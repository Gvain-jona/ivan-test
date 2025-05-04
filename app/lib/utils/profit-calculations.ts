import { CalculationBasisOption, ProfitOverride, ProfitSettings } from '@/app/context/settings/types';

/**
 * Check if profit calculations are enabled
 *
 * @param settings - The profit settings or undefined
 * @returns Whether profit calculations are enabled
 */
export function isProfitCalculationsEnabled(settings?: ProfitSettings | null): boolean {
  // If settings are undefined or null, profit calculations are disabled
  if (!settings) return false;

  // Check the enabled flag
  return settings.enabled === true;
}

/**
 * Interface for an order item with profit calculation fields
 */
export interface OrderItemWithProfit {
  id?: string;
  item_id?: string;
  category_id?: string;
  item_name: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  total_amount?: number;
  profit_amount?: number;
  labor_amount?: number;
}

/**
 * Get item or category override if available
 *
 * @param itemId - The item ID
 * @param categoryId - The category ID
 * @param itemName - The item name
 * @param categoryName - The category name
 * @param settings - The profit settings
 * @returns The override if found, otherwise null
 */
export function getItemOverride(
  itemId: string | undefined,
  categoryId: string | undefined,
  itemName: string,
  categoryName: string,
  settings: ProfitSettings
): ProfitOverride | null {
  // First try to find an item override by ID
  if (itemId) {
    const itemOverride = settings.overrides.find(
      o => o.type === 'item' && o.id === itemId
    );
    if (itemOverride) return itemOverride;
  }

  // Then try to find an item override by name
  const itemNameOverride = settings.overrides.find(
    o => o.type === 'item' && o.name.toLowerCase() === itemName.toLowerCase()
  );
  if (itemNameOverride) return itemNameOverride;

  // Then try to find a category override by ID
  if (categoryId) {
    const categoryOverride = settings.overrides.find(
      o => o.type === 'category' && o.id === categoryId
    );
    if (categoryOverride) return categoryOverride;
  }

  // Finally try to find a category override by name
  const categoryNameOverride = settings.overrides.find(
    o => o.type === 'category' && o.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (categoryNameOverride) return categoryNameOverride;

  // No override found
  return null;
}

/**
 * Calculate profit amount for an order item
 *
 * @param item - The order item
 * @param settings - The profit settings
 * @returns The calculated profit amount
 */
export function calculateProfitAmount(
  item: OrderItemWithProfit,
  settings: ProfitSettings
): number {
  // Get the profit percentage (from override or default)
  const override = getItemOverride(
    item.item_id,
    item.category_id,
    item.item_name,
    item.category_name,
    settings
  );

  const profitPercentage = override?.profitPercentage ?? settings.defaultProfitPercentage;

  // Calculate based on the calculation basis
  if (settings.calculationBasis === 'unit_price') {
    // Unit Price basis: profit is calculated per item
    return (item.unit_price * profitPercentage) / 100;
  } else {
    // Total Cost basis: profit is calculated on the total
    const totalAmount = item.total_amount ?? (item.quantity * item.unit_price);
    return (totalAmount * profitPercentage) / 100;
  }
}

/**
 * Calculate labor amount for an order item
 *
 * @param item - The order item
 * @param profitAmount - The calculated profit amount
 * @param settings - The profit settings
 * @returns The calculated labor amount
 */
export function calculateLaborAmount(
  item: OrderItemWithProfit,
  profitAmount: number,
  settings: ProfitSettings
): number {
  // If labor tracking is disabled, return 0
  if (!settings.includeLabor) {
    return 0;
  }

  // Get the labor percentage (from override or default)
  const override = getItemOverride(
    item.item_id,
    item.category_id,
    item.item_name,
    item.category_name,
    settings
  );

  const laborPercentage = override?.laborPercentage ?? settings.laborPercentage;

  // Calculate based on the calculation basis
  if (settings.calculationBasis === 'unit_price') {
    // Unit Price basis: labor is calculated on production cost per item
    const productionCost = item.unit_price - profitAmount;
    return (productionCost * laborPercentage) / 100;
  } else {
    // Total Cost basis: labor is calculated on total production cost
    const totalAmount = item.total_amount ?? (item.quantity * item.unit_price);
    const productionCost = totalAmount - profitAmount;
    return (productionCost * laborPercentage) / 100;
  }
}

/**
 * Apply profit calculations to an order item
 *
 * @param item - The order item
 * @param settings - The profit settings
 * @param allocateToAccounts - Whether to allocate profit and labor amounts to accounts
 * @returns The order item with profit and labor amounts
 */
export function applyProfitCalculations(
  item: OrderItemWithProfit,
  settings: ProfitSettings,
  allocateToAccounts: boolean = false
): OrderItemWithProfit {
  // Ensure total_amount is calculated
  const totalAmount = item.quantity * item.unit_price;

  // If profit calculations are disabled, return item with only total_amount
  if (!isProfitCalculationsEnabled(settings)) {
    return {
      ...item,
      total_amount: totalAmount,
      profit_amount: 0,
      labor_amount: 0
    };
  }

  // Calculate profit amount
  const profitAmount = calculateProfitAmount(item, settings);

  // Calculate labor amount
  const laborAmount = calculateLaborAmount(item, profitAmount, settings);

  // If allocateToAccounts is true, allocate profit and labor amounts to accounts
  if (allocateToAccounts && item.id) {
    import('./account-allocations').then(({ allocateProfitAmount, allocateLaborAmount }) => {
      // Allocate profit amount
      if (profitAmount > 0) {
        allocateProfitAmount(
          profitAmount * item.quantity,
          item.id,
          `Profit allocation for ${item.item_name} (${item.quantity} x ${item.unit_price})`
        ).catch(error => {
          console.error('Error allocating profit amount:', error);
        });
      }

      // Allocate labor amount
      if (laborAmount > 0) {
        allocateLaborAmount(
          laborAmount * item.quantity,
          item.id,
          `Labor allocation for ${item.item_name} (${item.quantity} x ${item.unit_price})`
        ).catch(error => {
          console.error('Error allocating labor amount:', error);
        });
      }
    });
  }

  // Return updated item
  return {
    ...item,
    total_amount: totalAmount,
    profit_amount: profitAmount,
    labor_amount: laborAmount
  };
}

/**
 * Apply profit calculations to multiple order items
 *
 * @param items - The order items
 * @param settings - The profit settings
 * @param allocateToAccounts - Whether to allocate profit and labor amounts to accounts
 * @returns The order items with profit and labor amounts
 */
export function applyProfitCalculationsToItems(
  items: OrderItemWithProfit[],
  settings: ProfitSettings,
  allocateToAccounts: boolean = false
): OrderItemWithProfit[] {
  return items.map(item => applyProfitCalculations(item, settings, allocateToAccounts));
}
