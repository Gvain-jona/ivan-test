'use client';

import { useCallback } from 'react';
import { useSettings } from '@/app/context/settings';
import { ProfitSettings } from '@/app/context/settings/types';
import {
  OrderItemWithProfit,
  applyProfitCalculations,
  applyProfitCalculationsToItems,
  isProfitCalculationsEnabled
} from '@/app/lib/utils/profit-calculations';

/**
 * Hook for profit calculations
 * Provides functions to calculate profit and labor amounts for order items
 */
export function useProfitCalculations() {
  const { settings } = useSettings();

  // Get profit settings or use defaults
  const profitSettings = settings.profit || {
    enabled: false,
    calculationBasis: 'unit_price',
    defaultProfitPercentage: 30,
    includeLabor: false,
    laborPercentage: 10,
    overrides: [],
  };

  /**
   * Calculate profit and labor amounts for a single order item
   */
  const calculateItemProfit = useCallback(
    (item: OrderItemWithProfit): OrderItemWithProfit => {
      return applyProfitCalculations(item, profitSettings);
    },
    [profitSettings]
  );

  /**
   * Calculate profit and labor amounts for multiple order items
   */
  const calculateItemsProfit = useCallback(
    (items: OrderItemWithProfit[]): OrderItemWithProfit[] => {
      return applyProfitCalculationsToItems(items, profitSettings);
    },
    [profitSettings]
  );

  /**
   * Calculate total profit amount for multiple order items
   */
  const calculateTotalProfit = useCallback(
    (items: OrderItemWithProfit[]): number => {
      const itemsWithProfit = applyProfitCalculationsToItems(items, profitSettings);
      return itemsWithProfit.reduce((total, item) => {
        return total + (item.profit_amount || 0) * item.quantity;
      }, 0);
    },
    [profitSettings]
  );

  /**
   * Calculate total labor amount for multiple order items
   */
  const calculateTotalLabor = useCallback(
    (items: OrderItemWithProfit[]): number => {
      const itemsWithProfit = applyProfitCalculationsToItems(items, profitSettings);
      return itemsWithProfit.reduce((total, item) => {
        return total + (item.labor_amount || 0) * item.quantity;
      }, 0);
    },
    [profitSettings]
  );

  /**
   * Check if profit calculations are enabled
   */
  const isProfitEnabled = useCallback(
    (): boolean => {
      return isProfitCalculationsEnabled(profitSettings);
    },
    [profitSettings]
  );

  return {
    profitSettings,
    isProfitEnabled,
    calculateItemProfit,
    calculateItemsProfit,
    calculateTotalProfit,
    calculateTotalLabor,
  };
}
