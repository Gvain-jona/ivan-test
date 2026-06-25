# UI Component Responsiveness Registry

An ongoing log, not a gate. Add one row whenever a new component is created (or an existing one is significantly restructured), with a plain `Yes` / `No` / `Partial` on whether it holds up across breakpoints (~375px phone through desktop). No write-up required, no enforcement implied — `No` is a perfectly valid entry. This exists only to keep visibility into how much of the app actually scales as it grows.

Seeded below from `MOBILE_AUDIT.md` (2026-06-25) to bootstrap the log — update a row's status in place once its underlying fix ships, rather than adding a duplicate row.

| Component | Path | Responsive | Notes |
|-----------|------|------------|-------|
| ExpensesTable | `app/dashboard/expenses/_components/table/ExpensesTable.tsx` | No | MOB-01 |
| MaterialPurchasesTable | `app/components/materials/MaterialPurchasesTable.tsx` | No | MOB-02 |
| NotificationsDrawer | `app/components/notifications/NotificationsDrawer.tsx` | No | MOB-03 |
| OrdersTableNew | `app/components/orders/OrdersTableNew.tsx` | Partial | Scrolls, but no mobile card view — MOB-04 |
| AccountsSettingsTab (edit dialogs) | `app/dashboard/settings/_components/AccountsSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| ProfitSettingsTab (edit dialogs) | `app/dashboard/settings/_components/ProfitSettingsTab.tsx` | Partial | MOB-05, MOB-06 |
| UserManagementTab | `app/dashboard/settings/_components/UserManagementTab.tsx` | Partial | MOB-06, MOB-12 |
| OrderFormSheet | `app/components/orders/OrderFormSheet.tsx` | Partial | MOB-06, MOB-07, MOB-08 |
| MaterialPurchaseForm | `app/components/materials/MaterialPurchaseForm.tsx` | Partial | Field grids solid; sticky footer overlaps keyboard — MOB-07 |
| InvoiceSheet | `app/features/invoices/components/InvoiceSheet.tsx` | Partial | Tabs overflow — MOB-08 |
| MaterialsPanel (analytics) | `app/dashboard/analytics/_components/MaterialsPanel.tsx` | Partial | Stat grid hardcoded to 2 cols — MOB-09 |
| OrangeInvoiceTemplate | `app/features/invoices/components/templates/OrangeInvoiceTemplate.tsx` | Partial | Metadata grid doesn't collapse — MOB-10 |
| RolePermissionsSection | `app/dashboard/settings/_components/RolePermissionsSection.tsx` | Partial | Double-scroll inside dialog — MOB-12 |
| FooterNav / ExpandableTabs | `app/components/navigation/FooterNav.tsx` | Yes | |
| TopHeader | `app/components/navigation/TopHeader.tsx` | Yes | Non-essential elements intentionally hidden below `md` |
| DashboardLayout | `app/components/layout/DashboardLayout.tsx` | Yes | |
| Home dashboard KPI grids | `app/dashboard/home/` | Yes | |
| MaterialPurchaseForm field grids | `app/components/materials/MaterialPurchaseForm.tsx` | Yes | Internal `grid-cols-1 md:grid-cols-2/3` layout specifically |
| Chart rendering (Recharts) | various `_components/` analytics charts | Yes | `ResponsiveContainer` used consistently |
| Date-range picker | shared date-range component | Yes | |
| SideNav | `app/components/navigation/SideNav.tsx` | N/A | Dead code, never rendered — see MOBILE_AUDIT.md architecture question |
