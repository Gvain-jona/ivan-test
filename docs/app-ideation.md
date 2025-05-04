
---

### Step 1: Breakdown into Sections
Based on your document, I’ve categorized the content into distinct sections that align with the app’s purpose and features. These sections will serve as the foundation for the work plan.

#### Sections Identified
1. [x] **App Concept and Goals**
   - Overview, purpose, and high-level objectives.
2. [x] **User Roles and Permissions**
   - Role-based access control and user management.
3. [x] **Orders Management**
   - Order creation, tracking, UI/UX, invoices, and related features.
4. [x] **Finance Tracking**
   - Expenses and material purchases management.
5. [x] **Workflow Optimization**
   - To-Do list, follow-ups, quick actions, and smart automations.
6. [x] **Dashboard and Analytics**
   - Home page, insights, KPIs, and reporting features.
7. [x] **Profit Calculation Mechanism**
   - Percentage-based profit and labor tracking system.
8. [ ] **Technical Considerations**
   - Database design, performance, security, and implementation tools.
9. [ ] **Potential Enhancements**
   - Optional features like inventory management, client profiles, etc.


---

### Step 3: Streamlined Overview
Here’s a concise summary of the work plan to guide production planning:

| **Section**               | **Key Focus**                          | **Priority** | **Dependencies**            |
|---------------------------|----------------------------------------|--------------|-----------------------------|
| App Concept and Goals     | Define scope and success metrics       | High         | None                        |
| User Roles                | Permissions matrix and UI              | Medium       | Orders, Finance, Workflow   |
| Orders Management         | Order flow, UI/UX, invoices            | High         | Workflow, Profit            |
| Finance Tracking          | Expenses, materials, analytics         | High         | Dashboard                   |
| Workflow Optimization     | To-Do, follow-ups, automations         | Medium       | Orders, Finance             |
| Dashboard and Analytics   | KPIs, charts, reports                  | Medium       | Orders, Finance, Profit     |
| Profit Calculation        | Configurable profit/labor system       | Medium       | Orders, Dashboard           |
| Technical Considerations  | Database, security, performance        | High         | All sections                |
| Potential Enhancements    | Inventory, client profiles, etc.       | Low          | Core features               |

---

## **App Concept and Goals*

---

### Streamlined Summary: App Concept and Goals

#### What It Is
The **Printing Business Order & Finance Management System** is an internal app for a printing business with 5-20 users. It’s built from scratch to replace a no-system setup (no prior software or spreadsheets) with a centralized, easy-to-use tool. It focuses on managing orders, tracking finances, and improving workflows for a team that’s moderately comfortable with technology.

#### Key Details
- **Users**: 5-20 employees, including the owner and staff.
- **Order Volume**: Average of 30 orders per day, but varies with busy and slow seasons.
- **Scope**: Strictly internal—no customer-facing features.
- **Future Needs**: Will eventually handle tax tracking (e.g., VAT) and reports for accountants, but not yet.

#### Main Goals
1. **Centralize Data**: Move from chaos to one organized system for orders, finances, and materials.
2. **Cut Manual Work**: Automate tasks like entering orders, calculating totals, and sending reminders.
3. **Simplify Finances**: Make expenses and costs clear and easy to track for non-experts.
4. **Run Smoothly**: Handle 30 orders/day with quick insights, even during busy seasons.
5. **Grow Over Time**: Start simple, then add features (like tax support) and define success later.

#### Why It Matters
This app saves time, reduces errors, and gives the business control over daily operations. It’s designed to be fast and practical, with plans to adapt as the team uses it.

---

**User Roles and Permissions**

---

#### Core Concept
- **Purpose**: A dynamic role-based access system for 5-20 users, ensuring secure and controlled operations while allowing flexibility to adapt permissions over time.
- **Roles**: Three initial roles—Admin, Manager, and Employee—with Admins and Managers sharing approval power for deletions.

#### Key Details
- **Roles and Permissions**:
  - **Admin**: Full control, approves deletions, manages permissions via a future Settings Page.
  - **Manager**: Mid-level access (e.g., edit orders), can approve deletions (not just request them), no approval needed for non-essential actions like status changes.
  - **Employee**: Basic access (e.g., add/view orders, submit expenses), requests deletions for Admin/Manager approval.
- **Approvals**:
  - Deletions (e.g., order items, payments) require Admin or Manager approval.
  - Non-essential actions (e.g., status changes like “Pending” to “In Progress”) don’t need approval—users can act freely within their role.
- **Approvals Page**: A dedicated space for Admins and Managers to review deletion requests, with a daily review cadence (not real-time, to allow thorough assessment).
- **Dynamic Settings**: A Settings Page (ideated later) will let Admins tweak permissions and roles, starting with the 3-role base but expandable.

#### What’s Available Now
- **From Notes**: Role-based access, Admin-only deletions (expanded now to Managers), and permission examples (e.g., Expenses: Admin edits/deletes, Employees submit).
- **Your Input**: Managers can approve deletions; status changes are approval-free; daily review for deletions via an Approvals Page; dynamic Settings Page planned.

---

### Refined Summary: User Roles and Permissions
The **User Roles and Permissions** system controls access for 5-20 users in the printing business, starting with three roles: Admin, Manager, and Employee. Admins have full control and manage permissions, Managers can edit and approve deletions, and Employees handle basic tasks (e.g., add/view) but request deletions. An **Approvals Page** lets Admins and Managers review deletion requests daily, ensuring oversight without rushing. Non-essential actions like status changes need no approval. A future **Settings Page** will allow Admins to dynamically adjust permissions and roles, keeping the system flexible as the app evolves.

#### Breakdown
- **Roles**:
  - **Admin**: All access, approves deletions, configures settings.
  - **Manager**: Edits, approves deletions, acts freely on status changes.
  - **Employee**: Adds/views, requests deletions.
- **Approvals**: Deletions need Admin/Manager sign-off; daily review via Approvals Page.
- **Flexibility**: Settings Page (later) for tweaking roles/permissions.
- **Goal**: Secure, collaborative, adaptable access.

---

### Finalized Work Plan for Auditing
- **Summary**: A dynamic role system with 3 roles (Admin, Manager, Employee). Admins and Managers approve deletions via a daily-reviewed Approvals Page; status changes are approval-free. A Settings Page will later enable permission tweaks.
- **Questions/Clarifications**: All addressed—Manager approval scope and deletion urgency are clear.
- **Action Items**:
  - Draft a permissions matrix: Admin (all + approvals), Manager (edit + approve deletions), Employee (add/view + request deletions).
  - Sketch Approvals Page layout (e.g., table: action, requester, date, approve/deny).
  - Plan Settings Page placeholders (e.g., role editor, permission toggles) for later.
  - Add database fields for approvals (e.g., `pending_deletions`: item, requester, status).
- **Dependencies**: Impacts Orders, Finance, Workflow (e.g., deletion flows).
- **Priority**: Medium (key for security, follows core features).

---

### Final Polished Summary
The **User Roles and Permissions** system manages access for a printing business with 5-20 users across three roles: Admin, Manager, and Employee. Admins hold full control, including permission management, while Managers can edit and approve deletions. Employees add and view data but request deletions, reviewed daily by Admins or Managers via an **Approvals Page**. Non-essential actions like status changes require no approval, keeping workflows smooth. A future **Settings Page** will let Admins dynamically adjust roles and permissions, ensuring flexibility as the app grows. This setup balances security, collaboration, and adaptability for a team transitioning from no prior system.

---

**Orders Management**

---



#### Invoice Template Analysis
The provided invoice includes:
- **Header**:
  - Business Info: Logo, Name (“Ivan Prints”), Tagline (“Making You Visible”), Contact (0755 541 373, sherilex256@gmail.com), TIN (1028570150).
  - Invoice Number (890), Date (21/06/24).
  - Client Info: To “Primax, The MDS”.
- **Items Table**:
  - Columns: Quantity, Details, Unit Price, Amount.
  - Example: 45pcs, “MDUs Shell Stands,” 54,000/=, 2,430,000/=.
- **Summary**:
  - Grand Total: 2,430,000/=.
  - Amount in Words: “Two million four hundred thirty thousand shillings only”.
- **Footer**:
  - Payment Details: Bank (Absa Bank, Account 6008084570), Mobile Money (0755 541 373, Vule Abdul).
  - Terms: “Accounts are due on demand.”
  - Signature: Space for sign and “Ivan Prints” label.
- **Design**: Green/orange color scheme, clean layout, print-friendly.

This template will guide the Invoice functionality, with dynamic fields (e.g., business info, bank details) editable via the Customization tab.

---

### Ideation: Updated View Modal and Invoice

#### 1. View Modal (Updated)
- **Purpose**: Quick view of an order with inline edits/additions, now using minimal cards for items and payments.
- **Structure**:
  - **General Info** (Top Section):
    - Client Name, Order Date, Order Status, Payment Status.
    - Total Amount, Cash Paid, Balance, Order Number, Generate/View Invoice button.
  - **Items Section**:
    - **Minimal Cards**: One card per item.
    - Card Content: Item (e.g., “Business Cards A6”), Size, Qty, Unit Price, Total Cost (e.g., “A6, 5, $10, $50”).
    - **Quick Add**: Inline form below cards (Category/Item/Size dropdowns, Qty/Unit Price inputs, “Add” button), updates Total Amount.
  - **Payments Section**:
    - **Minimal Cards**: One card per payment.
    - Card Content: Amount, Date, Type (e.g., “$50, 3/26/25, Cash”).
    - **Quick Add**: Inline form (Amount input, Date picker, Type dropdown, “Add” button), updates Cash Paid/Balance.
  - **Notes Section**:
    - List: Type, Text, Timestamp (e.g., “Client Follow-Up: Call client, 3/26/25”).
    - **Quick Edit**: Inline (click note → Type dropdown, Text field, “Save”).
    - **Quick Add**: Inline form (Type dropdown, Text field, “Add” button).
  - **Timeline**: Logs actions (e.g., “Order created,” “Payment added $50”).
- **Mobile**: Full-screen, collapsible sections (General, Items, Payments, Notes, Timeline), sticky action buttons.

#### 2. Invoice Functionality (Updated)
- **Purpose**: Generate print-friendly invoices based on the provided template, with dynamic, editable business info.
- **Modal Structure**:
  - **Tabs**:
    - **Preview Tab**: Displays the invoice as it will print.
    - **Customization Tab**: Edit fields (e.g., business info, bank details).
  - **Preview Tab Layout** (Based on Template):
    - **Header**:
      - Business Info: Logo, Name, Tagline, Contact, TIN (default from Settings, editable).
      - Invoice Number (auto-generated, editable), Date (auto-filled, editable).
      - Client Info: Name, Address (from order, editable).
    - **Items Table**:
      - Columns: Quantity, Details (Item + Size), Unit Price, Amount.
      - Pre-filled from order items, editable (e.g., adjust Qty, Price).
    - **Summary**:
      - Grand Total (auto-calculated).
      - Amount in Words (auto-generated, e.g., “Two million…”).
    - **Footer**:
      - Payment Details: Bank Name, Account Number, Mobile Money (default, editable).
      - Terms: “Accounts are due on demand” (default, editable).
      - Signature: Space for sign, “Ivan Prints” label (editable name).
  - **Customization Tab**:
    - **Business Info**: Edit Logo, Name, Tagline, Contact, TIN.
    - **Payment Details**: Edit Bank Name, Account Number, Mobile Money.
    - **Toggles**: Show/Hide Payments (Cash Paid, Balance), Notes, Terms.
    - **Terms**: Edit default text (e.g., “Due in 30 days”).
  - **Actions**: Preview (switches to Preview Tab), Save & Print (PDF), Add Items (pull from another order).
- **Mobile**: Full-screen, collapsible sections, sticky Save & Print button.

---

### Detailed Output: Orders Management

#### Overview
The Orders Management system is a core component of the Printing Business Order & Finance Management System, designed for 5-20 users to handle 30 orders per day (up to 70 during peak seasons). It provides a dual-view interface (Table and Task Card views) to manage orders efficiently, with automation to reduce manual effort, role-based access for security, and integration with workflow features like task generation and notifications. The system supports desktop and mobile use, with full functionality for adding, editing, and viewing orders.

