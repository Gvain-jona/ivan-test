# Onboarding redesign — design/build gap map & plan

Status: **planning** (2026-07-29). Source of truth for the target UX is the
Pencil canvas at `yoko` (this repo root). This doc maps those screens onto the
code that exists today and sequences the work.

Read first: `FIRST_RUN_AND_FIELD_SETUP.md` (the decisions the wizard was built
from — still valid; this redesign changes *how* it's presented and how it
saves, not the model), `STATE.md`, `CLAUDE.md`.

---

## 1. What the design specifies

### How to read the canvas

**The frames are states of a few surfaces, not a list of screens.** The canvas
was built to show the *cycle* at different moments, so read it as a system and
resolve apparent contradictions against the intent rather than frame-by-frame.
Concretely:

- **Five real steps**: Currency, Products, Clients, Orders, First records.
- **Products / Clients / Orders are one component** (`EntityFieldSetup`) with
  per-entity content. `k7wNjU`, `abwvp`, `AVHgD` are that component with three
  different datasets.
- **`k7wNjU` → `gZL7g` → `U7r3X` is one surface across time**: collapsed list →
  composer active with the type picker open → the field just added, expanded
  for editing. The running example ("Finishing") is the same field in all
  three. **This means a newly added field auto-expands into edit mode** — the
  `Just added · editing` header and `Saved` chip in `U7r3X` are that moment.
- **`exJQe` is a drill-in state** of the Orders step, not a sixth step.
- **`j2O3UT` / `g445H` / `p18Ek` are state catalogues** for the components
  above — the spec for what each control does in every condition.
- **Per-frame subtitles are design annotation, not copy.** "Tap any field to
  edit it right here" and "No form, no modal" describe the state being
  demonstrated. The step's real subtitle is the one on the collapsed frame;
  don't build copy that changes as the user expands a row.

14 top-level frames in `yoko`. Screen node ids kept here so the canvas and the
code stay traceable.

