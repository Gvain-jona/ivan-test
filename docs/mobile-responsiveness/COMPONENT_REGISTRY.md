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
| StatusWorkflowEditor | `app/components/fields/StatusWorkflowEditor.tsx` | Yes | Drill-in workflow editor. Add-stage form wraps below `sm` (name on its own line, tag + Add beneath); Back control 44px on touch, 32px from `sm` |
| WorkflowStageRow | `app/components/fields/WorkflowStageRow.tsx` | Yes | One stage row. Verified at 375px in-browser: below `sm` the name takes a full line and the six controls wrap to a second, each ≥44px (were 12–24px); the `starts here` badge becomes a filled flag so every row's control line is the same width. Desktop single-row layout unchanged |
| StatusWorkflowDrillIn | `app/components/fields/StatusWorkflowDrillIn.tsx` | Yes | Hosts the editor and owns save timing; no layout of its own |
| EntityFieldList | `app/components/onboarding/EntityFieldList.tsx` | Yes | Renders the row list; no layout of its own |
| FieldEditor | `app/components/fields/FieldEditor.tsx` | Yes | Inline field editor: stacked single-column groups (label / type / options / rules / archive), all full-width |
| FieldOptionsEditor | `app/components/fields/FieldOptionsEditor.tsx` | Yes | `flex-wrap` option chips + a full-width add row |
| EditableFieldRow | `app/components/fields/EditableFieldRow.tsx` | Yes | Composition of FieldRow + FieldEditor for a field that exists; no layout of its own |
| StarterFieldRow | `app/components/onboarding/StarterFieldRow.tsx` | Yes | Same composition for a starter that doesn't exist yet (edits staged until Continue); no layout of its own |
| FieldComposer | `app/components/fields/FieldComposer.tsx` | Yes | Below `sm` the name input takes the full width and the type select + Add drop beneath it (at 375px one row left the input 165px, truncating the placeholder's example); both 44px on touch. Single row from `sm` up, unchanged |
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
| SetupShell | `app/components/onboarding/SetupShell.tsx` | Yes | Full-height two columns (340px rail + panel), not a floating card. Rail never scrolls; only the panel's content does, with the step title and footer hoisted out of the scroll area via portals. Below `lg` the columns stack and the rail becomes a header band. Also exports SectionLabel / StepHeading / StepFooter. The pinned footer clears the home-indicator inset (`max(1.25rem, env(safe-area-inset-bottom))`, same treatment as OrderSheet/MobileTabBar) and its actions are 44px on touch. **Still unverified:** the stacked mobile header band's vertical cost (~170px before content on a 667px viewport) — needs eyes in a running authed app |
| OrgLogo | `app/components/onboarding/OrgLogo.tsx` | Yes | Square org mark from Clerk `imageUrl`, initials only as a pre-load fallback; size-driven, no layout of its own |
| StepTracker | `app/components/onboarding/StepTracker.tsx` | Yes | Vertical rail tracker on `lg`, horizontal indicator strip below (labels `sr-only`); both from one step model |
| WelcomeStep | `app/components/onboarding/WelcomeStep.tsx` | Yes | Centred intro; `max-w-md` copy block, single CTA |
| CurrencyStep | `app/components/onboarding/CurrencyStep.tsx` | Yes | `flex-wrap` shortlist chips reflow 3→2→1 per row; below them a full-width search box and a `max-h-64` scrolling list of all 158 currencies. Rows are name (truncates) + code, so they hold at 375px. The ISO-code text composer it used to carry is gone |
| currency-picker-parts | `app/components/onboarding/currency-picker-parts.tsx` | Yes | `CurrencyChip` + `CurrencyListRow`, the two radio presentations of the one currency choice; no layout of their own |
| FirstRecordsStep | `app/components/onboarding/FirstRecordsStep.tsx` | Yes | Three entity rows (icon + text + action). The action drops to its own full-width 44px line below `sm` — inline it left the label and hint ~135px and truncated three-word copy. Inline from `sm` up |
| EntityFieldSetupStep | `app/components/onboarding/EntityFieldSetupStep.tsx` | Partial | Toggle-able starter field rows + option chips (`flex-wrap`); custom fields come from the inline `FieldComposer` (the old FieldDefinitionFormSheet dialog is deleted, not an alternative). Rebuilt in redesign phases 3-4. Visual QA pending |
| OnboardingGate | `app/components/onboarding/OnboardingGate.tsx` | Yes | Logic-only redirect wrapper (renders children unchanged); no layout of its own |
