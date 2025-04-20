import { createClient } from '@/lib/supabase/server';

/**
 * Optimized query builder for Supabase
 * Helps create efficient queries with proper pagination and filtering
 */
export class QueryOptimizer {
  private table: string;
  private selectFields: string;
  private countEnabled: boolean = false;
  private filterConditions: Record<string, any> = {};
  private sortField: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private joinRelations: string[] = [];
  private supabase: any;

  constructor(table: string, selectFields: string = '*') {
    this.table = table;
    this.selectFields = selectFields;
  }

  /**
   * Initialize the Supabase client
   * This needs to be called before executing the query
   */
  async init() {
    try {
      // Make sure we properly await the createClient function
      const client = await createClient();
      if (!client) {
        throw new Error('Failed to initialize Supabase client');
      }
      this.supabase = client;
      return this;
    } catch (error) {
      console.error('Error initializing QueryOptimizer:', error);
      // Instead of throwing, return a failed state that can be handled gracefully
      this.supabase = null;
      return this;
    }
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
      // Initialize Supabase client if not already initialized
      if (!this.supabase) {
        await this.init();
      }

      // Double-check that we have a valid Supabase client
      if (!this.supabase) {
        console.error('Supabase client initialization failed');
        // Return empty result instead of throwing
        return {
          data: [],
          count: 0,
          error: new Error('Supabase client initialization failed')
        };
      }

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
        // Skip null or undefined values to prevent errors
        if (value === null || value === undefined) {
          console.log(`Skipping filter for ${column} with null/undefined value`);
          return;
        }

        try {
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
              // Ensure value is an array
              if (Array.isArray(value) && value.length > 0) {
                query = query.in(column, value);
              } else {
                console.log(`Skipping 'in' filter for ${column} with invalid array value`);
              }
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
        } catch (filterError) {
          console.error(`Error applying filter for ${column}:`, filterError);
          // Continue with other filters
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

      // Execute the query without a timeout to avoid AbortError issues
      try {
        // Execute the query
        const { data, error, count } = await query;

        if (error) {
          console.error(`Query error for ${this.table}:`, error);
          return {
            data: [],
            count: 0,
            error
          };
        }

        return {
          data: data || [],
          count: count || 0,
          error: null
        };
      } catch (queryError) {
        console.error(`Query error for ${this.table}:`, queryError);
        return {
          data: [],
          count: 0,
          error: queryError
        };
      }
    } catch (error) {
      console.error(`Error executing optimized query for ${this.table}:`, error);
      return {
        data: [],
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
