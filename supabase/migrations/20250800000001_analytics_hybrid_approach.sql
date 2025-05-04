-- Analytics Hybrid Approach Migration
-- Created: 2025-08-01
-- This migration adds materialized views and summary tables for analytics
-- to implement a hybrid approach for better performance.

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_revenue AS
SELECT 
    date,
    SUM(total_amount) AS total_revenue,
    COUNT(id) AS total_orders,
    CASE WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) ELSE 0 END AS avg_order_value
FROM orders
GROUP BY date
ORDER BY date;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_revenue_date ON analytics_daily_revenue(date);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_expenses AS
SELECT 
    date,
    category,
    SUM(total_amount) AS total_amount,
    COUNT(id) AS expense_count
FROM expenses
GROUP BY date, category
ORDER BY date, category;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_expenses_date ON analytics_daily_expenses(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_expenses_category ON analytics_daily_expenses(category);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_materials AS
SELECT 
    date,
    supplier_name,
    SUM(total_amount) AS total_amount,
    COUNT(id) AS purchase_count
FROM material_purchases
GROUP BY date, supplier_name
ORDER BY date, supplier_name;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_materials_date ON analytics_daily_materials(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_materials_supplier ON analytics_daily_materials(supplier_name);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_profit AS
SELECT 
    o.date,
    SUM(oi.profit_amount) AS total_profit,
    SUM(o.total_amount) AS total_revenue,
    CASE WHEN SUM(o.total_amount) > 0 THEN (SUM(oi.profit_amount) / SUM(o.total_amount)) * 100 ELSE 0 END AS profit_margin
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.date
ORDER BY o.date;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_profit_date ON analytics_daily_profit(date);

-- Create summary tables for different time granularities
CREATE TABLE IF NOT EXISTS analytics_monthly_revenue (
    month_key TEXT PRIMARY KEY,
    year INTEGER,
    month_num INTEGER,
    total_revenue NUMERIC,
    total_orders INTEGER,
    avg_order_value NUMERIC,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_monthly_revenue_year ON analytics_monthly_revenue(year);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_revenue_month_num ON analytics_monthly_revenue(month_num);

CREATE TABLE IF NOT EXISTS analytics_monthly_expenses (
    month_key TEXT,
    category TEXT,
    year INTEGER,
    month_num INTEGER,
    total_amount NUMERIC,
    expense_count INTEGER,
    last_updated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (month_key, category)
);

CREATE INDEX IF NOT EXISTS idx_analytics_monthly_expenses_year ON analytics_monthly_expenses(year);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_expenses_month_num ON analytics_monthly_expenses(month_num);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_expenses_category ON analytics_monthly_expenses(category);

CREATE TABLE IF NOT EXISTS analytics_monthly_profit (
    month_key TEXT PRIMARY KEY,
    year INTEGER,
    month_num INTEGER,
    total_profit NUMERIC,
    total_revenue NUMERIC,
    profit_margin NUMERIC,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_monthly_profit_year ON analytics_monthly_profit(year);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_profit_month_num ON analytics_monthly_profit(month_num);

CREATE TABLE IF NOT EXISTS analytics_weekly_revenue (
    week_key TEXT PRIMARY KEY,
    year INTEGER,
    week_num INTEGER,
    start_date DATE,
    end_date DATE,
    total_revenue NUMERIC,
    total_orders INTEGER,
    avg_order_value NUMERIC,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_weekly_revenue_year ON analytics_weekly_revenue(year);
CREATE INDEX IF NOT EXISTS idx_analytics_weekly_revenue_week_num ON analytics_weekly_revenue(week_num);
CREATE INDEX IF NOT EXISTS idx_analytics_weekly_revenue_date_range ON analytics_weekly_revenue(start_date, end_date);

-- Create functions to update summary tables
CREATE OR REPLACE FUNCTION update_monthly_revenue_summary(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
DECLARE
    month_start DATE;
    month_end DATE;
    target_month_key TEXT;
BEGIN
    -- Calculate month start and end dates
    month_start := make_date(target_year, target_month, 1);
    month_end := (month_start + INTERVAL '1 month')::DATE - INTERVAL '1 day';
    target_month_key := TO_CHAR(month_start, 'YYYY-MM');
    
    -- Delete existing data for this month
    DELETE FROM analytics_monthly_revenue WHERE month_key = target_month_key;
    
    -- Insert new data
    INSERT INTO analytics_monthly_revenue (
        month_key, year, month_num, total_revenue, total_orders, avg_order_value
    )
    SELECT 
        target_month_key,
        target_year,
        target_month,
        SUM(total_amount),
        COUNT(id),
        CASE WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) ELSE 0 END
    FROM orders
    WHERE date BETWEEN month_start AND month_end;
    
    -- Update last_updated timestamp
    UPDATE analytics_monthly_revenue 
    SET last_updated = NOW() 
    WHERE month_key = target_month_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_monthly_expenses_summary(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
DECLARE
    month_start DATE;
    month_end DATE;
    target_month_key TEXT;
BEGIN
    -- Calculate month start and end dates
    month_start := make_date(target_year, target_month, 1);
    month_end := (month_start + INTERVAL '1 month')::DATE - INTERVAL '1 day';
    target_month_key := TO_CHAR(month_start, 'YYYY-MM');
    
    -- Delete existing data for this month
    DELETE FROM analytics_monthly_expenses WHERE month_key = target_month_key;
    
    -- Insert new data
    INSERT INTO analytics_monthly_expenses (
        month_key, category, year, month_num, total_amount, expense_count
    )
    SELECT 
        target_month_key,
        category,
        target_year,
        target_month,
        SUM(total_amount),
        COUNT(id)
    FROM expenses
    WHERE date BETWEEN month_start AND month_end
    GROUP BY category;
    
    -- Update last_updated timestamp
    UPDATE analytics_monthly_expenses 
    SET last_updated = NOW() 
    WHERE month_key = target_month_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_monthly_profit_summary(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
DECLARE
    month_start DATE;
    month_end DATE;
    target_month_key TEXT;
BEGIN
    -- Calculate month start and end dates
    month_start := make_date(target_year, target_month, 1);
    month_end := (month_start + INTERVAL '1 month')::DATE - INTERVAL '1 day';
    target_month_key := TO_CHAR(month_start, 'YYYY-MM');
    
    -- Delete existing data for this month
    DELETE FROM analytics_monthly_profit WHERE month_key = target_month_key;
    
    -- Insert new data
    INSERT INTO analytics_monthly_profit (
        month_key, year, month_num, total_profit, total_revenue, profit_margin
    )
    SELECT 
        target_month_key,
        target_year,
        target_month,
        SUM(oi.profit_amount),
        SUM(o.total_amount),
        CASE WHEN SUM(o.total_amount) > 0 THEN (SUM(oi.profit_amount) / SUM(o.total_amount)) * 100 ELSE 0 END
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.date BETWEEN month_start AND month_end;
    
    -- Update last_updated timestamp
    UPDATE analytics_monthly_profit 
    SET last_updated = NOW() 
    WHERE month_key = target_month_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_weekly_revenue_summary(target_year INTEGER, target_week INTEGER)
RETURNS VOID AS $$
DECLARE
    week_start DATE;
    week_end DATE;
    target_week_key TEXT;
BEGIN
    -- Calculate week start and end dates (assuming ISO week where week starts on Monday)
    week_start := TO_DATE(target_year || '-' || target_week || '-1', 'IYYY-IW-ID');
    week_end := week_start + INTERVAL '6 days';
    target_week_key := target_year || '-W' || LPAD(target_week::TEXT, 2, '0');
    
    -- Delete existing data for this week
    DELETE FROM analytics_weekly_revenue WHERE week_key = target_week_key;
    
    -- Insert new data
    INSERT INTO analytics_weekly_revenue (
        week_key, year, week_num, start_date, end_date, total_revenue, total_orders, avg_order_value
    )
    SELECT 
        target_week_key,
        target_year,
        target_week,
        week_start,
        week_end,
        SUM(total_amount),
        COUNT(id),
        CASE WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) ELSE 0 END
    FROM orders
    WHERE date BETWEEN week_start AND week_end;
    
    -- Update last_updated timestamp
    UPDATE analytics_weekly_revenue 
    SET last_updated = NOW() 
    WHERE week_key = target_week_key;
END;
$$ LANGUAGE plpgsql;

-- Create master functions to update all summary tables
CREATE OR REPLACE FUNCTION update_all_monthly_summaries(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Update all monthly summaries
    PERFORM update_monthly_revenue_summary(target_year, target_month);
    PERFORM update_monthly_expenses_summary(target_year, target_month);
    PERFORM update_monthly_profit_summary(target_year, target_month);
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW analytics_daily_revenue;
    REFRESH MATERIALIZED VIEW analytics_daily_expenses;
    REFRESH MATERIALIZED VIEW analytics_daily_materials;
    REFRESH MATERIALIZED VIEW analytics_daily_profit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_all_weekly_summaries(target_year INTEGER, target_week INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Update weekly revenue summary
    PERFORM update_weekly_revenue_summary(target_year, target_week);
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW analytics_daily_revenue;
    REFRESH MATERIALIZED VIEW analytics_daily_expenses;
    REFRESH MATERIALIZED VIEW analytics_daily_materials;
    REFRESH MATERIALIZED VIEW analytics_daily_profit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_current_month_summaries()
RETURNS VOID AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
BEGIN
    -- Get current year and month
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Update all monthly summaries for current month
    PERFORM update_all_monthly_summaries(current_year, current_month);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_current_week_summaries()
RETURNS VOID AS $$
DECLARE
    current_year INTEGER;
    current_week INTEGER;
BEGIN
    -- Get current ISO year and week
    current_year := EXTRACT(ISOYEAR FROM CURRENT_DATE);
    current_week := EXTRACT(WEEK FROM CURRENT_DATE);
    
    -- Update all weekly summaries for current week
    PERFORM update_all_weekly_summaries(current_year, current_week);
END;
$$ LANGUAGE plpgsql;

-- Create scheduled jobs to update summary tables
SELECT cron.schedule('refresh-materialized-views', '0 1 * * *', 'REFRESH MATERIALIZED VIEW analytics_daily_revenue; REFRESH MATERIALIZED VIEW analytics_daily_expenses; REFRESH MATERIALIZED VIEW analytics_daily_materials; REFRESH MATERIALIZED VIEW analytics_daily_profit;');
SELECT cron.schedule('update-weekly-summaries', '0 2 * * 1', 'SELECT update_current_week_summaries();');
SELECT cron.schedule('update-monthly-summaries', '0 3 1 * *', 'SELECT update_current_month_summaries();');

-- Initial population of summary tables
DO $$
DECLARE
    current_date DATE := CURRENT_DATE;
    month_date DATE;
    i INTEGER;
BEGIN
    -- Populate monthly summaries for the last 12 months
    FOR i IN 0..11 LOOP
        month_date := (current_date - (i || ' month')::INTERVAL);
        PERFORM update_monthly_revenue_summary(
            EXTRACT(YEAR FROM month_date)::INTEGER,
            EXTRACT(MONTH FROM month_date)::INTEGER
        );
        PERFORM update_monthly_expenses_summary(
            EXTRACT(YEAR FROM month_date)::INTEGER,
            EXTRACT(MONTH FROM month_date)::INTEGER
        );
        PERFORM update_monthly_profit_summary(
            EXTRACT(YEAR FROM month_date)::INTEGER,
            EXTRACT(MONTH FROM month_date)::INTEGER
        );
    END LOOP;
    
    -- Populate weekly summaries for the last 12 weeks
    FOR i IN 0..11 LOOP
        DECLARE
            week_date DATE := (current_date - (i * 7 || ' day')::INTERVAL);
        BEGIN
            PERFORM update_weekly_revenue_summary(
                EXTRACT(ISOYEAR FROM week_date)::INTEGER,
                EXTRACT(WEEK FROM week_date)::INTEGER
            );
        END;
    END LOOP;
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW analytics_daily_revenue;
    REFRESH MATERIALIZED VIEW analytics_daily_expenses;
    REFRESH MATERIALIZED VIEW analytics_daily_materials;
    REFRESH MATERIALIZED VIEW analytics_daily_profit;
END;
$$;
