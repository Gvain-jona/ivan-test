// Export all loading hooks from a single file
// This makes it easier to import loading hooks

// Export the SWR hooks
export { useLoadingSWR, useFetch } from './useLoadingSWR';

// Export the data hooks
export * from './useData';
