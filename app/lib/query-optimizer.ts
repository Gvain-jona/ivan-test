'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Optimized query builder for Supabase
 * Helps create efficient queries with proper pagination and filtering
 */
export class QueryOptimizer {
  private supabase = createClient();
  private table: string;
  private selectFields: string;
  private countEnabled: boolean = false;
  private filterConditions: Record<string, any> = {};
  private sortField: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private joinRelations: string[] = [];

  constructor(table: string, selectFields: string = '*') {
    this.table = table;
    this.selectFields = selectFields;
  }

  /**
   * Enable count to get total number of records
   */
  count(): QueryOptimizer {
    this.countEnabled = true;
    return this;
  }

  /**
   * Add a filter condition
   */
  filter(column: string, operator: string, value: any): QueryOptimizer {
    this.filterConditions[column] = { operator, value };
    return this;
  }

  /**
   * Add a sort order
   */
  sort(field: string, direction: 'asc' | 'desc' = 'asc'): QueryOptimizer {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  /**
   * Add pagination
   */
  paginate(page: number, pageSize: number): QueryOptimizer {
    this.limitValue = pageSize;
    this.offsetValue = (page - 1) * pageSize;
    return this;
  }

  /**
   * Add a join relation
   */
  join(relation: string): QueryOptimizer {
    this.joinRelations.push(relation);
    return this;
  }

  /**
   * Execute the query
   */
  async execute() {
    try {
      // Start building the query
      let query = this.supabase
        .from(this.table)
        .select(
          this.joinRelations.length > 0
            ? `${this.selectFields}, ${this.joinRelations.join(', ')}`
            : this.selectFields,
          { count: this.countEnabled }
        );

      // Apply filters
      Object.entries(this.filterConditions).forEach(([column, { operator, value }]) => {
        switch (operator) {
          case '=':
            query = query.eq(column, value);
            break;
          case '!=':
            query = query.neq(column, value);
            break;
          case '>':
            query = query.gt(column, value);
            break;
          case '>=':
            query = query.gte(column, value);
            break;
          case '<':
            query = query.lt(column, value);
            break;
          case '<=':
            query = query.lte(column, value);
            break;
          case 'in':
            query = query.in(column, value);
            break;
          case 'like':
            query = query.like(column, `%${value}%`);
            break;
          case 'ilike':
            query = query.ilike(column, `%${value}%`);
            break;
          default:
            query = query.eq(column, value);
        }
      });

      // Apply sorting
      if (this.sortField) {
        query = query.order(this.sortField, { ascending: this.sortDirection === 'asc' });
      }

      // Apply pagination
      if (this.limitValue !== null) {
        query = query.limit(this.limitValue);
      }

      if (this.offsetValue !== null) {
        query = query.range(this.offsetValue, this.offsetValue + (this.limitValue || 10) - 1);
      }

      // Execute the query
      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data,
        count,
        error: null
      };
    } catch (error) {
      console.error(`Error executing optimized query for ${this.table}:`, error);
      return {
        data: null,
        count: 0,
        error
      };
    }
  }
}

/**
 * Example usage:
 * 
 * const result = await new QueryOptimizer('orders')
 *   .count()
 *   .filter('status', '=', 'pending')
 *   .sort('created_at', 'desc')
 *   .paginate(1, 10)
 *   .join('clients(id, name)')
 *   .execute();
 * 
 * const { data, count, error } = result;
 */
