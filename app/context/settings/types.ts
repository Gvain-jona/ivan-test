/**
 * Types for the settings context and related functionality
 */

export type ThemeOption = 'light' | 'dark' | 'system';
export type LanguageOption = 'english' | 'spanish' | 'french' | 'german' | 'russian';
export type DateFormatOption = 'mdy' | 'dmy' | 'ymd';
export type TimeFormatOption = '12h' | '24h';
export type TableDensityOption = 'compact' | 'medium' | 'relaxed';
export type AccentColorOption = 'orange' | 'blue' | 'green' | 'purple' | 'pink';
export type CalculationBasisOption = 'unit_price' | 'total_cost';
export type AccountType = 'profit' | 'labor' | 'expense' | 'revenue' | 'custom';
export type TransactionType = 'credit' | 'debit';
export type SourceType = 'order' | 'expense' | 'manual' | 'profit' | 'labor' | 'order_payment';

export interface AppearanceSettings {
  theme: ThemeOption;
  companyName: string;
  companyLogo: string;
}

export interface LayoutSettings {
  compactMode: boolean;
  defaultDashboardView: 'orders' | 'analytics' | 'expenses';
  tableDensity: TableDensityOption;
}

export interface NotificationSettings {
  enabled: boolean;
  emailNotifications: boolean;
  notificationTypes: {
    orderUpdates: boolean;
    expenseAlerts: boolean;
    systemAnnouncements: boolean;
  };
}

export interface LanguageSettings {
  language: LanguageOption;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
}

export interface DataPrivacySettings {
  dataSync: boolean;
  usageDataCollection: boolean;
}

/**
 * Interface for item/category profit override
 */
export interface ProfitOverride {
  id: string;
  type: 'item' | 'category';
  name: string;
  profitPercentage: number;
  laborPercentage?: number;
  lastUpdated: string;
}

/**
 * Interface for profit calculation settings
 */
export interface ProfitSettings {
  enabled: boolean;
  calculationBasis: CalculationBasisOption;
  defaultProfitPercentage: number;
  includeLabor: boolean;
  laborPercentage: number;
  overrides: ProfitOverride[];
}

/**
 * Interface for account
 */
export interface Account {
  id: string;
  name: string;
  description?: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for account transaction
 */
export interface AccountTransaction {
  id: string;
  accountId: string;
  amount: number;
  transactionType: TransactionType;
  sourceType: SourceType;
  sourceId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for account allocation rule
 */
export interface AccountAllocationRule {
  id: string;
  sourceType: SourceType;
  accountId: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for accounts settings
 */
export interface AccountsSettings {
  enableAccountTracking: boolean;
  defaultProfitAccount: string | null;
  defaultLaborAccount: string | null;
  defaultRevenueAccount: string | null;
  defaultExpenseAccount: string | null;
}

export interface UserSettings {
  appearance: AppearanceSettings;
  layout: LayoutSettings;
  notifications: NotificationSettings;
  language: LanguageSettings;
  dataPrivacy: DataPrivacySettings;
  profit?: ProfitSettings;
  accounts?: AccountsSettings;
}

export const defaultSettings: UserSettings = {
  appearance: {
    theme: 'system',
    companyName: 'IVAN PRINTS',
    companyLogo: '/images/default-logo.svg',
  },
  layout: {
    compactMode: false,
    defaultDashboardView: 'orders',
    tableDensity: 'medium',
  },
  notifications: {
    enabled: true,
    emailNotifications: true,
    notificationTypes: {
      orderUpdates: true,
      expenseAlerts: true,
      systemAnnouncements: true,
    },
  },
  language: {
    language: 'english',
    dateFormat: 'mdy',
    timeFormat: '12h',
  },
  dataPrivacy: {
    dataSync: true,
    usageDataCollection: true,
  },
  profit: {
    enabled: false,
    calculationBasis: 'unit_price',
    defaultProfitPercentage: 30,
    includeLabor: false,
    laborPercentage: 10,
    overrides: [],
  },
  accounts: {
    enableAccountTracking: true,
    defaultProfitAccount: null,
    defaultLaborAccount: null,
    defaultRevenueAccount: null,
    defaultExpenseAccount: null,
  },
};

export interface SettingsContextType {
  settings: UserSettings;
  updateSettings: <K extends keyof UserSettings>(
    category: K,
    values: Partial<UserSettings[K]>
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
