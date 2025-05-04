-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    account_type VARCHAR NOT NULL, -- e.g., 'profit', 'labor', 'expense', 'revenue', 'custom'
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to the accounts table
COMMENT ON TABLE public.accounts IS 'Stores financial accounts for tracking different types of funds';

-- Create account_transactions table
CREATE TABLE IF NOT EXISTS public.account_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    transaction_type VARCHAR NOT NULL, -- 'credit', 'debit'
    source_type VARCHAR NOT NULL, -- 'order', 'expense', 'manual', etc.
    source_id UUID, -- ID of the source (order_id, expense_id, etc.)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to the account_transactions table
COMMENT ON TABLE public.account_transactions IS 'Tracks all transactions for financial accounts';

-- Create account_allocation_rules table
CREATE TABLE IF NOT EXISTS public.account_allocation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR NOT NULL, -- 'profit', 'labor', 'order_payment', 'expense'
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    percentage NUMERIC NOT NULL, -- Percentage of the amount to allocate
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to the account_allocation_rules table
COMMENT ON TABLE public.account_allocation_rules IS 'Stores rules for automatic allocation of funds to accounts';

-- Add RLS policies for accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read accounts
CREATE POLICY "Allow authenticated users to read accounts"
    ON public.accounts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow service_role to manage accounts
CREATE POLICY "Allow service_role to manage accounts"
    ON public.accounts
    FOR ALL
    TO service_role
    USING (true);

-- Add RLS policies for account_transactions table
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read account transactions
CREATE POLICY "Allow authenticated users to read account transactions"
    ON public.account_transactions
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow service_role to manage account transactions
CREATE POLICY "Allow service_role to manage account transactions"
    ON public.account_transactions
    FOR ALL
    TO service_role
    USING (true);

-- Add RLS policies for account_allocation_rules table
ALTER TABLE public.account_allocation_rules ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read account allocation rules
CREATE POLICY "Allow authenticated users to read account allocation rules"
    ON public.account_allocation_rules
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow service_role to manage account allocation rules
CREATE POLICY "Allow service_role to manage account allocation rules"
    ON public.account_allocation_rules
    FOR ALL
    TO service_role
    USING (true);

-- Update app_settings with account settings
UPDATE app_settings
SET settings = jsonb_set(
    settings,
    '{accounts}',
    '{"enableAccountTracking": true, "defaultProfitAccount": null, "defaultLaborAccount": null, "defaultRevenueAccount": null, "defaultExpenseAccount": null}'
)
WHERE id = 1;

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update account balance based on transaction type
        IF NEW.transaction_type = 'credit' THEN
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.transaction_type = 'debit' THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the effect of the deleted transaction
        IF OLD.transaction_type = 'credit' THEN
            UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.transaction_type = 'debit' THEN
            UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle updates by reversing old transaction and applying new one
        IF OLD.transaction_type = 'credit' THEN
            UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.transaction_type = 'debit' THEN
            UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
        
        IF NEW.transaction_type = 'credit' THEN
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.transaction_type = 'debit' THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account_transactions
CREATE TRIGGER account_transaction_trigger
AFTER INSERT OR UPDATE OR DELETE ON account_transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_allocation_rules TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_allocation_rules TO service_role;
