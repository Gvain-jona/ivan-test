'use client';

/**
 * Enhanced fetcher function for SWR with error handling
 * This is used across the application for data fetching with SWR
 */
export const fetcher = async (url: string) => {
  try {
    // Apply different caching strategies based on the endpoint
    const options: RequestInit = {
      // Add headers for better performance
      headers: {
        // Request compressed responses
        'Accept-Encoding': 'gzip, deflate, br',
        // Prefer JSON responses
        'Accept': 'application/json',
        // Add a cache buster for dynamic data to avoid browser cache issues
        ...(url.includes('/api/orders') || url.includes('/api/dashboard') || url.includes('/api/material-purchases')
          ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          : {})
      }
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for 404 errors to handle missing data gracefully
        return [];
      }

      // For other errors, try to get the error message from the response
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Fetch error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    // Log and rethrow errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching ${url}:`, error);
    }
    throw error;
  }
};

/**
 * Post data to an API endpoint
 */
export const poster = async (url: string, data: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`POST error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error posting to ${url}:`, error);
    }
    throw error;
  }
};

/**
 * Update data at an API endpoint
 */
export const updater = async (url: string, data: any) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`PUT error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error updating ${url}:`, error);
    }
    throw error;
  }
};

/**
 * Delete data at an API endpoint
 */
export const deleter = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`DELETE error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error deleting ${url}:`, error);
    }
    throw error;
  }
};
