-- A4 (docs/v2-migration/DB_ASKS.md): create_order() keeps a payment's note.
--
-- The payment insert named organization_id, direction, party_type, party_id,
-- amount, payment_date, payment_method, reference, created_by — and nothing
-- else. A note sent with an inline payment vanished with no error.
-- record_payment(), the other path, has always stored one, so the same field
-- was capturable when recording a payment against an existing order and lost
-- when recording one while creating the order.
--
-- The app has been refusing `notes` on this path (orderCreatePaymentSchema
-- omits it, .strict()) precisely so the loss was loud rather than silent. That
-- refusal lifts in the same commit: a dropped key is a lost one whether the DB
-- or zod discards it, and now neither does.
--
-- Everything else about the function is unchanged from 20260809120000, which
-- added the discount fields. `set search_path = ''` is restated because
-- CREATE OR REPLACE resets attributes that aren't; ownership and the existing
-- grants (authenticated) are preserved by REPLACE.
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
        amount, payment_date, payment_method, reference, notes, created_by
      ) values (
        v_org, 'in',
        case when v_client_id is null then null else 'client' end,
        v_client_id,
        (v_payment->>'amount')::numeric,
        coalesce((v_payment->>'payment_date')::date, current_date),
        coalesce(v_payment->>'payment_method', 'cash'),
        nullif(v_payment->>'reference',''),
        -- The A4 fix. nullif matches how `reference` is handled: an empty
        -- string is an absent note, not a note that says nothing.
        nullif(v_payment->>'notes',''),
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
