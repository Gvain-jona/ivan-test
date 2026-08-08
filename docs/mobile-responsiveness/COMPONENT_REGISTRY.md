# UI Component Responsiveness Registry

An ongoing log, not a gate. Add one row whenever a new component is created (or an existing one is significantly restructured), with a plain `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). No write-up required, no enforcement implied — `No` is a perfectly valid entry. This exists only to keep visibility into how much of the app actually scales as it grows.

Seeded below from `MOBILE_AUDIT.md` (2026-06-25) to bootstrap the log — update a row's status in place once its underlying fix ships, rather than adding a duplicate row.

| Component | Path | Responsive | Notes |
|-----------|------|------------|-------|
| ExpensesTable | `app/dashboard/expenses/_components/table/ExpensesTable.tsx` | No | MOB-01 |
| MaterialPurchasesTable | `app/components/materials/MaterialPurchasesTable.tsx` | No | MOB-02 |
| NotificationsDrawer | `app/components/notifications/NotificationsDrawer.tsx` | No | MOB-03 |
| OrdersTableNew | `app/components/orders/OrdersTableNew.tsx` | Yes | Card-first list on mobile (`lg:hidden`), table desktop-only (`hidden lg:block`) — MOB-04 fixed |
| OrderCard | `app/components/orders/OrderCard.tsx` | Yes | Mobile order card (Home card language) with full action parity — tap-to-view, status dropdown, actions menu, badges |
| OrdersFilterSheet | `app/components/orders/OrdersFilterSheet.tsx` | Yes | Mobile filter bottom sheet (the reference "Filter" pattern) on the shared OrderSheet primitive: Status/Payment/Date groups + Clear all (N) / Show N footer. A Filter button (`lg:hidden`) in OrdersTableNew opens it; desktop keeps the inline selects |
| OrderViewSheet (+ tabs) | `app/components/orders/order-view/` | Yes | Renders through the OrderSheet primitive (bottom sheet on mobile). Tab bar scrolls horizontally at 375px; theme-token-correct after swapping 34 dark-only hardcodes (`text-white`/`#2B2B40`/`orange-500` → `foreground`/`border`/`primary`) so it holds in light mode. Items tab table scrolls in `overflow-x-auto` |
| AccountsSettingsTab (edit dialogs) | `app/dashboard/settings/_components/AccountsSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| ProfitSettingsTab (edit dialogs) | `app/dashboard/settings/_components/ProfitSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| UserManagementTab | `app/dashboard/settings/_components/UserManagementTab.tsx` | Partial | MOB-06, MOB-12 |
| OrderFormSheet | `app/components/orders/OrderFormSheet.tsx` | Partial | MOB-06, MOB-07, MOB-08 |
| MaterialPurchaseForm | `app/components/materials/MaterialPurchaseForm.tsx` | Partial | Field grids solid; sticky footer overlaps keyboard — MOB-07 |
| InvoiceSheet | `app/features/invoices/components/InvoiceSheet.tsx` | Partial | Tabs overflow — MOB-08 |
| MaterialsPanel (analytics) | `app/dashboard/analytics/_components/MaterialsPanel.tsx` | Partial | Stat grid hardcoded to 2 cols — MOB-09 |
| OrangeInvoiceTemplate | `app/features/invoices/components/templates/OrangeInvoiceTemplate.tsx` | Partial | Metadata grid doesn't collapse — MOB-10 |
| RolePermissionsSection | `app/dashboard/settings/_components/RolePermissionsSection.tsx` | Partial | Double-scroll inside dialog — MOB-12 |
| FooterNav / ExpandableTabs | `app/components/navigation/FooterNav.tsx` | Yes | Desktop-only now (`hidden lg:block`) — the floating pill with the full destination set; mobile renders MobileTabBar instead |
| MobileTabBar | `app/components/navigation/MobileTabBar.tsx` | Yes | Mobile-only (`lg:hidden`) bottom tab bar: 4 primary routes + More sheet; safe-area aware. The platform-adaptive counterpart to the desktop pill |
| TopHeader | `app/components/navigation/TopHeader.tsx` | Yes | Entirely desktop-only now: branded bar + announcement banner (`hidden lg:block`) and the profile-error alert (`hidden lg:flex`) all render only at `lg+`. Mobile shows nothing from this header — each screen owns its own top (e.g. Home hero) |
| DashboardLayout | `app/components/layout/DashboardLayout.tsx` | Yes | |
| Home dashboard KPI grids | `app/dashboard/home/` | Yes | |
| MaterialPurchaseForm field grids | `app/components/materials/MaterialPurchaseForm.tsx` | Yes | Internal `grid-cols-1 md:grid-cols-2/3` layout specifically |
| Chart rendering (Recharts) | various `_components/` analytics charts | Yes | `ResponsiveContainer` used consistently |
| Date-range picker | shared date-range component | Yes | |
| SideNav | `app/components/navigation/SideNav.tsx` | N/A | Dead code, never rendered — see MOBILE_AUDIT.md architecture question |
| CustomFieldsForm | `app/components/fields/CustomFieldsForm.tsx` | Yes | Field grid collapses `sm:grid-cols-2` → 1 col; groups stack vertically |
| CustomFieldInput | `app/components/fields/CustomFieldInput.tsx` | Yes | Dimension inputs wrap via `flex-wrap`; selects/inputs full-width |
| OrderSheet (the one sheet primitive) | `app/components/ui/sheets/OrderSheet.tsx` | Yes | Built on **`vaul`**: real drag-to-dismiss, focus trap, slide animation, scroll-lock, keyboard-aware inputs. **Bottom drawer on mobile / right drawer on desktop** (`useMediaQuery`). Optional sticky **`footer` slot** (safe-area aware). Every form (order/client/product/field) **and** the tab-bar More sheet render through it — one sheet language |
| OrderFormSheet (v2 rebuild) | `app/components/orders/OrderFormSheet.tsx` | Yes | All field grids collapse `sm:` → 1 col; payment rows stack. Bottom sheet on mobile with a **sticky Cancel/Save footer** (via OrderSheet `footer`) |
| ProductsPage | `app/dashboard/products/page.tsx` | Yes | Header/controls stack on mobile; table scrolls in `overflow-x-auto` |
| ProductFormSheet | `app/components/products/ProductFormSheet.tsx` | Yes | Grids collapse `sm:` → 1 col |
| ~~FieldSetupPage~~ | ~~`app/dashboard/fields/page.tsx`~~ | — | **Removed 2026-07-25** — retired; field editing moved per-entity via `EntityFieldsManager` |
| StatusWorkflowEditor | `app/components/fields/StatusWorkflowEditor.tsx` | Partial | Drill-in workflow editor; stage rows pack colour + name + tag + controls on one line and get tight at 375px — check whether the semantic tag should wrap below the name |
| WorkflowStageRow | `app/components/fields/WorkflowStageRow.tsx` | Partial | One stage row; name input flexes, controls are fixed-width. Same 375px caveat as above |
| StatusWorkflowDrillIn | `app/components/onboarding/StatusWorkflowDrillIn.tsx` | Yes | Hosts the editor and owns save timing; no layout of its own |
| EntityFieldList | `app/components/onboarding/EntityFieldList.tsx` | Yes | Renders the row list; no layout of its own |
| FieldEditor | `app/components/fields/FieldEditor.tsx` | Yes | Inline field editor: stacked single-column groups (label / type / options / rules / archive), all full-width |
| FieldOptionsEditor | `app/components/fields/FieldOptionsEditor.tsx` | Yes | `flex-wrap` option chips + a full-width add row |
| EditableFieldRow | `app/components/fields/EditableFieldRow.tsx` | Yes | Composition of FieldRow + FieldEditor for a field that exists; no layout of its own |
| StarterFieldRow | `app/components/onboarding/StarterFieldRow.tsx` | Yes | Same composition for a starter that doesn't exist yet (edits staged until Continue); no layout of its own |
| FieldComposer | `app/components/fields/FieldComposer.tsx` | Partial | Single-row form (input + type select + Add) that stays horizontal at 375px; the input flexes but the row gets tight — check whether the type select should drop below on narrow screens |
| FieldRow | `app/components/fields/FieldRow.tsx` | Yes | One field in an entity's list: switch + tinted type tag + wrapping option chips. Meta line and chips both `flex-wrap`; switch stays pinned right. Shared by setup and (from phase 7) the field manager |
| EntityFieldsManager | `app/components/fields/EntityFieldsManager.tsx` | Yes | Inline per-entity field list behind a "Fields" toggle on Products/Clients/Orders. Rebuilt on the shared FieldRow / FieldEditor / FieldComposer; single-column, no dialog |
| ~~FieldDefinitionFormSheet~~ | ~~`app/components/fields/FieldDefinitionFormSheet.tsx`~~ | — | **Removed 2026-07-31** — create/edit moved inline (composer + in-row editor); the sheet also couldn't save object-shaped select options |
| ClientsPage | `app/dashboard/clients/page.tsx` | Yes | Controls stack on mobile; table scrolls in `overflow-x-auto` |
| ClientFormSheet | `app/components/clients/ClientFormSheet.tsx` | Yes | Single column; custom-field grid collapses `sm:` → 1 col |
| SignInPage (Clerk) | `app/auth/signin/[[...rest]]/page.tsx` | Yes | Clerk `<SignIn />` card is responsive by default; branding shell reuses signin.css |
| HomePage | `app/dashboard/home/page.tsx` | Yes | Mobile-first Home feed; centered `max-w-2xl` column, stacks naturally |
| HomeHero | `app/components/home/HomeHero.tsx` | Yes | Greeting hero + avatar + quick-add bar; greeting scales `text-3xl sm:text-4xl` |
| HomeQuickActions | `app/components/home/HomeQuickActions.tsx` | Yes | Horizontal-scroll quick-action chips (New client / New product → `?new=1` deep-links). Replaced HomeCategoryChips, which duplicated the tab bar |
| HomeSnapshot | `app/components/home/HomeSnapshot.tsx` | Yes | "Sales this month" momentum card (figure + month order count); single column |
| RecentOrdersList | `app/components/home/RecentOrdersList.tsx` | Yes | Card-first order list grouped by workflow state (in progress / awaiting payment / …) — the mobile default for order data |
| GettingStartedPage | `app/dashboard/getting-started/page.tsx` | Yes | First-run wizard host; renders without dashboard chrome (DashboardLayout suppresses it for this route), so the shell owns the viewport |
| GettingStartedWizard | `app/components/onboarding/GettingStartedWizard.tsx` | Partial | Step switchboard on `SetupShell`; layout is the shell's. Visual QA pending (needs authed runtime) |
| SetupShell | `app/components/onboarding/SetupShell.tsx` | Yes | Full-height two columns (340px rail + panel), not a floating card. Rail never scrolls; only the panel's content does, with the step title and footer hoisted out of the scroll area via portals. Below `lg` the columns stack and the rail becomes a header band. Also exports SectionLabel / StepHeading / StepFooter |
| OrgLogo | `app/components/onboarding/OrgLogo.tsx` | Yes | Square org mark from Clerk `imageUrl`, initials only as a pre-load fallback; size-driven, no layout of its own |
| StepTracker | `app/components/onboarding/StepTracker.tsx` | Yes | Vertical rail tracker on `lg`, horizontal indicator strip below (labels `sr-only`); both from one step model |
| WelcomeStep | `app/components/onboarding/WelcomeStep.tsx` | Yes | Centred intro; `max-w-md` copy block, single CTA |
| CurrencyStep | `app/components/onboarding/CurrencyStep.tsx` | Yes | `flex-wrap` shortlist chips reflow 3→2→1 per row; below them a full-width search box and a `max-h-64` scrolling list of all 158 currencies. Rows are name (truncates) + code, so they hold at 375px. The ISO-code text composer it used to carry is gone |
| currency-picker-parts | `app/components/onboarding/currency-picker-parts.tsx` | Yes | `CurrencyChip` + `CurrencyListRow`, the two radio presentations of the one currency choice; no layout of their own |
| FirstRecordsStep | `app/components/onboarding/FirstRecordsStep.tsx` | Partial | Three entity rows (icon + text + action); text truncates, but the row stays horizontal at 375px — check the button doesn't crowd the label. Visual QA pending |
| EntityFieldSetupStep | `app/components/onboarding/EntityFieldSetupStep.tsx` | Partial | Now a shell: one or two `EntityFieldSection`s plus the footer. Rebuilt in redesign phases 3-4, reduced to the shell 2026-08-07. Visual QA pending |
| EntityFieldSection | `app/components/onboarding/EntityFieldSection.tsx` | Partial | The per-entity body extracted from `EntityFieldSetupStep` (fixed-fields banner, starter rows + option chips via `flex-wrap`, inline `FieldComposer`, status drill-in). Two stacked sections on the Orders step make it the longest scroll in setup on a ~375px screen. Visual QA pending |
| OnboardingGate | `app/components/onboarding/OnboardingGate.tsx` | Yes | Logic-only redirect wrapper (renders children unchanged); no layout of its own |
| OrganizationSettingsPage | `app/dashboard/organization/page.tsx` | Yes | Single `max-w-3xl` column, `px-4 sm:px-6`; sections stack. No table, no chrome of its own |
| BrandColorPicker | `app/components/organization/BrandColorPicker.tsx` | Yes | `flex-wrap` swatch chips reflow 4→3→2 per row at 375px; owner-only (staff renders the same chips disabled) |
| ThemePreference | `app/components/organization/ThemePreference.tsx` | Yes | Three `flex-wrap` chips (Light/Dark/System); fits one row at 375px |
| BrandStyle | `app/components/theme/BrandStyle.tsx` | Yes | Emits a `<style>` element only — no rendered layout |
| ThemedSignIn | `app/auth/signin/ThemedSignIn.tsx` | Yes | Clerk's `<SignIn />` with a theme-reactive appearance; Clerk owns the card's own responsiveness |
| screen-parts (new-order) | `app/components/orders/new-order/screen-parts.tsx` | Yes | The redesign's layout vocabulary transcribed from the B2 frame: field boxes, choice chips, list rows, sticky header/footer. Built at 375px first; chips scroll horizontally, rows truncate rather than wrap |
| ClientField | `app/components/orders/new-order/ClientField.tsx` | Yes | Client search in place (B2d state of B2) — field becomes a search box with results beneath, no stacked surface. Single column throughout |
| patterns/screen | `app/components/patterns/screen.tsx` | Yes | Shared screen furniture read off the B2 and F3 frames: sticky header, section label, hairline card, sticky footer (figure+action or full-width). Built at 375px first |
| patterns/settings-rows | `app/components/patterns/settings-rows.tsx` | Yes | Settings row vocabulary from F3: value row (tap to edit in place), edit row, link row (chevron = navigates), switch row, toggle chip. Labels truncate rather than wrap |
| InvoiceSettingsScreen | `app/components/settings/InvoiceSettingsScreen.tsx` | Yes | F3. Six sections of single-column cards, `flex-wrap` chips, sticky full-width Save. Longest scroll in settings at 375px. Visual QA pending |
| OrganizationDestinations | `app/components/organization/OrganizationDestinations.tsx` | Yes | The hub's link rows (E3 shape); summary text truncates |
| DocumentsPage | `app/dashboard/documents/page.tsx` | Yes | F1. Two-figure summary card, `flex-wrap` quick action, horizontally scrolling filter chips, single-column list. Visual QA pending |
| DocumentRow | `app/components/documents/DocumentRow.tsx` | Yes | Two-line row on the shared anatomy; number/client truncate, money and state stay pinned right |
| DocumentPaper | `app/components/documents/DocumentPaper.tsx` | Yes | B9. Fixed-light by design (paper is always white — the documented exception in CLAUDE.md); single column, wraps at 375px, prints without the app chrome |
| DocumentPage | `app/dashboard/documents/[id]/page.tsx` | Yes | Header/footer `print:hidden` so only the paper reaches the printer |
