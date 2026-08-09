-- A1 part 2 (docs/v2-migration/DB_ASKS.md): the order discount reaches the
-- document, and issue_document() rounds at the currency's own scale.
--
-- Part 1 (20260807220500) added orders.discount_type/discount_value and made
-- orders.total_amount net of them. It stopped there on purpose, which left a
-- divergence: issue_document() summed order_items and wrote discount_total = 0,
-- so an invoice would have billed the *undiscounted* amount. Nothing could
-- reach it — create_order() took no discount fields and orderUpdateSchema
-- allowlisted four keys that excluded them — so the gap closes in the only safe
-- order: the document learns the discount here, and only then does the write
-- path open (same commit, app side).
--
-- WHY THE ARITHMETIC LOOKS BACKWARDS
--
-- documents.total is GENERATED ALWAYS AS ((subtotal - discount_total) + tax_total)
-- STORED. It cannot be written. So the three components are not computed
-- independently and summed — they are chosen so that the column Postgres
-- generates from them lands exactly on what the customer pays, with no rounding
-- drift. That is why the tax-inclusive branch *derives* discount_total from two
-- rounded figures instead of computing it directly: rounding each of the three
-- on its own leaves the generated total off by a minor unit.
--
-- WHY THE DISCOUNT COMES OFF BEFORE TAX
--
-- This is a trade discount — a reduction in the price actually charged, agreed
-- before the sale. It reduces the taxable base (EU VAT Directive Art 79(b);
-- IFRS 15 / ASC 606 treat it as part of the transaction price, not an expense).
-- A settlement discount for early payment would behave differently and is not
-- what this models. See DB_ASKS.md A1 for the full reasoning.
--
-- CREATE OR REPLACE resets attributes that aren't restated, so both functions
-- restate `set search_path = ''`. Ownership and grants ARE preserved by
-- REPLACE, so the existing ACLs stay as they are; neither function is
-- SECURITY DEFINER and neither becomes one.

-- ------------------------------------------------------------ constraint ----
-- A percentage over 100 can only ever produce a negative document. Part 1
-- constrained discount_value >= 0 but had no way to say this without knowing
-- the type.
alter table v2.orders
  drop constraint if exists orders_discount_percent_range;
alter table v2.orders
  add constraint orders_discount_percent_range
  check (discount_type is distinct from 'percent' or discount_value <= 100);

