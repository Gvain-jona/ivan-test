-- A1 part 1 (docs/v2-migration/DB_ASKS.md): order-level discount, plus the
-- rounding rule that makes it safe.
--
-- NOT YET APPLIED. Written 2026-08-07; apply via the Supabase SQL editor or
-- `supabase db push`, then part 2 (issue_document + create_order) follows.
--
-- Money is stated at the currency's own precision. UGX has zero minor units, so
-- a hardcoded 2dp invents cents that renderers round away again — with a
-- discount in play that produced 85 of 367 documents whose printed figures did
-- not add up. At the currency's scale: 0 of 367.
--
-- Three things this deliberately does NOT do, each found by auditing an earlier
-- draft of it:
--
--   * It does not omit `set search_path = ''`. Every v2 function carries it
--     (hardened in 20260725164737), and CREATE OR REPLACE resets attributes
--     that aren't restated — so replacing recompute_order_totals() without it
--     would silently strip the hardening from a function that runs on every
--     order_items write.
--   * It does not add a callable function that writes. An earlier draft had a
--     recompute_order_total_for(uuid) helper that UPDATEd v2.orders for any id
--     with no org check; locking it down is awkward because the trigger path
--     needs EXECUTE anyway. The UPDATE lives inside the trigger functions
--     instead — those cannot be invoked directly. Only pure, data-free
--     arithmetic is exposed.
--   * It does not raise when the discount exceeds the lines. That would make a
--     discounted order un-editable: removing items until the sum drops below a
--     fixed discount would fail on every delete. The real invariant is that a
--     *document* cannot be issued with a negative total, which belongs in
--     issue_document() (part 2). An order mid-edit is a working draft.
--
-- Known transient oddity, accepted: while a fixed discount exceeds the line
-- sum, orders.total_amount goes negative and the generated payment_status
-- reads 'paid' (amount_paid >= total_amount). Editing state only; issuing is
-- what's guarded.

-- ---------------------------------------------------------------- pure ----
-- ISO 4217 minor units. Zero- and three-decimal are the exceptions.
-- Not STRICT: a null currency must fall through to the default, not to null.
create or replace function v2.currency_scale(p_currency text)
returns int language sql immutable
set search_path = ''
as $$
  select case upper(coalesce(p_currency, ''))
    when 'BIF' then 0 when 'CLP' then 0 when 'DJF' then 0 when 'GNF' then 0
    when 'ISK' then 0 when 'JPY' then 0 when 'KMF' then 0 when 'KRW' then 0
    when 'PYG' then 0 when 'RWF' then 0 when 'UGX' then 0 when 'UYI' then 0
    when 'VND' then 0 when 'VUV' then 0 when 'XAF' then 0 when 'XOF' then 0
    when 'XPF' then 0
    when 'BHD' then 3 when 'IQD' then 3 when 'JOD' then 3 when 'KWD' then 3
    when 'LYD' then 3 when 'OMR' then 3 when 'TND' then 3
    else 2
  end;
$$;

-- One place resolves a discount, so an order's total and the document that
-- freezes it can never disagree. Pure arithmetic, touches no table.
create or replace function v2.order_discount_amount(
  p_line_sum numeric, p_type text, p_value numeric, p_scale int
) returns numeric language sql immutable
set search_path = ''
as $$
  select case
    when p_type = 'percent' then round(p_line_sum * coalesce(p_value, 0) / 100, p_scale)
    when p_type = 'amount'  then round(coalesce(p_value, 0), p_scale)
    else 0
  end;
$$;

-- ------------------------------------------------------------- columns ----
alter table v2.orders
  add column if not exists discount_type text
    check (discount_type is null or discount_type in ('amount','percent')),
  add column if not exists discount_value numeric not null default 0
    check (discount_value >= 0);

comment on column v2.orders.discount_type is
  'Trade discount off the whole order: ''amount'' | ''percent''. Null = none.';
comment on column v2.orders.discount_value is
  'The figure the user entered. The resolved money amount is derived, never stored.';

-- ---------------------------------------------------------- recomputes ----
-- Lines changed. Same trigger as before, now net of the order discount and
-- rounded at the currency's scale.
create or replace function v2.recompute_order_totals()
returns trigger language plpgsql
set search_path = ''
as $$
declare v_order uuid; v_o record; v_sum numeric; v_disc numeric;
begin
  v_order := coalesce(NEW.order_id, OLD.order_id);

  select o.discount_type, o.discount_value,
         v2.currency_scale(org.settings->'locale'->>'currency') as scale
    into v_o
  from v2.orders o
  join v2.organizations org on org.id = o.organization_id
  where o.id = v_order;
  if not found then return coalesce(NEW, OLD); end if;

  select round(coalesce(sum(oi.total_amount), 0), v_o.scale) into v_sum
  from v2.order_items oi where oi.order_id = v_order;

  v_disc := v2.order_discount_amount(v_sum, v_o.discount_type, v_o.discount_value, v_o.scale);

  update v2.orders set total_amount = v_sum - v_disc, updated_at = now()
  where id = v_order;

  return coalesce(NEW, OLD);
end $$;

-- The discount changed. The item trigger cannot see this: it touches only
-- v2.orders.
create or replace function v2.recompute_order_totals_on_discount()
returns trigger language plpgsql
set search_path = ''
as $$
declare v_scale int; v_sum numeric; v_disc numeric;
begin
  select v2.currency_scale(org.settings->'locale'->>'currency') into v_scale
  from v2.organizations org where org.id = NEW.organization_id;
  v_scale := coalesce(v_scale, 2);

  select round(coalesce(sum(oi.total_amount), 0), v_scale) into v_sum
  from v2.order_items oi where oi.order_id = NEW.id;

  v_disc := v2.order_discount_amount(v_sum, NEW.discount_type, NEW.discount_value, v_scale);

  update v2.orders set total_amount = v_sum - v_disc, updated_at = now()
  where id = NEW.id;

  return null;
end $$;

-- The WHEN guard is what stops this recursing: the UPDATE above changes
-- total_amount and never the discount columns, so the trigger does not re-fire.
drop trigger if exists trg_orders_discount_totals on v2.orders;
create trigger trg_orders_discount_totals
  after update on v2.orders
  for each row
  when (NEW.discount_type  is distinct from OLD.discount_type
     or NEW.discount_value is distinct from OLD.discount_value)
  execute function v2.recompute_order_totals_on_discount();
