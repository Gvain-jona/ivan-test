/**
 * Analytics Service
 *
 * This service provides methods for fetching analytics data from the API.
 * It uses a hybrid approach:
 * 1. Summary tables for common, performance-critical analytics
 * 2. Database functions for less frequent, ad hoc, or detailed analysis
 */

import { createClient } from '@/lib/supabase/client';
import { DateRange } from '@/types/date-range';
import { format, isWithinInterval, parseISO, subDays } from 'date-fns';

// Define types for analytics data
export interface SummaryMetrics {
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  avg_order_value: number;
  total_expenses: number;
  total_materials: number;
  orders_change: number;
  revenue_change: number;
  profit_change: number;
  aov_change: number;
  expenses_change: number;
  materials_change: number;
}

export interface ClientSegment {
  segment: string;
  client_count: number;
  order_count: number;
  total_revenue: number;
  percentage: number;
  avg_order_value: number;
  color: string;
}

export interface RevenueByPeriod {
  period: string;
  total_revenue: number;
  total_orders: number;
}

export interface ProfitByPeriod {
  period: string;
  total_profit: number;
  total_revenue: number;
  profit_margin: number;
}

export interface ClientPerformance {
  client_id: string;
  client_name: string;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  average_order_value: number;
}

export interface ExpensesByCategory {
  category: string;
  total_amount: number;
  percentage: number;
}

export interface MaterialsBySupplier {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_percentage: number;
}

export interface CashFlowAnalysis {
  period: string;
  inflow: number;
  outflow: number;
  net_flow: number;
  cumulative_flow: number;
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  order_count: number;
  item_count: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  avg_unit_price: number;
}

export interface ClientRetentionRate {
  retention_rate: number;
  repeat_clients: number;
  total_clients: number;
}

export interface LateDeliveries {
  late_delivery_count: number;
  total_delivered_count: number;
  late_delivery_percentage: number;
  average_delay_days: number;
}

export interface InstallmentDelinquencyRate {
  overdue_count: number;
  total_count: number;
  delinquency_rate: number;
  total_overdue_amount: number;
}

export interface ExpenseToRevenueRatio {
  period: string;
  total_revenue: number;
  total_expenses: number;
  total_materials: number;
  expense_ratio: number;
  materials_ratio: number;
  combined_ratio: number;
}

export interface OrderFrequency {
  client_id: string;
  client_name: string;
  order_count: number;
  first_order_date: string;
  last_order_date: string;
  avg_days_between_orders: number;
  total_revenue: number;
}

export interface SpendingSummary {
  totalSpend: number;
  spendingLimit: number;
  categories: {
    name: string;
    amount: number;
    icon: string;
    color: string;
  }[];
}

