-- A3a + A3b (docs/v2-migration/DB_ASKS.md): one invoice may cover several
-- orders, and everything that assumed one document = one order learns better.
--
-- WHAT THE ASK UNDERCOUNTED
--
-- DB_ASKS lists three order-scoped guards. Reading the sources found five
-- places, and the two it missed are the dangerous ones because they are silent:
--
--   4. recompute_order_paid() attributes an allocation back to an order via
--      allocation_order_id(), which returns NULL for a client-level document.
--      The trigger would resolve nothing, recompute_order_paid_for(null) would
--      return immediately, and every order under a consolidated invoice would
--      read amount_paid = 0 forever — with orders.balance (generated) wrong to
--      match, on every screen that shows it.
--   5. reconcile_money() computes drift with the *same* formula. Change one
--      without the other and the drift checker reports every consolidated
--      order as broken. They are now the same function call, so they cannot
--      disagree: v2.order_paid_amount().
--
-- THE SPLIT RULE (owner's decision, 2026-08-09): OLDEST FIRST
--
-- Cash allocated to a consolidated invoice fills its covered orders in the
-- sequence the invoice billed them, each to its own total, before moving to
-- the next. Standard AR waterfall, deterministic, and it keeps every existing
-- screen truthful without teaching each one to look through to the invoice.
--
-- Two details that make it behave:
--
--   * The waterfall reads the totals FROZEN IN THE SNAPSHOT, not the orders'
--     current totals. The invoice said order A was 300,000; editing A later
--     must not silently re-apportion money that was already received.
--   * The LAST covered order absorbs any remainder rather than being capped.
--     That keeps overpayment visible as a negative balance instead of quietly
--     vanishing, and it makes the single-order case arithmetically identical
--     to the old behaviour — which is why no existing document changes value.
--
-- In tax-exclusive mode the document's total exceeds the sum of its orders by
-- the tax, since orders carry no tax. The waterfall therefore attributes
-- principal before tax. That is deliberate: an order is settled when its own
-- total is covered.
--
-- SHAPE
--
-- One order  → entity_type='order', entity_id=<order> — exactly as before.
-- Several    → entity_type='client', entity_id=<client>, with the covered
--              orders frozen in snapshot.orders.
--
-- No link table: "which orders has this invoice billed" is a jsonb containment
-- query, indexed below, and issue_document() is the only way a document comes
-- into existence so double-billing needs no constraint.

-- ----------------------------------------------------------------- index ----
-- Makes `snapshot @> '{"orders":[{"order_id":"…"}]}'` an index scan.
-- jsonb_path_ops rather than the default: it supports exactly @> and is
-- substantially smaller, which matters because snapshots hold every line.
create index if not exists documents_snapshot_orders_idx
  on v2.documents using gin (snapshot jsonb_path_ops);

-- ------------------------------------------------------- coverage lookups ----
-- All of these are pure reads. They are still revoked from PUBLIC and granted
-- to the roles that need them: `authenticated` because the trigger path runs
-- as the invoking user, `service_role` for the app's shims.

-- The orders a document covers, in the sequence it billed them.
create or replace function v2.document_order_ids(p_document_id uuid)
returns setof uuid language sql stable
set search_path = ''
as $$
  select (e.value->>'order_id')::uuid
  from v2.documents d,
       lateral jsonb_array_elements(d.snapshot->'orders') with ordinality e(value, ord)
  where d.id = p_document_id and jsonb_typeof(d.snapshot->'orders') = 'array'
  union all
  -- A document frozen before consolidated invoicing carries no `orders` array.
  -- It covers exactly the order it names.
  select d.entity_id from v2.documents d
  where d.id = p_document_id and d.entity_type = 'order'
    and jsonb_typeof(d.snapshot->'orders') is distinct from 'array'
$$;

-- The documents covering an order — direct or consolidated. One predicate, so
-- a single-order document (which is matched by both halves) returns once.
create or replace function v2.order_documents(p_order_id uuid)
returns setof uuid language sql stable
set search_path = ''
as $$
  select d.id
  from v2.orders o
  join v2.documents d on d.organization_id = o.organization_id
  where o.id = p_order_id
    and (
      (d.entity_type = 'order' and d.entity_id = p_order_id)
      or d.snapshot @> jsonb_build_object(
           'orders', jsonb_build_array(jsonb_build_object('order_id', p_order_id)))
    )
$$;

-- The live invoice covering an order, if any. This is the SINGLE RECEIVABLE
-- test, and it now finds a consolidated invoice as readily as a direct one.
create or replace function v2.order_live_invoice(p_order_id uuid)
returns uuid language sql stable
set search_path = ''
as $$
  select d.id from v2.documents d
  join v2.order_documents(p_order_id) as t(doc_id) on t.doc_id = d.id
  where d.document_type = 'invoice'
    and d.status not in ('draft', 'void')
  limit 1
$$;

-- One order's share of the cash received against one document — the waterfall.
-- Totals come from the snapshot, so the split is fixed at issue time.
create or replace function v2.document_order_share(p_document_id uuid, p_order_id uuid)
returns numeric language sql stable
set search_path = ''
as $$
  with cash as (
    select coalesce(sum(a.amount), 0) as amount
    from v2.payment_allocations a
    where a.target_type = 'document' and a.target_id = p_document_id
  ),
  listed as (
    select (e.value->>'order_id')::uuid as order_id,
           coalesce((e.value->>'total')::numeric, 0) as total,
           e.ord
    from v2.documents d,
         lateral jsonb_array_elements(d.snapshot->'orders') with ordinality e(value, ord)
    where d.id = p_document_id and jsonb_typeof(d.snapshot->'orders') = 'array'
    union all
    -- Pre-consolidation document: one order, and it takes all the cash —
    -- which is what the old allocation_order_id() formula did.
    select d.entity_id, 0, 1
    from v2.documents d
    where d.id = p_document_id and d.entity_type = 'order'
      and jsonb_typeof(d.snapshot->'orders') is distinct from 'array'
  ),
  covered as (
    select l.order_id, l.total, l.ord, count(*) over () as n from listed l
  ),
  waterfall as (
    select c.order_id, c.total, c.ord, c.n,
           coalesce(sum(c.total) over (
             order by c.ord rows between unbounded preceding and 1 preceding
           ), 0) as claimed_before
    from covered c
  )
  select greatest(0,
    case
      -- The last covered order takes whatever is left, so an overpayment stays
      -- visible instead of being capped away.
      when w.ord = w.n then (select amount from cash) - w.claimed_before
      else least(w.total, (select amount from cash) - w.claimed_before)
    end)
  from waterfall w
  where w.order_id = p_order_id
$$;

-- What an order has actually been paid. THE formula — the trigger that
-- maintains orders.amount_paid and the reconciliation check that looks for
-- drift both call this, so they cannot drift apart from each other.
create or replace function v2.order_paid_amount(p_order_id uuid)
returns numeric language sql stable
set search_path = ''
as $$
  select coalesce((
           select sum(a.amount) from v2.payment_allocations a
           where a.target_type = 'order' and a.target_id = p_order_id
         ), 0)
       + coalesce((
           select sum(v2.document_order_share(t.doc_id, p_order_id))
           from v2.order_documents(p_order_id) as t(doc_id)
         ), 0)
$$;

-- The client a payment target belongs to. Replaces allocation_order_id() for
-- the party check: a consolidated invoice resolves to no single order but to
-- exactly one client, which is what the check actually wanted to know.
create or replace function v2.allocation_client_id(p_target_type text, p_target_id uuid)
returns uuid language sql stable
set search_path = ''
as $$
  select case
    when p_target_type = 'order' then (
      select o.client_id from v2.orders o where o.id = p_target_id
    )
    when p_target_type = 'document' then (
      select case
        when d.entity_type = 'client' then d.entity_id
        when d.entity_type = 'order' then (
          select o.client_id from v2.orders o where o.id = d.entity_id
        )
      end
      from v2.documents d where d.id = p_target_id
    )
  end
$$;

revoke execute on function
  v2.document_order_ids(uuid), v2.order_documents(uuid), v2.order_live_invoice(uuid),
  v2.document_order_share(uuid, uuid), v2.order_paid_amount(uuid),
  v2.allocation_client_id(text, uuid)
from public;
grant execute on function
  v2.document_order_ids(uuid), v2.order_documents(uuid), v2.order_live_invoice(uuid),
  v2.document_order_share(uuid, uuid), v2.order_paid_amount(uuid),
  v2.allocation_client_id(text, uuid)
to authenticated, service_role;

-- --------------------------------------------------------- attribution ----
-- Every order an allocation touches. For a document target that is all the
-- orders it covers, which is the whole reason the recompute became a loop.
create or replace function v2.allocation_target_orders(p_target_type text, p_target_id uuid)
returns setof uuid language sql stable
set search_path = ''
as $$
  select p_target_id where p_target_type = 'order'
  union all
  select t.order_id from v2.document_order_ids(p_target_id) as t(order_id)
  where p_target_type = 'document'
$$;

revoke execute on function v2.allocation_target_orders(text, uuid) from public;
grant execute on function v2.allocation_target_orders(text, uuid) to authenticated, service_role;

-- The UPDATE moves into the trigger function and the callable writer goes.
-- recompute_order_paid_for(uuid) held PUBLIC EXECUTE and updated any order by
-- id with no org check; it could not be locked down usefully because the
-- trigger path needs EXECUTE anyway. A trigger function refuses direct
-- invocation, so the surface stops existing. What remains callable
-- (order_paid_amount) computes and writes nothing.
create or replace function v2.recompute_order_paid()
returns trigger language plpgsql
set search_path = ''
as $$
declare
  v_ids uuid[] := '{}';
  v_order uuid;
begin
  -- An allocation against a consolidated invoice moves several orders at once,
  -- which is why this is a loop and no longer a single id.
  if tg_op in ('UPDATE', 'DELETE') then
    v_ids := v_ids || array(select * from v2.allocation_target_orders(old.target_type, old.target_id));
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_ids := v_ids || array(select * from v2.allocation_target_orders(new.target_type, new.target_id));
  end if;

  for v_order in select distinct u from unnest(v_ids) u where u is not null
  loop
    update v2.orders o
    set amount_paid = v2.order_paid_amount(v_order), updated_at = now()
    where o.id = v_order;
  end loop;

  return coalesce(new, old);
end $$;

drop function if exists v2.recompute_order_paid_for(uuid);

-- ------------------------------------------------------------- guards ----
create or replace function v2.validate_payment_allocation()
returns trigger language plpgsql
set search_path = ''
as $$
declare
  v_pay_org      uuid;
  v_pay_amount   numeric;
  v_pay_party_t  text;
  v_pay_party_id uuid;
  v_allocated    numeric;
  v_target_org   uuid;
  v_target_client uuid;
  v_live         uuid;
begin
  select p.organization_id, p.amount, p.party_type, p.party_id
    into v_pay_org, v_pay_amount, v_pay_party_t, v_pay_party_id
  from v2.payments p
  where p.id = new.payment_id
  for update;

  if v_pay_org is null then
    raise exception 'allocation: payment % not found', new.payment_id;
  end if;

  if v_pay_org <> new.organization_id then
    raise exception 'allocation: cross-tenant payment reference (payment org %, allocation org %)',
      v_pay_org, new.organization_id;
  end if;

  if new.target_type = 'order' then
    select o.organization_id into v_target_org
    from v2.orders o where o.id = new.target_id;
  elsif new.target_type = 'document' then
    select d.organization_id into v_target_org
    from v2.documents d where d.id = new.target_id;
  else
    raise exception 'allocation: target_type % not yet supported', new.target_type;
  end if;

  if v_target_org is null then
    raise exception 'allocation: target %/% not found', new.target_type, new.target_id;
  end if;

  if v_target_org <> new.organization_id then
    raise exception 'allocation: cross-tenant target reference (target org %, allocation org %)',
      v_target_org, new.organization_id;
  end if;

  if v_pay_party_t = 'client' and new.target_type not in ('order','document') then
    raise exception 'allocation: client payment cannot settle a % target', new.target_type;
  end if;

  if v_pay_party_t = 'supplier' and new.target_type not in ('expense','material_purchase') then
    raise exception 'allocation: supplier payment cannot settle a % target', new.target_type;
  end if;

  -- Party check, by client rather than by order. A consolidated invoice
  -- resolves to no single order, and resolving it through allocation_order_id()
  -- used to fail the allocation outright with "does not resolve to an order".
  if v_pay_party_id is not null and new.target_type in ('order','document') then
    v_target_client := v2.allocation_client_id(new.target_type, new.target_id);

    if v_target_client is null then
      raise exception 'allocation: % % does not resolve to a client - cannot verify party',
        new.target_type, new.target_id;
    end if;

    if v_target_client is distinct from v_pay_party_id then
      raise exception 'allocation: party mismatch - payment belongs to client %, target belongs to client %',
        v_pay_party_id, v_target_client;
    end if;
  end if;

  -- SINGLE RECEIVABLE. Now finds a consolidated invoice too; previously an
  -- order covered by one stayed open here and money could split across two
  -- receivables for a single debt.
  if new.target_type = 'order' then
    v_live := v2.order_live_invoice(new.target_id);
    if v_live is not null then
      raise exception 'allocation: order % is billed on live invoice % - allocate to the document instead',
        new.target_id, v_live;
    end if;
  end if;

  select coalesce(sum(a.amount), 0) into v_allocated
  from v2.payment_allocations a
  where a.payment_id = new.payment_id
    and (tg_op = 'INSERT' or a.id <> new.id);

  if v_allocated + new.amount > v_pay_amount then
    raise exception 'allocation: over-allocation on payment % (payment %, already allocated %, attempted %)',
      new.payment_id, v_pay_amount, v_allocated, new.amount;
  end if;

  return new;
end $$;

-- ------------------------------------------------------- reconciliation ----
-- Same formula as the trigger, by construction.
create or replace function v2.reconcile_money()
returns table(violation text, entity_id uuid, expected numeric, found numeric)
language sql stable
set search_path = ''
as $$
  select 'order.amount_paid_drift'::text, o.id, v2.order_paid_amount(o.id), o.amount_paid
  from v2.orders o
  where o.amount_paid is distinct from v2.order_paid_amount(o.id)

  union all

  select 'payment.over_allocated'::text, u.payment_id, u.amount, u.amount_allocated
  from v2.v_payment_unallocated u
  where u.amount_allocated > u.amount

  union all

  select 'allocation.cross_tenant'::text, a.id, null::numeric, null::numeric
  from v2.payment_allocations a
  join v2.payments p on p.id = a.payment_id
  where p.organization_id <> a.organization_id

  union all

  select 'allocation.party_mismatch'::text, a.id, null::numeric, null::numeric
  from v2.payment_allocations a
  join v2.payments p on p.id = a.payment_id
  where p.party_id is not null
    and p.party_id is distinct from v2.allocation_client_id(a.target_type, a.target_id);
$$;

-- ------------------------------------------------------ issue_document ----
-- The signature changes from uuid to uuid[], so this is a drop and create
-- rather than a replace — which means grants must be restated. The shim goes
-- first because it calls the function by name.
drop function if exists v2.issue_document_as_org(uuid, uuid, uuid, text, jsonb);
drop function if exists v2.issue_document(uuid, text, jsonb);

create function v2.issue_document(
  p_order_ids uuid[], p_document_type text, p_options jsonb default '{}'::jsonb
) returns uuid language plpgsql
set search_path = ''
as $$
declare
  v_org         uuid;
  v_ids         uuid[];
  v_doc_id      uuid;
  v_number      text;
  v_client      record;
  v_client_id   uuid;
  v_clients     int;
  v_found       int;
  v_dup         uuid;
  v_o           record;
  v_settings    jsonb;
  v_identity    jsonb;
  v_tax         jsonb;
  v_locale      jsonb;
  v_docs        jsonb;
  v_currency    text;
  v_scale       int;
  v_registered  boolean;
  v_rate        numeric := 0;
  v_inclusive   boolean := false;
  v_o_gross     numeric;
  v_o_disc      numeric;
  v_o_lines     jsonb;
  v_o_fields    jsonb;
  v_gross       numeric := 0;
  v_disc_gross  numeric := 0;
  v_net_gross   numeric := 0;
  v_net_ex      numeric := 0;
  v_subtotal    numeric := 0;
  v_discount    numeric := 0;
  v_tax_total   numeric := 0;
  v_lines       jsonb := '[]'::jsonb;
  v_orders      jsonb := '[]'::jsonb;
  v_entity_type text;
  v_entity_id   uuid;
  v_terms_days  int;
  v_due         date;
  v_valid       date;
  v_snapshot    jsonb;
begin
  v_org := v2.current_org_id();
  if v_org is null then
    raise exception 'issue_document: no organization context';
  end if;

  select array_agg(distinct x) into v_ids from unnest(coalesce(p_order_ids, '{}'::uuid[])) x;
  if v_ids is null or array_length(v_ids, 1) is null then
    raise exception 'issue_document: no orders given';
  end if;

  -- Every order must exist here, and they must belong to one client — a
  -- document is addressed to somebody.
  select count(*), count(distinct o.client_id)
    into v_found, v_clients
  from v2.orders o where o.id = any(v_ids) and o.organization_id = v_org;

  if v_found <> array_length(v_ids, 1) then
    raise exception 'issue_document: one or more orders not found in this organization';
  end if;
  if v_clients > 1 then
    raise exception 'issue_document: cannot combine orders for different clients on one document';
  end if;

  select o.client_id into v_client_id from v2.orders o
  where o.id = any(v_ids) and o.organization_id = v_org limit 1;

  select * into v_client from v2.clients c where c.id = v_client_id;

  -- one live invoice per order, whether that invoice is direct or consolidated
  if p_document_type = 'invoice' then
    select o.id into v_dup from v2.orders o
    where o.id = any(v_ids) and v2.order_live_invoice(o.id) is not null
    limit 1;
    if found then
      raise exception 'issue_document: order % already has a live invoice - void it before reissuing', v_dup;
    end if;
  end if;

  -- ---- resolve settings -------------------------------------------
  select o.settings into v_settings from v2.organizations o where o.id = v_org;
  v_identity := coalesce(v_settings->'identity', '{}'::jsonb);
  v_tax      := coalesce(v_settings->'tax',      '{}'::jsonb);
  v_locale   := coalesce(v_settings->'locale',   '{}'::jsonb);
  v_docs     := coalesce(v_settings->'documents','{}'::jsonb);

  v_currency := v_locale->>'currency';
  if v_currency is null then
    raise exception 'issue_document: organization has no locale.currency configured - complete setup first';
  end if;
  v_scale := v2.currency_scale(v_currency);

  v_registered := coalesce((v_tax->>'registered')::boolean, false);
  if v_registered then
    v_rate      := coalesce((v_tax->>'rate')::numeric, 0);
    v_inclusive := coalesce((v_tax->>'inclusive')::boolean, false);
  end if;

  -- ---- per order: lines, discount, frozen total ---------------------
  -- Order matters: this sequence is what the payment waterfall follows.
  for v_o in
    select * from v2.orders o where o.id = any(v_ids)
    order by o.order_date, o.order_number, o.id
  loop
    select coalesce(sum(oi.total_amount), 0) into v_o_gross
    from v2.order_items oi where oi.order_id = v_o.id;
    v_o_gross := round(v_o_gross, v_scale);

    v_o_disc := v2.order_discount_amount(
                  v_o_gross, v_o.discount_type, v_o.discount_value, v_scale);
    if v_o_disc > v_o_gross then
      raise exception
        'issue_document: order % has a discount of % against lines of % - a document cannot be issued for a negative amount',
        v_o.order_number, v_o_disc, v_o_gross;
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
             'order_number', v_o.order_number,
             'description', coalesce(p.name, oi.product_name_raw),
             'quantity',    oi.quantity,
             'unit_price',  oi.unit_price,
             'discount',    oi.discount,
             'total',       oi.total_amount,
             'fields',      coalesce((
               select jsonb_object_agg(fd.field_label, oi.custom_data->fd.field_name)
               from v2.field_definitions fd
               where fd.organization_id = v_org and fd.entity = 'order_item'
                 and fd.show_in_documents and fd.status = 'active'
                 and oi.custom_data ? fd.field_name
             ), '{}'::jsonb)
           ) order by oi.created_at), '[]'::jsonb)
      into v_o_lines
    from v2.order_items oi
    left join v2.products p on p.id = oi.product_id
    where oi.order_id = v_o.id;

    if jsonb_array_length(v_o_lines) = 0 then
      raise exception 'issue_document: order % has no items', v_o.order_number;
    end if;

    v_o_fields := coalesce((
      select jsonb_object_agg(fd.field_label, v_o.custom_data->fd.field_name)
      from v2.field_definitions fd
      where fd.organization_id = v_org and fd.entity = 'order'
        and fd.show_in_documents and fd.status = 'active'
        and v_o.custom_data ? fd.field_name
    ), '{}'::jsonb);

    v_lines  := v_lines || v_o_lines;
    v_orders := v_orders || jsonb_build_array(jsonb_build_object(
      'order_id',       v_o.id,
      'order_number',   v_o.order_number,
      'order_date',     v_o.order_date,
      'lines_total',    v_o_gross,
      'discount_total', v_o_disc,
      -- The figure the waterfall fills to, and it equals orders.total_amount.
      'total',          v_o_gross - v_o_disc,
      'discount_type',  v_o.discount_type,
      'discount_value', v_o.discount_value,
      'fields',         v_o_fields
    ));

    v_gross      := v_gross + v_o_gross;
    v_disc_gross := v_disc_gross + v_o_disc;
  end loop;

  v_net_gross := v_gross - v_disc_gross;

  -- ---- tax ----------------------------------------------------------
  -- documents.total is generated from these three; see 20260809120000 for why
  -- the inclusive branch derives the discount instead of computing it.
  if not v_registered or v_rate = 0 then
    v_subtotal  := v_gross;
    v_discount  := v_disc_gross;
    v_tax_total := 0;
  elsif v_inclusive then
    v_net_ex    := round(v_net_gross / (1 + v_rate / 100), v_scale);
    v_tax_total := v_net_gross - v_net_ex;
    v_subtotal  := round(v_gross / (1 + v_rate / 100), v_scale);
    v_discount  := v_subtotal - v_net_ex;
  else
    v_subtotal  := v_gross;
    v_discount  := v_disc_gross;
    v_tax_total := round(v_net_gross * v_rate / 100, v_scale);
  end if;

  -- ---- dates --------------------------------------------------------
  v_terms_days := coalesce((p_options->>'terms_days')::int, (v_docs->>'terms_days')::int);
  if p_document_type = 'invoice' and coalesce(v_terms_days, 0) > 0 then
    v_due := current_date + v_terms_days;
  end if;

  if p_document_type = 'quotation' then
    v_valid := current_date + coalesce(
      (p_options->>'validity_days')::int,
      (v_docs->>'quote_validity_days')::int,
      30
    );
  end if;

  v_number := v2.next_number('doc:' || p_document_type, v_org);

  -- ---- who the document is about ------------------------------------
  -- One order keeps the direct reference, so nothing about the existing path
  -- changes. Several can only be addressed to the client they share.
  if array_length(v_ids, 1) = 1 then
    v_entity_type := 'order';
    v_entity_id   := v_ids[1];
  else
    v_entity_type := 'client';
    v_entity_id   := v_client_id;
  end if;

  v_snapshot := jsonb_build_object(
    'meta', jsonb_build_object(
      'document_type', p_document_type,
      'document_number', v_number,
      -- Null for a consolidated document: it has no single order number, and
      -- claiming one would be a lie the renderer would print.
      'order_number', case when array_length(v_ids,1) = 1
                           then v_orders->0->>'order_number' end,
      'order_date',   case when array_length(v_ids,1) = 1
                           then v_orders->0->>'order_date' end,
      'order_count',  array_length(v_ids, 1),
      'issued_at', now()
    ),
    'issuer', v_identity,
    'recipient', jsonb_build_object(
      'client_id', v_client_id,
      'name', v_client.name,
      'fields', coalesce((
        select jsonb_object_agg(fd.field_label, v_client.custom_data->fd.field_name)
        from v2.field_definitions fd
        where fd.organization_id = v_org and fd.entity = 'client'
          and fd.show_in_documents and fd.status = 'active'
          and v_client.custom_data ? fd.field_name
      ), '{}'::jsonb)
    ),
    -- Order-level fields stay at the top for a single-order document, where
    -- they are unambiguous. On a consolidated one they live per order, inside
    -- `orders`, because two orders can answer the same field differently.
    'order_fields', case when array_length(v_ids,1) = 1
                         then v_orders->0->'fields' else '{}'::jsonb end,
    'orders', v_orders,
    'lines', v_lines,
    'totals', jsonb_build_object(
      'currency', v_currency,
      'subtotal', v_subtotal,
      'discount_total', v_discount,
      'discount_type', case when array_length(v_ids,1) = 1
                            then v_orders->0->>'discount_type' end,
      'discount_value', case when array_length(v_ids,1) = 1
                             then (v_orders->0->>'discount_value')::numeric else 0 end,
      'tax_total', v_tax_total,
      'total', v_subtotal - v_discount + v_tax_total,
      'tax_label', coalesce(v_tax->>'label', 'Tax'),
      'tax_rate', v_rate,
      'tax_registered', v_registered,
      'amounts_include_tax', v_inclusive
    ),
    'terms', jsonb_build_object(
      'terms_days', v_terms_days,
      'due_date', v_due,
      'valid_until', v_valid,
      'footer', v_docs->>'footer',
      'bank_details', case when coalesce((v_docs->>'show_bank_details')::boolean, false)
                           then v_docs->>'bank_details' else null end
    )
  );

  insert into v2.documents (
    organization_id, entity_type, entity_id, document_type, document_number,
    snapshot, status, currency, amounts_include_tax,
    subtotal, discount_total, tax_total, valid_until, due_date, issued_at, created_by
  ) values (
    v_org, v_entity_type, v_entity_id, p_document_type, v_number,
    v_snapshot, 'issued', v_currency, v_inclusive,
    v_subtotal, v_discount, v_tax_total, v_valid, v_due, now(), v2.current_user_id()
  )
  returning id into v_doc_id;

  return v_doc_id;
end $$;

revoke execute on function v2.issue_document(uuid[], text, jsonb) from public;
grant execute on function v2.issue_document(uuid[], text, jsonb)
  to authenticated, service_role;

-- INTERIM service-role shim, retires with Clerk Phase 2 alongside
-- create_order_as_org.
create function v2.issue_document_as_org(
  p_org uuid, p_user uuid, p_order_ids uuid[], p_document_type text,
  p_options jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer
set search_path = ''
as $$
begin
  if p_org is null then
    raise exception 'issue_document_as_org: p_org is required';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('organization_id', p_org, 'sub', p_user, 'role', 'authenticated')::text,
    true
  );

  return v2.issue_document(p_order_ids, p_document_type, p_options);
end $$;

revoke execute on function v2.issue_document_as_org(uuid, uuid, uuid[], text, jsonb) from public;
grant execute on function v2.issue_document_as_org(uuid, uuid, uuid[], text, jsonb)
  to service_role;
