'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DropdownOption = {
  value: string
  label: string
  [key: string]: any // Allow for additional metadata
}

export type EntityType = 'clients' | 'categories' | 'items' | 'suppliers' | 'sizes'

interface FetchOptionsParams {
  entityType: EntityType
  search?: string
  parentId?: string
  filterField?: string
  filterValue?: string
  limit?: number
}

/**
 * Server action to fetch dropdown options from Supabase
 * This follows Next.js App Router best practices for data fetching
 */
// Simple in-memory cache for dropdown options
const optionsCache = new Map<string, { options: DropdownOption[], timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

// Request timeout for Supabase queries to prevent hanging requests
const REQUEST_TIMEOUT = 3000; // 3 seconds

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

export async function fetchDropdownOptions({
  entityType,
  search,
  parentId,
  filterField,
  filterValue,
  limit = 50
}: FetchOptionsParams): Promise<{ options: DropdownOption[], error: string | null }> {
  // Generate a cache key based on the request parameters
  const cacheKey = `${entityType}-${search || ''}-${parentId || ''}-${filterField || ''}-${filterValue || ''}-${limit}`;

  // Check if we have a valid cached result
  const cachedResult = optionsCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`[Server] Using cached ${entityType} options (${cachedResult.options.length} items)`);
    return { options: cachedResult.options, error: null };
  }

  // Only log in development to reduce noise in production
  if (process.env.NODE_ENV === 'development') {
    // Skip logging undefined parameters to reduce console noise
    const logParams = {
      search: search || '',
      parentId: parentId || undefined,
      filterField: filterField || undefined,
      filterValue: filterValue || undefined
    }
    console.log(`[Server] Fetching ${entityType} options`, logParams)
  }

  try {
    const supabase = await createClient()

    // Determine which table to query based on entity type
    let table = ''
    let columns = 'id, name'
    let orderBy = 'name'
    let whereClause = ''

    switch (entityType) {
      case 'clients':
        table = 'clients'
        break
      case 'categories':
        table = 'categories'
        break
      case 'items':
        table = 'items'
        // Items are independent of categories
        // No need to filter by category_id
        break
      case 'suppliers':
        table = 'suppliers'
        break
      case 'sizes':
        table = 'sizes'
        break
      default:
        return {
          options: [],
          error: `Unknown entity type: ${entityType}`
        }
    }

    // Build the query
    let query = supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .limit(limit)

    // Add search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Add where clause if provided
    if (whereClause) {
      const [field, value] = whereClause.split('.eq.')
      query = query.eq(field, value)
    }

    // Add filter if provided
    if (filterField && filterValue) {
      query = query.eq(filterField, filterValue)
    }

    // Execute the query with timeout
    const { data, error } = await withTimeout(
      query,
      REQUEST_TIMEOUT,
      `Request timeout fetching ${entityType}`
    )

    if (error) {
      console.error(`[Server] Error fetching ${entityType}:`, error)
      return {
        options: [],
        error: `Error fetching ${entityType}: ${error.message}`
      }
    }

    // Transform data to options format
    const options = data?.map(item => ({
      value: item.id.toString(),
      label: item.name,
      ...item // Include all original data
    })) || []

    // Store the results in the cache
    optionsCache.set(cacheKey, {
      options,
      timestamp: Date.now()
    });

    // Only log in development to reduce noise in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Server] Fetched ${options.length} ${entityType} options - cache key: ${cacheKey}`)
    }

    return { options, error: null }
  } catch (error: any) {
    console.error(`[Server] Unexpected error fetching ${entityType}:`, error)
    return {
      options: [],
      error: `Unexpected error fetching ${entityType}: ${error.message}`
    }
  }
}

/**
 * Server action to create a new dropdown option
 */
export async function createDropdownOption({
  entityType,
  label,
  parentId
}: {
  entityType: EntityType
  label: string
  parentId?: string
}): Promise<{ option: DropdownOption | null, error: string | null }> {
  if (!label || label.trim() === '') {
    return { option: null, error: 'Cannot create option with empty label' }
  }

  try {
    const supabase = await createClient()

    // Determine which table to insert into
    let table = ''
    let data: any = { name: label.trim() }

    switch (entityType) {
      case 'clients':
        table = 'clients'
        break
      case 'categories':
        table = 'categories'
        break
      case 'items':
        table = 'items'
        // For items, we can optionally include a category_id if provided
        if (parentId) {
          data.category_id = parentId
        }
        break
      case 'suppliers':
        table = 'suppliers'
        break
      case 'sizes':
        table = 'sizes'
        break
      default:
        return {
          option: null,
          error: `Unknown entity type: ${entityType}`
        }
    }

    // Insert the new record
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error(`[Server] Error creating ${entityType}:`, error)
      return {
        option: null,
        error: `Error creating ${entityType}: ${error.message}`
      }
    }

    // Create a new option from the inserted data
    const option: DropdownOption = {
      value: result.id.toString(),
      label: result.name,
      ...result // Include all original data
    }

    // Revalidate the path to update any cached data
    revalidatePath('/dashboard')

    return { option, error: null }
  } catch (error: any) {
    console.error(`[Server] Unexpected error creating ${entityType}:`, error)
    return {
      option: null,
      error: `Unexpected error creating ${entityType}: ${error.message}`
    }
  }
}