| Node | Screen | What it establishes |
|---|---|---|
| `A68xv` | 1. Welcome | The shell: canvas bg, centred 1000×640 card, **340px left rail** (brand mark + "GETTING STARTED" + 6-row vertical step tracker) + **660px right panel**. Welcome content = org logo tile, "Let's set up **Ivan Prints**", personalised body ("Hi Jona — …"), single `Get Started` CTA. |
| `T7Hm5Z` | 2. Currency | "STEP 1 OF 5". Currency as a **chip grid** (UGX KES TZS RWF NGN USD EUR GBP) + a free-text composer: "NOT LISTED? TYPE ANY ISO-4217 CODE" with an Add button. Footer = Back + primary. |
| `k7wNjU` | 3. Products | The field-setup pattern: `Always included: Name · Selling price` lock strip → `STARTER FIELDS · TOGGLE OFF WHAT YOU DON'T NEED` → field rows (label, coloured type tag, inline option-chip preview, chevron, switch) → **inline composer** (`Add a field — e.g. Finishing` + type mini-select + Add) → `Changes save as you go` → Back / Continue. |
| `abwvp` | 4. Clients | Same pattern. Company row carries the conditional note `· shows only for Contract clients`. |
| `AVHgD` | 5. Orders | Same pattern **plus** a separate group above starter fields: `WORKFLOW · ALWAYS ON, EDIT THE STAGES ANYTIME` holding the locked system Status row with its stage chips. |
| `U7r3X` | 6. Field editing (inline expand) | A field row **expands in place** into a full editor: Label input, Type select ("still changeable — this field has no data yet"), **Selection** (Single choice / Multiple), Options chips with ✕ + option composer ("Enter adds another and keeps the cursor here"), Rules (Required, Show on documents — each with a plain-language description), and a destructive **Archive this field** row ("Hides it going forward — existing product data stays readable"). Header shows `Just added · editing` + a `Saved` chip. |
| `gZL7g` | 7. Type picker | Dropdown from the composer. Seven types, each icon + name + **plain-language description**: Text "Any words or numbers", Number "Amounts you can add up", Date "A day on the calendar", Yes / No "A simple on-or-off switch", Select "Choice from a list you define", Relation "Points at another record", Dimension "Width x height with units". Subtitle: *"Name it, pick what kind of thing it is, hit Add. No form, no modal."* |
| `exJQe` | 8. Status workflow editor | Full-panel **drill-in** (back chevron, "Status" + lock + type tag, `Orders · system field, can't be removed`). Info strip explains name-vs-meaning: *"The app reads the tag, never the name."* Stage rows = drag grip, colour-dot swatch (with chevron ⇒ colour picker), name, `starts here` default tag, semantic tag (`open`/`won`/`lost`), ✕. Composer adds a stage with swatch + name + semantic select. `Stages save as you add them`. |
| `j2O3UT` | 9. States — rows & controls | Field row: **on / off (dims, stays legible) / system (locked on) / already added (locked + badged) / hover / dragging (Arrange mode)**. Switch: on/off/locked-on/disabled. Type tag colours. Option chip: default/removable/adding. Buttons: primary default/saving/disabled, secondary default/disabled. Currency chip: unselected/selected. |
| `g445H` | 10. States — feedback & rules | Validation: duplicate name → *"A field called \"Size\" already exists on products."* (23505 in plain words), empty label → *"A label is required — the machine key is built from it."* Guardrails (**warn, don't block**): select with no options; **nothing kept** → *"You've turned every starter field off. That's fine — products will just have a name and price…"*; type locked once data exists → *"Archive it and add a new one instead — nothing is ever deleted."* Conditional-visibility **rule builder** (`SHOW THIS FIELD ONLY WHEN [Type] [is] [Contract]`). Save feedback: saving (buttons lock, nothing else moves), save-failed toast that **keeps your toggles**. |
| `p18Ek` | 11. States — live composer | Composer: idle (Add dimmed) / typing (Enter commits and re-focuses) / **duplicate caught client-side before the 23505 round-trip** / adding (optimistic row). After add: row **flashes in place, ~1s, no scroll jump, no reopen**. **Undo, not confirm** — removing an option and archiving a field both produce an Undo toast, explicitly because *"a confirm dialog would re-introduce the modal we just removed."* |
| `W5q5eZ` | First records (final step) | "STEP 5 OF 5", `Your workspace is set up`. Three entity rows with live state — Products (`1 product added` + Done chip, `Add another`), Clients (`Who you sell to`, primary `Add a client`), Orders (lock + `Needs a client first`). Footer: Back + `Go to my dashboard →`. |

**The design's thesis, in one line:** onboarding is a *guided rail with an
always-visible list you edit in place and that saves as you go* — every modal,
confirm dialog and deferred batch-save is deliberately removed.

---

## 2. What exists today

| File | Lines | Role |
|---|---|---|
| [GettingStartedWizard.tsx](app/components/onboarding/GettingStartedWizard.tsx) | 207 | `welcome → currency → product → client → order`; centred `max-w-xl` column; a `Step n of 4` string; finish → PATCH `onboarding.completed` → `/dashboard/orders`. |
| [EntityFieldSetupStep.tsx](app/components/onboarding/EntityFieldSetupStep.tsx) | 177 | Starter fields as **checkbox rows**; "Add your own field" opens the modal sheet; **Save & continue** writes all kept starters in a loop, then advances. |
| [OnboardingGate.tsx](app/components/onboarding/OnboardingGate.tsx) | 28 | Redirect-only; hard-routes to the wizard while incomplete. |
| [FieldDefinitionFormSheet.tsx](app/components/fields/FieldDefinitionFormSheet.tsx) | 280 | The modal the design removes — machine key, group, sort order, options-as-textarea, checkboxes. |
| [EntityFieldsManager.tsx](app/components/fields/EntityFieldsManager.tsx) | 146 | Post-onboarding per-entity field list (add/edit/archive) behind a Fields toggle on Products/Clients/Orders. |
| [presets.ts](app/lib/organization/presets.ts) | 152 | Currency menu, status workflow (with `color`/`semantic`/`is_default`), per-entity starter sets. **Matches the design's content exactly.** |

Backing capability that already works: field-definitions CRUD (POST/PATCH,
archive via `status`), object-shaped options end-to-end, `is_system`,
`conditions` with a live interpreter ([CustomFieldsForm.tsx:28](app/components/fields/CustomFieldsForm.tsx:28)),
`sort_order`, `PATCH /api/organization` accepting **any** ISO-4217 shape
([validators.ts:135](app/lib/api/validators.ts:135)).

---

## 3. Gap map

Ordered roughly by size. "Backing" = whether the API/DB already supports it.

| # | Design element | Today | Backing | Work |
|---|---|---|---|---|
| 1 | **Inline expand editor** (`U7r3X`) | modal sheet | ✅ ready | New `FieldRowEditor`. The single biggest piece. Two entry points: tapping a row, **and automatically on the field you just added** (see §1). |
| 2 | **Inline composer + type picker** (`gZL7g`) | "Add your own field" → modal | ✅ ready | New composer; type picker with the plain-language descriptions from the design. Commits → optimistic row → flash → auto-expand, with the cursor back in the composer. |
| 3 | **Save-as-you-go** | deferred batch on Continue ([EntityFieldSetupStep.tsx:70](app/components/onboarding/EntityFieldSetupStep.tsx:70)) | ✅ ready | Per-row create/archive on toggle; optimistic row + flash; Continue becomes navigation only. |
| 4 | **Status workflow editor** (`exJQe`) | none — status ships as a preset you can't touch | ⚠️ colour palette undefined; reorder needs N PATCHes | Drill-in panel: rename, reorder, recolour, semantic tag, default stage, add/remove. |
| 5 | **Shell** — full-bleed split card + left rail tracker | `max-w-xl` column **inside** `DashboardLayout` (TopHeader, FooterNav, `pb-24`) | n/a | Route must escape the dashboard chrome (or the layout must suppress it on `/dashboard/getting-started`), then a new `SetupShell` + `StepTracker`. |
| 6 | **Undo, not confirm** (`p18Ek`) | none | ✅ (archive is reversible; option removal is local until saved) | Toast with an Undo action; restore path for archive. |
| 7 | **Guardrails & validation copy** (`g445H`) | one generic destructive toast | ✅ | Client-side duplicate check, warn-don't-block states, the "nothing kept" reassurance, the type-lock explanation. |
| 8 | **First records step** (`W5q5eZ`) | doesn't exist — order Continue redirects | ✅ (`useProducts`/`useClients` counts + `useSheets()`) | New step; makes the count "of 5" true. |
| 9 | **Field row v2** — switch, type tag, chip preview, chevron | checkbox + badge, no expand | ✅ | Rebuild row; add off/system/already-added/hover states from `j2O3UT`. |
| 10 | **Currency chips + free ISO entry** (`T7Hm5Z`) | shadcn `Select`, 8 fixed options | ✅ API already accepts any code | Chip grid + code composer. |
| 11 | **Back on every step** | no back navigation at all | n/a | Step history. |
| 12 | **Personalisation** — "Let's set up Ivan Prints", "Hi Jona" | generic copy | ✅ `useOrganization().organization.name`, Clerk user | Wire both. |
| 13 | **`Always included` lock strip** | absent | n/a | Per-entity constant (fixed columns aren't in `STARTER_FIELDS` by design). |
| 14 | **Conditional-visibility rule builder** (`g445H`) | `conditions` set in the preset, never surfaced | ✅ interpreter exists | UI only — read/write `{field, equals}`. |
| 15 | **Drag to reorder** ("Arrange mode", `j2O3UT`) | none | ⚠️ no batch endpoint | dnd + `sort_order`; either N PATCHes or a small batch route. |
| 16 | **Option colour swatch picker** (`exJQe`) | `color` is a free string; presets use names | ⚠️ palette undefined | Fix a named palette in `lib/fields/options.ts` and render chips from it. |
| 17 | **Multiple-choice selection mode** (`U7r3X`) | **not supported anywhere** — `field_type` has no multi variant, `CustomFieldInput` renders a single `Select` ([:162](app/components/fields/CustomFieldInput.tsx:162)), the DB trigger validates a scalar against options | ❌ **DB-owner work** | See §5 — this is a new capability, not UI. |
| 18 | **Relation / Dimension configuration** | `RelationField` renders, but nothing sets `related_entity` / `display_field` | ⚠️ | The type picker offers types the editor can't configure. |

### Bugs found while mapping (independent of the redesign)

- [FieldDefinitionFormSheet.tsx:89](app/components/fields/FieldDefinitionFormSheet.tsx:89) filters options to
  `typeof o === 'string'`. **Every preset field ships object options**, so
  editing one shows an empty textarea, and `canSubmit` then blocks saving a
  select. Today this makes the status field effectively uneditable — which is
  part of why the redesign's dedicated workflow editor matters.
- [FieldDefinitionFormSheet.tsx:265,269](app/components/fields/FieldDefinitionFormSheet.tsx:265) hardcode `text-white` (violates the theme-token rule in `CLAUDE.md`). Moot if the sheet is retired.
- The wizard reads `Step n of 4` ([GettingStartedWizard.tsx:25](app/components/onboarding/GettingStartedWizard.tsx:25)); design and spec both say 5.

---

## 4. Holes in the design itself

### Decided 2026-07-29

1. **Mobile — adapt responsively at build time.** No mobile frames will be
   drawn; the desktop frames are the reference and the mobile behaviour is a
   build-time judgment call. Working rules: card goes full-bleed below `lg`,
   the left rail collapses to a horizontal step strip above the panel content,
   and the inline expand stays **inline** (it does not become a sheet — the
   design's whole point is that the list never goes away). Every new component
   gets a row in `docs/mobile-responsiveness/COMPONENT_REGISTRY.md`.
2. **Theming — map to theme tokens, light + dark.** The canvas palette is
   translated onto the app's tokens (`bg-card`, `bg-muted`, `text-foreground`,
   `text-muted-foreground`, `border-border`, `bg-primary`…) rather than copied
   as literal hex. Colours will shift slightly from the canvas; the surface has
   to hold in dark mode like every other screen. Type-tag and status-chip
   colours come from the named palette in §5, not from raw hex.
3. **Capability scope — build only what v2 supports.** The editor exposes what
   the v2 schema and `validate_custom_data` actually accept, nothing more. This
   drops the **Selection (Single choice / Multiple)** block from the expand
   editor entirely — `field_type` has no multi variant and the trigger
   validates a scalar. Same test applies elsewhere: `relation` keeps
   `related_entity`/`display_field` (both real columns) and `dimension` renders
   as-is; nothing gets a UI that the DB would reject.

### Still open (smaller — proposing defaults, say if you disagree)

4. ~~**Brand orange conflict.**~~ **Resolved 2026-07-29 — there was none.**
   The app's `--primary` is `16 100% 50%`, which *is* `#FF4400`, the canvas
   value. `#FF8400` belongs to the lunaris component library imported into the
   Pencil document, not to this app.
5. ~~**Tracker numbering.**~~ **Resolved in build, 2026-07-29.** Better than the
   proposed "drop the numerals": the rail keeps the design's numbered circles,
   but **Welcome carries a dot instead of a numeral** because it's an intro,
   not a counted step. Currency is then `1` in both the rail and the panel's
   "STEP 1 OF 5", and they can't drift — both read `SETUP_STEPS` in
   `app/lib/onboarding/steps.ts`, and a test pins it.
6. **Toggle-off vs archive.** For a starter field that has *never been
   created*, "Archive this field" is meaningless. *Default: expand on an
   uncreated starter shows no Archive row (the switch already means "don't
   create it"); Archive appears only once the row exists in the org.*
7. **Skip / resume.** No skip affordance in the design; the gate hard-redirects.
   The "already added, locked on" row state implies re-entry works. *Default:
   no skip, but the wizard is resumable — which the save-as-you-go model gives
   us for free.* Still listed as open in `FIRST_RUN_AND_FIELD_SETUP.md`.

---

## 5. Foundations

### Token map — **DONE** (phase 0, 2026-07-29)

Canvas palette → app tokens. New variables are defined for both themes in
`app/globals.css` and bound in `tailwind.config.ts`.

| Canvas | Token | Notes |
|---|---|---|
| `#EDEEF2` page canvas | `bg-setup-canvas` | **New.** The base tokens can't express the design's three elevation levels — in light, `--card` (98%) is *darker* than `--background` (100%), which would put the card behind the page. |
| `#F4F5F9` right panel | `bg-setup-panel` | **New.** |
| `#FFFFFF` rows / left rail | `bg-setup-surface` | **New.** |
| `#FF4400` brand | `bg-primary` | **No change needed** — `--primary` is already `16 100% 50%` = `#FF4400`. The `#FF8400` in the Pencil doc is the imported lunaris library's token, not this app's. |
| `#18181B` / `#6B6F80` / `#A1A1AA` ink ramp | `text-foreground` / `text-muted-foreground` | |
| `#EFEFF2` / `#E2E5EC` lines | `border-border` | |
| `#16A34A` + `#E7F6ED` | `text-success` / `bg-success-bg` | **New** — no success token existed. |
| `#B45309` + `#FDF4E7` | `text-warning` / `bg-warning-bg` | **New.** |
| `#2563EB` + `#E8F1FE` | `text-info` / `bg-info-bg` | **New.** |
| `#DC2626` + `#FDECEC` | `text-destructive` | Existing token. |

### Option colour palette — **DONE** (phase 0)

`app/lib/fields/colors.ts` (not `options.ts` as first sketched — `options.ts`
stays about normalising option *data*). Exports `OPTION_COLOR_NAMES`,
`OPTION_COLORS`, `optionColorClasses()`, `SEMANTIC_COLORS` and
`fieldTypeTagClasses()`; colocated tests assert the palette covers every
colour the presets ship and that the type-tag map matches the validator enum.

**Three roles per colour, not one** — measured, not eyeballed:

- `--opt-X` **vivid** (the canvas's own 500/600 values) for stage dots and
  swatches. Decorative non-text UI, ≥3:1 on the row surface in both themes.
- `--opt-X-fg` **darker** for chip label text, ≥4.5:1 on `-bg`. The vivid
  values only reach 2.8–4.3:1 in light (amber worst at 2.83), and chip labels
  are small text — so a single value per colour cannot serve both roles.
- `--opt-X-bg` chip background.

Dark theme passes at 5.1–7.2:1 throughout, so there `-fg` equals the vivid
value; the var still exists so call sites stay theme-agnostic.

Consume via `colors.ts` only — never compose an `opt-*` class name at a call
site, or Tailwind's JIT won't find it and it'll be purged.

### Still to decide

- **Reordering *fields*** — N × `PATCH /api/field-definitions/[id]` (simple,
  chatty, fine for ≤10 rows) vs a batch route. Recommend N PATCHes. Not needed
  by any shipped phase yet.
  *Note: reordering **stages** turned out not to need this at all — stages are
  entries in one field's `options` array, so the whole workflow saves in a
  single PATCH.*

### Revision 2026-07-31 — full-height columns, not a card

The canvas draws setup as a centred 1000×640 card floating on a canvas colour.
Built that way it read as a modal, which is the wrong promise: setup is the
whole screen at that moment, not something overlaid on an app you could return
to. Replaced with two full-height columns and generous internal margins.

That change is what makes the scroll behaviour work:

- **The rail never scrolls** (`overflow-hidden`, full height). Where you are in
  setup is a fixed frame of reference and can't be scrolled out of sight.
- **Only the panel's content scrolls.** The step title and the Back/Continue
  footer are hoisted out of the scroll area — they're the two things needed
  constantly, and a footer that scrolls away means hunting for Continue on
  every long step (the field lists are long).
- Hoisting is done with **portals into slots the shell owns** (`SetupSlots`
  context) rather than by lifting heading/footer into props. Steps still render
  `<StepHeading>` / `<StepFooter>` where it reads naturally, and the shell
  decides where they land — so `EntityFieldSetupStep` keeps owning the Continue
  that triggers its own save. The slots are null until mounted, so the first
  client render matches the server's.

**Org logo everywhere** — the rail mark and the welcome hero use the Clerk
`imageUrl` (`OrgLogo`), with initials only as a pre-load fallback. This also
required adding Clerk's image hosts to `next.config.js` `remotePatterns`;
without them `next/image` throws in production, which `TopHeader` was already
exposed to (dev hides it via `unoptimized`).

### Deviations from the canvas, and why

- **Reorder is buttons, not drag.** The project has no drag-and-drop library
  and a list of seven stages didn't justify adding one. Buttons are also
  keyboard-reachable, which a hand-rolled drag wouldn't have been.
- **Field type is read-only in the editor** (§ phase 4). v2 has no guard
  against retyping a field that holds data, and nothing client-side can tell
  whether records carry values — so the editor gives the design's own
  guardrail copy instead: archive it and add a new one.
- **`relation` is absent from the composer's type list** until its target can
  be set (phase 4c).

### Trigger interactions the workflow editor has to respect

`v2.validate_custom_data` checks `order.status` against the status field's
`options` on **every** order insert/update, so the editor can lock orders out
of being saved. Two cases, found 2026-07-31:

- ✅ **Fixed — emptying the stage list.** `value_in_options` treats **NULL** as
  "unconstrained" but an **empty array** as "nothing matches", so an active
  status field with `options: []` rejects every order status write. The design's
  "select with no options → warn, don't block" rule was written for ordinary
  selects; for the governed status column it's a hard break. Removing the last
  stage is now blocked (the × isn't rendered) rather than warned.
- 🔲 **Open — removing a stage that orders are in.** Delete "Printing" while
  orders sit in it and those orders can't be saved again
  (`order status printing not in allowed options`); the rows survive but become
  un-editable. Needs a usage check before removal — `GET /api/orders?status=
  <value>&limit=1` returns `total`, so the count is available; the editor would
  take an optional `usageOf(value)` resolver and refuse (or warn with the count)
  when it's non-zero. Only reachable from `EntityFieldsManager`, since during
  first-run there are no orders yet.

Renaming is safe by construction: the editor edits `label` only and freezes
`value`, which is what sits in the column.

Nothing here needs the DB owner. Per decision §4.3, multi-select is out of
scope rather than blocking.

---

## 6. Build sequence

Each phase leaves the wizard working; the field-editing pieces are built as
reusable components so `EntityFieldsManager` inherits them in phase 7 and
`FieldDefinitionFormSheet` can then be deleted.

| Phase | Scope | Depends on |
|---|---|---|
| **0** | ✅ **DONE 2026-07-29** — token map (canvas → app tokens; new setup-surface, success/warning/info and `opt-*` variables in `globals.css` + `tailwind.config.ts`) and the option/type colour palette in `app/lib/fields/colors.ts` with colocated tests | §4.2, §5 |
| **1** | ✅ **DONE 2026-07-29** — `SetupShell` + `StepTracker` + `StepHeading`/`StepFooter`, the 6-step model in `app/lib/onboarding/steps.ts` (+ tests), chrome suppressed for `SETUP_PATH`, `OnboardingGate` lifted above the layout and made bidirectional, Back on every step, personalised `WelcomeStep`, and `FirstRecordsStep` so the sixth rail row resolves | phase 0 |
| **2** | ✅ **DONE 2026-07-30** — `CurrencyStep`: selectable chip grid (real radios under the styling) + free ISO-4217 composer whose codes join the grid. `CURRENCY_OPTIONS` split `label` into a bare name plus `symbol` so chips read `CODE · Name`; preset tests extended. **Amended 2026-08-02: the step is required, not skippable** — `v2.issue_document()` refuses to raise an invoice or quotation without `settings.locale.currency`, so a skipped currency meant onboarding stamped complete and then every document failed. Continue is disabled until a code is chosen, and the wizard prefills the org's saved currency so a second pass isn't re-blocked. **Also 2026-08-02: browse, don't guess** — the free-text "Not listed? Type any ISO-4217 code" composer is removed (it asked the user to name a standard and recall a 3-letter code with no feedback until it was wrong). The 8 chips are now a shortlist over a searchable list of all 158 currencies (`lib/organization/currencies.ts`, generated by `scripts/gen-currencies.js` and committed — deriving it from `Intl` at runtime would risk an SSR hydration mismatch on the names). A pick from the long list joins the chip row so the selection stays visible. The list is a browsing aid only: API and DB still validate on `^[A-Z]{3}$` alone | phase 1 |
| **3a** | ✅ **DONE 2026-07-30** — `FieldRow` (switch, tinted type tag, inline option chips, off/locked/added states) replacing the checkbox rows; `FIXED_FIELDS` + the `Always included` strip; conditional-rule qualifier rendered from `conditions`. Also fixed the shared `Switch` primitive, which hardcoded `orange-600`/`gray-700` and only read correctly in dark mode. **No expand chevron yet** — phase 4 wires it; showing it now would break the "every signifier is wired" rule | phase 1 |
| **3b** | ~~Save-as-you-go on the starter toggles~~ — **dropped 2026-07-30, this was a misread.** "Changes save as you go" sits *inside the composer block*, and the row's ON state reads "Kept — **will be created**". Starter toggles are staged and applied on Continue; immediate saving belongs to the composer and the editor. The existing staged model was already correct | — |
| **3c** | ✅ **DONE 2026-07-30** — `FieldComposer` + type picker with plain-language descriptions, replacing the create-field modal in setup. Adds immediately, clears and refocuses so fields can be added in a row, catches duplicates client-side before the 23505 round-trip, and flashes the new row in place. Added fields render as rows in the same list, not a separate badge strip. `slugifyFieldName` extracted to `lib/fields/slug.ts` | phase 3a |
| **4** | ✅ **DONE 2026-07-30** — `FieldEditor` opens inside the row: label (with the empty-label error), read-only type + the archive-instead guardrail, `FieldOptionsEditor` (Enter adds and keeps the cursor) with the no-options warning, Required / Show-on-documents rules, and archive with an **Undo toast, no confirm**. Saves on a 700ms debounce with a Saved indicator. The just-added row auto-expands, completing add→expand→settle. `EditableFieldRow` bundles row+editor for phase 7's port. **Only fields that exist are expandable** — see below | phase 3c |
| **4b** | ✅ **DONE 2026-07-30** — starters are editable before they exist. `FieldEditor` became controlled and the debounce moved to `useDebouncedSave`, so one editor serves both the persisted case (`EditableFieldRow`) and the staged one (`StarterFieldRow`). `starterFieldsToApply` takes an `overrides` map, so a relabelled field or a reworked option list is created as the user shaped it. **System fields stay unexpandable** — their options carry colour and semantics this editor can't set; that's phase 6's job | phase 4 |
| **4c** | `relation` rejoins the composer's type list, once its target entity/display field can be set | phase 4 |
| **5** | **Feedback layer**: duplicate pre-check, guardrail copy, Undo toasts, saving/failed states, rule builder | phase 4 |
| **6** | ✅ **DONE 2026-07-31** — `StatusWorkflowEditor` as a drill-in that takes over the panel: rename, reorder, recolour (phase-0 palette), set the semantic tag, set the starting stage, add and remove. Works on the staged starter *and* on the field once created. Renaming changes `label` only — `value` is what sits in `order.status` on existing orders. Also fixed a dead end: a created starter used to render as a locked row with no editor; the list is now pending-starters + everything the org has | phase 4, phase 0 |
| **7** | ✅ **DONE 2026-07-31** — `EntityFieldsManager` rebuilt on the same row, editor, composer and workflow drill-in as setup, so a field is added and edited identically on day one and day one hundred. **`FieldDefinitionFormSheet` deleted** — the last dialog in this area, and the one that couldn't save a preset select at all (it filtered options to strings, so every object-shaped option was dropped). Archived fields fold away with Restore instead of vanishing. Shared pieces moved out of `onboarding/` into `fields/`: `useFieldActions` (was `useEntityFieldActions`, now typed to `FieldEntity` so it covers `order_item`), `StatusWorkflowDrillIn`, and `FIELD_EXAMPLE`. (The First records step landed back in phase 1 — a rail row that redirected away instead of rendering would have been a lie in the UI.) | phases 3–6 |

Reordering/drag ("Arrange mode") and relation/dimension configuration are
deliberately left to a follow-up after phase 7 — neither blocks first-run.