-- -------------------------------------------------------- issue_document ----
-- `p_options jsonb DEFAULT '{}'::jsonb` — the default is restated because
-- REPLACE cannot drop one ("cannot remove parameter defaults from existing
-- function"), and dropping it would break every two-argument call site.
-- pg_get_function_identity_arguments() does not show defaults;
-- pg_get_function_arguments() does.
create or replace function v2.issue_document(
  p_order_id uuid, p_document_type text, p_options jsonb default '{}'::jsonb
) returns uuid language plpgsql
set search_path = ''
as $$
declare
  v_org        uuid;
  v_doc_id     uuid;
  v_number     text;
  v_order      record;
  v_client     record;
  v_settings   jsonb;
  v_identity   jsonb;
  v_tax        jsonb;
  v_locale     jsonb;
  v_docs       jsonb;
  v_currency   text;
  v_scale      int;
  v_registered boolean;
  v_rate       numeric := 0;
  v_inclusive  boolean := false;
  v_gross      numeric := 0;
  v_disc_gross numeric := 0;
  v_net_gross  numeric := 0;
  v_net_ex     numeric := 0;
  v_subtotal   numeric := 0;
  v_discount   numeric := 0;
  v_tax_total  numeric := 0;
  v_lines      jsonb;
  v_terms_days int;
  v_due        date;
  v_valid      date;
  v_live       int;
  v_snapshot   jsonb;
begin
  v_org := v2.current_org_id();
  if v_org is null then
    raise exception 'issue_document: no organization context';
  end if;

  select * into v_order from v2.orders o
   where o.id = p_order_id and o.organization_id = v_org;
  if not found then
    raise exception 'issue_document: order % not found in this organization', p_order_id;
  end if;

  select * into v_client from v2.clients c where c.id = v_order.client_id;

  -- one live invoice per order: the single-receivable rule depends on it
  if p_document_type = 'invoice' then
    select count(*) into v_live from v2.documents d
     where d.organization_id = v_org and d.entity_type = 'order'
       and d.entity_id = p_order_id and d.document_type = 'invoice'
       and d.status not in ('draft','void');
    if v_live > 0 then
      raise exception 'issue_document: order % already has a live invoice - void it before reissuing', p_order_id;
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
  -- Every figure below rounds here, not at a hardcoded 2. UGX has no minor
  -- unit; cents invented at this step get rounded away by the renderer and the
  -- printed document stops adding up.
  v_scale := v2.currency_scale(v_currency);

  v_registered := coalesce((v_tax->>'registered')::boolean, false);
  if v_registered then
    v_rate      := coalesce((v_tax->>'rate')::numeric, 0);
    v_inclusive := coalesce((v_tax->>'inclusive')::boolean, false);
  end if;

  -- ---- lines + gross ------------------------------------------------
  select coalesce(sum(oi.total_amount), 0),
         coalesce(jsonb_agg(jsonb_build_object(
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
    into v_gross, v_lines
  from v2.order_items oi
  left join v2.products p on p.id = oi.product_id
  where oi.order_id = p_order_id;

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'issue_document: order % has no items', p_order_id;
  end if;

  -- ---- order-level discount -----------------------------------------
  -- The same resolver v2.recompute_order_totals() uses, so the order and the
  -- document it freezes can never disagree about the figure.
  v_gross      := round(v_gross, v_scale);
  v_disc_gross := v2.order_discount_amount(
                    v_gross, v_order.discount_type, v_order.discount_value, v_scale);

  -- The invariant part 1 deliberately left to this function: an order mid-edit
  -- may sit below its own discount, but a *document* may not be issued for a
  -- negative amount.
  if v_disc_gross > v_gross then
    raise exception
      'issue_document: discount of % exceeds the order lines (%) - a document cannot be issued for a negative amount',
      v_disc_gross, v_gross;
  end if;
  v_net_gross := v_gross - v_disc_gross;

  -- ---- tax ----------------------------------------------------------
  if not v_registered or v_rate = 0 then
    v_subtotal  := v_gross;
    v_discount  := v_disc_gross;
    v_tax_total := 0;

  elsif v_inclusive then
    -- Entered prices already contain tax, so the discount the user typed is a
    -- gross figure too. Strip tax from the *discounted* gross first; that makes
    -- tax_total exact by subtraction and pins the generated total to
    -- v_net_gross, which is what the customer actually hands over. subtotal and
    -- discount_total are then the tax-exclusive presentation of the same deal —
    -- discount_total derived, so subtotal - discount_total = v_net_ex exactly.
    v_net_ex    := round(v_net_gross / (1 + v_rate / 100), v_scale);
    v_tax_total := v_net_gross - v_net_ex;
    v_subtotal  := round(v_gross / (1 + v_rate / 100), v_scale);
    v_discount  := v_subtotal - v_net_ex;

  else
    v_subtotal  := v_gross;
    v_discount  := v_disc_gross;
    v_tax_total := round((v_gross - v_disc_gross) * v_rate / 100, v_scale);
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

  -- ---- number -------------------------------------------------------
  v_number := v2.next_number('doc:' || p_document_type, v_org);

  -- ---- snapshot: everything the render needs, frozen ----------------
  v_snapshot := jsonb_build_object(
    'meta', jsonb_build_object(
      'document_type', p_document_type,
      'document_number', v_number,
      'order_number', v_order.order_number,
      'order_date', v_order.order_date,
      'issued_at', now()
    ),
    'issuer', v_identity,
    'recipient', jsonb_build_object(
      'client_id', v_order.client_id,
      'name', v_client.name,
      'fields', coalesce((
        select jsonb_object_agg(fd.field_label, v_client.custom_data->fd.field_name)
        from v2.field_definitions fd
        where fd.organization_id = v_org and fd.entity = 'client'
          and fd.show_in_documents and fd.status = 'active'
          and v_client.custom_data ? fd.field_name
      ), '{}'::jsonb)
    ),
    'order_fields', coalesce((
      select jsonb_object_agg(fd.field_label, v_order.custom_data->fd.field_name)
      from v2.field_definitions fd
      where fd.organization_id = v_org and fd.entity = 'order'
        and fd.show_in_documents and fd.status = 'active'
        and v_order.custom_data ? fd.field_name
    ), '{}'::jsonb),
    'lines', v_lines,
    'totals', jsonb_build_object(
      'currency', v_currency,
      'subtotal', v_subtotal,
      'discount_total', v_discount,
      -- The shape of the deal as agreed, so the paper can say "Discount (10%)"
      -- rather than only an amount. Frozen like everything else here: changing
      -- the order afterwards must not restate an issued document.
      'discount_type', v_order.discount_type,
      'discount_value', v_order.discount_value,
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

  -- `total` is generated from the three below and cannot be inserted.
  insert into v2.documents (
    organization_id, entity_type, entity_id, document_type, document_number,
    snapshot, status, currency, amounts_include_tax,
    subtotal, discount_total, tax_total, valid_until, due_date, issued_at, created_by
  ) values (
    v_org, 'order', p_order_id, p_document_type, v_number,
    v_snapshot, 'issued', v_currency, v_inclusive,
    v_subtotal, v_discount, v_tax_total, v_valid, v_due, now(), v2.current_user_id()
  )
  returning id into v_doc_id;

  return v_doc_id;
end $$;

-- ----------------------------------------------------------- create_order ----
-- Accepts the discount at creation. The order is inserted before its items, so
-- the totals trigger has nothing to work with yet; it fires on each item insert
-- and arrives at the right net figure. An order carrying a discount with no
-- items therefore reads total_amount = 0 rather than a negative — a state
-- issue_document() refuses anyway ("order has no items").
create or replace function v2.create_order(payload jsonb)
returns uuid language plpgsql
set search_path = ''
as $$
declare
  v_org          uuid;
  v_order_id     uuid;
  v_order_number text;
  v_client_id    uuid;
  v_item         jsonb;
  v_payment      jsonb;
  v_payment_id   uuid;
begin
  v_org := v2.current_org_id();
  if v_org is null then
    raise exception 'create_order: no organization context';
  end if;

  v_client_id    := (payload->>'client_id')::uuid;
  v_order_number := v2.next_number('order', v_org);

  insert into v2.orders (
    organization_id, order_number, client_id, order_date, status, custom_data,
    discount_type, discount_value, created_by
  ) values (
    v_org,
    v_order_number,
    v_client_id,
    coalesce((payload->>'order_date')::date, current_date),
    coalesce(payload->>'status', 'pending'),
    coalesce(payload->'custom_data', '{}'::jsonb),
    nullif(payload->>'discount_type', ''),
    coalesce((payload->>'discount_value')::numeric, 0),
    v2.current_user_id()
  )
  returning id into v_order_id;

  if payload ? 'items' then
    for v_item in select * from jsonb_array_elements(payload->'items')
    loop
      insert into v2.order_items (
        organization_id, order_id, product_id, product_name_raw,
        quantity, unit_price, discount, total_amount, custom_data
      ) values (
        v_org,
        v_order_id,
        nullif(v_item->>'product_id','')::uuid,
        v_item->>'product_name_raw',
        coalesce((v_item->>'quantity')::numeric, 1),
        coalesce((v_item->>'unit_price')::numeric, 0),
        coalesce((v_item->>'discount')::numeric, 0),
        coalesce((v_item->>'quantity')::numeric,1) * coalesce((v_item->>'unit_price')::numeric,0)
          - coalesce((v_item->>'discount')::numeric,0),
        coalesce(v_item->'custom_data', '{}'::jsonb)
      );
    end loop;
  end if;

  if payload ? 'payments' then
    for v_payment in select * from jsonb_array_elements(payload->'payments')
    loop
      insert into v2.payments (
        organization_id, direction, party_type, party_id,
        amount, payment_date, payment_method, reference, created_by
      ) values (
        v_org, 'in',
        case when v_client_id is null then null else 'client' end,
        v_client_id,
        (v_payment->>'amount')::numeric,
        coalesce((v_payment->>'payment_date')::date, current_date),
        coalesce(v_payment->>'payment_method', 'cash'),
        nullif(v_payment->>'reference',''),
        v2.current_user_id()
      )
      returning id into v_payment_id;

      insert into v2.payment_allocations (
        organization_id, payment_id, target_type, target_id, amount, created_by
      ) values (
        v_org, v_payment_id, 'order', v_order_id,
        (v_payment->>'amount')::numeric, v2.current_user_id()
      );
    end loop;
  end if;

  return v_order_id;
end $$;