#### Interface and Views
- **Dual Views (Desktop)**:
  - **Table View**:
    - Displays orders in a structured table.
    - **Main Row Columns**: Date, Client Name, Total Amount, Cash Paid, Balance, Payment Status, Order Status, Actions (3-dot column).
    - **Subrow**: Expands to show order items (Category, Item, Size, Qty, Unit Price, Total Cost).
    - **Actions Column (3-dot)**:
      - Quick Status Updates: Paused → In Progress → Completed → Delivered (final).
      - Generate/View Invoice (toggles if invoice exists).
      - View Order, Edit Order, Delete Order (requires Admin/Manager approval), Duplicate Order.
  - **Task View (Card Format)**:
    - Focuses on task-oriented orders (e.g., those needing action).
    - **Card Title**: Order Number (e.g., “Order #123”).
    - **Card Content**:
      - Order Status (e.g., “In Progress”).
      - Order Items Summary (e.g., “Business Cards A6, 5pcs”).
      - Note (if present, e.g., “Client Follow-Up: Call client”).
    - **Actions**: Same 3-dot menu as Table View.
    - **Tabs**: Table Tab and Task Tab to switch views.
- **Mobile View**:
  - Card layout with minimal info (e.g., Client Name, Order Status, Payment Status).
  - Expandable to show full details (including items, payments, notes).
  - Same 3-dot Actions column as desktop.

#### Order Statuses
- **Statuses**: Paused, In Progress, Completed, Delivered (final), Cancelled.
- **Flow**: Paused → In Progress → Completed → Delivered (or Cancelled at any point).
- **Tracking**: Status changes auto-logged in a timeline (e.g., “Order #123: Paused → In Progress, 3/26/25”).

#### Adding/Editing Orders (Side Modal)
- **Purpose**: Create or modify orders with minimal manual input.
- **Sections**:
  - **General Info**:
    - Client Name (Smart Dropdown: searchable, past entries, add new).
    - Client Type (Dropdown: e.g., Individual, Business).
    - Order Date (Date Picker).
    - Order Status (Dropdown: Paused, In Progress, etc.).
    - Payment Method (Dropdown: Cash, Bank Transfer, Mobile Payment).
    - **Auto-Calculations**:
      - Total Amount (sum of all items).
      - Cash Paid (sum of all payments).
      - Balance (Total Amount - Cash Paid).
  - **Items Section**:
    - Multi-entry (add/remove items).
    - Fields: Category (Smart Dropdown), Item (Smart Dropdown), Size (Smart Dropdown), Qty, Unit Price, Total Cost (auto-calculated).
  - **Payments Section**:
    - Multi-entry (add/remove payments).
    - Fields: Amount, Date, Payment Type (Dropdown: Cash, Bank Transfer, Mobile Payment).
  - **Notes Section**:
    - Multi-entry (add/remove notes).
    - Fields: Type (Dropdown: Info, Client Follow-Up, Urgent, Internal), Text (e.g., “Call client for approval”).
- **Smart Dropdowns**:
  - Client Name, Category, Item, Size: Searchable, show recent/frequent entries, allow new additions.
  - Challenges: Prevent duplicates (e.g., “A4” vs. “A4 Size”), ensure fast lookup for large datasets.

#### Order Details Modal (View Mode)
- **Purpose**: Quick view with inline edits/additions.
- **Structure**:
  - **General Info**:
    - Client Name, Order Date, Order Status, Payment Status.
    - Total Amount, Cash Paid, Balance, Order Number.
    - Generate/View Invoice button.
  - **Items Section**:
    - Minimal Cards: One per item (e.g., “Business Cards A6, 5pcs, $10, $50”).
    - Quick Add: Inline form (Category/Item/Size dropdowns, Qty/Unit Price inputs, “Add” button), updates Total Amount.
  - **Payments Section**:
    - Minimal Cards: One per payment (e.g., “$50, 3/26/25, Cash”).
    - Quick Add: Inline form (Amount input, Date picker, Type dropdown, “Add” button), updates Cash Paid/Balance.
  - **Notes Section**:
    - List: Type, Text, Timestamp (e.g., “Client Follow-Up: Call client, 3/26/25”).
    - Quick Edit: Inline (click note → Type dropdown, Text field, “Save”).
    - Quick Add: Inline form (Type dropdown, Text field, “Add” button).
  - **Timeline**:
    - Logs actions: “Order created,” “Status: In Progress,” “Payment added $50.”
- **Mobile**: Full-screen, collapsible sections, sticky action buttons (Close, Edit, Invoice).

#### Duplicate Order Functionality
- **Purpose**: Quickly replicate an order for recurring clients.
- **What’s Duplicated**:
  - General Info: Client Name, Client Type.
  - Items: Category, Item, Size, Qty, Unit Price.
- **What’s Reset**:
  - Date (set to today or blank).
  - Payment Details (not copied).
  - Order Status (reset to Paused).
- **Flow**:
  - Click “Duplicate Order” in 3-dot menu.
  - Opens Add Order modal with pre-filled info.
  - User modifies and saves.

#### Invoice Functionality
- **Purpose**: Generate print-friendly invoices based on the provided template.
- **Modal Structure**:
  - **Tabs**:
    - Preview Tab: Shows the invoice as it will print.
    - Customization Tab: Edit dynamic fields.
  - **Preview Tab Layout** (Based on Template):
    - **Header**:
      - Business Info: Logo, Name, Tagline, Contact, TIN (default from Settings, editable).
      - Invoice Number (auto-generated, editable), Date (auto-filled, editable).
      - Client Info: Name, Address (from order, editable).
    - **Items Table**:
      - Columns: Quantity, Details (Item + Size), Unit Price, Amount.
      - Pre-filled from order items, editable (e.g., adjust Qty, Price).
    - **Summary**:
      - Grand Total (auto-calculated).
      - Amount in Words (auto-generated, e.g., “Two million…”).
    - **Footer**:
      - Payment Details: Bank Name, Account Number, Mobile Money (default, editable).
      - Terms: “Accounts are due on demand” (default, editable).
      - Signature: Space for sign, Business Name (editable).
  - **Customization Tab**:
    - Business Info: Edit Logo, Name, Tagline, Contact, TIN.
    - Payment Details: Edit Bank Name, Account Number, Mobile Money.
    - Toggles: Show/Hide Payments (Cash Paid, Balance), Notes, Terms.
    - Terms: Edit default text (e.g., “Due in 30 days”).
  - **Actions**:
    - Preview (switches to Preview Tab).
    - Save & Print (generates PDF).
    - Add Items (pull from another order).
- **Mobile**: Full-screen, collapsible sections, sticky Save & Print button.
- **Future**: Add legal/tax fields (e.g., VAT) in a separate ideation.

#### Notes Feature
- **Purpose**: Add order-specific details and trigger tasks based on type.
- **Implementation**:
  - **Types and Priorities**:
    - Info: No task, low priority (e.g., “Client prefers blue ink”).
    - Client Follow-Up: Medium priority task (e.g., “Call client for approval”).
    - Urgent: High priority task (e.g., “Rush order due tomorrow”).
    - Internal: Optional task (e.g., “Check printer”).
  - **Task Trigger**:
    - On save, pop-up for task-eligible types (e.g., “Create task: Call client?” with priority pre-set).
    - Tasks link to To-Do list.
  - **Display**:
    - In View/Edit Modals, list format (Type, Text, Timestamp).
    - Optional on Invoice (via toggle).
  - **Automation**: Timestamps added on creation/edit.

#### Notifications
- **Purpose**: Alert Admins/Managers on order actions.
- **Triggers**:
  - Order creation.
  - Any action: Status change, payment added, note added, etc.
- **Delivery**:
  - In-app: Pop-up or bell icon for Admins/Managers.
  - Push notifications: For mobile users (Admins/Managers).
- **Example**: “Order #123 created,” “Payment of $50 added to Order #123.”

#### UI/UX Enhancements
- **Search & Filters**:
  - Global Search: Client Name, Order Number, Item, Date.
  - Filters: Order Status (e.g., In Progress), Payment Status (e.g., Unpaid), Date Range.
  - Sort: Newest, Oldest, Highest Amount.
- **Bulk Actions**:
  - Mark as Completed, Mark as Paid, Delete (approved), Download Invoice.
  - Checkbox selection for multiple orders.
- **Quick Analytics Cards**:
  - Total Orders This Month, Completed Orders, Pending Payments, Total Revenue.
- **Status Indicators**:
  - Order Status: Paused (Red), In Progress (Yellow), Completed (Green), Delivered (Blue), Cancelled (Gray).
  - Payment Status: Paid (Green), Partially Paid (Orange), Unpaid (Red).
- **Alerts**:
  - 7-day unpaid orders: Yellow highlight/badge in table.
  - Subsequent reminders: 14 days, 21 days.
- **Smart Actions**:
  - Inline with status (e.g., “Mark as In Progress” for Paused).
- **Order Timeline**:
  - Logs all actions (e.g., “Order created,” “Status: Delivered,” “Payment added”).

#### Role-Based Access Integration
- **Deletions**: Require Admin/Manager approval via Approvals Page.
- **Other Actions**:
  - Admins: Full access (edit, delete, approve).
  - Managers: Edit, approve deletions, change statuses.
  - Employees: Add/view, request deletions.

#### Scalability and Performance
- **Volume**: 30 orders/day average, 70 max in peaks.
- **Design**: Optimized for fast loading (e.g., indexed columns for Order ID, Client Name).
- **Mobile**: Full functionality (entry/viewing), collapsible sections for usability.

---

### Updated Work Plan
- **Action Items**:
  - Define status flow: Paused → In Progress → Completed → Delivered/Cancelled.
  - Wireframe: Table View, Task Card View, Add/Edit Modal, View Modal (cards + inline forms), Invoice Modal (Preview/Customization).
  - List note types and task priorities (Info, Follow-Up, Urgent, Internal).
  - Plan notification UI (in-app bell, push alerts).
  - Design invoice template with dynamic fields (e.g., business info, bank details).
- **Dependencies**: User Roles (approvals), Workflow (tasks), Profit (item costs).
- **Priority**: High.

---

 **Finance Tracking**

---

### 

#### Key Updates
- **Expenses**:
  - Installments are on by default, treated like payments in Orders (multiple amounts paid over time).
  - Recurring expenses (e.g., rent) will appear as recurring task reminders in the Personal To-Do page, with initial setup and recurrence settings (to ideate later).
  - Main categories: Rent, Utilities, Salaries, Marketing, Equipment (as suggested).
  - No approval needed for adding expenses; Managers/Admins approve deletions only.
  - Notifications triggered for expense actions (e.g., added, edited).
  - VAT field added, optional.
- **Material Purchases**:
  - Installment payments supported (similar to expenses).
  - Reminders for clearing installments: Options to push to Personal Tasks, add a Critical Weekly To-Do section on the Home Page, or both.
  - Smart dropdowns for items/suppliers will suggest based on user input history (no predefined list needed).
- **Permissions**:
  - Managers can approve Employee-submitted expenses for deletion (not addition).
  - Employees can see all expenses/purchases (not just their own, as previously assumed).

#### Ideation: Material Purchase Installment Reminders
- **Purpose**: Ensure users don’t forget to clear installment payments for material purchases.
- **Options**:
  - **Personal Tasks**: Each installment due date creates a task (e.g., “Pay $50 to Supplier A, due 4/26/25”).
  - **Critical Weekly To-Do (Home Page)**: A dedicated section on the Home Page showing upcoming/overdue installment payments (e.g., “Due This Week: $50 to Supplier A, 4/26/25”).
  - **Combined Approach**: Use both for maximum visibility—tasks for individual tracking, Home Page section for quick visibility.
- **Chosen Approach**: Combined (Tasks + Home Page section) for redundancy and user convenience.
  - **Personal Tasks**: Auto-generated task per installment (e.g., “Pay Installment: $50 to Supplier A,” priority: Medium if upcoming, High if overdue).
  - **Home Page Section**: “Critical Weekly To-Do” widget showing installments due within 7 days or overdue (e.g., “Overdue: $50 to Supplier A, 3/26/25”).
- **Notifications**: In-app and push notifications for each reminder (e.g., “Installment due: $50 to Supplier A, 4/26/25”).

---

### Detailed Output: Finance Tracking

#### Overview
The Finance Tracking system enables a printing business with 5-20 users to monitor and manage financial activities, focusing on expenses and material purchases. It simplifies financial oversight for users with moderate tech skills, providing intuitive interfaces, automation, and role-based access. The system supports 30 orders/day (up to 70 in peaks) by ensuring financial data is organized, trackable, and ready for future tax compliance. It integrates with the Dashboard for analytics, the Workflow system for task generation, and the Home Page for critical reminders.

#### Interface and Views
- **Expenses Page**:
  - **Desktop (Table View)**:
    - **Main Row Columns**: Date, Category, Total Amount, Amount Paid, Balance, Installment (Yes/No), VAT (Optional), Actions (3-dot column).
    - **Subrow**: Expands for payment details (e.g., Payment 1: $50, 3/26/25; Payment 2: $50, 4/26/25).
    - **Actions Column (3-dot)**:
      - View, Edit, Delete (requires Admin/Manager approval).
  - **Mobile View**:
    - Card layout: Minimal info (e.g., Date, Category, Total Amount, Balance).
    - Expandable for full details (including payments, VAT).
    - Same 3-dot Actions column.
- **Material Purchases Page**:
  - **Desktop (Table View)**:
    - **Main Row Columns**: Date, Supplier, Item, Quantity, Total Amount, Amount Paid, Balance, Installment (Yes/No), Actions (3-dot column).
    - **Subrow**: Expands for payment details (e.g., Payment 1: $100, 3/26/25; Balance: $50).
    - **Actions Column (3-dot)**:
      - View, Edit, Delete (requires approval).
      - Mark Paid (for Partially Paid/Unpaid).
  - **Mobile View**:
    - Card layout: Minimal info (e.g., Date, Supplier, Item, Total Amount).
    - Expandable for full details (including payments).
    - Same 3-dot Actions column.

#### Adding/Editing Expenses (Side Modal)
- **Purpose**: Add or modify expense entries with automation.
- **Sections**:
  - **General Info**:
    - Date (Date Picker).
    - Category (Smart Dropdown: Rent, Utilities, Salaries, Marketing, Equipment—customizable).
    - Total Amount (Input).
    - Installments (Default: On; toggle to disable).
    - VAT (Optional Input: e.g., 16%—not required).
  - **Payments (Installments On)**:
    - Multi-entry (add/remove payments).
    - Fields: Amount, Date, Payment Type (Dropdown: Cash, Bank Transfer, Mobile Payment).
    - Auto-Calculations: Amount Paid (sum of payments), Balance (Total Amount - Amount Paid).
    - Optional: Number of Installments, Amount per Installment, Start Date, Frequency (Weekly, Monthly, Quarterly) for structured payments.
  - **Notes**:
    - Type (Dropdown: Info, Follow-Up, Urgent, Internal).
    - Text (e.g., “Rent for March”).
- **Smart Dropdowns**:
  - Category: Searchable, recent entries, add new (Admin can clean up duplicates).
- **Recurring Expenses**:
  - Handled via Personal To-Do page (e.g., “Pay Rent $500, Monthly”).
  - Setup: User creates task, sets recurrence (to ideate later).

#### Adding/Editing Material Purchases (Side Modal)
- **Purpose**: Add or modify material purchase entries.
- **Sections**:
  - **General Info**:
    - Date (Date Picker).
    - Supplier (Smart Dropdown: user-input history, searchable, add new).
    - Item (Smart Dropdown: user-input history, e.g., Paper, Ink, Toner, Vinyl).
    - Quantity (Input).
    - Unit Price (Input).
    - Total Amount (Auto-calculated: Quantity × Unit Price).
    - Installments (Default: On; toggle to disable).
  - **Payments (Installments On)**:
    - Multi-entry (add/remove payments).
    - Fields: Amount, Date, Payment Type (Dropdown: Cash, Bank Transfer, Mobile Payment).
    - Auto-Calculations: Amount Paid (sum of payments), Balance (Total Amount - Amount Paid).
    - Optional: Number of Installments, Amount per Installment, Start Date, Frequency (Weekly, Monthly, Quarterly).
  - **Notes**:
    - Type (Dropdown: Info, Follow-Up, Urgent, Internal).
    - Text (e.g., “Check stock levels”).
- **Smart Dropdowns**:
  - Supplier, Item: Searchable, suggest based on user input history, add new.

#### View Modal (Expenses and Material Purchases)
- **Purpose**: Quick view with inline edits/additions.
- **Structure (Expenses)**:
  - **General Info**: Date, Category, Total Amount, Amount Paid, Balance, Installment (Yes/No), VAT (if entered).
  - **Payments**: Minimal Cards (e.g., “Payment 1: $50, 3/26/25, Cash”).
    - Quick Add: Inline form (Amount, Date, Type, “Add” button), updates Amount Paid/Balance.
  - **Notes**: List (Type, Text, Timestamp), inline edit/add.
  - **Timeline**: Logs actions (e.g., “Expense added,” “Payment added $50”).
- **Structure (Material Purchases)**:
  - **General Info**: Date, Supplier, Item, Quantity, Total Amount, Amount Paid, Balance, Installment (Yes/No).
  - **Payments**: Minimal Cards (e.g., “Payment 1: $100, 3/26/25, Cash”).
    - Quick Add: Inline form (Amount, Date, Type, “Add” button), updates Amount Paid/Balance.
  - **Notes**: List (Type, Text, Timestamp), inline edit/add.
  - **Timeline**: Logs actions (e.g., “Purchase added,” “Marked Paid”).
- **Mobile**: Full-screen, collapsible sections.

#### Notes Feature
- **Types and Priorities**:
  - Info: No task (e.g., “Utility bill paid”).
  - Client Follow-Up: Medium priority task (e.g., “Follow up with supplier”).
  - Urgent: High priority task (e.g., “Pay overdue bill”).
  - Internal: Optional task (e.g., “Check budget”).
- **Task Trigger**: Pop-up on save for task-eligible types (e.g., “Create task: Follow up with supplier?”).
- **Display**: In View/Edit Modals, list format.

#### Installment Reminders (Material Purchases)
- **Purpose**: Track and remind users of installment payments.
- **Implementation**:
  - **Personal Tasks**:
    - Auto-generated per installment (e.g., “Pay Installment: $50 to Supplier A, due 4/26/25”).
    - Priority: Medium (upcoming), High (overdue).
  - **Home Page Section**:
    - “Critical Weekly To-Do” widget.
    - Shows installments due within 7 days or overdue (e.g., “Overdue: $50 to Supplier A, 3/26/25”).
    - Format: Card list, clickable to View Modal.
- **Notifications**:
  - In-app: Pop-up or bell icon (e.g., “Installment due: $50 to Supplier A”).
  - Push: For mobile users (Admins/Managers).

#### Notifications
- **Triggers**:
  - Expense/Purchase added.
  - Payment added to expense/purchase.
  - Deletion requested.
- **Delivery**:
  - In-app: Pop-up or bell icon for Admins/Managers.
  - Push notifications: For mobile users (Admins/Managers).
- **Example**: “Expense #456 added,” “Payment of $50 added to Purchase #789.”

#### UI/UX Enhancements
- **Search & Filters**:
  - Expenses: Category, Date, Amount Range.
  - Material Purchases: Supplier, Item, Date, Payment Status.
  - Sort: Newest, Oldest, Highest Amount.
- **Bulk Actions**:
  - Expenses: Delete (approved).
  - Material Purchases: Mark Paid, Delete (approved).
- **Analytics Cards**:
  - Expenses: Total This Month, Top Categories (e.g., Rent: $500).
  - Material Purchases: Total Spent, Top Suppliers (e.g., Supplier A: $1,000).
- **Status Indicators**:
  - Material Purchases: Paid (Green), Partially Paid (Orange), Unpaid (Red).
- **Alerts**:
  - Overdue installments: Highlight in table (e.g., due 3/26/25, unpaid).
  - Unpaid purchases: 7-day reminders.

#### Role-Based Access Integration
- **Permissions**:
  - **Admin**: Add/edit/delete, approve deletions, clean up dropdowns.
  - **Manager**: Add/edit, approve deletions (including Employee submissions).
  - **Employee**: Add/view all expenses/purchases, request deletions.
- **Deletions**: Require Admin/Manager approval via Approvals Page.
- **Action Logging**: Tracks changes (e.g., “Expense #456 added by User X”).

#### Scalability and Performance
- **Volume**: Handle varying transaction volumes (e.g., more purchases during peaks).
- **Design**: Indexed columns (e.g., Date, Category) for fast filtering.
- **Mobile**: Full functionality, collapsible sections for usability.

#### Future Considerations
- **Tax Compliance**: VAT field added (optional), more fields (e.g., tax ID) in a later iteration.
- **Inventory Integration**: Link material purchases to stock levels (future enhancement).
- **Recurring Expenses**: Ideate setup and recurrence in Workflow section.

---

### Updated Work Plan
- **Action Items**:
  - Wireframe: Expenses Table, Material Purchases Table, Add/Edit Modals, View Modals, Home Page Critical Weekly To-Do.
  - Plan recurring expense task setup (deferred to Workflow).
  - Design notification UI for financial actions and reminders.
  - Add VAT field to database (optional).
- **Dependencies**: User Roles (approvals), Dashboard (analytics), Workflow (tasks), Home Page (reminders).
- **Priority**: High.

---

**Workflow Optimization**

---

### 

#### Key Updates
- **Task Integration**:
  - **Orders Page**: Only order-related tasks (e.g., follow-ups, order notes) are integrated into the Task Card View tab.
  - **Manual Tasks Page**: Material purchase and expense tasks (e.g., installment reminders, expense notes) are moved here, under a Todoist-inspired “Work Projects” theme.
    - **Work Projects Feature**: Includes project setup (e.g., group tasks under a project) and subtasks (e.g., nested tasks within a main task).
- **Smart Dropdowns (Client Info)**:
  - Fields like address and contact are optional during entry (e.g., in Orders Add/Edit Modal).
  - Ability to add/edit later in a separate setting (e.g., a “Client Management” section in Settings).

#### Updated Smart Dropdowns Mechanism (Client Info)
- **Client Name (Orders Add/Edit Modal)**:
  - **During Entry**:
    - Smart Dropdown: Suggests existing clients (searchable, recent/frequent).
    - Add New: Mini-form with Name (required), Address (optional), Contact (optional).
  - **Later Editing**:
    - **Client Management (Settings)**:
      - List of all clients (e.g., Name, Address, Contact).
      - Actions: Edit (update Address/Contact), Delete (Admin-only, requires approval if linked to orders).
      - Example: “John Smith, Address: [empty], Contact: [empty]” → Edit to add “123 Main St, 555-1234”.
- **Database**:
  - `clients` table: `client_id`, `name` (required), `address` (nullable), `contact` (nullable), `created_at`.
- **Consistency**: Fuzzy matching to prevent duplicates (e.g., “John Smith” vs. “John S.”), with Admin cleanup.

---

### Detailed Output: Workflow Optimization

#### Overview
The Workflow Optimization system enhances efficiency for a printing business with 5-20 users by automating task generation, providing quick actions, and streamlining follow-ups. It integrates with Orders (task cards for order-related tasks), Finance (material purchase and expense tasks in the Manual Tasks page), and the Home Page (To-Do widget, Critical Weekly To-Do section). The system supports 30 orders/day (up to 70 in peaks) with a focus on actionable insights, reminders, and user-friendly task management. Manual tasks and non-order auto-tasks are managed via a Todoist-inspired hub with a “Work Projects” theme, while order-related tasks are embedded in the Orders page.

#### Interface and Views
- **Manual Tasks Page (Todoist-Inspired with Work Projects)**:
  - **Purpose**: A hub for manual tasks and auto-generated tasks from Expenses and Material Purchases.
  - **Desktop (List View)**:
    - **Work Projects Theme**:
      - **Projects**: Group tasks under projects (e.g., “Finance Follow-Ups,” “Material Payments”).
      - **Project Setup**:
        - Add Project: Name (e.g., “Finance Follow-Ups”), Color (optional), Icon (optional).
        - Tasks are added under a project (default: “Inbox” if none selected).
      - **Task Details**:
        - Title (e.g., “Pay $50 to Supplier A”).
        - Description (Note if available, e.g., “Urgent: Pay overdue bill”).
        - Due Date (e.g., 3/26/25).
        - Priority (High, Medium, Low).
        - Linked Item (e.g., Material Purchase #789).
        - Status (Pending, Completed).
      - **Subtasks**:
        - Nested under a main task (e.g., Main: “Pay Supplier A,” Subtask: “Confirm invoice”).
        - Same details as main task (Title, Description, Due Date, Priority, Status).
    - **Actions (Inline)**:
      - Mark Completed (checkbox).
      - Edit (opens modal).
      - Delete (requires approval for non-creators).
      - Add Subtask (inline form: Title, Due Date, Priority).
  - **Mobile View**:
    - Card layout: Minimal info (e.g., Title, Due Date, Priority).
    - Expandable for full details (Description, Linked Item, Subtasks).
    - Same inline actions.
- **Orders Page (Task Card View)**:
  - **Purpose**: Display auto-generated tasks from Orders only.
  - **Tab Switch**: Table View (orders list), Task Card View (order-related tasks).
  - **Task Card View**:
    - **Card Title**: “Order #123”.
    - **Content**:
      - Task Title (e.g., “Follow up on payment”).
      - Description (Note if available, e.g., “Client Follow-Up: Call client”).
      - Due Date (e.g., 3/26/25).
      - Priority (High, Medium, Low).
      - Linked Item (Order #123—clickable to View Modal).
      - Status (Pending, Completed).
    - **Actions (Inline)**:
      - Mark Completed (checkbox).
      - View Linked Item (opens Order #123).
  - **Mobile**: Cards stack vertically, expandable for details.
- **To-Do Widget (Home Page)**:
  - **Format**: Collapsible card list.
  - **Content**: Top 5 upcoming/overdue tasks (manual + auto-generated from all sources).
    - Example: “Call client for Order #123, Due 3/26/25, Medium”.
  - **Actions**: Mark Completed (inline), View All (links to Manual Tasks page or Orders Task Card View).
- **Critical Weekly To-Do (Home Page)**:
  - **Format**: Card list, always visible.
  - **Content**:
    - Material Purchase Installments: Due within 7 days or overdue (e.g., “Pay $50 to Supplier A, Due 3/26/25”).
    - Overdue Order Follow-Ups: (e.g., “Order #123, Unpaid 14 days”).
    - Overdue Payments: Across Orders/Material Purchases (e.g., “Order #123 Balance: $100, Due 3/20/25”).
  - **Actions**: Click to view linked item, Mark Completed (inline).

#### Task Generation
- **Sources**:
  - **Manual (Manual Tasks Page)**:
    - User-added tasks (e.g., “Check printer”).
    - Added under a project (e.g., “Inbox,” “Finance Follow-Ups”).
  - **Auto-Generated**:
    - **Orders (Orders Task Card View)**:
      - Order Notes: Based on type (e.g., Client Follow-Up: “Call client” → Medium task).
      - Order Follow-Ups: Unpaid orders (e.g., “Follow up on Order #123, Unpaid 7 days”).
    - **Expenses/Material Purchases (Manual Tasks Page, Work Projects)**:
      - Finance Notes: Based on type (e.g., Urgent: “Pay overdue bill” → High task).
      - Material Purchase Installments: Per installment (e.g., “Pay $50 to Supplier A, Due 4/26/25”).
      - Recurring Expenses: From setup (e.g., “Pay Rent $500, Due 4/1/25”).
- **Task Details**:
  - Title (e.g., “Call client”).
  - Description (Note if available, e.g., “Call client for approval”).
  - Due Date (e.g., 3/26/25).
  - Priority (High, Medium, Low—auto-set for auto-tasks, manual for others).
  - Linked Item (e.g., Order #123, Expense #456).
  - Status (Pending, Completed).

#### Adding/Editing Manual Tasks (Side Modal)
- **Purpose**: Create or modify manual tasks.
- **Sections**:
  - **General Info**:
    - Project (Dropdown: Inbox, Finance Follow-Ups, etc.—or “Add New Project”).
    - Title (Input: e.g., “Check printer”).
    - Description (Text: e.g., “Ensure ink levels are sufficient”).
    - Due Date (Date Picker).
    - Priority (Dropdown: High, Medium, Low).
    - Linked Item (Optional Dropdown: Orders, Expenses, Material Purchases—searchable).
  - **Subtasks**:
    - Multi-entry (add/remove): Title, Due Date, Priority.
  - **Recurrence (Optional)**:
    - Toggle: Recurring (Yes/No).
    - If Yes:
      - Frequency (Dropdown: Weekly, Monthly, Yearly, Custom).
      - Monthly Options: Same Date (e.g., 1st of each month), Specific Date (e.g., 15th).
      - End Date (Optional Date Picker).
- **Auto-Tasks**:
  - Pre-filled from source (e.g., “Pay $50 to Supplier A” from Material Purchase, Due Date: 4/26/25, Priority: Medium).

#### Recurring Tasks
- **Purpose**: Handle recurring expenses and reminders.
- **Setup** (Manual Tasks Page):
  - **Add Task Modal**:
    - General Info: Project, Title (e.g., “Pay Rent”), Description (e.g., “$500 for office”), Due Date, Priority.
    - Linked Item: Optional (e.g., Expense #456).
    - Recurrence: Toggle On, Frequency (Weekly, Monthly, Yearly, Custom), Monthly Options (Same Date, Specific Date), End Date (Optional).
  - **Behavior**:
    - Task auto-generates on schedule (e.g., “Pay Rent, Due 4/1/25”).
    - Manual completion required.
    - On completion, next instance generates (e.g., “Pay Rent, Due 5/1/25”).
- **Display**:
  - In Manual Tasks page under selected project with recurrence icon (🔄).
  - Notes: “Recurs Monthly” in description.

#### Order Follow-Ups
- **Purpose**: Ensure timely payment collection.
- **Implementation**:
  - **Trigger**: Unpaid orders after 7 days (then 14, 21 days).
  - **Task**: “Follow up on Order #123, Unpaid 7 days,” Priority: Medium (escalates to High after 14 days).
  - **Display**: In Orders Task Card View.
  - **Highlight**: Yellow badge in Orders Table View.
  - **Critical Weekly To-Do**: Included if overdue (e.g., “Order #123, Unpaid 14 days”).

#### Quick Actions
- **Purpose**: Speed up common tasks.
- **Implementation**:
  - Inline in Orders/Finance tables (via 3-dot menu).
  - Examples:
    - Orders: “Mark as In Progress” (Paused), “Mark as Delivered” (Completed).
    - Expenses: “Add Payment” (inline form).
    - Material Purchases: “Mark Paid” (Unpaid).
  - Role-Based: Employees can’t perform actions requiring approval (e.g., Delete).

#### Smart Automations
- **Notes to Tasks**:
  - **Trigger**: Notes with task-eligible types (Client Follow-Up, Urgent, Internal if specified).
  - **Priority**:
    - Urgent: High.
    - Client Follow-Up: Medium.
    - Internal: Low (if task created).
    - Info: No task.
  - **Pop-Up**: On note save (e.g., “Create task: Call client?” with pre-set priority).
- **Keyword Triggers**:
  - In note text (e.g., “urgent” → High priority, “tomorrow” → Due Date: +1 day).
- **Overdue Escalation**:
  - Tasks overdue by 3+ days auto-escalate (e.g., Medium → High).

#### Notifications
- **Triggers**:
  - Task created (manual or auto).
  - Task due today.
  - Task overdue.
  - Overdue payments (Orders, Material Purchases).
- **Delivery**:
  - In-app: Pop-up or bell icon for all users.
  - Push: For mobile users (all roles).
- **Frequency**:
  - Due today: Morning notification.
  - Overdue: Daily until completed (user can snooze, e.g., “Remind tomorrow”).
- **Example**: “Task due today: Call client for Order #123,” “Task overdue: Pay $50 to Supplier A.”

#### UI/UX Enhancements
- **Filters (Orders Task Card View)**:
  - Priority (High, Medium, Low).
  - Due Date (Today, This Week, Overdue).
  - Status (Pending, Completed).
- **Filters (Manual Tasks Page)**:
  - None (simplified UI, inspired by Todoist).
- **Bulk Actions**:
  - Orders Task Card View: Mark Completed, Delete.
  - Manual Tasks Page: Mark Completed, Delete.
- **Status Indicators**:
  - Priority: High (Red), Medium (Yellow), Low (Green).
  - Status: Pending (Gray), Completed (Blue).
- **Alerts**:
  - Overdue tasks: Red badge in Task Card View/Widget.
  - Upcoming: Yellow badge if due today.

#### Role-Based Access Integration
- **Permissions**:
  - **Admin**: Add/edit/delete tasks, approve deletions.
  - **Manager**: Add/edit tasks, approve deletions.
  - **Employee**: Add tasks, request deletions.
- **Task Assignment**:
  - None (removed as per clarification).
- **Deletions**: Require Admin/Manager approval via Approvals Page.

#### Scalability and Performance
- **Volume**: Handle increased tasks during peaks (e.g., 70 orders/day → more follow-ups).
- **Design**: Indexed columns (e.g., Due Date, Priority) for fast filtering.
- **Mobile**: Full functionality, collapsible sections for usability.

#### Smart Dropdowns in Workflow
- **Task Type**:
  - Predefined: Info, Client Follow-Up, Urgent, Internal.
  - Mechanism: Searchable, recent entries, add new (e.g., “Custom Type”), Admin cleanup via Settings.
- **Linked Item**:
  - Dropdown: Orders, Expenses, Material Purchases.
  - Mechanism: Searchable (e.g., “Order #123”), recent entries, no “Add New” (links to existing items).
- **Client Info (Orders Integration)**:
  - Address, Contact: Optional during entry, editable later in Client Management (Settings).

---

### Updated Work Plan
- **Action Items**:
  - Wireframe: Manual Tasks Page (Work Projects, subtasks), Orders Task Card View, To-Do Widget (collapsible), Critical Weekly To-Do Section.
  - Design recurring task setup UI (frequency, monthly options).
  - Plan notification snooze options (in-app + push).
  - Define keyword triggers (e.g., “urgent,” “tomorrow”).
  - Add Client Management section to Settings (for address/contact edits).
- **Dependencies**: Orders (task cards), Finance (tasks), Home Page (widget).
- **Priority**: Medium.

---

**Dashboard and Analytics**

---

### 

#### Key Updates
- **Home Page vs. Dashboard/Analytics**:
  - **Home Page**: Quick insights only (e.g., Pending Orders, Tasks, Critical Weekly To-Do), minimal analytics (e.g., no charts like Revenue Trend, Top Clients).
    - Retains Quick Actions (Add Order, Add Expense, Add Material Purchase).
  - **Dashboard/Analytics Page**: Full analytics and drill-downs (e.g., Orders, Finance, Client Analytics).
- **Access**:
  - Dashboard/Analytics page restricted to Admins and Managers only (Employees have no access).
  - Home Page accessible to all users (Admins, Managers, Employees).
- **Export Options**:
  - Add export functionality for analytics data (e.g., CSV, PDF).
- **Client Analytics**:
  - Focus on breaking down and drilling down into client data (e.g., order history, payments).
  - Charts: Line graphs and bar charts preferred, but no strict restriction as long as data is understandable.
- **Charts**:
  - Removed from Home Page (e.g., Revenue Trend, Top Clients).
  - Retained in Dashboard/Analytics with a preference for line and bar charts.

---

### Detailed Output: Dashboard and Analytics

#### Overview
The Dashboard and Analytics section provides insights into the printing business’s performance for 5-20 users, split into two distinct areas: the Home Page for quick insights accessible to all users, and the Dashboard/Analytics page for in-depth analytics restricted to Admins and Managers. The Home Page focuses on actionable data (e.g., pending orders, tasks) with minimal analytics, while the Dashboard/Analytics page offers detailed metrics, charts, and drill-downs (e.g., Orders, Finance, Client Analytics). The system supports 30 orders/day (up to 70 in peaks), ensuring data is presented clearly and exportable for further analysis.

#### Interface and Views
- **Home Page**:
  - **Purpose**: Quick insights and actions for all users (Admins, Managers, Employees).
  - **Widgets**:
    - **Pending Orders**: Card (e.g., “30 Pending Orders”).
      - Clickable: Links to Orders page (filtered to Pending).
    - **Pending Payments**: Card (e.g., “$5,000 Unpaid”).
      - Clickable: Links to Orders page (filtered to Unpaid).
    - **To-Do Widget**: Collapsible card list, top 5 upcoming/overdue tasks (e.g., “Call client for Order #123, Due 3/26/25, Medium”).
      - Actions: Mark Completed (inline), View All (links to Manual Tasks page or Orders Task Card View).
    - **Critical Weekly To-Do**: Card list, always visible.
      - Content: Material purchase installments (e.g., “Pay $50 to Supplier A, Due 3/26/25”), overdue order follow-ups (e.g., “Order #123, Unpaid 14 days”), overdue payments (e.g., “Order #123 Balance: $100, Due 3/20/25”).
      - Actions: Click to view linked item, Mark Completed (inline).
  - **Quick Actions**:
    - Buttons: Add Order, Add Expense, Add Material Purchase (open respective modals).
  - **Analytics**: Minimal (no charts, only counts like Pending Orders).
  - **Mobile**:
    - Widgets stack vertically, quick actions as sticky footer.
- **Dashboard/Analytics Page**:
  - **Purpose**: In-depth analytics and drill-downs for Admins and Managers only.
  - **Access**: Restricted to Admins and Managers (Employees have no access).
  - **Sections**:
    - **Orders Analytics**:
      - Total Orders (e.g., “300”).
      - Completed Orders (e.g., “250”).
      - Average Order Value (e.g., “$50”).
      - Order Status Breakdown: Pie chart (Pending, In Progress, Completed, Delivered, Cancelled).
      - Revenue by Client: Table (Client Name, Total Revenue, Order Count).
        - Export: CSV, PDF (buttons above table).
      - Revenue Trend: Line chart (Daily, Weekly, Monthly toggle).
        - X-axis: Time (e.g., days of month).
        - Y-axis: Revenue (e.g., $0-$5,000).
    - **Finance Analytics**:
      - Total Expenses (e.g., “$2,000”).
      - Total Material Purchases (e.g., “$1,500”).
      - Expense Categories: Bar chart (e.g., Rent: $500, Salaries: $800).
      - Top Suppliers: Table (Supplier, Total Spent, Purchase Count).
        - Export: CSV, PDF.
      - Expense Trend: Line chart (Daily, Weekly, Monthly toggle).
        - X-axis: Time.
        - Y-axis: Expenses (e.g., $0-$1,000).
    - **Client Analytics**:
      - **Client List**:
        - Table: Client Name, Total Spent, Order Count, Last Order Date.
        - Actions: View Details (opens drill-down).
      - **Client Details (Drill-Down)**:
        - **General Info**: Name, Address (if available), Contact (if available), Total Spent, Order Count.
        - **Order History**: Table (Order Number, Date, Amount, Status, Payment Status).
          - Export: CSV, PDF.
        - **Payment History**: Table (Order Number, Payment Amount, Date, Type).
          - Export: CSV, PDF.
        - **Revenue Trend**: Line chart (Monthly revenue from this client).
          - X-axis: Months (e.g., Jan-Mar 2025).
          - Y-axis: Revenue (e.g., $0-$2,000).
        - **Order Status Breakdown**: Bar chart (e.g., Completed: 10, Delivered: 5).
        - **Timeline**: Chronological log (e.g., “Order #123 placed, 3/26/25,” “Payment of $50 added, 3/27/25”).
        - **Metrics**: Average Order Value (e.g., “$50”), Last Order Date (e.g., “3/26/25”).
        - **Actions**: Edit Client (opens modal to update Address/Contact), Add Order (links to Add Order modal with client pre-filled).
  - **Filters**:
    - Date Range (Dropdown: Today, This Week, This Month, Custom—date picker).
    - Client (Smart Dropdown: e.g., “John Smith”).
    - Category (Smart Dropdown: e.g., “Rent”).
    - Supplier (Smart Dropdown: e.g., “Supplier A”).
  - **Mobile**:
    - Sections collapsible, charts scrollable, filters in a modal.

#### Data Sources
- **Home Page**:
  - Orders: Pending Orders, Pending Payments.
  - Workflow: Tasks for To-Do Widget, Critical Weekly To-Do (e.g., overdue payments, follow-ups).
- **Dashboard/Analytics**:
  - Orders: Total Orders, Completed Orders, Average Order Value, Order Status, Revenue by Client, Revenue Trend.
  - Finance: Total Expenses, Total Material Purchases, Expense Categories, Top Suppliers, Expense Trend.
  - Clients: Client-specific data (order history, payments, trends).

#### Export Options
- **Tables**:
  - Revenue by Client, Top Suppliers, Order History, Payment History.
  - Buttons: “Export as CSV,” “Export as PDF” (above each table).
- **Implementation**:
  - CSV: Downloads raw data (e.g., Client Name, Total Revenue, Order Count).
  - PDF: Formatted report with table and filters applied (e.g., “Revenue by Client, Mar 2025”).
- **Access**: Admins and Managers only (aligned with Dashboard/Analytics access).

#### Smart Dropdowns in Analytics
- **Client, Category, Supplier**:
  - Mechanism: Searchable, recent/frequent suggestions, add new (Admin cleanup in Settings).
  - Client Info: Address, Contact optional during entry, editable in Client Management (Settings).
- **Client Management (Settings)**:
  - List: Client Name, Address, Contact.
  - Actions: Edit (update Address/Contact), Delete (Admin-only, requires approval if linked to orders).

#### Visual Design
- **Charts**:
  - Types: Line (Revenue Trend, Expense Trend, Client Revenue Trend), Bar (Expense Categories, Client Order Status), Pie (Order Status).
  - Preference: Line and bar charts favored, but pie used for status breakdowns (data remains understandable).
  - Colors: Green/orange scheme (from invoice template—e.g., green for positive metrics, orange for warnings).
- **Responsiveness**:
  - Charts resize dynamically, switch to scrollable on mobile.
  - Widgets/cards stack vertically on smaller screens.

#### Role-Based Access Integration
- **Permissions**:
  - **Home Page**: Accessible to all (Admins, Managers, Employees).
  - **Dashboard/Analytics**:
    - Admins/Managers: Full access (all analytics, exports).
    - Employees: No access (redirected to Home Page if attempted).
  - **Client Management (Settings)**:
    - Admins: Edit/delete clients.
    - Managers: Edit clients, request deletions.
    - Employees: View-only (if accessed via Settings).
- **Deletions**: Client deletions require Admin/Manager approval.

#### Scalability and Performance
- **Volume**: Handle data for 30 orders/day (up to 70 in peaks).
- **Design**:
  - Pre-aggregated data for common metrics (e.g., Total Revenue, Total Expenses stored in summary tables).
  - Indexed columns (e.g., Order Date, Client ID) for fast filtering.
  - Caching: Dashboard widgets cached (refresh every 5 minutes).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load charts).

#### Future Considerations
- **Task Analytics**: Add metrics (e.g., Total Tasks, Completion Rate) in a later iteration.
- **Customization**: Allow widget reordering/hiding on Dashboard (future enhancement).

---

### Updated Work Plan
- **Action Items**:
  - Wireframe: Home Page (quick insights, widgets), Dashboard/Analytics Page (sections, filters, charts), Client Analytics Page (list, drill-down).
  - Design chart color scheme (green/orange).
  - Implement export functionality (CSV, PDF) for tables.
  - Plan Client Management UI in Settings (edit address/contact).
  - Optimize database queries for analytics (e.g., pre-aggregate Total Revenue).
- **Dependencies**: Orders, Finance, Workflow (data sources), Settings (Client Management).
- **Priority**: Medium.

---

**Profit Calculation Mechanism** 

---



#### Key Updates
- **Profit Calculation Correction**:
  - Profit percentage is applied to the **unit price** of each item, not the total cost of the order.
    - Example: 10 flyers at 200 USH each → Profit % applied to 200 USH per flyer, not 2000 USH total.
  - Updated Formula:
    - Profit per Item = `Unit Price × Profit %`.
    - Total Profit for the order = Sum of profit across all items.
- **Dynamic Calculation Setup**:
  - Add a setting to let users choose whether the profit percentage is applied to:
    - **Unit Price** (e.g., 200 USH per flyer).
    - **Total Cost** (e.g., 2000 USH for 10 flyers).
  - This setting will also apply to the labor percentage calculation (if enabled).
- **Impact**:
  - **Orders**: Recalculate profit and labor per item based on the chosen setting.
  - **Settings**: Add a configuration option for the calculation basis (Unit Price or Total Cost).
  - **Analytics**: Ensure profit metrics reflect the chosen calculation method.

#### Example with Updated Calculation
- **Scenario**: 10 flyers, 200 USH each, Total Cost = 2000 USH.
- **Settings**:
  - Profit % = 20%, Labor % = 10%.
  - Calculation Basis: Unit Price (default, as clarified).
- **Per Flyer**:
  1. **Unit Price**: 200 USH.
  2. **Profit Amount**: `Unit Price × Profit %` = 200 × 20% = 40 USH.
  3. **Production Cost**: `Unit Price - Profit Amount` = 200 - 40 = 160 USH.
  4. **Labor Amount**: `Production Cost × Labor %` = 160 × 10% = 16 USH.
  5. **Remaining Cost**: `Production Cost - Labor Amount` = 160 - 16 = 144 USH.
- **Total for Order** (10 Flyers):
  - Total Profit: 40 USH × 10 = 400 USH.
  - Total Labor: 16 USH × 10 = 160 USH.
  - Total Remaining Cost: 144 USH × 10 = 1440 USH.
- **If Calculation Basis = Total Cost**:
  1. **Total Cost**: 2000 USH.
  2. **Profit Amount**: `Total Cost × Profit %` = 2000 × 20% = 400 USH (same total profit, but calculated differently).
  3. **Production Cost**: `Total Cost - Profit Amount` = 2000 - 400 = 1600 USH.
  4. **Labor Amount**: `Production Cost × Labor %` = 1600 × 10% = 160 USH.
  5. **Remaining Cost**: `Production Cost - Labor Amount` = 1600 - 160 = 1440 USH.
  - Result: Same totals, but the breakdown per item differs (e.g., profit per flyer isn’t 40 USH but proportional to the total).

---

### Detailed Output: Profit Calculation Mechanism (Updated)

#### Overview
The Profit Calculation Mechanism enables a printing business with 5-20 users to calculate profits using a percentage-based system, with the flexibility to apply percentages to either the **unit price** of each order item or the **total cost** of the order items. The mechanism optionally includes labor costs and is configurable via the Settings page, ensuring adaptability to different business models. It integrates with Orders (calculation and storage), Analytics (profit metrics and drill-downs), and Settings (dynamic configuration), supporting 30 orders/day (up to 70 in peaks) with a focus on transparency and actionable financial insights for Admins and Managers.

#### Profit Calculation Formula
- **Calculation Basis** (Configurable in Settings):
  - **Unit Price** (default): Apply percentages to the unit price of each item.
  - **Total Cost**: Apply percentages to the total cost of all items in the order.
- **Per Order Item (Unit Price Basis)**:
  1. **Unit Price**: Cost per item (e.g., 200 USH for 1 flyer).
  2. **Profit Amount**: `Unit Price × Profit %`.
     - Example: 200 × 20% = 40 USH.
  3. **Production Cost**: `Unit Price - Profit Amount`.
     - Example: 200 - 40 = 160 USH.
  4. **Labor Amount (Optional)**: `Production Cost × Labor %`.
     - Example: 160 × 10% = 16 USH.
  5. **Remaining Cost**: `Production Cost - Labor Amount`.
     - Example: 160 - 16 = 144 USH.
  - **Total for Order**:
    - Total Profit: Sum of `profit_amount` across all items (e.g., 40 USH × 10 = 400 USH).
    - Total Labor: Sum of `labor_amount` across all items (e.g., 16 USH × 10 = 160 USH).
- **Per Order (Total Cost Basis)**:
  1. **Total Cost**: Sum of all item totals (e.g., 2000 USH for 10 flyers).
  2. **Profit Amount**: `Total Cost × Profit %`.
     - Example: 2000 × 20% = 400 USH.
  3. **Production Cost**: `Total Cost - Profit Amount`.
     - Example: 2000 - 400 = 1600 USH.
  4. **Labor Amount (Optional)**: `Production Cost × Labor %`.
     - Example: 1600 × 10% = 160 USH.
  5. **Remaining Cost**: `Production Cost - Labor Amount`.
     - Example: 1600 - 160 = 1440 USH.
  - **Per Item Breakdown** (for display):
    - Profit per Item: `Profit Amount × (Item Total / Total Cost)`.
      - Example: Item Total = 200 USH, Profit = 400 USH × (200/2000) = 40 USH.
    - Labor per Item: `Labor Amount × (Item Total / Total Cost)`.
      - Example: Labor = 160 USH × (200/2000) = 16 USH.
- **Overall (e.g., Monthly)**:
  - Total Profit: Sum of `profit_amount` across all order items.
  - Total Labor: Sum of `labor_amount` across all order items.
  - Profit Margin: (Total Profit / Total Revenue) × 100.

#### Database Storage
- **Table: `order_items`**:
  - Existing: `order_id`, `item_id`, `category_id`, `quantity`, `unit_price`, `total_amount`.
  - New Fields:
    - `profit_amount` (decimal): Profit for this item (e.g., 40 USH).
    - `labor_amount` (decimal): Labor cost for this item (e.g., 16 USH).
- **Calculation Trigger**:
  - On order creation/edit: Calculate `profit_amount` and `labor_amount` based on Settings (profit %, labor %, calculation basis).
  - Store in `order_items` for analytics and reporting.

#### Integration with Orders
- 
  - No UI changes—profit calculation happens automatically on save.
  - Uses profit and labor percentages from Settings (global or overrides, based on calculation basis).
-
#### Integration with Settings
- **Purpose**: Configure profit and labor percentages, and the calculation basis.
- **Section: Profit Settings**:
  - **Global Settings**:
    - **Calculation Basis**: Dropdown (Unit Price, Total Cost—default: Unit Price).
    - Default Profit %: Input (e.g., 20%, default: 0%).
    - Include Labor: Toggle (Yes/No, default: No).
    - Labor % (if Yes): Input (e.g., 10%, default: 0%).
  - **Overrides**:
    - Table: Item/Category, Profit %, Labor % (if enabled), Last Updated.
    - Actions: Add (select Item/Category, set Profit %, Labor %), Edit, Delete (Admin-only).
    - Example: “Flyers (Category), 25% Profit, 12% Labor”.
  - **Logic**:
    - On order save: Check for item/category override; if none, use global settings.
    - Apply percentages based on Calculation Basis (Unit Price or Total Cost).
    - Example: Flyers use 25% profit (override), while Posters use 20% (global).
- **Access**:
  - Admins: Full access (add/edit/delete overrides, change global settings).
  - Managers: View/edit overrides, view global settings (no changes).
  - Employees: No access.

#### Integration with Dashboard/Analytics
- **Purpose**: Display profit metrics for Admins and Managers.
- **Section: Profit Analytics** (Dashboard/Analytics Page):
  - **Metrics**:
    - Total Profit (e.g., “1200 USH”).
      - Drill-Down: Click to view Orders list (filtered by date range, showing `profit_amount` per item).
    - Total Labor Cost (e.g., “300 USH”).
    - Profit Margin (e.g., “25%”).
    - Average Profit per Order (e.g., “40 USH”).
  - **Profit Trend**: Line chart (Daily, Weekly, Monthly toggle).
    - X-axis: Time (e.g., days of month).
    - Y-axis: Profit (e.g., 0-500 USH).
  - **Profit by Category**: Bar chart (e.g., Flyers: 500 USH, Posters: 300 USH).
    - X-axis: Categories.
    - Y-axis: Profit.
  - **Profit by Client**: Table (Client Name, Total Revenue, Total Profit, Profit Margin, Labor Cost).
    - Export: CSV, PDF (includes all columns).
  - **Filters**:
    - Date Range (Today, This Week, This Month, Custom).
    - Client (Smart Dropdown).
    - Category (Smart Dropdown).
  - **Custom Reports**:
    - Build Report: Select metrics (e.g., Total Profit, Profit Margin), group by (e.g., Category, Client), date range.
    - Example: “Total Profit by Category, Q1 2025” (table: Flyers: 500 USH, Posters: 300 USH).
    - Export: CSV, PDF.
- **Client Analytics (Updated)**:
  - **Profit Metrics**:
    - Total Profit from Client (e.g., “500 USH”).
    - Profit Margin (e.g., “25%”).
    - Total Labor Cost (e.g., “100 USH”).
    - Profit Trend: Line chart (Monthly profit from this client).
  - **Order History** (Updated):
    - Add Columns: Profit Amount, Labor Amount (e.g., Order #123: 400 USH Profit, 160 USH Labor).
  - **Export**: CSV, PDF (includes profit and labor columns).

#### Smart Dropdowns in Profit Calculation
- **Item/Category (Settings Overrides)**:
  - Mechanism: Searchable, recent/frequent suggestions, add new (Admin cleanup).
- **Client (Analytics Filters)**:
  - Mechanism: Searchable, recent/frequent suggestions, add new.
  - Client Info: Address, Contact optional, editable in Client Management (Settings).

#### Visual Design
- **Charts**:
  - Types: Line (Profit Trend), Bar (Profit by Category).
  - Colors: Green/orange scheme (green for profit, orange for costs).
- **Responsiveness**:
  - Charts resize dynamically, scrollable on mobile.
  - Tables exportable (CSV, PDF) with filters applied.

#### Role-Based Access Integration
- **Profit Analytics (Dashboard/Analytics)**:
  - Admins/Managers: Full access (view, export, custom reports).
  - Employees: No access (redirected to Home Page).
- **Settings (Profit Settings)**:
  - Admins: Full access (add/edit/delete overrides, change global settings).
  - Managers: View/edit overrides, view global settings (no changes).
  - Employees: No access.

#### Scalability and Performance
- **Volume**: Handle 30 orders/day (up to 70 in peaks).
- **Design**:
  - Pre-aggregated data for profit metrics (e.g., `profit_summary` table: `date`, `total_profit`, `total_labor`).
  - Indexed columns (e.g., Order Date, Client ID) for fast filtering.
  - Caching: Profit metrics cached (refresh every 5 minutes).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load charts).

#### Future Considerations
- **Dynamic Calculation Enhancements**:
  - Add more calculation bases (e.g., per quantity, per category-specific rules).
  - Allow labor % to vary by item (e.g., add to overrides).
- **Actual Cost Integration**:
  - Link to Material Purchases for real costs (future enhancement).
- **Tax Integration**:
  - Factor in VAT (optional field from Finance) for net profit (future enhancement).

---

### Updated Work Plan
- **Action Items**:
  - Update database schema: Add `profit_amount`, `labor_amount` to `order_items`.
  - Update Profit Settings: Add Calculation Basis (Unit Price/Total Cost).
  - Wireframe: Profit Settings (updated global settings, overrides), Profit Analytics (charts, tables, custom reports).
  - Implement updated profit calculation logic (Unit Price or Total Cost basis).
  - Add export functionality (CSV, PDF) for Profit by Client, custom reports.
  - Optimize queries for profit metrics (e.g., pre-aggregate data).
- **Dependencies**: Orders (calculation, storage), Analytics (display), Settings (configuration).
- **Priority**: High.

---

 **Settings and Customization** 

---

### 

#### Key Updates
- **Smart Dropdowns**:
  - Add automatic cleanup (e.g., flag duplicates, suggest merges) for Admins and Managers.
  - Manual cleanup: Admins and Managers can manage all smart dropdown data (clients, items, categories, suppliers), including marking unused products as inactive and merging duplicates.
- **Role-Based Access**:
  - Admins and Managers: Full access to all settings, except for technical settings (e.g., currency, language, user limit), which are Admin-only.
  - Managers: Can’t see technical settings (e.g., currency, language, user limit settings).
  - Employees: Data input and read-only access (e.g., Orders), with dynamic access to specific items configurable by Admins/Managers.
- **User Management**:
  - Admins: Control who can access the app (add/edit/deactivate users, set user limit).
  - Managers: Can add users but don’t see the user limit; receive a notification if the limit is exceeded.
  - User Limit: Set by Admin (e.g., 5-20), enforced dynamically.
- **Orders**:
  - Dynamic Access: Admins/Managers can grant Employees access to specific items (e.g., Employee A can only input orders for Flyers).
- **Profit Settings**:
  - Accessible to both Admins and Managers (no changes needed, already aligned).
- **General Settings**:
  - Currency: Default to Ugandan Shillings (USH), Admin-only to change.
  - Language: Default to English, Admin-only to change.
  - Theme: Add light/dark mode (accessible to Admins and Managers).
- **Notifications**:
  - Admins and Managers can manage notification settings (e.g., push, reminder frequency).
- **Data Management**:
  - Admins and Managers can manage all smart dropdown data (clients, items, categories, suppliers).
  - Mark unused products as inactive (e.g., items not used in orders for X months).
- **Company Branding**:
  - Managers can input company name and logo, used throughout the app (e.g., on invoices, Home Page).
- **Analytics**:
  - Add filters to Analytics (already included) and support saving custom report templates.
- **Backup**:
  - Backup options available (already included, e.g., export all data as CSV).

---

### Detailed Output: Settings and Customization (Updated)

#### Overview
The Settings and Customization section provides a centralized hub for a printing business with 5-20 users to configure app-wide settings, manage data, and customize features. It integrates with Orders (e.g., dynamic employee access, items), Finance (e.g., suppliers), Analytics (e.g., clients, custom reports), and Workflow (e.g., notifications), ensuring flexibility while maintaining security. Admins and Managers have full access to most settings, with technical settings (e.g., currency, language, user limit) restricted to Admins. The system supports 30 orders/day (up to 70 in peaks) with a focus on usability, scalability, and security.

#### Interface and Views
- **Settings Page**:
  - **Purpose**: Central hub for all configurations.
  - **Structure**:
    - Sidebar: Sections (e.g., General, Profit Settings, Data Management, User Management, Notifications, Branding, Analytics).
    - Main Content: Selected section’s settings.
  - **Sections**:
    - **General Settings**:
      - **Currency**: Dropdown (e.g., USH, USD—default: USH, Admin-only).
      - **Language**: Dropdown (e.g., English, Swahili—default: English, Admin-only).
      - **Theme**: Dropdown (Light Mode, Dark Mode—default: Light Mode, Admins/Managers).
      - **User Limit**: Input (e.g., 5-20, default: 20, Admin-only).
    - **Profit Settings**:
      - **Global Settings**:
        - Calculation Basis: Dropdown (Unit Price, Total Cost—default: Unit Price).
        - Default Profit %: Input (e.g., 20%, default: 0%).
        - Include Labor: Toggle (Yes/No, default: No).
        - Labor % (if Yes): Input (e.g., 10%, default: 0%).
      - **Overrides**:
        - Table: Item/Category, Profit %, Labor % (if enabled), Last Updated.
        - Actions: Add (select Item/Category, set Profit %, Labor %), Edit, Delete.
      - **Access**: Admins and Managers.
    - **Data Management**:
      - **Clients**:
        - Table: Client Name, Address, Contact, Order Count, Status (Active/Inactive).
        - Actions: Edit (update Address/Contact), Mark Inactive (if no recent orders), Delete (requires approval if linked to orders).
      - **Items**:
        - Table: Item Name, Category, Usage Count, Last Used, Status (Active/Inactive).
        - Actions: Edit (update name, category), Mark Inactive (if not used in 6 months), Merge (e.g., “A4” and “A4 Size”), Delete (requires approval if used).
      - **Categories**:
        - Table: Category Name, Usage Count, Status (Active/Inactive).
        - Actions: Edit, Mark Inactive, Merge, Delete (requires approval if used).
      - **Suppliers**:
        - Table: Supplier Name, Usage Count, Status (Active/Inactive).
        - Actions: Edit, Mark Inactive, Merge, Delete (requires approval if used).
      - **Automatic Cleanup**:
        - **Duplicates**: System flags potential duplicates (e.g., “A4” vs. “A4 Size”) using fuzzy matching.
          - Table: Suggested Merges (e.g., “A4” and “A4 Size”, Usage Counts).
          - Actions: Merge (combine into one, update all records), Ignore.
        - **Unused Items**: Flags items not used in orders for 6 months.
          - Table: Inactive Suggestions (e.g., “Old Poster”, Last Used: 9/1/24).
          - Actions: Mark Inactive, Delete (requires approval).
      - **Access**: Admins and Managers.
    - **User Management**:
      - **Users**:
        - Table: User Name, Email, Role (Admin, Manager, Employee), Status (Active, Inactive).
        - Actions:
          - Add (Name, Email, Role, Password—Admins/Managers).
          - Edit (update details—Admins/Managers).
          - Deactivate (Admin-only, requires approval if user has records).
        - Limit: Set by Admin (e.g., 5-20).
        - Notification: Managers receive a notification if limit exceeded (e.g., “User limit of 20 reached”).
      - **Employee Access (Orders)**:
        - Table: Employee Name, Accessible Items (e.g., Flyers, Posters), Last Updated.
        - Actions: Edit (select items Employee can input orders for—e.g., Employee A: Flyers only).
        - Example: Employee A can only add orders for Flyers, not Posters.
      - **Access**:
        - Admins: Full access (add/edit/deactivate, set limit, manage employee access).
        - Managers: Add/edit users, manage employee access (don’t see user limit).
        - Employees: No access.
    - **Notifications**:
      - Push Notifications: Toggle (Enable/Disable—default: Enable).
      - Overdue Task Reminders: Dropdown (Daily, Every 2 Days, Weekly—default: Daily).
      - Snooze Options: Toggle (Allow Snooze—default: Yes).
      - **Access**: Admins and Managers.
    - **Branding**:
      - Company Name: Input (e.g., “ABC Printing”).
      - Company Logo: Upload (image file, displayed on Home Page, invoices).
      - **Access**: Admins and Managers.
    - **Analytics**:
      - **Custom Report Templates**:
        - Table: Template Name, Metrics (e.g., Total Profit, Revenue), Group By (e.g., Category), Date Range.
        - Actions: Add (create template), Edit, Delete.
        - Example: “Profit by Category (Monthly)” (Total Profit, Category, This Month).
      - **Access**: Admins and Managers.
    - **Backup and Export**:
      - Export All Data: Button (downloads CSV with Orders, Expenses, Material Purchases, Clients, etc.).
      - Format: CSV (separate files for each table).
      - **Access**: Admins and Managers.
  - **Mobile**:
    - Sections collapsible, tables scrollable, actions in a modal.

#### Integration with Other Sections
- **Orders**:
  - Items, Categories: Managed in Data Management (e.g., mark inactive, merge duplicates).
  - Employee Access: Dynamic access to items (e.g., Employee A can only input orders for Flyers).
  - Profit Calculation: Uses Profit Settings (calculation basis, profit %, labor %).
  - Currency: Affects order amounts (e.g., USH).
- **Finance**:
  - Suppliers: Managed in Data Management.
  - Currency: Affects expenses, material purchases.
- **Analytics**:
  - Clients: Managed in Data Management (edit address/contact, mark inactive).
  - Profit Metrics: Uses Profit Settings for calculations.
  - Custom Reports: Templates saved for reuse.
- **Workflow**:
  - Notifications: Uses Notification settings (e.g., push, reminder frequency).
- **General**:
  - Branding: Company name and logo displayed on Home Page, invoices.
  - Theme: Light/dark mode applied app-wide.

#### Smart Dropdowns in Settings
- **Item/Category (Profit Overrides, Data Management)**:
  - Mechanism: Searchable, recent/frequent suggestions, add new.
  - Automatic Cleanup: Flags duplicates (e.g., “A4” vs. “A4 Size”), suggests merges.
  - Manual Cleanup: Mark inactive, merge, delete.
- **Client (Data Management)**:
  - Mechanism: Searchable, recent/frequent suggestions, add new.
  - Cleanup: Mark inactive (e.g., no orders in 6 months), delete (requires approval).

#### Security and Role-Based Access
- **Access**:
  - **Admins**:
    - Full access to all settings (General, Profit Settings, Data Management, User Management, Notifications, Branding, Analytics, Backup).
    - Technical Settings: Currency, Language, User Limit (Admin-only).
    - User Management: Add/edit/deactivate users, set limit, manage employee access.
  - **Managers**:
    - Full access to most settings (Profit Settings, Data Management, User Management, Notifications, Branding, Analytics, Backup).
    - Restricted: Can’t see or edit Currency, Language, User Limit.
    - User Management: Add/edit users, manage employee access (don’t see user limit, receive notification if exceeded).
  - **Employees**:
    - No access to Settings (redirected to Home Page).
    - Orders: Data input and read-only (dynamic access to items set by Admins/Managers).
- **Deletions**:
  - Clients, Items, Categories, Suppliers: Require approval if linked to records (e.g., orders, purchases).
  - Users: Deactivate (Admin-only, requires approval if user has records).

#### Scalability and Performance
- **Volume**: Handle growing datasets (e.g., hundreds of clients, items).
- **Design**:
  - Indexed columns (e.g., Client Name, Item Name) for fast search.
  - Caching: Settings cached (refresh on update).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load tables).

#### Future Considerations
- **Authentication Setup**:
  - Refine user access control (e.g., multi-factor authentication, session management) in a later iteration.
- **Advanced Customization**:
  - Add more theme options (e.g., custom colors).
  - Integrate with external systems (e.g., accounting software for backups).

---

### Updated Work Plan
- **Action Items**:
  - Wireframe: Settings Page (updated sections: General, Profit Settings, Data Management, User Management, Notifications, Branding, Analytics, Backup).
  - Design database schema: Update `users` table (add `accessible_items` for employee access in Orders).
  - Implement automatic smart dropdown cleanup (flag duplicates, suggest merges).
  - Add dynamic employee access logic in Orders (e.g., restrict to specific items).
  - Implement company branding (name, logo) across app (e.g., Home Page, invoices).
  - Add custom report templates in Analytics.
  - Add export functionality for Backup (CSV for all data).
  - Optimize queries for data management (e.g., indexed columns).
- **Dependencies**: Orders, Finance, Analytics, Workflow (data sources, settings integration).
- **Priority**: Medium.

---

 **User Onboarding and Help** 

---

### Updated Understanding Based on Your Clarifications

#### Key Updates
- **Onboarding**:
  - **Setup Wizard**:
    - Exclusive to Managers (not Admins).
    - Not mandatory—Managers can skip it.
    - Comes with prefilled data (e.g., company name, profit settings) for confirmation.
  - **Admins**:
    - Direct access to the app, no setup wizard or onboarding tour.
    - Admin accounts pre-added in the database (along with Managers).
  - **Managers and Employees**:
    - Both get a simplified tutorial (e.g., “How to Add an Order”).
    - Managers also confirm prefilled setup data (if they don’t skip).
  - **Demo Data**:
    - Removed—no preloaded sample data.
- **Help Resources**:
  - Limited to in-app tooltips (no guides, FAQs, or videos for now).
  - Support options: Email, WhatsApp direct link, phone call.
- **Support Access**:
  - Not specified, but assumed to be available to all users (Admins, Managers, Employees) unless clarified otherwise.

#### Impact
- **Onboarding**:
  - Simplified for all roles: Admins have direct access, Managers confirm prefilled data (optional), and both Managers and Employees get a tutorial.
  - No demo data to clear, reducing complexity.
- **Help**:
  - Streamlined to tooltips and support options (email, WhatsApp, phone).
  - Feedback mechanism remains for all users to report issues or suggest features.

---

### 

#### Overview
The User Onboarding and Help section ensures a smooth onboarding experience for a printing business with 5-20 users, helping them learn the app’s features based on their roles (Admins, Managers, Employees). Onboarding is streamlined: Admins have direct access, Managers confirm prefilled setup data (optional), and both Managers and Employees receive a simplified tutorial. The Help section provides in-app tooltips and support options (email, WhatsApp, phone) to assist users. The system supports 30 orders/day (up to 70 in peaks), focusing on usability and role-based access.

#### Interface and Views
- **User Onboarding**:
  - **Purpose**: Guide users through initial setup and key features based on their role.
  - **Initial Setup**:
    - **Admin and Manager Accounts**:
      - Pre-added in the database during app deployment.
      - Example: Admin (email: admin@abcprintingapp.com, password: preset), Manager (email: manager@abcprintingapp.com, password: preset).
      - Admins can later change passwords in Settings > User Management.
  - **First Login Experience**:
    - **Admins**:
      - Direct Access: No setup wizard or tour.
      - Lands on Home Page with full access to all features.
    - **Managers**:
      - **Setup Wizard** (Optional):
        1. Welcome Screen: “Welcome to ABC Printing App! Let’s confirm your business setup.”
        2. Company Branding: Prefilled (e.g., Company Name: “ABC Printing”, Logo: default placeholder)—confirm or edit.
        3. Profit Settings: Prefilled (e.g., Calculation Basis: Unit Price, Profit %: 20%, Labor: Off)—confirm or edit.
        4. Complete/Skip: “Setup complete! Take a quick tour?” (Skip option available).
      - **Simplified Tutorial** (If not skipped):
        - Pop-up tour: “Add an Order” (Orders page), “View Analytics” (Analytics page), “Manage Tasks” (Workflow page).
        - Progress Tracker: “Complete 3/3 steps”.
    - **Employees**:
      - **Simplified Tutorial**:
        - Pop-up tour: “Add an Order” (Orders page, restricted to accessible items), “View Orders” (Orders page).
        - Progress Tracker: “Complete 2/2 steps”.
  - **Mobile**:
    - Wizard/Tutorial: One step at a time, swipe to proceed.
    - Progress tracker at the top (e.g., “Step 1/3”).

- **Help Section**:
  - **Purpose**: Provide support for users through tooltips and contact options.
  - **Access**: Available via a “Help” icon (question mark) in the top-right corner of all pages.
  - **Structure**:
    - **Tooltips**:
      - In-app tooltips for key features:
        - Orders: “Enter the client name to start an order” (Add Order modal).
        - Analytics: “Filter by date range to view specific profit metrics” (Profit Analytics).
        - Settings: “Set the default profit % for all orders” (Profit Settings).
      - Toggle: “Enable/Disable Tooltips” (per user, saved in user profile, default: Enable).
    - **Support**:
      - **Email Support**: Link (e.g., “mailto:support@abcprintingapp.com?subject=Support Request”).
      - **WhatsApp**: Direct Link (e.g., “https://wa.me/1234567890?text=Support Request”).
      - **Phone**: Call Link (e.g., “tel:+1234567890”).
    - **Feedback**:
      - Form: “Submit Feedback” (Type: Bug, Feature Request, General; Message).
      - Submission: Sends email to app provider (e.g., feedback@abcprintingapp.com).
  - **Mobile**:
    - Help section in a modal, tooltips simplified (e.g., shorter text), support links open in browser/phone app.

#### Integration with Other Sections
- **Settings**:
  - Onboarding: Managers confirm prefilled data for Branding, Profit Settings.
  - Help: Tooltips for Settings (e.g., Profit Settings, Data Management).
- **Orders**:
  - Onboarding: Managers and Employees guided to add orders (Employees restricted to accessible items).
  - Help: Tooltips for adding/viewing orders.
- **Analytics**:
  - Onboarding: Managers guided to view Analytics.
  - Help: Tooltips for using Analytics (e.g., Profit Analytics).
- **Workflow**:
  - Onboarding: Managers guided to manage tasks.
  - Help: Tooltips for task management (e.g., adding tasks).

#### Role-Based Access
- **Onboarding**:
  - Admins: Direct access, no wizard or tour.
  - Managers: Setup wizard (optional, prefilled data), simplified tutorial.
  - Employees: Simplified tutorial (Orders only).
- **Help**:
  - Admins: Full access to tooltips, support options.
  - Managers: Access to relevant tooltips (e.g., Analytics, Tasks), support options.
  - Employees: Access to basic tooltips (e.g., Orders), support options.
  - Feedback: Available to all users.

#### Scalability and Performance
- **Volume**: Handle 5-20 users with role-based onboarding.
- **Design**:
  - Tooltips: Stored as static content (e.g., JSON files) for fast loading.
  - Support/Feedback: Emails queued for sending (e.g., using a background job).
- **Mobile**: Optimized for low-bandwidth (e.g., lightweight tooltips).

#### Future Considerations
- **Help Enhancements**:
  - Add text guides, FAQs, or video tutorials.
  - Integrate in-app chat support.
- **Onboarding Enhancements**:
  - Add interactive tutorials (e.g., “Try adding an order”).
  - Support additional languages for tooltips (e.g., Swahili).

---

### Updated Work Plan
- **Action Items**:
  - Wireframe: Onboarding (setup wizard for Managers, simplified tutorials for Managers/Employees), Help Section (tooltips, support links, feedback).
  - Pre-add Admin/Manager accounts in the database (e.g., during deployment).
  - Implement setup wizard with prefilled data (Managers only, skippable).
  - Develop simplified tutorials for Managers and Employees.
  - Add in-app tooltips for key features (e.g., Orders, Analytics, Settings).
  - Add support links (email, WhatsApp, phone) and feedback form (email integration).
  - Optimize tooltip loading (e.g., static JSON files).
- **Dependencies**: Settings (branding, profit settings), Orders, Analytics, Workflow (feature integration).
- **Priority**: Medium.

---

**Authentication Setup** 

---

### Updated Understanding Based on Your Clarifications

#### Key Updates
- **Email Verification Code**:
  - Not one-time use; reusable but resets every 3 months (automatic regeneration).
  - Code regeneration can be both manual (by Admins/Managers) and automatic (every 3 months).
- **PIN Reset**:
  - User must re-verify their email using their assigned code.
  - After verification, user can reset their 4-digit PIN.
- **Failed Login Attempts**:
  - Admins and Managers are notified of multiple failed login attempts.
  - Actions: Log the user out of all devices or regenerate the email verification code.
- **Code Delivery**:
  - Manual delivery by Admins/Managers (no external APIs for email/SMS due to budget constraints).
- **Session Timeout**:
  - Sessions expire every 2 hours (requires PIN re-entry).
- **Device Visibility**:
  - Admins: Can see all users’ devices (including Managers, Employees).
  - Managers: Can see Employees’ devices but not Admins’ devices.
  - Employees: Can view their own devices in a Profile page.
- **Profile Page**:
  - New section for Employees to view their logged-in devices.

#### Impact
- **Authentication Flow**:
  - Email verification code persists until reset (every 3 months or manually).
  - PIN reset process added (re-verify email, then reset PIN).
  - Session timeout set to 2 hours.
- **Security**:
  - Failed login attempt notifications and actions (logout, code regeneration).
  - Manual code delivery (Admins/Managers provide codes directly).
- **Settings > User Management**:
  - Updated device visibility based on roles.
  - Notifications for failed login attempts.
- **Profile Page**:
  - Added for Employees to view their devices.

---

### 

#### Overview
The Authentication Setup ensures secure access to the Printing Business Order & Finance Management System, protecting sensitive data (e.g., profit metrics, client info) for a business with 5-20 users. It uses a two-step process: initial email verification with a reusable code (reset every 3 months), followed by setting a 4-digit PIN for subsequent logins. Device limits (Admins: unlimited, Managers: 4, Employees: 2), session timeouts (12 hours), and email deactivation enforce security. Admins and Managers are notified of failed login attempts, and device visibility is role-based. The system supports 30 orders/day (up to 70 in peaks), focusing on security and usability.

#### Database Schema
- **Table: `users`** (Updated):
  - Existing: `id`, `name`, `email`, `role` (Admin, Manager, Employee), `status` (Active, Inactive).
  - New Fields:
    - `pin` (string): Encrypted 4-digit PIN (hashed with bcrypt).
    - `verification_code` (string): Reusable code for email verification (e.g., “ABCD1234”).
    - `code_expiry` (datetime): When the code expires (e.g., 3 months from generation).
    - `is_verified` (boolean): Whether the email has been verified (default: false).
    - `devices` (JSON): List of active devices (e.g., `[{device_id: "device1", last_used: "2025-03-28"}]`.
    - `failed_attempts` (integer): Count of failed login attempts (default: 0).
- **Table: `sessions`**:
  - Fields: `id`, `user_id`, `device_id` (string), `token` (string), `created_at` (datetime), `expires_at` (datetime).
  - Purpose: Track active sessions (expires after 12 hours).

#### Authentication Flow
- **Initial Setup (By Admin/Manager)**:
  - In Settings > User Management:
    - Add User: Input Name, Email, Role.
    - System generates a unique verification code (e.g., 8-character alphanumeric: “ABCD1234”).
    - Sets `users.verification_code` and `users.code_expiry` (e.g., 3 months from now: 2025-06-28).
    - Admin/Manager manually delivers the code to the user (e.g., via direct communication).
- **First Login**:
  1. **Email Input**:
     - Screen: “Enter your email to sign in.”
     - User inputs email (e.g., “user@abcprintingapp.com”).
     - System checks if email exists in `users` table and `status` is Active.
     - If not found or inactive: Error (“Email not authorized or deactivated”).
  2. **Email Verification**:
     - Screen: “Enter the verification code provided by your Admin/Manager.”
     - User inputs code (e.g., “ABCD1234”).
     - System checks if code matches `users.verification_code` and `code_expiry` is not past.
     - If incorrect: Error (“Invalid code”); increment `users.failed_attempts`.
     - If expired: Error (“Code expired. Contact your Admin/Manager for a new code”).
     - If correct: Set `users.is_verified` to true, reset `failed_attempts` to 0.
  3. **PIN Setup**:
     - Screen: “Set your 4-digit PIN for future logins.”
     - User inputs PIN (e.g., “1234”), confirms PIN.
     - System encrypts PIN (bcrypt) and stores in `users.pin`.
  4. **Device Registration**:
     - System generates a unique `device_id` (e.g., based on device fingerprint).
     - Checks device limit:
       - Admins: Unlimited.
       - Managers: 4 devices.
       - Employees: 2 devices.
     - If limit exceeded: Error (“Device limit reached. Remove a device to continue.”).
     - Stores device in `users.devices` (e.g., `[{device_id: "device1", last_used: "2025-03-28"}]`.
  5. **Login**:
     - Creates a session in `sessions` table (e.g., `token`, `device_id`, `expires_at` = 2 hours from now).
     - Redirects to Home Page.
- **Subsequent Logins**:
  1. **Email and PIN Input**:
     - Screen: “Sign in with your email and PIN.”
     - User inputs email and 4-digit PIN.
     - System checks if email exists, `status` is Active, and PIN matches (after decrypting).
     - If incorrect: Error (“Invalid email or PIN”); increment `users.failed_attempts`.
     - If correct: Reset `failed_attempts` to 0.
  2. **Device Check**:
     - If new device: Requires email verification (same as First Login steps 2-4).
     - If known device: Proceeds to login.
  3. **Session Check**:
     - If session expired (`expires_at` past 2 hours): Requires PIN re-entry.
     - If session active: Skips PIN input (until expiry).
  4. **Login**:
     - Updates session in `sessions` table (new `expires_at` = 12 hours from now).
     - Redirects to Home Page.
- **Email Verification Triggers**:
  - Required for:
    - First login.
    - After logging out and signing back in.
    - Logging into a new device.
  - If `users.is_verified` is true and device is known, skips verification.
- **PIN Reset**:
  1. **Initiate Reset**:
     - Screen: “Forgot your PIN? Enter your email to reset.”
     - User inputs email.
     - System checks if email exists and `status` is Active.
     - If not found or inactive: Error (“Email not authorized or deactivated”).
  2. **Email Verification**:
     - Screen: “Enter your verification code to proceed.”
     - User inputs code.
     - System checks if code matches `users.verification_code` and `code_expiry` is not past.
     - If incorrect: Error (“Invalid code”); increment `failed_attempts`.
     - If expired: Error (“Code expired. Contact your Admin/Manager for a new code”).
     - If correct: Proceed to PIN reset.
  3. **Reset PIN**:
     - Screen: “Set a new 4-digit PIN.”
     - User inputs new PIN, confirms PIN.
     - System encrypts new PIN (bcrypt) and updates `users.pin`.
     - Logs user out of all devices (clears `sessions` table, updates `users.devices`).
     - Redirects to login screen.
- **Failed Login Attempts**:
  - Threshold: 5 failed attempts (email verification or PIN input).
  - Action:
    - Notify Admins and Managers: “User user@abcprintingapp.com has 5 failed login attempts.”
    - Options (in Settings > User Management):
      - Log Out All Devices: Clears `sessions` table, updates `users.devices`.
      - Regenerate Code: Generates new `verification_code`, sets new `code_expiry`, delivers manually.
    - User is temporarily locked (cannot attempt login until action taken).
- **Code Regeneration**:
  - **Automatic**:
    - Every 3 months: System checks `code_expiry` on login.
    - If expired: Generates new code, sets new `code_expiry` (3 months from now).
    - Admin/Manager manually delivers new code to user.
  - **Manual**:
    - In Settings > User Management: “Generate New Code” (Admins/Managers).
    - Generates new `verification_code`, sets new `code_expiry`.
    - Admin/Manager manually delivers new code to user.
  - User is not logged out; new code is for future use (e.g., new device login).
- **Deactivation**:
  - In Settings > User Management:
    - Admin deactivates a user (sets `users.status` to Inactive).
    - System logs out user from all devices:
      - Deletes all entries in `sessions` table for the user.
      - Removes all devices from `users.devices`.
    - User cannot log in (error: “Email deactivated”).

#### Integration with Settings
- **User Management**:
  - Add/Edit User:
    - Input: Name, Email, Role.
    - Generates `verification_code` and `code_expiry` (3 months from now).
    - Displays code to Admin/Manager for manual delivery.
  - Actions:
    - Generate New Code: Regenerates `verification_code`, sets new `code_expiry`.
    - Deactivate: Logs out user from all devices, bars access.
    - Failed Login Response: Options to log out user or regenerate code.
  - Device Management (Admins/Managers):
    - Table: User Name, Email, Role, Active Devices (e.g., “Device 1, Last Used: 2025-03-28”).
    - Visibility:
      - Admins: See all users’ devices (Admins, Managers, Employees).
      - Managers: See only Employees’ devices (not Admins’ devices).
    - Actions: Remove Device (logs out user from that device, removes from `users.devices`).

#### Profile Page (New)
- **Purpose**: Allow Employees to view their logged-in devices.
- **Access**: Available via a “Profile” icon in the top-right corner (all users).
- **Structure**:
  - **Employee View**:
    - Section: “Logged-In Devices”.
    - Table: Device ID, Last Used (e.g., “Device 1, 2025-03-28”).
    - Note: Employees can only view (no actions).
  - **Admin/Manager View**:
    - Redirects to Settings > User Management for device management.
  - **Mobile**:
    - Table scrollable, minimal design.

#### Security Features
- **PIN Encryption**:
  - Stored in `users.pin` using bcrypt (hashed, not plain text).
- **Session Management**:
  - Sessions expire after 2 hours (`expires_at` in `sessions` table).
  - Session expires on logout or email deactivation.
- **Device Limits**:
  - Enforced during login (Admins: unlimited, Managers: 4, Employees: 2).
- **Failed Login Attempts**:
  - Threshold: 5 attempts (email verification or PIN).
  - Notifies Admins/Managers, allows actions (logout, regenerate code).
- **Code Delivery**:
  - Manual by Admins/Managers (no external APIs for email/SMS).

#### User Experience
- **Error Messages**:
  - “Email not authorized or deactivated.”
  - “Invalid code.”
  - “Code expired. Contact your Admin/Manager for a new code.”
  - “Invalid email or PIN.”
  - “Device limit reached. Remove a device to continue.”
  - “Account locked due to multiple failed attempts. Contact your Admin/Manager.”
- **Mobile**:
  - Login screens: Simple input fields (email, code, PIN).
  - Error messages in red, dismissible.

#### Scalability and Performance
- **Volume**: Handle 5-20 users with multiple devices.
- **Design**:
  - Indexed columns: `users.email`, `sessions.device_id` for fast lookups.
  - Caching: User data cached (refresh on update).
- **Mobile**: Optimized for low-bandwidth (e.g., minimal API calls during login).

#### Future Considerations
- **Advanced Security**:
  - Add multi-factor authentication (e.g., SMS code if budget allows).
  - Implement IP-based restrictions for logins.
- **Code Delivery**:
  - Automate delivery via email/SMS (future enhancement if budget allows).

---

### Updated Work Plan
- **Action Items**:
  - Update database schema: Add `code_expiry`, `failed_attempts` to `users` table.
  - Wireframe: Updated login screens (PIN reset flow), Profile Page (device view for Employees).
  - Implement updated authentication flow (reusable code, 3-month reset, PIN reset).
  - Add failed login attempt logic (notify Admins/Managers, actions: logout, regenerate code).
  - Set session timeout to 12 hours.
  - Update device visibility in Settings > User Management (Admins see all, Managers exclude Admins).
  - Add Profile Page for Employees (view devices).
  - Optimize queries for login (e.g., indexed columns).
- **Dependencies**: Settings (user management), Notifications (failed login alerts).
- **Priority**: High.

---

**Notifications and Alerts**

---

### Updated Understanding Based on Your Clarifications

#### Key Updates
- **Notification Types**:
  - Add notifications for new orders (e.g., “New order added, Client: John Doe, 5 items”).
  - System events (e.g., verification code regenerated): Notify Admins and Managers only (not Employees).
- **Notifications Page**:
  - Dedicated page to view all notifications across different periods (e.g., filter by date range).
- **Snooze Durations**:
  - Expanded options: Hours (e.g., 1 hour, 6 hours), Next Week, Next Month.
- **Push Notifications**:
  - Enabled by default.
  - Admins can disable them (app-wide or per user) in Settings > Notifications.
  - No sensitive info in push notifications (e.g., no money-related details, profit, or sensitive data).
  - Example for new order: “New order added, Client: John Doe, 5 items.”
- **Actions**:
  - Notifications can have actions like “View Order” (redirects to Orders page) or “Go to Task” (redirects to Workflow page).
- **Security**:
  - Ensure notifications (especially push) don’t expose sensitive info (e.g., financial data, profit metrics).

#### Impact
- **Notification Types**:
  - New order notifications added for relevant users (Admins, Managers, Employees).
  - System event notifications restricted to Admins and Managers.
- **Notifications Page**:
  - New page for viewing all notifications with filtering options.
- **Settings > Notifications**:
  - Updated to allow Admins to disable push notifications (app-wide or per user).
- **Push Notifications**:
  - Limited to non-sensitive info (e.g., client name, number of items, no financial data).
- **Snooze Options**:
  - Expanded to include hourly options, Next Week, and Next Month.

---

### 

#### Overview
The Notifications and Alerts system keeps users (Admins, Managers, Employees) informed about critical events and actionable updates in the Printing Business Order & Finance Management System. It supports security (e.g., failed login alerts), workflow efficiency (e.g., overdue task reminders), user management (e.g., user limit exceeded), and order tracking (e.g., new order notifications). Notifications are delivered in-app (via a dedicated Notifications page and bell icon) and via push (configurable by Admins), with role-based access ensuring users only see relevant alerts. Sensitive information (e.g., financial data) is excluded from push notifications. The system supports 30 orders/day (up to 70 in peaks), focusing on usability and security.

#### Database Schema
- **Table: `notifications`**:
  - Fields:
    - `id` (integer): Unique ID.
    - `user_id` (integer): Recipient user ID.
    - `type` (string): Notification type (e.g., “failed_login”, “overdue_task”, “new_order”).
    - `message` (string): Notification message (e.g., “New order added, Client: John Doe, 5 items”).
    - `push_message` (string): Push notification message (e.g., same as `message` but ensures no sensitive info).
    - `data` (JSON): Additional data (e.g., `{"order_id": 1}` for new order).
    - `status` (string): Status (e.g., “unread”, “read”, “snoozed”).
    - `snooze_until` (datetime): When the notification is snoozed until (if applicable).
    - `created_at` (datetime): When the notification was created.
  - Purpose: Store notifications for in-app display and history.

#### Notification Types
- **Security**:
  - **Failed Login Attempts**:
    - Trigger: 5 failed attempts (email verification or PIN).
    - Recipients: Admins and Managers.
    - Message: “5 failed login attempts for user@abcprintingapp.com.”
    - Push Message: “Security alert: Multiple failed login attempts.”
    - Data: `{"user_id": 1, "action": "logout"}` or `{"user_id": 1, "action": "regenerate_code"}`.
  - **User Limit Exceeded**:
    - Trigger: Manager adds a user beyond the limit (e.g., 21st user when limit is 20).
    - Recipients: Managers.
    - Message: “User limit of 20 reached. Contact your Admin to increase the limit.”
    - Push Message: “User limit reached.”
    - Data: `{"limit": 20}`.
- **Workflow**:
  - **Overdue Task Reminder**:
    - Trigger: Task is past due date (based on Settings > Notifications frequency: Daily, Every 2 Days, Weekly).
    - Recipients: Assigned user (Admins, Managers, Employees).
    - Message: “Task ‘Print Flyers’ is overdue. Due: 2025-03-27.”
    - Push Message: “Task ‘Print Flyers’ is overdue.”
    - Data: `{"task_id": 1}`.
    - Action: “Go to Task” (redirects to Workflow page with task ID).
  - **Task Assigned**:
    - Trigger: Task assigned to a user.
    - Recipients: Assigned user.
    - Message: “You’ve been assigned a task: ‘Print Flyers’. Due: 2025-03-30.”
    - Push Message: “New task assigned: ‘Print Flyers’.”
    - Data: `{"task_id": 1}`.
    - Action: “Go to Task” (redirects to Workflow page with task ID).
- **Orders**:
  - **New Order**:
    - Trigger: New order placed.
    - Recipients: Admins, Managers, Employees (if they have access to the order’s items).
    - Message: “New order added, Client: John Doe, 5 items.”
    - Push Message: “New order added, Client: John Doe, 5 items.”
    - Data: `{"order_id": 1}`.
    - Action: “View Order” (redirects to Orders page with order ID).
- **System**:
  - **Verification Code Regenerated**:
    - Trigger: Code regenerated (manual or automatic every 3 months).
    - Recipients: Admins and Managers (not Employees).
    - Message: “Verification code updated for user@abcprintingapp.com. Deliver the new code manually.”
    - Push Message: “Verification code updated for a user.”
    - Data: `{"user_id": 1}`.

#### Delivery Methods
- **In-App Notifications**:
  - **Bell Icon**:
    - Display: Notification bell icon in the top-right corner of all pages.
    - List: Shows unread notifications (e.g., “New order added, Client: John Doe, 5 items”).
    - Actions:
      - Mark as Read: Updates `notifications.status` to “read”.
      - Snooze (for task-related notifications): Updates `status` to “snoozed”, sets `snooze_until`.
      - Action Links (e.g., “View Order”, “Go to Task”).
  - **Notifications Page** (New):
    - Access: Via sidebar menu (“Notifications”).
    - Structure:
      - Table: Date, Type, Message, Status, Actions.
      - Filters: Date Range (Today, This Week, This Month, Custom), Status (Unread, Read, Snoozed).
      - Example: “2025-03-28, New Order, New order added, Client: John Doe, 5 items, Unread, View Order”.
    - Actions: Mark as Read, Snooze, Action Links.
    - Mobile: Table scrollable, filters in a modal.
- **Push Notifications**:
  - Trigger: Enabled by default (Settings > Notifications).
  - Delivery: Sends push notification to user’s device (e.g., “New order added, Client: John Doe, 5 items”).
  - Security: No sensitive info (e.g., no financial data, profit, or sensitive details).
  - Action: Tapping opens app to relevant page (e.g., Orders page for new order).
  - Fallback: If disabled (by Admin), relies on in-app notifications only.

#### Notification Flow
- **Generation**:
  - Event triggers notification (e.g., new order, failed login, overdue task).
  - System creates a record in `notifications` table with `status` as “unread”.
  - Sets `message` and `push_message` (ensures no sensitive info in `push_message`).
- **Delivery**:
  - In-App: Added to user’s notification list (bell icon, Notifications page).
  - Push: Sent if enabled in Settings (e.g., via device’s push notification service).
- **User Interaction**:
  - **Bell Icon**:
    - View: User clicks bell icon, sees list of unread notifications.
    - Actions: Mark as Read, Snooze, Action Links.
  - **Notifications Page**:
    - View: User navigates to Notifications page, filters by date/status.
    - Actions: Mark as Read, Snooze, Action Links.
  - **Snooze Expiry**:
    - If `snooze_until` is past, notification reappears as “unread”.

#### Snooze Options
- For task-related notifications (e.g., overdue task, task assigned):
  - Options: 1 Hour, 6 Hours, 12 Hours, 1 Day, 3 Days, Next Week, Next Month.
  - Sets `snooze_until` based on selected duration (e.g., Next Week = 7 days from now).

#### Integration with Other Sections
- **Authentication Setup**:
  - Failed Login Attempts: Notifies Admins/Managers after 5 attempts.
  - Verification Code Regenerated: Notifies Admins/Managers (not Employees).
- **Settings**:
  - **Notifications** (Updated):
    - Push Notifications: Toggle (Enable/Disable—default: Enable, Admins only).
    - Per-User Push: Table (User Name, Email, Push Enabled—Admins can toggle per user).
    - Overdue Task Reminders: Dropdown (Daily, Every 2 Days, Weekly—default: Daily, Admins/Managers).
    - Snooze Options: Toggle (Allow Snooze—default: Yes, Admins/Managers).
  - User Management: User limit exceeded notification for Managers.
- **Orders**:
  - New Order: Notifies relevant users (Admins, Managers, Employees with access to items).
- **Workflow**:
  - Overdue Task Reminders: Based on task due dates and Settings frequency.
  - Task Assigned: Notifies user when assigned a task.
- **Notifications Page**:
  - Central hub for viewing all notifications.

#### Role-Based Access
- **Admins**:
  - Receive: All notifications (failed logins, user limit exceeded, new orders, tasks, system events).
  - Configure: Notification settings (Settings > Notifications, including push toggle).
- **Managers**:
  - Receive: Most notifications (failed logins, user limit exceeded, new orders, tasks, system events).
  - Configure: Notification settings (except push toggle, which is Admin-only).
- **Employees**:
  - Receive: Task-related notifications (overdue tasks, task assigned), new orders (if they have access to items).
  - Configure: No access to notification settings.

#### Security Features
- **Push Notifications**:
  - No sensitive info (e.g., no financial data, profit, or sensitive details).
  - Example: “New order added, Client: John Doe, 5 items” (no total amount, profit, etc.).
- **In-App Notifications**:
  - Sensitive info (e.g., failed login details) restricted to Admins/Managers.

#### User Experience
- **Notification Bell**:
  - Icon: Bell with badge (e.g., “3” for 3 unread notifications).
  - List: Sorted by `created_at` (newest first), shows unread notifications.
  - Mobile: List in a modal, scrollable.
- **Notifications Page**:
  - Table: Date, Type, Message, Status, Actions.
  - Filters: Date Range, Status.
  - Mobile: Table scrollable, filters in a modal.
- **Push Notifications**:
  - Format: Short message (e.g., “New order added, Client: John Doe, 5 items”).
  - Action: Tapping opens app to relevant page (e.g., Orders page for new order).
- **Snooze Options**:
  - For task notifications: 1 Hour, 6 Hours, 12 Hours, 1 Day, 3 Days, Next Week, Next Month.

#### Scalability and Performance
- **Volume**: Handle notifications for 5-20 users with frequent events (e.g., orders, tasks).
- **Design**:
  - Indexed columns: `notifications.user_id`, `notifications.status`, `notifications.created_at` for fast retrieval.
  - Cleanup: Delete notifications older than 90 days (background job).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load notification list).

#### Future Considerations
- **Additional Notifications**:
  - Add inventory alerts (e.g., “Low paper stock”).
  - Add order completion notifications (e.g., “Order #123 completed”).
- **Delivery Enhancements**:
  - Add email/SMS delivery if budget allows (future enhancement).
- **Advanced Filtering**:
  - Add more filters to Notifications page (e.g., by type, user).

---

### Updated Work Plan
- **Action Items**:
  - Update database schema: Add `push_message` to `notifications` table.
  - Wireframe: Notifications Page (table, filters), updated notification bell (actions).
  - Implement new order notifications (limited details, action: View Order).
  - Restrict system event notifications to Admins/Managers.
  - Add Notifications Page (table, filters, actions).
  - Update snooze options (1 Hour, 6 Hours, 12 Hours, 1 Day, 3 Days, Next Week, Next Month).
  - Update Settings > Notifications (push toggle for Admins, per-user push control).
  - Ensure push notifications exclude sensitive info.
  - Optimize notification retrieval (e.g., indexed columns).
- **Dependencies**: Authentication (failed login alerts), Settings (notification preferences), Orders (new order notifications), Workflow (task reminders).
- **Priority**: Medium.

---

**Detailed App Pages Breakdown and UI Components** 

---

### Updated Understanding Based on Your Clarifications

#### Key Updates
- **Finance Page**:
  - Split into two independent pages: **Expenses** and **Material Purchases**.
  - Remove Revenue section (no longer required).
- **Workflow Page**:
  - Renamed to **Personal To-Do Page**, inspired by Todoist (focus on personal task management).
  - Tasks are now integrated into **Orders**, **Expenses**, and **Material Purchases** pages via a tabbed view (switch between data table and task cards).
- **Tasks Integration**:
  - Each page (Orders, Expenses, Material Purchases) has tabs: Data Table (e.g., orders list) and Task Cards (e.g., tasks related to orders).
- **Loading States**:
  - Spinners for general loading (e.g., page load).
  - Skeletons for data loads (e.g., tables, cards).
- **Error Handling**:
  - Toasts for general errors (e.g., “Failed to save order”).
  - Inline errors for form validation (e.g., “Client name is required”).
- **Branding**:
  - Company name and logo (set in Settings > Branding) displayed in the sidebar.
- **Inventory Management**:
  - Confirmed: No Inventory Management page.
- **Quick Metric Cards**:
  - Add simple metric cards on each page (e.g., Orders: “Total Orders Today: 5”), linking to the Analytics page (Admins/Managers only).

#### Impact
- **Navigation**:
  - Finance page removed; replaced with Expenses and Material Purchases in the sidebar.
  - Workflow page renamed to Personal To-Do Page.
- **Tasks**:
  - Removed as a standalone page (Workflow); tasks are now embedded in Orders, Expenses, and Material Purchases via tabs.
  - Personal To-Do Page focuses on personal task management (Todoist-inspired).
- **UI**:
  - Added tabs for data and tasks in Orders, Expenses, Material Purchases.
  - Spinners and skeletons for loading states.
  - Toasts and inline errors for error handling.
  - Company name and logo in the sidebar.
  - Quick metric cards on each page (linking to Analytics).

---

### 

#### Overview
The Printing Business Order & Finance Management System consists of several pages, each designed to support specific functionalities for a business with 5-20 users. The UI is consistent, responsive (desktop and mobile), and user-friendly, with role-based access ensuring users only see relevant content. The app supports 30 orders/day (up to 70 in peaks), focusing on usability, security, and scalability.

#### Navigation Structure
- **Sidebar** (Left):
  - **Branding**: Company name (text), logo (image) at the top.
  - **Menu**:
    - Home
    - Orders
    - Expenses
    - Material Purchases
    - Personal To-Do
    - Dashboard/Analytics (Admins/Managers only)
    - Settings (Admins/Managers only)
    - Notifications
  - Mobile: Collapsible sidebar (hamburger menu), branding at the top.
- **Top Bar** (Right):
  - Notification Bell: Shows unread count (e.g., “3”).
  - Profile Icon: Links to Profile page.
  - Help Icon: Links to Help section (tooltips, support).
  - Logout Icon: Logs user out (requires email verification on next login).
  - Mobile: Icons in a top bar, scrollable.

#### App Pages and UI Components

1. **Login Pages**
   - **Purpose**: Handle user authentication (email verification, PIN setup, login, PIN reset).
   - **Pages**:
     - Email Input
     - Code Verification
     - PIN Setup
     - PIN Login
     - PIN Reset
   - **UI Components**:
     - **Input Fields**: Email, Code, PIN (4-digit, numeric), Confirm PIN.
     - **Buttons**: Submit, Reset PIN.
     - **Error Messages**: Inline (e.g., “Invalid email or PIN” in red below input).
     - **Toast Messages**: General errors (e.g., “Failed to verify code” as a toast).
     - **Spinner**: During verification/login (e.g., centered spinner).
     - **Labels**: “Enter your email”, “Enter your verification code”, “Set your 4-digit PIN”.
     - **Mobile**: Full-screen forms, keyboard-friendly (numeric keypad for PIN).

2. **Home Page**
   - **Purpose**: Provide an overview for all users (Admins, Managers, Employees).
   - **Sections**:
     - Quick Metrics (Admins/Managers): Today’s Orders, Today’s Expenses, Today’s Material Purchases (click to Analytics).
     - Quick Metrics (Employees): Your Pending Tasks.
     - Recent Orders: List of 5 recent orders (click to view).
     - Recent Tasks: List of 5 recent personal tasks (click to view in Personal To-Do).
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Today’s Orders: 5”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load (e.g., gray placeholders).
     - **Tables**: Recent Orders (Order Number, Client, Date, Status), Recent Tasks (Task Name, Due Date, Status).
     - **Skeleton Loaders**: For tables (e.g., gray rows).
     - **Spinner**: During initial page load (centered).
     - **Buttons**: View Order, View Task.
     - **Toast Messages**: Errors (e.g., “Failed to load recent orders”).
     - **Mobile**: Cards stack vertically, tables scrollable.

3. **Orders Page**
   - **Purpose**: Manage orders and related tasks.
   - **Sections**:
     - Quick Metrics (Admins/Managers): Total Orders Today (click to Analytics).
     - Tabs: Orders (data table), Tasks (task cards).
     - Orders Tab: Table of all orders.
     - Tasks Tab: Cards for tasks related to orders (e.g., “Print Flyers for Order #123”).
     - Add Order/Task: Buttons to open modals.
     - View/Edit Order/Task: Modals for details and editing.
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Total Orders Today: 5”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load.
     - **Tabs**: Orders, Tasks (toggle between table and cards).
     - **Table (Orders Tab)**: Order Number, Client, Date, Total Items, Status, Actions (View, Edit—Admins/Managers only).
     - **Cards (Tasks Tab)**: Task Name, Due Date, Status, Actions (View, Edit, Delete—Admins/Managers).
     - **Skeleton Loaders**: For table/cards (e.g., gray rows/cards).
     - **Spinner**: During tab switch or page load.
     - **Buttons**: Add Order, Add Task, View, Edit.
     - **Modal (Add/Edit Order)**:
       - Inputs: Client (smart dropdown), Items (smart dropdown, multi-select), Quantity (number), Unit Price (number).
       - Buttons: Save, Cancel.
       - Inline Errors: “Client name is required” (below input).
     - **Modal (Add/Edit Task)**:
       - Inputs: Task Name, Assigned To (smart dropdown), Due Date, Recurring (toggle), Frequency (dropdown: Daily, Weekly, Monthly—if recurring).
       - Buttons: Save, Cancel.
       - Inline Errors: “Due date is required”.
     - **Modal (View Order/Task)**: Details (e.g., Client, Items, Task Name, Due Date).
     - **Filters**: Date Range, Client (smart dropdown), Status (dropdown).
     - **Toast Messages**: Errors (e.g., “Failed to save order”).
     - **Mobile**: Tabs as a horizontal scroll, table/cards scrollable, modals full-screen, filters in a modal.

4. **Expenses Page**
   - **Purpose**: Manage expenses and related tasks.
   - **Sections**:
     - Quick Metrics (Admins/Managers): Total Expenses Today (click to Analytics).
     - Tabs: Expenses (data table), Tasks (task cards).
     - Expenses Tab: Table of all expenses.
     - Tasks Tab: Cards for tasks related to expenses (e.g., “Review Expense #123”).
     - Add Expense/Task: Buttons to open modals.
     - View/Edit Expense/Task: Modals for details and editing.
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Total Expenses Today: 500 USH”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load.
     - **Tabs**: Expenses, Tasks (toggle between table and cards).
     - **Table (Expenses Tab)**: Date, Description, Amount, Actions (Edit, Delete—Admins/Managers).
     - **Cards (Tasks Tab)**: Task Name, Due Date, Status, Actions (View, Edit, Delete—Admins/Managers).
     - **Skeleton Loaders**: For table/cards.
     - **Spinner**: During tab switch or page load.
     - **Buttons**: Add Expense, Add Task, Edit, Delete.
     - **Modal (Add/Edit Expense)**:
       - Inputs: Date, Description, Amount.
       - Buttons: Save, Cancel.
       - Inline Errors: “Amount is required”.
     - **Modal (Add/Edit Task)**: Same as Orders page.
     - **Modal (View Expense/Task)**: Details (e.g., Description, Amount, Task Name).
     - **Filters**: Date Range.
     - **Toast Messages**: Errors (e.g., “Failed to save expense”).
     - **Mobile**: Tabs as a horizontal scroll, table/cards scrollable, modals full-screen, filters in a modal.

5. **Material Purchases Page**
   - **Purpose**: Manage material purchases and related tasks.
   - **Sections**:
     - Quick Metrics (Admins/Managers): Total Purchases Today (click to Analytics).
     - Tabs: Material Purchases (data table), Tasks (task cards).
     - Material Purchases Tab: Table of all purchases.
     - Tasks Tab: Cards for tasks related to purchases (e.g., “Order Paper for Purchase #123”).
     - Add Purchase/Task: Buttons to open modals.
     - View/Edit Purchase/Task: Modals for details and editing.
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Total Purchases Today: 1000 USH”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load.
     - **Tabs**: Material Purchases, Tasks (toggle between table and cards).
     - **Table (Material Purchases Tab)**: Date, Supplier (smart dropdown), Material, Quantity, Cost, Actions (Edit, Delete—Admins/Managers).
     - **Cards (Tasks Tab)**: Task Name, Due Date, Status, Actions (View, Edit, Delete—Admins/Managers).
     - **Skeleton Loaders**: For table/cards.
     - **Spinner**: During tab switch or page load.
     - **Buttons**: Add Purchase, Add Task, Edit, Delete.
     - **Modal (Add/Edit Purchase)**:
       - Inputs: Date, Supplier (smart dropdown), Material, Quantity, Cost.
       - Buttons: Save, Cancel.
       - Inline Errors: “Supplier is required”.
     - **Modal (Add/Edit Task)**: Same as Orders page.
     - **Modal (View Purchase/Task)**: Details (e.g., Supplier, Material, Task Name).
     - **Filters**: Date Range, Supplier (smart dropdown).
     - **Toast Messages**: Errors (e.g., “Failed to save purchase”).
     - **Mobile**: Tabs as a horizontal scroll, table/cards scrollable, modals full-screen, filters in a modal.

6. **Personal To-Do Page**
   - **Purpose**: Manage personal tasks (inspired by Todoist).
   - **Sections**:
     - Quick Metrics (Admins/Managers): Total Tasks Today (click to Analytics).
     - Tasks List: Cards for personal tasks (not tied to Orders/Expenses/Purchases).
     - Add Task: Button to open modal.
     - View/Edit Task: Modal for details and editing.
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Total Tasks Today: 3”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load.
     - **Task Cards**: Task Name, Due Date, Status, Actions (Mark Complete, Edit, Delete—Admins/Managers).
     - **Skeleton Loaders**: For task cards.
     - **Spinner**: During page load.
     - **Buttons**: Add Task, Mark Complete, Edit, Delete.
     - **Modal (Add/Edit Task)**:
       - Inputs: Task Name, Due Date, Recurring (toggle), Frequency (dropdown: Daily, Weekly, Monthly—if recurring).
       - Buttons: Save, Cancel.
       - Inline Errors: “Task name is required”.
     - **Modal (View Task)**: Details (e.g., Task Name, Due Date).
     - **Filters**: Date Range, Status (dropdown).
     - **Toast Messages**: Errors (e.g., “Failed to save task”).
     - **Mobile**: Cards stack vertically, modals full-screen, filters in a modal.

7. **Dashboard/Analytics Page** (Admins/Managers Only)
   - **Purpose**: Display profit metrics, trends, custom reports.
   - **Sections**:
     - Profit Metrics: Total Profit, Profit Margin, Average Profit per Order.
     - Profit Trend: Line chart (Daily, Weekly, Monthly toggle).
     - Profit by Category: Bar chart.
     - Profit by Client: Table.
     - Detailed Breakdown: Per order, per item tables.
     - Custom Reports: Build and view custom reports.
   - **UI Components**:
     - **Cards**: Metrics (e.g., “Total Profit: 1200 USH”).
     - **Skeleton Loaders**: For cards during data load.
     - **Charts**:
       - Line Chart: Profit Trend (X: Time, Y: Profit, toggle: Daily/Weekly/Monthly).
       - Bar Chart: Profit by Category (X: Categories, Y: Profit).
     - **Skeleton Loaders**: For charts (e.g., gray placeholders).
     - **Tables**:
       - Profit by Client: Client Name, Total Revenue, Total Profit, Profit Margin, Labor Cost.
       - Detailed Breakdown: Per Order (Order Number, Date, Total Profit), Per Item (Item Name, Profit Amount).
     - **Skeleton Loaders**: For tables.
     - **Spinner**: During page load.
     - **Buttons**: Build Report, Export (CSV, PDF).
     - **Filters**: Date Range, Client (smart dropdown), Category (smart dropdown).
     - **Modal (Build Report)**:
       - Inputs: Metrics (checkboxes: Total Profit, Revenue), Group By (dropdown: Category, Client), Date Range.
       - Buttons: Generate, Save Template, Cancel.
       - Inline Errors: “Select at least one metric”.
     - **Toast Messages**: Errors (e.g., “Failed to load profit data”).
     - **Mobile**: Charts resize, tables scrollable, filters in a modal.

8. **Settings Page** (Admins/Managers Only)
   - **Purpose**: Configure app settings (general, profit, data management, user management, notifications, branding, analytics).
   - **Sections**:
     - General: Currency, Language, Theme, User Limit (Admin-only).
     - Profit Settings: Calculation Basis, Profit %, Labor %.
     - Data Management: Clients, Items, Categories, Suppliers (edit, mark inactive, merge).
     - User Management: Users, Employee Access (Orders).
     - Notifications: Push toggle (Admin-only), per-user push, task reminder frequency, snooze options.
     - Branding: Company Name, Logo.
     - Analytics: Custom Report Templates.
     - Backup: Export all data.
   - **UI Components**:
     - **Sidebar (Sub-Menu)**: General, Profit Settings, Data Management, User Management, Notifications, Branding, Analytics, Backup.
     - **Inputs**:
       - Dropdowns: Currency, Language, Theme, Calculation Basis, Task Reminder Frequency.
       - Text: Company Name, User Limit.
       - Toggle: Push Notifications, Include Labor, Snooze Options.
       - File Upload: Logo.
     - **Tables**:
       - Data Management: Client Name, Address, Actions (Edit, Mark Inactive, Delete).
       - User Management: User Name, Email, Role, Active Devices, Actions (Edit, Deactivate).
       - Custom Report Templates: Template Name, Metrics, Actions (Edit, Delete).
     - **Skeleton Loaders**: For tables.
     - **Spinner**: During section load.
     - **Buttons**: Save, Add, Edit, Delete, Export (CSV), Generate New Code (User Management).
     - **Toast Messages**: Errors (e.g., “Failed to save settings”).
     - **Inline Errors**: In forms (e.g., “Profit % must be a number”).
     - **Mobile**: Sub-menu collapsible, tables scrollable, inputs in modals.

9. **Notifications Page**
   - **Purpose**: View all notifications across different periods.
   - **Sections**:
     - Quick Metrics (Admins/Managers): Total Notifications Today (click to Analytics).
     - Notifications List: Table of all notifications.
   - **UI Components**:
     - **Cards**: Quick Metrics (e.g., “Total Notifications Today: 3”, clickable to Analytics).
     - **Skeleton Loaders**: For cards during data load.
     - **Table**: Date, Type, Message, Status, Actions (Mark as Read, Snooze, View Order/Go to Task).
     - **Skeleton Loaders**: For table.
     - **Spinner**: During page load.
     - **Filters**: Date Range (Today, This Week, This Month, Custom), Status (Unread, Read, Snoozed).
     - **Snooze Options**: 1 Hour, 6 Hours, 12 Hours, 1 Day, 3 Days, Next Week, Next Month.
     - **Buttons**: Mark as Read, Snooze.
     - **Toast Messages**: Errors (e.g., “Failed to load notifications”).
     - **Mobile**: Table scrollable, filters in a modal.

10. **Profile Page**
    - **Purpose**: View logged-in devices (Employees), redirect to Settings for Admins/Managers.
    - **Sections**:
      - Employee View: Logged-In Devices.
      - Admin/Manager View: Redirect to Settings > User Management.
    - **UI Components**:
      - **Table (Employees)**: Device ID, Last Used (e.g., “Device 1, 2025-03-28”).
      - **Skeleton Loaders**: For table.
      - **Spinner**: During page load.
      - **Redirect Link (Admins/Managers)**: “Manage users and devices in Settings.”
      - **Toast Messages**: Errors (e.g., “Failed to load devices”).
      - **Mobile**: Table scrollable.

#### UI Consistency
- **Theme**: Light/dark mode (set in Settings > General).
- **Colors**: Green/orange scheme (green for positive actions like Save, orange for warnings like Delete).
- **Typography**: Sans-serif font (e.g., Roboto), readable sizes (16px for body, 20px for headings).
- **Buttons**: Primary (green, e.g., Save), Secondary (gray, e.g., Cancel), Destructive (orange, e.g., Delete).
- **Modals**: Centered, with header, body, footer (e.g., Save/Cancel buttons).
- **Tables**: Paginated (10 rows per page), sortable (e.g., by date), with action columns.
- **Smart Dropdowns**: Searchable, recent/frequent suggestions, add new option.
- **Loading States**:
  - Spinners: Centered during page load or tab switch.
  - Skeletons: Gray placeholders for cards, tables, charts during data load.
- **Error Handling**:
  - Toasts: General errors (e.g., “Failed to save order”, top-right, dismissible).
  - Inline Errors: Form validation (e.g., “Client name is required”, below input in red).

#### Security Considerations
- **Sensitive Info**:
  - Profit data: Restricted to Analytics page (Admins/Managers only).
  - Push Notifications: No financial data (e.g., “New order added, Client: John Doe, 5 items”).
- **Role-Based Access**:
  - Pages like Analytics, Settings hidden for Employees.
  - Actions like Edit, Delete restricted to Admins/Managers.
  - Quick Metrics: Hidden for Employees (except on Personal To-Do).

#### Scalability and Performance
- **Volume**: Handle 5-20 users with frequent interactions.
- **Design**:
  - Lazy-load tables, cards, and charts (e.g., Analytics page).
  - Cache static UI components (e.g., sidebar, top bar).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load tables, compress images like logo).

---

### Updated Work Plan
- **Action Items**:
  - Update wireframes: Split Finance into Expenses and Material Purchases, rename Workflow to Personal To-Do, add tabs (Orders, Expenses, Material Purchases), add quick metric cards.
  - Define UI component library: Spinners, Skeletons, Toasts, Inline Errors, Tabs, Cards.
  - Implement loading states (spinners, skeletons).
  - Implement error handling (toasts, inline errors).
  - Update sidebar with company name and logo.
  - Ensure role-based access in UI (e.g., hide Analytics for Employees).
  - Implement responsive design (desktop and mobile).
  - Optimize UI performance (e.g., lazy-load tables, cards).
- **Dependencies**: All previous sections (Orders, Finance, Workflow, Analytics, Settings, Notifications, Authentication).
- **Priority**: High.

---

 detailed breakdown of the **Home Page** 

---

### Updated Understanding Based on Your Clarifications

#### Key Updates
- **Expenses and Material Purchases Actions**:
  - Limit actions to “View” only (no “Mark as Paid” or other actions).
- **Pending Invoices**:
  - No additional actions (e.g., no “Send Reminder”); only “View” action.
- **Dynamic Elements**:
  - Default rows: 10 for desktop (>1200px), 3 for smaller screens (e.g., mobile or <1200px).
  - “Show More”: Loads more rows dynamically (e.g., +5 rows each time).
- **Layout**:
  - Stacked vertically (already implemented).
  - Summaries and Pending Invoices sections adjust rows based on screen size and “Show More”.

#### Impact
- **Expenses and Material Purchases**:
  - Simplified actions: Only “View” button in the summaries.
- **Pending Invoices**:
  - Actions limited to “View” (same as other summaries).
- **Dynamic Elements**:
  - Default: 10 rows (desktop), 3 rows (smaller screens).
  - “Show More”: Adds +5 rows each time (e.g., 10 → 15 → 20).
- **Summaries**:
  - Updated row counts and “Show More” behavior.

#### Assumptions
- **Show More**:
  - Loads +5 rows each time (e.g., 10 → 15 → 20 on desktop).
  - On smaller screens: 3 → 8 → 13, etc.
  - If there are fewer rows available (e.g., only 12 total orders), “Show More” button disappears.
- **Desktop vs. Smaller Screens**:
  - Desktop: >1200px (10 rows default).
  - Smaller screens: <1200px (3 rows default, e.g., mobile, tablets).

---

### Follow-Up Questions
To refine this breakdown, here are some questions:
1. **Show More**:
   - Is +5 rows per “Show More” click appropriate, or should it be a different number (e.g., +3 or +10)?
   - Should there be a maximum limit (e.g., stop at 20 rows, then rely on “View All”)?
2. **Pending Invoices**:
   - Should Pending Invoices be sorted by a specific field (e.g., due date, amount)?
3. **Summaries**:
   - Should summaries be sorted by a specific field (e.g., Orders by date, Tasks by due date)?

---

### 

#### Overview
The Home Page provides a concise, actionable overview for all users (Admins, Managers, Employees) in the Printing Business Order & Finance Management System. It includes quick metrics, a separate Pending Invoices section, and small summaries from each page (Orders, Expenses, Material Purchases, Personal To-Do) based on user access. The layout is stacked vertically, with dynamic elements (e.g., 10 rows default on desktop, 3 on smaller screens, “Show More” loads +5 rows). Actionable elements include “View” for all sections, “Mark Complete” for tasks, and “Add” buttons. The page supports 30 orders/day (up to 70 in peaks) for a business with 5-20 users, focusing on usability and role-based access.

#### General Layout (Applies to All Users)
- **Header**: None (company name and logo are in the sidebar).
- **Navigation**:
  - Sidebar (Left): Company name, logo, menu (Home, Orders, Expenses, Material Purchases, Personal To-Do, Analytics, Settings, Notifications).
  - Top Bar (Right): Notification Bell, Profile Icon, Help Icon, Logout Icon.
- **Main Content** (Stacked Vertically):
  - **Quick Metrics**: 1-4 cards (role-specific).
  - **Pending Invoices**: Table (10 rows default on desktop, 3 on smaller screens).
  - **Summaries**:
    - Orders Summary.
    - Expenses Summary (Admins/Managers only).
    - Material Purchases Summary (Admins only).
    - Personal To-Do Summary.
  - Each section includes a table with dynamic rows, “Show More” toggle, and “View All” button.
- **Dynamic Elements**:
  - Default: 10 rows (desktop, >1200px), 3 rows (smaller screens, <1200px).
  - “Show More”: Loads +5 rows each time (e.g., 10 → 15 → 20 on desktop; 3 → 8 → 13 on smaller screens).
  - “Show More” disappears if no more rows are available.
- **Loading States**:
  - Spinner: Centered during initial page load.
  - Skeletons: Gray placeholders for Quick Metric cards (e.g., 1-4 gray rectangles), tables (e.g., 3-10 gray rows per section).
- **Error Handling**:
  - Toasts: General errors (e.g., “Failed to load pending invoices”, top-right, dismissible, green for success, red for errors).
- **Mobile**:
  - Quick Metrics: Stacked vertically.
  - Tables: Scrollable horizontally.
  - Sidebar: Collapsible (hamburger menu).

#### Home Page for Admins
- **Purpose**: Provide a comprehensive overview of business operations with actionable insights.
- **Sections** (Stacked Vertically):
  - **Quick Metrics** (4 Cards):
    - Today’s Orders: “5 Orders” (clickable to Analytics).
    - Today’s Expenses: “500 USH” (clickable to Analytics).
    - Today’s Material Purchases: “1000 USH” (clickable to Analytics).
    - Pending Tasks: “3 Tasks” (clickable to Analytics).
  - **Pending Invoices**:
    - Header: “Pending Invoices” with “View All” button (top-right, redirects to Orders page with “Pending Payment” filter).
    - Table (Dynamic Rows):
      - Columns: Order Number, Client, Date, Amount, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More” (e.g., 10 → 15 → 20).
      - Example: “#123, John Doe, 2025-03-28, 2000 USH, View”.
      - Action: “View” button (redirects to Orders page with order ID).
    - Highlight: Entire row in orange to emphasize importance.
    - Show More: Button (e.g., “Show More”, green, loads +5 rows).
  - **Orders Summary**:
    - Header: “Orders Overview” with “Add Order” and “View All” buttons (top-right, “View All” redirects to Orders page).
    - Table (Dynamic Rows):
      - Columns: Order Number, Client, Date, Status, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “#124, Jane Doe, 2025-03-28, Completed, View”.
      - Action: “View” button (redirects to Orders page with order ID).
    - Show More: Button.
  - **Expenses Summary**:
    - Header: “Expenses Overview” with “Add Expense” and “View All” buttons (top-right, “View All” redirects to Expenses page).
    - Table (Dynamic Rows):
      - Columns: Date, Description, Amount, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “2025-03-28, Rent, 500 USH, View”.
      - Action: “View” button (redirects to Expenses page with expense ID).
    - Show More: Button.
  - **Material Purchases Summary**:
    - Header: “Material Purchases Overview” with “Add Purchase” and “View All” buttons (top-right, “View All” redirects to Material Purchases page).
    - Table (Dynamic Rows):
      - Columns: Date, Supplier, Material, Cost, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “2025-03-28, Supplier A, Paper, 1000 USH, View”.
      - Action: “View” button (redirects to Material Purchases page with purchase ID).
    - Show More: Button.
  - **Personal To-Do Summary**:
    - Header: “Personal To-Do Overview” with “Add Task” and “View All” buttons (top-right, “View All” redirects to Personal To-Do page).
    - Table (Dynamic Rows):
      - Columns: Task Name, Due Date, Status, Actions.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “Review Order #123, 2025-03-30, Pending, View/Mark Complete”.
      - Actions: “View” (redirects to Personal To-Do page), “Mark Complete” (updates task status to Completed).
    - Show More: Button.
- **UI Components**:
  - **Cards (Quick Metrics)**:
    - Layout: 4 cards in a row (desktop), stacked vertically (mobile).
    - Content: Metric name (e.g., “Today’s Orders”), value (e.g., “5 Orders”), clickable to Analytics.
    - Skeleton: Gray rectangle (e.g., 200px wide, 100px tall).
  - **Tables (Pending Invoices, Summaries)**:
    - Columns: As listed above.
    - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
    - Skeleton: 3-10 gray rows per table (based on screen size).
    - Action Buttons: “View” (green, redirects to respective page), “Mark Complete” (green, for tasks).
    - Highlight: Pending Invoices rows in orange.
    - Show More: Button (e.g., “Show More”, green, loads +5 rows, disappears if no more rows).
    - View All: Button (green, redirects to respective page).
  - **Buttons**:
    - Add Buttons: “Add Order”, “Add Expense”, “Add Purchase”, “Add Task” (top-right of each section, green, opens modal).
  - **Spinner**: Centered during page load.
  - **Toast Messages**: Errors (e.g., “Failed to load pending invoices”).
- **Actionable Elements**:
  - Quick Metrics: Click to Analytics.
  - Pending Invoices: “View” button to Orders page, “View All” to Orders page (filtered).
  - Orders Summary: “View” button to Orders page, “Add Order” button, “View All” to Orders page.
  - Expenses Summary: “View” button to Expenses page, “Add Expense” button, “View All” to Expenses page.
  - Material Purchases Summary: “View” button to Material Purchases page, “Add Purchase” button, “View All” to Material Purchases page.
  - Personal To-Do Summary: “View” button to Personal To-Do page, “Mark Complete” button, “Add Task” button, “View All” to Personal To-Do page.

#### Home Page for Managers
- **Purpose**: Provide an operational overview (similar to Admins but with limited access).
- **Sections** (Stacked Vertically):
  - **Quick Metrics** (3 Cards):
    - Today’s Orders: “5 Orders” (clickable to Analytics).
    - Today’s Expenses: “500 USH” (clickable to Analytics).
    - Pending Tasks: “3 Tasks” (clickable to Analytics).
  - **Pending Invoices**:
    - Same as Admins.
  - **Orders Summary**:
    - Same as Admins.
  - **Expenses Summary**:
    - Same as Admins.
  - **Personal To-Do Summary**:
    - Same as Admins.
  - **Note**: Excludes Material Purchases Summary (not critical for Managers).
- **UI Components**:
  - Same as Admins, but with 3 Quick Metric cards and no Material Purchases Summary.
  - Skeleton Loaders: For 3 cards (Quick Metrics), 3-10 rows per table (Pending Invoices, Orders, Expenses, Personal To-Do).
- **Actionable Elements**:
  - Same as Admins, minus Material Purchases actions.

#### Home Page for Employees
- **Purpose**: Focus on the employee’s responsibilities (tasks, accessible orders).
- **Sections** (Stacked Vertically):
  - **Quick Metrics** (1 Card):
    - Your Pending Tasks: “2 Tasks” (not clickable, no Analytics access).
  - **Pending Invoices**:
    - Header: “Pending Invoices” with “View All” button (top-right, redirects to Orders page with “Pending Payment” filter).
    - Table (Dynamic Rows):
      - Columns: Order Number, Client, Date, Amount, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “#123, John Doe, 2025-03-28, 2000 USH, View”.
      - Action: “View” button (redirects to Orders page with order ID).
      - Filtered: Only orders the employee has access to (based on Settings > User Management > Employee Access).
    - Highlight: Rows in orange.
    - Show More: Button.
  - **Orders Summary**:
    - Header: “Orders Overview” with “Add Order” and “View All” buttons (top-right, “Add Order” only for accessible items, “View All” to Orders page).
    - Table (Dynamic Rows):
      - Columns: Order Number, Client, Date, Status, Action.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “#124, Jane Doe, 2025-03-28, Completed, View”.
      - Action: “View” button (redirects to Orders page with order ID).
      - Filtered: Only accessible orders.
    - Show More: Button.
  - **Personal To-Do Summary**:
    - Header: “Personal To-Do Overview” with “Add Task” and “View All” buttons (top-right, “View All” to Personal To-Do page).
    - Table (Dynamic Rows):
      - Columns: Task Name, Due Date, Status, Actions.
      - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
      - Example: “Review Order #123, 2025-03-30, Pending, View/Mark Complete”.
      - Actions: “View” (redirects to Personal To-Do page), “Mark Complete” (updates task status to Completed).
    - Show More: Button.
  - **Note**: Excludes Expenses and Material Purchases (Employees don’t have access).
- **UI Components**:
  - **Card (Quick Metrics)**:
    - Layout: Single card (desktop and mobile).
    - Content: “Your Pending Tasks: 2 Tasks” (not clickable).
    - Skeleton: Gray rectangle (e.g., 200px wide, 100px tall).
  - **Tables (Pending Invoices, Summaries)**:
    - Columns: As listed above.
    - Rows: 10 (desktop), 3 (smaller screens), +5 with “Show More”.
    - Skeleton: 3-10 gray rows per table.
    - Action Buttons: “View” (green), “Mark Complete” (green, for tasks).
    - Highlight: Pending Invoices rows in orange.
    - Show More: Button.
    - View All: Button (green, redirects to respective page).
  - **Buttons**:
    - Add Buttons: “Add Order” (restricted to accessible items), “Add Task” (green, opens modal).
  - **Spinner**: Centered during page load.
  - **Toast Messages**: Errors (e.g., “Failed to load pending invoices”).
- **Actionable Elements**:
  - Pending Invoices: “View” button to Orders page, “View All” to Orders page (filtered).
  - Orders Summary: “View” button to Orders page (only for accessible orders), “Add Order” button, “View All” to Orders page.
  - Personal To-Do Summary: “View” button to Personal To-Do page, “Mark Complete” button, “Add Task” button, “View All” to Personal To-Do page.

#### Modals (Shared Across Roles)
- **Add Order Modal**:
  - Inputs: Client (smart dropdown), Items (smart dropdown, multi-select, restricted for Employees), Quantity (number), Unit Price (number, hidden for Employees).
  - Buttons: Save (green), Cancel (gray).
  - Inline Errors: “Client name is required” (below input in red).
  - Toast Messages: Success (“Order added”), Error (“Failed to save order”).
- **Add Expense Modal** (Admins/Managers):
  - Inputs: Date, Description, Amount.
  - Buttons: Save (green), Cancel (gray).
  - Inline Errors: “Amount is required”.
  - Toast Messages: Success (“Expense added”), Error (“Failed to save expense”).
- **Add Purchase Modal** (Admins):
  - Inputs: Date, Supplier (smart dropdown), Material, Quantity, Cost.
  - Buttons: Save (green), Cancel (gray).
  - Inline Errors: “Supplier is required”.
  - Toast Messages: Success (“Purchase added”), Error (“Failed to save purchase”).
- **Add Task Modal**:
  - Inputs: Task Name, Due Date, Recurring (toggle), Frequency (dropdown: Daily, Weekly, Monthly—if recurring).
  - Buttons: Save (green), Cancel (gray).
  - Inline Errors: “Task name is required”.
  - Toast Messages: Success (“Task added”), Error (“Failed to save task”).

#### Security Considerations
- **Sensitive Info**:
  - No financial data in Quick Metrics for Employees (e.g., no expenses, purchases).
  - Profit data: Restricted to Analytics (not shown on Home Page).
  - Pending Invoices: Amount visible (e.g., 2000 USH), but only for accessible orders (Employees).
- **Role-Based Access**:
  - Quick Metrics: Limited for Employees (only personal tasks, no Analytics link).
  - Summaries: Filtered for Employees (only accessible orders, no Expenses/Material Purchases).
  - Add Order: Restricted for Employees (only accessible items, no unit price input).

#### Scalability and Performance
- **Volume**: Handle 5-20 users with frequent interactions.
- **Design**:
  - Lazy-load Quick Metrics, Pending Invoices, and summary tables (e.g., fetch 10 rows initially, +5 with “Show More”).
  - Cache static UI components (e.g., sidebar, top bar).
- **Mobile**: Optimized for low-bandwidth (e.g., lazy-load tables, compress images).

---

### Updated Work Plan
- **Action Items**:
  - Update wireframe: Home Page for Admins (4 metrics, Pending Invoices, 4 summaries), Managers (3 metrics, Pending Invoices, 3 summaries), Employees (1 metric, Pending Invoices, 2 summaries).
  - Implement role-specific Quick Metrics (Admins: 4, Managers: 3, Employees: 1).
  - Add Pending Invoices section (separate table, highlighted, 10 rows default on desktop, 3 on smaller screens, “View” action only).
  - Add summaries for Orders, Expenses, Material Purchases, Personal To-Do (role-specific, 10 rows default on desktop, 3 on smaller screens).
  - Update dynamic rows: 10 (desktop), 3 (smaller screens), +5 rows with “Show More”.
  - Add filters: “Show More” (loads +5 rows), “View All” button for each section.
  - Add actionable elements: “View” (all sections), “Mark Complete” (tasks), “Add” buttons, “View All” redirects.
  - Implement loading states (spinners for page load, skeletons for cards/tables).
  - Implement error handling (toasts for general errors).
  - Ensure responsive design (stacked vertically for all devices).
- **Dependencies**: Orders, Expenses, Material Purchases, Personal To-Do, Analytics (for Quick Metrics links).
- **Priority**: High.

---


---

### Final Summary of the App

#### App Overview
The Printing Business Order & Finance Management System is a web-based application designed for a printing business with 5-20 users, handling 30 orders/day (up to 70 in peaks). It streamlines order management, expense tracking, material purchases, personal task management, analytics, and notifications, with role-based access for Admins, Managers, and Employees. The app is responsive (desktop and mobile), user-friendly for moderately tech-savvy users, and secure (e.g., no sensitive info in push notifications, role-based access).

#### Key Features
- **Pages**:
  - Home: Overview with quick metrics, pending invoices, and summaries (Orders, Expenses, Material Purchases, Personal To-Do).
  - Orders: Manage orders and related tasks (tabbed view: data table, task cards).
  - Expenses: Manage expenses and related tasks (tabbed view).
  - Material Purchases: Manage purchases and related tasks (tabbed view).
  - Personal To-Do: Manage personal tasks (inspired by Todoist).
  - Dashboard/Analytics: Profit metrics, trends, custom reports (Admins/Managers only).
  - Settings: Configure app settings (general, profit, data management, user management, notifications, branding, analytics, backup).
  - Notifications: View all notifications with filters.
  - Profile: View logged-in devices (Employees), redirect to Settings (Admins/Managers).
  - Login: Email verification, PIN setup, login, PIN reset.
- **Role-Based Access**:
  - Admins: Full access to all features.
  - Managers: Access to most features (except technical settings like currency, user limit).
  - Employees: Limited access (Orders, Personal To-Do, Notifications, Profile; restricted to specific items in Orders).
- **UI/UX**:
  - Responsive: Desktop and mobile (stacked vertically on mobile, scrollable tables).
  - Loading States: Spinners (page load), skeletons (data load).
  - Error Handling: Toasts (general errors), inline errors (forms).
  - Dynamic Elements: 10 rows default on desktop, 3 on smaller screens, “Show More” loads +5 rows.
  - Actionable Elements: “View”, “Mark Complete” (tasks), “Add” buttons, “View All” redirects.
- **Security**:
  - No sensitive info in push notifications (e.g., no financial data).
  - Profit data restricted to Analytics (Admins/Managers only).
  - Role-based access enforced (e.g., Employees only see accessible orders).

#### Home Page Summary
- **Purpose**: Provide a concise, actionable overview for all users (Admins, Managers, Employees).
- **Layout** (Stacked Vertically):
  - Quick Metrics: Role-specific (Admins: 4, Managers: 3, Employees: 1).
  - Pending Invoices: Separate section (10 rows default on desktop, 3 on smaller screens, “View” action only).
  - Summaries: Orders, Expenses (Admins/Managers), Material Purchases (Admins), Personal To-Do (all users).
- **Dynamic Elements**:
  - Default: 10 rows (desktop, >1200px), 3 rows (smaller screens, <1200px).
  - “Show More”: Loads +5 rows each time (e.g., 10 → 15 → 20).
- **Actionable Elements**:
  - Quick Metrics: Click to Analytics (Admins/Managers).
  - Pending Invoices: “View” button, “View All” to Orders page (filtered).
  - Summaries: “View” (all sections), “Mark Complete” (tasks), “Add” buttons, “View All” redirects.
- **Role-Specific**:
  - Admins: 4 metrics, Pending Invoices, 4 summaries (Orders, Expenses, Material Purchases, Personal To-Do).
  - Managers: 3 metrics, Pending Invoices, 3 summaries (Orders, Expenses, Personal To-Do).
  - Employees: 1 metric, Pending Invoices, 2 summaries (Orders, Personal To-Do; filtered for access).

---

### Production-Ready Checklist

To ensure a smooth transition to production, here’s a checklist for the development team:

#### 1. Technical Setup
- [ ] **Environment Setup**:
  - Set up development, staging, and production environments.
  - Choose a tech stack (e.g., React for frontend, Node.js/Express for backend, PostgreSQL for database).
  - Configure version control (e.g., Git, GitHub repository).
- [ ] **Database Schema**:
  - Implement tables: `users`, `orders`, `expenses`, `material_purchases`, `tasks`, `notifications`, etc.
  - Add indexes for performance (e.g., `user_id`, `status`, `created_at`).
  - Set up initial data (e.g., default users, roles).
- [ ] **API Development**:
  - Create RESTful APIs for all features (e.g., GET /orders, POST /orders, GET /notifications).
  - Implement authentication (email verification, PIN login).
  - Add role-based access control (e.g., middleware to restrict endpoints).

#### 2. UI/UX Implementation
- [ ] **Wireframes and Design**:
  - Finalize wireframes for all pages (based on the detailed breakdown).
  - Create a UI component library (e.g., buttons, tables, modals, spinners, skeletons, toasts).
  - Implement the green/orange color scheme (green for positive actions, orange for warnings).
- [ ] **Home Page**:
  - Implement Quick Metrics (role-specific, clickable to Analytics for Admins/Managers).
  - Add Pending Invoices section (10 rows default on desktop, 3 on smaller screens, “View” action).
  - Add summaries for Orders, Expenses, Material Purchases, Personal To-Do (role-specific, dynamic rows).
  - Implement “Show More” (+5 rows) and “View All” buttons.
  - Add actionable elements: “View”, “Mark Complete” (tasks), “Add” buttons.
  - Add loading states (spinners, skeletons) and error handling (toasts).
- [ ] **Other Pages**:
  - Implement Orders, Expenses, Material Purchases (tabbed view: data table, task cards).
  - Implement Personal To-Do (Todoist-inspired task management).
  - Implement Analytics (charts, tables, custom reports).
  - Implement Settings (sub-sections: General, Profit Settings, etc.).
  - Implement Notifications (table with filters, snooze options).
  - Implement Profile and Login pages.
- [ ] **Responsive Design**:
  - Ensure all pages are responsive (stacked vertically on mobile, scrollable tables).
  - Test on multiple devices (e.g., desktop, tablet, mobile).

#### 3. Functionality
- [ ] **Authentication**:
  - Implement email verification, PIN setup, login, PIN reset.
  - Add failed login notifications (Admins/Managers after 5 attempts).
- [ ] **Notifications**:
  - Implement in-app notifications (bell icon, Notifications page).
  - Add push notifications (configurable by Admins, no sensitive info).
  - Include snooze options (1 Hour, 6 Hours, 12 Hours, 1 Day, 3 Days, Next Week, Next Month).
- [ ] **Role-Based Access**:
  - Restrict access based on roles (e.g., Employees only see accessible orders).
  - Hide Analytics, Settings for Employees.
- [ ] **Data Management**:
  - Implement CRUD operations for Orders, Expenses, Material Purchases, Tasks.
  - Add smart dropdowns (e.g., clients, items, suppliers) with search and “Add New” option.
- [ ] **Analytics**:
  - Implement profit metrics, trends (line chart), profit by category (bar chart), custom reports.
  - Add export options (CSV, PDF).

#### 4. Performance and Scalability
- [ ] **Optimization**:
  - Lazy-load tables, cards, and charts (e.g., fetch 10 rows initially, +5 with “Show More”).
  - Cache static UI components (e.g., sidebar, top bar).
  - Optimize for low-bandwidth (e.g., compress images, lazy-load tables).
- [ ] **Database**:
  - Add indexes for frequent queries (e.g., `user_id`, `status`).
  - Implement cleanup jobs (e.g., delete notifications older than 90 days).
- [ ] **Scalability**:
  - Ensure the app can handle 5-20 users with frequent interactions.
  - Test for peak load (70 orders/day).

#### 5. Testing
- [ ] **Unit Tests**:
  - Test API endpoints (e.g., GET /orders, POST /tasks).
  - Test role-based access (e.g., Employees can’t access Analytics).
- [ ] **Integration Tests**:
  - Test end-to-end flows (e.g., login → add order → view notification).
  - Test notifications (e.g., failed login, new order, overdue task).
- [ ] **UI Tests**:
  - Test responsive design (desktop, tablet, mobile).
  - Test loading states (spinners, skeletons) and error handling (toasts, inline errors).
- [ ] **User Acceptance Testing (UAT)**:
  - Conduct UAT with stakeholders (e.g., Admins, Managers, Employees).
  - Gather feedback on usability (e.g., is the Home Page actionable and not overwhelming?).

#### 6. Deployment
- [ ] **Deployment**:
  - Deploy to staging environment for final testing.
  - Deploy to production environment.
- [ ] **Monitoring**:
  - Set up monitoring (e.g., error tracking, performance metrics).
  - Monitor for peak load (70 orders/day).
- [ ] **Documentation**:
  - Provide user documentation (e.g., how to add an order, manage tasks).
  - Provide developer documentation (e.g., API endpoints, database schema).

#### 7. Post-Production
- [ ] **Future Enhancements**:
  - Add email/SMS delivery for notifications (if budget allows).
  - Add inventory alerts (e.g., “Low paper stock”).
  - Add more filters to Notifications and Analytics pages.
- [ ] **Support**:
  - Set up a support channel (e.g., email, in-app help).
  - Plan for bug fixes and updates based on user feedback.

---

### 