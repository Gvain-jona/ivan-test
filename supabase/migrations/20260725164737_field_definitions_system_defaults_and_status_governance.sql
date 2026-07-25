-- First-run/field-setup schema foundation (see
-- docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md). Applied to the live
-- project via MCP apply_migration on 2026-07-25 (version 20260725164737);
-- this file mirrors it so the repo's migration history stays complete.
--
-- 1. field_definitions gains is_system (starter/protected vs user-added)
--    and default_value (so predefined fields can pre-fill).
-- 2. A shared v2.value_in_options() so select validation accepts the new
--    object option shape {value,label,color,is_default,semantic} as well as
--    legacy string arrays / keyed objects.
-- 3. validate_custom_data() uses the helper for select fields AND now
--    governs the order.status fixed column against an entity='order',
--    field_name='status' select field-definition (enforced only when such a
--    field is configured, so an unconfigured org can still transact).
--    search_path hardened to '' (previously unset).

alter table v2.field_definitions
  add column if not exists is_system boolean not null default false;

alter table v2.field_definitions
  add column if not exists default_value jsonb;

comment on column v2.field_definitions.is_system is
  'Starter/protected field seeded by a template vs a user-added field. System fields (e.g. order status) should not be hard-deletable in the UI.';
comment on column v2.field_definitions.default_value is
  'Optional default the form pre-fills for this field (jsonb, same shape as the custom_data value).';

-- Membership test for a select field's allowed values. Tolerant of three
-- option shapes so the string->object migration is non-breaking:
--   array of strings   ["a","b"]
--   array of objects    [{"value":"a",...},{"value":"b",...}]  (new)
--   keyed object        {"a":...,"b":...}                      (legacy)
-- NULL options => no constraint (matches prior behavior).
create or replace function v2.value_in_options(p_options jsonb, p_value text)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select case
    when p_options is null then true
    when jsonb_typeof(p_options) = 'array' then exists (
      select 1
      from jsonb_array_elements(p_options) e
      where (jsonb_typeof(e) = 'string' and (e #>> '{}') = p_value)
         or (jsonb_typeof(e) = 'object' and (e ->> 'value') = p_value)
    )
    when jsonb_typeof(p_options) = 'object' then (p_options ? p_value)
    else false
  end
$$;

revoke all on function v2.value_in_options(jsonb, text) from public;
revoke all on function v2.value_in_options(jsonb, text) from anon;
grant execute on function v2.value_in_options(jsonb, text) to authenticated;
grant execute on function v2.value_in_options(jsonb, text) to service_role;

create or replace function v2.validate_custom_data()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
DECLARE
  v_entity text := TG_ARGV[0];
  fd RECORD;
  key text;
  val jsonb;
  ref_exists boolean;
  known_keys text[] := ARRAY[]::text[];
  v_status_fd RECORD;
BEGIN
  FOR fd IN
    SELECT * FROM v2.field_definitions
    WHERE organization_id = NEW.organization_id AND entity = v_entity AND status = 'active'
  LOOP
    known_keys := known_keys || fd.field_name;
    val := NEW.custom_data -> fd.field_name;

    IF fd.is_required AND (val IS NULL OR val = 'null'::jsonb) THEN
      RAISE EXCEPTION 'field % is required on %', fd.field_name, v_entity;
    END IF;

    CONTINUE WHEN val IS NULL;

    IF val = 'null'::jsonb THEN
      RAISE EXCEPTION 'field %: use absence, not null', fd.field_name;
    END IF;

    CASE fd.field_type
      WHEN 'text' THEN
        IF jsonb_typeof(val) <> 'string' THEN RAISE EXCEPTION 'field % must be text', fd.field_name; END IF;
      WHEN 'number' THEN
        IF jsonb_typeof(val) <> 'number' THEN RAISE EXCEPTION 'field % must be a number', fd.field_name; END IF;
      WHEN 'boolean' THEN
        IF jsonb_typeof(val) <> 'boolean' THEN RAISE EXCEPTION 'field % must be boolean', fd.field_name; END IF;
      WHEN 'date' THEN
        IF jsonb_typeof(val) <> 'string' OR (val #>> '{}') !~ '^\d{4}-\d{2}-\d{2}' THEN
          RAISE EXCEPTION 'field % must be an ISO date string', fd.field_name; END IF;
      WHEN 'select' THEN
        IF NOT v2.value_in_options(fd.options, val #>> '{}') THEN
          RAISE EXCEPTION 'field %: value % not in allowed options', fd.field_name, val #>> '{}'; END IF;
      WHEN 'dimension' THEN
        IF jsonb_typeof(val) <> 'object' OR NOT (val ? 'raw') THEN
          RAISE EXCEPTION 'field % must be an object with at least a raw key', fd.field_name; END IF;
        IF (val ? 'w') AND jsonb_typeof(val->'w') <> 'number' THEN
          RAISE EXCEPTION 'field %: w must be numeric', fd.field_name; END IF;
        IF (val ? 'h') AND jsonb_typeof(val->'h') <> 'number' THEN
          RAISE EXCEPTION 'field %: h must be numeric', fd.field_name; END IF;
      WHEN 'relation' THEN
        IF jsonb_typeof(val) <> 'string' THEN
          RAISE EXCEPTION 'field % must be a uuid string', fd.field_name; END IF;
        EXECUTE format(
          'SELECT EXISTS (SELECT 1 FROM v2.%I WHERE id = $1 AND organization_id = $2)',
          fd.related_entity
        ) INTO ref_exists USING (val #>> '{}')::uuid, NEW.organization_id;
        IF NOT ref_exists THEN
          RAISE EXCEPTION 'field %: reference % not found in same organization', fd.field_name, val #>> '{}';
        END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  FOR key IN SELECT jsonb_object_keys(NEW.custom_data) LOOP
    IF NOT key = ANY(known_keys) THEN
      RAISE EXCEPTION 'unknown field % on % — define it in field_definitions first', key, v_entity;
    END IF;
  END LOOP;

  -- Order status is a fixed column (not custom_data), but its allowed values
  -- are governed the same way: an entity='order', field_name='status' select
  -- field-definition. Enforced only when such a field is configured, so an
  -- unconfigured org can still transact until it sets its workflow.
  IF v_entity = 'order' THEN
    SELECT * INTO v_status_fd
    FROM v2.field_definitions
    WHERE organization_id = NEW.organization_id
      AND entity = 'order' AND field_name = 'status' AND status = 'active'
      AND field_type = 'select'
    LIMIT 1;

    IF FOUND AND NEW.status IS NOT NULL THEN
      IF NOT v2.value_in_options(v_status_fd.options, NEW.status) THEN
        RAISE EXCEPTION 'order status % not in allowed options', NEW.status;
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $function$;
