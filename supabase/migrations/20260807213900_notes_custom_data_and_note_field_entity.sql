-- A2 (docs/v2-migration/DB_ASKS.md): give notes the same org-defined field
-- treatment every other entity has, so a "note type" is something the
-- organization configures rather than a column the app hardcodes.
--
-- The designs group notes by kind (Artwork, Delivery, Client request, General)
-- and the settings screen presents that list as editable. v2.notes had neither
-- a type column nor custom_data, so the usual route — put it in the field
-- registry — wasn't available.
--
-- Purely additive, and notably NOT a change to validate_custom_data(): that
-- function is already parameterised by TG_ARGV[0] and reads NEW.custom_data /
-- NEW.organization_id generically, with `order` status as its only
-- entity-specific branch. Notes just needed their own trigger registration,
-- the same shape as trg_validate_client_cd / _order_cd / _payment_cd.
--
-- Applied to the live project 2026-08-07 and mirrored here, per the
-- convention that supabase/migrations reflects app-requested v2 changes.

alter table v2.notes
  add column if not exists custom_data jsonb not null default '{}'::jsonb;

-- Widen the entity whitelist. Strictly more permissive, so no existing row can
-- violate the new form. ('payment' and 'attachment' were already allowed
-- DB-side; the app surfaces only client/order/order_item/product/note.)
alter table v2.field_definitions
  drop constraint if exists field_definitions_entity_check;

alter table v2.field_definitions
  add constraint field_definitions_entity_check
  check (entity = any (array[
    'client'::text, 'order'::text, 'order_item'::text, 'product'::text,
    'payment'::text, 'attachment'::text, 'note'::text
  ]));

drop trigger if exists trg_validate_note_cd on v2.notes;
create trigger trg_validate_note_cd
  before insert or update on v2.notes
  for each row execute function v2.validate_custom_data('note');
