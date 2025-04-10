# Smart Dropdown Component

The Smart Dropdown component is an enhanced version of the standard Combobox that provides additional functionality for searching, selecting, and creating new options. It's designed to be used in forms where users need to select from existing options or create new ones on the fly.

## Features

- **Search functionality**: Users can search through existing options
- **Create new options**: Users can create new options if they don't exist
- **Recently used options**: Tracks and displays recently used options
- **Loading states**: Shows loading indicators during data fetching
- **Keyboard navigation**: Full keyboard support for accessibility
- **Customizable**: Highly customizable appearance and behavior

## Components

### SmartCombobox

The main component that renders the dropdown UI.

```tsx
import { SmartCombobox } from '@/components/ui/smart-combobox';

<SmartCombobox
  options={options}
  value={value}
  onChange={setValue}
  onSearch={handleSearch}
  isLoading={isLoading}
  placeholder="Select or search..."
  allowCreate={true}
  onCreateOption={handleCreateOption}
  entityName="Item"
/>
```

### useSmartDropdown Hook

A custom hook that provides data management for the SmartCombobox component.

```tsx
import { useSmartDropdown } from '@/hooks/useSmartDropdown';

const {
  options,
  recentOptions,
  isLoading,
  searchQuery,
  setSearchQuery,
  createOption,
  refreshOptions,
} = useSmartDropdown({
  entityType: 'categories',
  parentId: selectedCategoryId, // Optional, for related entities
  initialOptions: [], // Optional, for initial data
});
```

## Usage Examples

### Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { useSmartDropdown } from '@/hooks/useSmartDropdown';

export default function CategorySelector() {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const {
    options: categoryOptions,
    isLoading: categoriesLoading,
    setSearchQuery: setCategorySearch,
    createOption: createCategory
  } = useSmartDropdown({
    entityType: 'categories',
  });
  
  const handleCreateCategory = async (value: string) => {
    const newCategory = await createCategory(value);
    if (newCategory) {
      setSelectedCategory(newCategory.value);
      return newCategory;
    }
    return null;
  };
  
  return (
    <div>
      <label>Category</label>
      <SmartCombobox
        options={categoryOptions}
        value={selectedCategory}
        onChange={setSelectedCategory}
        onSearch={setCategorySearch}
        isLoading={categoriesLoading}
        placeholder="Select or search category"
        allowCreate={true}
        onCreateOption={handleCreateCategory}
        entityName="Category"
      />
    </div>
  );
}
```

### Related Dropdowns (Parent-Child)

```tsx
'use client';

import { useState } from 'react';
import { SmartCombobox } from '@/components/ui/smart-combobox';
import { useSmartDropdown } from '@/hooks/useSmartDropdown';

export default function CategoryAndItemSelector() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  const {
    options: categoryOptions,
    isLoading: categoriesLoading,
    setSearchQuery: setCategorySearch,
    createOption: createCategory
  } = useSmartDropdown({
    entityType: 'categories',
  });
  
  const {
    options: itemOptions,
    isLoading: itemsLoading,
    setSearchQuery: setItemSearch,
    createOption: createItem
  } = useSmartDropdown({
    entityType: 'items',
    parentId: selectedCategory, // This filters items by the selected category
  });
  
  const handleCreateCategory = async (value: string) => {
    const newCategory = await createCategory(value);
    if (newCategory) {
      setSelectedCategory(newCategory.value);
      return newCategory;
    }
    return null;
  };
  
  const handleCreateItem = async (value: string) => {
    if (!selectedCategory) return null;
    
    const newItem = await createItem(value);
    if (newItem) {
      setSelectedItem(newItem.value);
      return newItem;
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label>Category</label>
        <SmartCombobox
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          onSearch={setCategorySearch}
          isLoading={categoriesLoading}
          placeholder="Select or search category"
          allowCreate={true}
          onCreateOption={handleCreateCategory}
          entityName="Category"
        />
      </div>
      
      <div>
        <label>Item</label>
        <SmartCombobox
          options={itemOptions}
          value={selectedItem}
          onChange={setSelectedItem}
          onSearch={setItemSearch}
          isLoading={itemsLoading}
          placeholder="Select or search item"
          disabled={!selectedCategory}
          allowCreate={selectedCategory ? true : false}
          onCreateOption={handleCreateItem}
          entityName="Item"
        />
      </div>
    </div>
  );
}
```

## Props

### SmartCombobox Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `SmartComboboxOption[]` | Array of options to display in the dropdown |
| `value` | `string` | Currently selected value |
| `onChange` | `(value: string) => void` | Function called when selection changes |
| `onSearch` | `(value: string) => void` | Function called when search input changes |
| `isLoading` | `boolean` | Whether the dropdown is in a loading state |
| `placeholder` | `string` | Placeholder text when no option is selected |
| `emptyMessage` | `string` | Message to display when no options match the search |
| `createMessage` | `string` | Text for the create option button |
| `className` | `string` | Additional CSS classes |
| `disabled` | `boolean` | Whether the dropdown is disabled |
| `allowCreate` | `boolean` | Whether to allow creating new options |
| `onCreateOption` | `(value: string) => Promise<SmartComboboxOption \| null>` | Function called when creating a new option |
| `searchDebounce` | `number` | Debounce time in ms for search input |
| `recentOptions` | `SmartComboboxOption[]` | Array of recently used options |
| `entityName` | `string` | Name of the entity type (for toast messages) |

### useSmartDropdown Props

| Prop | Type | Description |
|------|------|-------------|
| `entityType` | `'clients' \| 'categories' \| 'items' \| 'suppliers'` | Type of entity to fetch |
| `parentId` | `string` | ID of parent entity (for related entities) |
| `initialOptions` | `SmartComboboxOption[]` | Initial options to display |
| `limit` | `number` | Maximum number of options to fetch |
| `cacheKey` | `string` | Custom key for caching options |
| `filterField` | `string` | Field to filter by |
| `filterValue` | `string` | Value to filter by |

## Implementation Details

The Smart Dropdown system consists of two main parts:

1. **SmartCombobox Component**: A UI component that extends the basic Combobox with additional features like creating new options and displaying loading states.

2. **useSmartDropdown Hook**: A data management hook that handles fetching options from the database, caching, and creating new options.

The system uses localStorage to remember recently used options for a better user experience.

## Database Integration

The Smart Dropdown integrates with your Supabase database to fetch and create options. It supports the following tables:

- `clients`
- `categories`
- `items`
- `suppliers`

When creating new options, it automatically sets appropriate fields like `status` to "active" and handles parent-child relationships (e.g., items belonging to categories).