// Analytics service
export const analyticsService = {
  /**
   * Get summary metrics for the dashboard
   *
   * @param dateRange - Date range for the metrics
   * @returns Summary metrics
   */
  async getSummaryMetrics(dateRange: DateRange): Promise<SummaryMetrics> {
    try {
      const supabase = createClient();

      // Calculate previous period
      const currentStart = new Date(dateRange.startDate);
      const currentEnd = new Date(dateRange.endDate);
      const daysDiff = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

      const prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff);

      // Call the database function
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        prev_start_date: prevStart.toISOString().split('T')[0],
        prev_end_date: prevEnd.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching summary metrics:', error);
        throw error;
      }

      return data as SummaryMetrics;
    } catch (error) {
      console.error('Error in getSummaryMetrics:', error);
      throw error;
    }
  },

  /**
   * Get revenue by period
   *
   * @param period - Period type (day, week, month, year)
   * @param dateRange - Date range for the metrics
   * @returns Revenue by period
   */
  async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange): Promise<RevenueByPeriod[]> {
    try {
      const supabase = createClient();

      // For daily data, use the materialized view for better performance
      if (period === 'day') {
        // Check if the date range is within the last 90 days (for which we have materialized data)
        const today = new Date();
        const ninetyDaysAgo = subDays(today, 90);
        const startDate = parseISO(dateRange.startDate);

        if (isWithinInterval(startDate, { start: ninetyDaysAgo, end: today })) {
          console.log('Using materialized view for daily revenue data');
          const { data, error } = await supabase
            .from('analytics_daily_revenue')
            .select('date as period, total_revenue, total_orders')
            .gte('date', dateRange.startDate)
            .lte('date', dateRange.endDate)
            .order('date');

          if (error) {
            console.error('Error fetching from materialized view:', error);
            // Fall back to the function if there's an error
          } else if (data && data.length > 0) {
            return data.map(item => ({
              period: format(new Date(item.period), 'yyyy-MM-dd'),
              total_revenue: item.total_revenue,
              total_orders: item.total_orders
            }));
          }
        }
      }

      // For monthly data, use the summary table for better performance
      if (period === 'month') {
        console.log('Using summary table for monthly revenue data');
        const { data, error } = await supabase
          .from('analytics_monthly_revenue')
          .select('month_key as period, total_revenue, total_orders')
          .gte('month_key', dateRange.startDate.substring(0, 7))
          .lte('month_key', dateRange.endDate.substring(0, 7))
          .order('month_key');

        if (error) {
          console.error('Error fetching from summary table:', error);
          // Fall back to the function if there's an error
        } else if (data && data.length > 0) {
          return data;
        }
      }

      // For weekly data, use the summary table for better performance
      if (period === 'week') {
        console.log('Using summary table for weekly revenue data');
        // We need to convert the date range to ISO week format
        const startWeek = format(parseISO(dateRange.startDate), 'YYYY-\'W\'ww');
        const endWeek = format(parseISO(dateRange.endDate), 'YYYY-\'W\'ww');

        const { data, error } = await supabase
          .from('analytics_weekly_revenue')
          .select('week_key as period, total_revenue, total_orders')
          .gte('week_key', startWeek)
          .lte('week_key', endWeek)
          .order('week_key');

        if (error) {
          console.error('Error fetching from summary table:', error);
          // Fall back to the function if there's an error
        } else if (data && data.length > 0) {
          return data;
        }
      }

      // Fall back to the database function for other periods or if the above queries return no data
      console.log('Falling back to database function for revenue data');
      const { data, error } = await supabase.rpc('get_revenue_by_period', {
        period_type: period,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching revenue by period:', error);
        throw error;
      }

      return data as RevenueByPeriod[];
    } catch (error) {
      console.error('Error in getRevenueByPeriod:', error);
      throw error;
    }
  },

  /**
   * Get profit by period
   *
   * @param period - Period type (day, week, month, year)
   * @param dateRange - Date range for the metrics
   * @returns Profit by period
   */
  async getProfitByPeriod(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange): Promise<ProfitByPeriod[]> {
    try {
      const supabase = createClient();

      // For daily data, use the materialized view for better performance
      if (period === 'day') {
        // Check if the date range is within the last 90 days (for which we have materialized data)
        const today = new Date();
        const ninetyDaysAgo = subDays(today, 90);
        const startDate = parseISO(dateRange.startDate);

        if (isWithinInterval(startDate, { start: ninetyDaysAgo, end: today })) {
          console.log('Using materialized view for daily profit data');
          const { data, error } = await supabase
            .from('analytics_daily_profit')
            .select('date as period, total_profit, total_revenue, profit_margin')
            .gte('date', dateRange.startDate)
            .lte('date', dateRange.endDate)
            .order('date');

          if (error) {
            console.error('Error fetching from materialized view:', error);
            // Fall back to the function if there's an error
          } else if (data && data.length > 0) {
            return data.map(item => ({
              period: format(new Date(item.period), 'yyyy-MM-dd'),
              total_profit: item.total_profit,
              total_revenue: item.total_revenue,
              profit_margin: item.profit_margin
            }));
          }
        }
      }

      // For monthly data, use the summary table for better performance
      if (period === 'month') {
        console.log('Using summary table for monthly profit data');
        const { data, error } = await supabase
          .from('analytics_monthly_profit')
          .select('month_key as period, total_profit, total_revenue, profit_margin')
          .gte('month_key', dateRange.startDate.substring(0, 7))
          .lte('month_key', dateRange.endDate.substring(0, 7))
          .order('month_key');

        if (error) {
          console.error('Error fetching from summary table:', error);
          // Fall back to the function if there's an error
        } else if (data && data.length > 0) {
          return data;
        }
      }

      // Fall back to the database function for other periods or if the above queries return no data
      console.log('Falling back to database function for profit data');
      const { data, error } = await supabase.rpc('get_profit_by_period', {
        period_type: period,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching profit by period:', error);
        throw error;
      }

      return data as ProfitByPeriod[];
    } catch (error) {
      console.error('Error in getProfitByPeriod:', error);
      throw error;
    }
  },

  /**
   * Get client performance
   *
   * @param dateRange - Date range for the metrics
   * @param limit - Maximum number of clients to return
   * @returns Client performance metrics
   */
  async getClientPerformance(dateRange: DateRange, limit: number = 10): Promise<ClientPerformance[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_client_performance', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching client performance:', error);
        throw error;
      }

      return data as ClientPerformance[];
    } catch (error) {
      console.error('Error in getClientPerformance:', error);
      throw error;
    }
  },

  /**
   * Get expenses by category
   *
   * @param dateRange - Date range for the metrics
   * @returns Expenses by category
   */
  async getExpensesByCategory(dateRange: DateRange): Promise<ExpensesByCategory[]> {
    try {
      const supabase = createClient();

      // Check if the date range aligns with a month boundary
      const startDate = parseISO(dateRange.startDate);
      const endDate = parseISO(dateRange.endDate);
      const startMonth = format(startDate, 'yyyy-MM');
      const endMonth = format(endDate, 'yyyy-MM');

      // If the date range spans a single month or multiple complete months, use the summary table
      if (
        (startDate.getDate() === 1 && endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()) ||
        (startMonth !== endMonth)
      ) {
        console.log('Using summary table for monthly expenses data');

        // Query the monthly expenses summary table
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('analytics_monthly_expenses')
          .select('category, total_amount')
          .gte('month_key', startMonth)
          .lte('month_key', endMonth);

        if (monthlyError) {
          console.error('Error fetching from monthly expenses summary:', monthlyError);
          // Fall back to the function if there's an error
        } else if (monthlyData && monthlyData.length > 0) {
          // Aggregate the data by category
          const categoryMap = new Map<string, number>();

          monthlyData.forEach(item => {
            const currentAmount = categoryMap.get(item.category) || 0;
            categoryMap.set(item.category, currentAmount + item.total_amount);
          });

          // Calculate total amount
          const totalAmount = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);

          // Format the result
          const result = Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            total_amount: amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
          }));

          return result;
        }
      }

      // For daily data within the last 90 days, use the materialized view
      const today = new Date();
      const ninetyDaysAgo = subDays(today, 90);

      if (isWithinInterval(startDate, { start: ninetyDaysAgo, end: today })) {
        console.log('Using materialized view for daily expenses data');

        // Query the daily expenses materialized view
        const { data: dailyData, error: dailyError } = await supabase
          .from('analytics_daily_expenses')
          .select('category, total_amount')
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate);

        if (dailyError) {
          console.error('Error fetching from daily expenses materialized view:', dailyError);
          // Fall back to the function if there's an error
        } else if (dailyData && dailyData.length > 0) {
          // Aggregate the data by category
          const categoryMap = new Map<string, number>();

          dailyData.forEach(item => {
            const currentAmount = categoryMap.get(item.category) || 0;
            categoryMap.set(item.category, currentAmount + item.total_amount);
          });

          // Calculate total amount
          const totalAmount = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);

          // Format the result
          const result = Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            total_amount: amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
          }));

          return result;
        }
      }

      // Fall back to the database function
      console.log('Falling back to database function for expenses by category');
      const { data, error } = await supabase.rpc('get_expenses_by_category', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching expenses by category:', error);
        throw error;
      }

      return data as ExpensesByCategory[];
    } catch (error) {
      console.error('Error in getExpensesByCategory:', error);
      throw error;
    }
  },

  /**
   * Get client segments
   *
   * @param dateRange - Date range for the metrics
   * @returns Client segments
   */
  async getClientSegments(dateRange: DateRange): Promise<ClientSegment[]> {
    try {
      const supabase = createClient();

      // Check if the date range aligns with a month boundary
      const startDate = parseISO(dateRange.startDate);
      const endDate = parseISO(dateRange.endDate);
      const startMonth = format(startDate, 'yyyy-MM');
      const endMonth = format(endDate, 'yyyy-MM');

      // If the date range spans a single month or multiple complete months, use the summary table
      if (
        (startDate.getDate() === 1 && endDate.getDate() === new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()) ||
        (startMonth !== endMonth)
      ) {
        console.log('Using summary table for monthly client segments data');

        // Query the monthly client metrics summary table
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('analytics_monthly_client_metrics')
          .select('segment, client_count, order_count, total_revenue, percentage, avg_order_value, color')
          .gte('month_key', startMonth)
          .lte('month_key', endMonth);

        if (monthlyError) {
          console.error('Error fetching from monthly client metrics summary:', monthlyError);
          // Fall back to the function if there's an error
        } else if (monthlyData && monthlyData.length > 0) {
          // Aggregate the data by segment
          const segmentMap = new Map<string, {
            segment: string;
            client_count: number;
            order_count: number;
            total_revenue: number;
            color: string;
          }>();

          monthlyData.forEach(item => {
            const current = segmentMap.get(item.segment) || {
              segment: item.segment,
              client_count: 0,
              order_count: 0,
              total_revenue: 0,
              color: item.color
            };

            segmentMap.set(item.segment, {
              segment: item.segment,
              client_count: current.client_count + item.client_count,
              order_count: current.order_count + item.order_count,
              total_revenue: current.total_revenue + item.total_revenue,
              color: item.color
            });
          });

          // Calculate total revenue for percentage calculation
          const totalRevenue = Array.from(segmentMap.values())
            .reduce((sum, item) => sum + item.total_revenue, 0);

          // Format the result
          const result = Array.from(segmentMap.values()).map(item => ({
            segment: item.segment,
            client_count: item.client_count,
            order_count: item.order_count,
            total_revenue: item.total_revenue,
            percentage: totalRevenue > 0 ? (item.total_revenue / totalRevenue) * 100 : 0,
            avg_order_value: item.order_count > 0 ? item.total_revenue / item.order_count : 0,
            color: item.color
          }));

          return result;
        }
      }

      // Use the materialized view for current data
      console.log('Using materialized view for client segments data');
      const { data: viewData, error: viewError } = await supabase
        .from('analytics_client_segments')
        .select('segment, client_count, order_count, total_revenue, percentage, avg_order_value, color');

      if (viewError) {
        console.error('Error fetching from client segments materialized view:', viewError);
        // Fall back to the function if there's an error
      } else if (viewData && viewData.length > 0) {
        return viewData;
      }

      // Fall back to the database function
      console.log('Falling back to database function for client segments');
      const { data, error } = await supabase.rpc('get_client_segments', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching client segments:', error);
        throw error;
      }

      return data as ClientSegment[];
    } catch (error) {
      console.error('Error in getClientSegments:', error);
      throw error;
    }
  },

  /**
   * Get client order frequency
   *
   * @param dateRange - Date range for the metrics
   * @param minOrders - Minimum number of orders for a client to be included
   * @returns Client order frequency metrics
   */
  async getClientOrderFrequency(dateRange: DateRange, minOrders: number = 2): Promise<OrderFrequency[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_client_order_frequency', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        min_orders: minOrders
      });

      if (error) {
        console.error('Error fetching client order frequency:', error);
        throw error;
      }

      return data as OrderFrequency[];
    } catch (error) {
      console.error('Error in getClientOrderFrequency:', error);
      throw error;
    }
  },

  /**
   * Get client lifetime value
   *
   * @param limit - Maximum number of clients to return
   * @returns Client lifetime value metrics
   */
  async getClientLifetimeValue(limit: number = 10): Promise<any[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_client_lifetime_value', {
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching client lifetime value:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getClientLifetimeValue:', error);
      throw error;
    }
  },

  /**
   * Get materials by supplier
   *
   * @param dateRange - Date range for the metrics
   * @param limit - Maximum number of suppliers to return
   * @returns Materials by supplier
   */
  async getMaterialsBySupplier(dateRange: DateRange, limit: number = 10): Promise<MaterialsBySupplier[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_materials_by_supplier', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching materials by supplier:', error);
        throw error;
      }

      return data as MaterialsBySupplier[];
    } catch (error) {
      console.error('Error in getMaterialsBySupplier:', error);
      throw error;
    }
  },

  /**
   * Get cash flow analysis
   *
   * @param period - Period type (day, week, month, year)
   * @param dateRange - Date range for the metrics
   * @returns Cash flow analysis
   */
  async getCashFlowAnalysis(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange): Promise<CashFlowAnalysis[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_cash_flow_analysis', {
        period_type: period,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching cash flow analysis:', error);
        throw error;
      }

      return data as CashFlowAnalysis[];
    } catch (error) {
      console.error('Error in getCashFlowAnalysis:', error);
      throw error;
    }
  },

  /**
   * Get category performance
   *
   * @param dateRange - Date range for the metrics
   * @returns Category performance metrics
   */
  async getCategoryPerformance(dateRange: DateRange): Promise<CategoryPerformance[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_category_performance', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching category performance:', error);
        throw error;
      }

      return data as CategoryPerformance[];
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      throw error;
    }
  },

  /**
   * Get client retention rate
   *
   * @param currentRange - Current date range
   * @param previousRange - Previous date range for comparison
   * @returns Client retention rate
   */
  async getClientRetentionRate(currentRange: DateRange, previousRange: DateRange): Promise<ClientRetentionRate> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_client_retention_rate', {
        start_date: currentRange.startDate,
        end_date: currentRange.endDate,
        previous_start_date: previousRange.startDate,
        previous_end_date: previousRange.endDate
      });

      if (error) {
        console.error('Error fetching client retention rate:', error);
        throw error;
      }

      return data as ClientRetentionRate;
    } catch (error) {
      console.error('Error in getClientRetentionRate:', error);
      throw error;
    }
  },

  /**
   * Get late deliveries
   *
   * @param dateRange - Date range for the metrics
   * @param expectedTurnaroundDays - Expected turnaround days
   * @returns Late deliveries metrics
   */
  async getLateDeliveries(dateRange: DateRange, expectedTurnaroundDays: number = 7): Promise<LateDeliveries> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_late_deliveries', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        expected_turnaround_days: expectedTurnaroundDays
      });

      if (error) {
        console.error('Error fetching late deliveries:', error);
        throw error;
      }

      return data as LateDeliveries;
    } catch (error) {
      console.error('Error in getLateDeliveries:', error);
      throw error;
    }
  },

  /**
   * Get installment delinquency rate
   *
   * @param asOfDate - Date to calculate delinquency as of
   * @returns Installment delinquency rate
   */
  async getInstallmentDelinquencyRate(asOfDate: string = new Date().toISOString().split('T')[0]): Promise<InstallmentDelinquencyRate> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_installment_delinquency_rate', {
        as_of_date: asOfDate
      });

      if (error) {
        console.error('Error fetching installment delinquency rate:', error);
        throw error;
      }

      return data as InstallmentDelinquencyRate;
    } catch (error) {
      console.error('Error in getInstallmentDelinquencyRate:', error);
      throw error;
    }
  },

  /**
   * Get expense to revenue ratio
   *
   * @param period - Period type (day, week, month, year)
   * @param dateRange - Date range for the metrics
   * @returns Expense to revenue ratio
   */
  async getExpenseToRevenueRatio(period: 'day' | 'week' | 'month' | 'year', dateRange: DateRange): Promise<ExpenseToRevenueRatio[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_expense_to_revenue_ratio', {
        period_type: period,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (error) {
        console.error('Error fetching expense to revenue ratio:', error);
        throw error;
      }

      return data as ExpenseToRevenueRatio[];
    } catch (error) {
      console.error('Error in getExpenseToRevenueRatio:', error);
      throw error;
    }
  },

  /**
   * Get order frequency
   *
   * @param dateRange - Date range for the metrics
   * @param minOrders - Minimum number of orders to include a client
   * @returns Order frequency metrics
   */
  async getOrderFrequency(dateRange: DateRange, minOrders: number = 2): Promise<OrderFrequency[]> {
    try {
      const supabase = createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('get_order_frequency', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        min_orders: minOrders
      });

      if (error) {
        console.error('Error fetching order frequency:', error);
        throw error;
      }

      return data as OrderFrequency[];
    } catch (error) {
      console.error('Error in getOrderFrequency:', error);
      throw error;
    }
  }
};
