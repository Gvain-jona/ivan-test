# Database Schema

## Overview
This document outlines the database schema for the Ivan Prints Business Management System. The system uses Supabase (PostgreSQL) as the database with Row Level Security (RLS) policies for data protection.

## Tables

### profiles
```sql
create table public.profiles (
    id uuid references auth.users not null primary key,
    email text not null unique,
    full_name text not null,
    role text not null check (role in ('admin', 'manager', 'staff')),
    status text not null check (status in ('active', 'inactive', 'locked')),
    pin text,  -- Bcrypt-hashed 4-digit PIN
    verification_code varchar(20),
    code_expiry timestamptz,
    is_verified boolean default false,
    failed_attempts integer default 0,
    devices jsonb default '[]'::jsonb not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;

-- Only admins can insert/update profiles
create policy "Admins can manage profiles"
on public.profiles
for all
using (auth.uid() in (select id from public.profiles where role = 'admin'))
with check (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Users can view their own data
create policy "Users can view own data"
on public.profiles
for select
using (auth.uid() = id);

-- Managers can view staff data
create policy "Managers can view staff data"
on public.profiles
for select
using (
    auth.uid() in (select id from public.profiles where role = 'manager')
    and role = 'staff'
);
```

### orders
```sql
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    client_id uuid references public.clients not null,
    created_by uuid references public.profiles not null,
    status text not null check (status in ('pending', 'in_progress', 'completed', 'delivered', 'cancelled')),
    payment_status text not null check (payment_status in ('unpaid', 'partially_paid', 'paid')),
    total_amount numeric(10,2) not null default 0,
    amount_paid numeric(10,2) not null default 0,
    notes jsonb default '[]',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies
alter table public.orders enable row level security;

-- Admins and managers have full access
create policy "Admins and managers have full access to orders"
on public.orders
for all
using (
    auth.uid() in (
        select id from public.profiles
        where role in ('admin', 'manager')
    )
);

-- Employees can view orders and insert new ones
create policy "Employees can view and create orders"
on public.orders
for select
using (true);

create policy "Employees can insert orders"
on public.orders
for insert
with check (auth.uid() = created_by);
```

### order_items
```sql
create table public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders not null,
    item_id uuid references public.items not null,
    quantity integer not null,
    unit_price numeric(10,2) not null,
    profit_amount numeric(10,2) not null default 0,
    labor_amount numeric(10,2) not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies follow same pattern as orders table
```

### expenses
```sql
create table public.expenses (
    id uuid default uuid_generate_v4() primary key,
    created_by uuid references public.profiles not null,
    category text not null,
    description text not null,
    amount numeric(10,2) not null,
    date date not null,
    notes jsonb default '[]',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for admin/manager only
```

### material_purchases
```sql
create table public.material_purchases (
    id uuid default uuid_generate_v4() primary key,
    created_by uuid references public.profiles not null,
    supplier_id uuid references public.suppliers not null,
    material text not null,
    quantity numeric(10,2) not null,
    cost numeric(10,2) not null,
    date date not null,
    notes jsonb default '[]',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for admin only
```

### tasks
```sql
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    created_by uuid references public.profiles not null,
    assigned_to uuid references public.profiles,
    title text not null,
    description text,
    due_date timestamptz,
    status text not null check (status in ('pending', 'completed')),
    priority text not null check (priority in ('low', 'medium', 'high')),
    related_to jsonb,  -- {type: 'order|expense|purchase', id: uuid}
    is_recurring boolean default false,
    recurrence_rule jsonb,  -- {frequency: 'daily|weekly|monthly', end_date: timestamptz}
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for task visibility
```

### notifications
```sql
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles not null,
    type text not null,
    message text not null,
    push_message text,  -- No sensitive info
    data jsonb,
    status text not null check (status in ('unread', 'read', 'snoozed')),
    snooze_until timestamptz,
    created_at timestamptz default now()
);

-- RLS Policies for notification visibility
```

### clients
```sql
create table public.clients (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    address text,
    contact text,
    status text default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for client data
```

### items
```sql
create table public.items (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    category text not null,
    status text default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for item management
```

### suppliers
```sql
create table public.suppliers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    contact text,
    status text default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS Policies for supplier management
```

## Indexes
```sql
-- Profiles
create index profiles_email_idx on public.profiles (email);
create index profiles_role_idx on public.profiles (role);
create index profiles_verification_code_idx on public.profiles (verification_code);
create index profiles_is_verified_idx on public.profiles (is_verified);

-- Orders
create index orders_client_id_idx on public.orders (client_id);
create index orders_created_by_idx on public.orders (created_by);
create index orders_status_idx on public.orders (status);
create index orders_payment_status_idx on public.orders (payment_status);
create index orders_created_at_idx on public.orders (created_at);

-- Order Items
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_item_id_idx on public.order_items (item_id);

-- Tasks
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);

-- Notifications
create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_status_idx on public.notifications (status);
create index notifications_created_at_idx on public.notifications (created_at);
```

## Functions and Triggers

### Update Updated At
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute function update_updated_at();

-- Repeat for other tables
```

### Calculate Order Totals
```sql
create or replace function calculate_order_totals()
returns trigger as $$
begin
    update public.orders
    set total_amount = (
        select sum(quantity * unit_price)
        from public.order_items
        where order_id = new.order_id
    )
    where id = new.order_id;
    return new;
end;
$$ language plpgsql;

create trigger update_order_totals
    after insert or update or delete on public.order_items
    for each row
    execute function calculate_order_totals();
```

## Real-time Subscriptions

### Enable Real-time
```sql
-- Enable real-time for specific tables
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
```

## Backups
- Daily automated backups enabled
- Point-in-time recovery available
- Backup retention: 30 days

## Performance Considerations
1. Use appropriate indexes for frequent queries
2. Monitor query performance with pg_stat_statements
3. Regular VACUUM and ANALYZE
4. Connection pooling enabled
5. Query optimization as needed

## Security Considerations
1. Row Level Security (RLS) policies
2. No sensitive data in real-time subscriptions
3. Encrypted PIN storage
4. Regular security audits
5. Backup encryption

## Resources
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)