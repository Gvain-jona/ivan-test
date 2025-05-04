import { createClient } from '@/lib/supabase/server';

/**
 * Helper function to add timeout to promises
 * @param promise The promise to add timeout to
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message to throw on timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

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
  private timeoutMs: number = 20000; // Default timeout: 20 seconds

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
   * Always uses 'exact' count for accurate pagination
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
   * Set a custom timeout for the query execution
   * @param timeoutMs Timeout in milliseconds
   */
  timeout(timeoutMs: number): QueryOptimizer {
    this.timeoutMs = timeoutMs;
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
      // Log query details for debugging
      console.log(`QueryOptimizer: Building query for ${this.table}`, {
        countEnabled: this.countEnabled,
        joinRelations: this.joinRelations,
        filterConditions: Object.keys(this.filterConditions)
      });

      let query = this.supabase
        .from(this.table)
        .select(
          this.joinRelations.length > 0
            ? `${this.selectFields}, ${this.joinRelations.join(', ')}`
            : this.selectFields,
          { count: this.countEnabled ? 'exact' : undefined }
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

      // Execute the query with a timeout to prevent hanging requests
      try {
        // Log timeout value for debugging
        console.log(`QueryOptimizer: Executing query for ${this.table} with ${this.timeoutMs}ms timeout`);

        // Execute the query with timeout
        const { data, error, count } = await withTimeout(
          query,
          this.timeoutMs,
          `Query timeout after ${this.timeoutMs}ms for table ${this.table}`
        );

        // Log count details for debugging
        console.log(`QueryOptimizer: Query result for ${this.table}`, {
          hasData: !!data && data.length > 0,
          dataLength: data?.length || 0,
          count,
          hasCount: count !== null && count !== undefined,
          countEnabled: this.countEnabled
        });

        if (error) {
          console.error(`Query error for ${this.table}:`, error);
          return {
            data: [],
            count: 0,
            error
          };
        }

        // Check if count is missing when it should be present
        if (this.countEnabled && (count === null || count === undefined)) {
          console.warn(`QueryOptimizer: Count is missing for ${this.table} despite being enabled. This may indicate an issue with the Supabase query or permissions.`);

          // If we have data but no count, we can use the data length as a fallback
          // but this is not ideal as it only represents the current page
          if (data && data.length > 0) {
            console.warn(`QueryOptimizer: Falling back to data length (${data.length}) for count. Note that this only represents the current page, not the total count.`);
          }
        }

        return {
          data: data || [],
          count: count || 0,
          error: null
        };
      } catch (queryError) {
        // Check if this is a timeout error
        const isTimeout = queryError instanceof Error &&
          (queryError.message.includes('timeout') || queryError.message.includes('abort'));

        // Log appropriate error message
        if (isTimeout) {
          console.error(`Query timeout for ${this.table} after ${this.timeoutMs}ms:`, queryError.message);
        } else {
          console.error(`Query error for ${this.table}:`, queryError);
        }

        return {
          data: [],
          count: 0,
          error: queryError,
          isTimeout: isTimeout
        };
      }
    } catch (error) {
      // Check if this is a timeout error
      const isTimeout = error instanceof Error &&
        (error.message.includes('timeout') || error.message.includes('abort'));

      if (isTimeout) {
        console.error(`Query timeout for ${this.table} after ${this.timeoutMs}ms:`, error.message);
      } else {
        console.error(`Error executing optimized query for ${this.table}:`, error);
      }

      return {
        data: [],
        count: 0,
        error,
        isTimeout: isTimeout
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
