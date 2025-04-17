// Export all smart combobox components from a single file
// This makes it easier to import them

// Export the base SmartCombobox component
export { SmartCombobox, type SmartComboboxProps, type SmartComboboxOption } from './smart-combobox';

// Export the SWR-based SmartCombobox component
export { SWRSmartCombobox, type EntityType } from './swr-smart-combobox';

// Export the deprecated components (marked as deprecated)
export { GlobalSmartCombobox } from './global-smart-combobox';
export { CachedSmartCombobox } from './cached-smart-combobox';
export { OptimizedSmartCombobox } from './optimized-smart-combobox';
