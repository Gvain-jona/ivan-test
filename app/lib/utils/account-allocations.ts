import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SourceType, TransactionType } from '@/app/context/settings/types';

/**
 * Interface for allocation result
 */
export interface AllocationResult {
  success: boolean;
  error?: string;
  transactions?: {
    accountId: string;
    amount: number;
    transactionType: TransactionType;
    sourceType: SourceType;
    sourceId?: string;
    description?: string;
  }[];
}

/**
 * Allocate an amount to accounts based on allocation rules
 * 
 * @param amount - The amount to allocate
 * @param sourceType - The source type of the allocation
 * @param sourceId - The source ID (optional)
 * @param description - The description (optional)
 * @param transactionType - The transaction type (credit or debit)
 * @returns The allocation result
 */
export async function allocateAmount(
  amount: number,
  sourceType: SourceType,
  sourceId?: string,
  description?: string,
  transactionType: TransactionType = 'credit'
): Promise<AllocationResult> {
  try {
    const supabase = createClientComponentClient();
    
    // Get active allocation rules for this source type
    const { data: rules, error } = await supabase
      .from('account_allocation_rules')
      .select('*')
      .eq('source_type', sourceType)
      .eq('is_active', true)
      .order('percentage', { ascending: false });
    
    if (error) {
      console.error('Error fetching allocation rules:', error);
      return { success: false, error: 'Failed to fetch allocation rules' };
    }
    
    // Calculate total percentage
    const totalPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0);
    
    // If no rules or total percentage is 0, return success with no transactions
    if (rules.length === 0 || totalPercentage === 0) {
      return { success: true, transactions: [] };
    }
    
    // Calculate amounts for each rule
    const transactions = rules.map(rule => {
      const ruleAmount = (amount * rule.percentage) / 100;
      
      return {
        accountId: rule.account_id,
        amount: ruleAmount,
        transactionType,
        sourceType,
        sourceId,
        description,
      };
    });
    
    return { success: true, transactions };
  } catch (error) {
    console.error('Error allocating amount:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create transactions for allocations
 * 
 * @param allocations - The allocation result
 * @returns Whether the transactions were created successfully
 */
export async function createTransactionsForAllocations(
  allocations: AllocationResult
): Promise<boolean> {
  if (!allocations.success || !allocations.transactions || allocations.transactions.length === 0) {
    return false;
  }
  
  try {
    const supabase = createClientComponentClient();
    
    // Create transactions
    const { error } = await supabase
      .from('account_transactions')
      .insert(
        allocations.transactions.map(transaction => ({
          account_id: transaction.accountId,
          amount: transaction.amount,
          transaction_type: transaction.transactionType,
          source_type: transaction.sourceType,
          source_id: transaction.sourceId || null,
          description: transaction.description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
    
    if (error) {
      console.error('Error creating transactions:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating transactions:', error);
    return false;
  }
}

/**
 * Allocate profit amount to accounts
 * 
 * @param profitAmount - The profit amount
 * @param sourceId - The source ID (optional)
 * @param description - The description (optional)
 * @returns Whether the allocation was successful
 */
export async function allocateProfitAmount(
  profitAmount: number,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  const allocations = await allocateAmount(
    profitAmount,
    'profit',
    sourceId,
    description || 'Profit allocation',
    'credit'
  );
  
  return await createTransactionsForAllocations(allocations);
}

/**
 * Allocate labor amount to accounts
 * 
 * @param laborAmount - The labor amount
 * @param sourceId - The source ID (optional)
 * @param description - The description (optional)
 * @returns Whether the allocation was successful
 */
export async function allocateLaborAmount(
  laborAmount: number,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  const allocations = await allocateAmount(
    laborAmount,
    'labor',
    sourceId,
    description || 'Labor allocation',
    'credit'
  );
  
  return await createTransactionsForAllocations(allocations);
}

/**
 * Allocate order payment amount to accounts
 * 
 * @param paymentAmount - The payment amount
 * @param sourceId - The source ID (optional)
 * @param description - The description (optional)
 * @returns Whether the allocation was successful
 */
export async function allocateOrderPaymentAmount(
  paymentAmount: number,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  const allocations = await allocateAmount(
    paymentAmount,
    'order_payment',
    sourceId,
    description || 'Order payment allocation',
    'credit'
  );
  
  return await createTransactionsForAllocations(allocations);
}

/**
 * Allocate expense amount to accounts
 * 
 * @param expenseAmount - The expense amount
 * @param sourceId - The source ID (optional)
 * @param description - The description (optional)
 * @returns Whether the allocation was successful
 */
export async function allocateExpenseAmount(
  expenseAmount: number,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  const allocations = await allocateAmount(
    expenseAmount,
    'expense',
    sourceId,
    description || 'Expense allocation',
    'debit'
  );
  
  return await createTransactionsForAllocations(allocations);
}
