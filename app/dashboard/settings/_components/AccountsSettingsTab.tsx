'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Edit2, RefreshCw, DollarSign, BarChart4, ArrowUp, ArrowDown, Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/app/context/settings';
import { useAuth } from '@/app/context/auth-context';
import {
  Account,
  AccountType,
  AccountsSettings
} from '@/app/context/settings/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format } from 'date-fns';

/**
 * Accounts Settings Tab Component
 * Allows configuration of financial accounts and allocation rules
 */
export function AccountsSettingsTab() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Local state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Transactions modal state
  const [isTransactionsSheetOpen, setIsTransactionsSheetOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Allocation rules state
  const [allocationRules, setAllocationRules] = useState<any[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);

  // Get accounts settings or use defaults
  const accountsSettings = settings.accounts || {
    enableAccountTracking: true,
    defaultProfitAccount: null,
    defaultLaborAccount: null,
    defaultRevenueAccount: null,
    defaultExpenseAccount: null,
  };

  // Local state for settings
  const [localSettings, setLocalSettings] = useState<AccountsSettings>(accountsSettings);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const canEdit = isAdmin || isManager;

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
    fetchAllocationRules();
  }, []);

  // Fetch transactions when selectedAccountId changes
  useEffect(() => {
    if (selectedAccountId && isTransactionsSheetOpen) {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, isTransactionsSheetOpen]);

  // Fetch accounts from the API
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/accounts');

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        description: account.description || '',
        accountType: account.account_type as AccountType,
        balance: account.balance,
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      })));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions for an account
  const fetchTransactions = async (accountId: string) => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/transactions`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Open transactions sheet for an account
  const openTransactionsSheet = (account: Account) => {
    setSelectedAccountId(account.id);
    setIsTransactionsSheetOpen(true);
  };

  // Fetch allocation rules from the API
  const fetchAllocationRules = async () => {
    setIsLoadingRules(true);
    try {
      const response = await fetch('/api/account-rules');

      if (!response.ok) {
        throw new Error('Failed to fetch allocation rules');
      }

      const data = await response.json();
      setAllocationRules(data.rules);
    } catch (error) {
      console.error('Error fetching allocation rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch allocation rules',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRules(false);
    }
  };

  // Handle settings change
  const handleSettingChange = (field: keyof AccountsSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save settings
  const saveSettings = async () => {
    try {
      await updateSettings('accounts', localSettings);
      toast({
        title: 'Settings saved',
        description: 'Account settings have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving account settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save account settings.',
        variant: 'destructive',
      });
    }
  };

  // Get account type badge color
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case 'profit':
        return 'bg-green-500';
      case 'labor':
        return 'bg-blue-500';
      case 'expense':
        return 'bg-red-500';
      case 'revenue':
        return 'bg-yellow-500';
      case 'custom':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Accounts Settings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchAccounts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={settingsLoading}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            General Account Settings
          </CardTitle>
          <CardDescription>
            Configure how financial accounts are tracked in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Account Tracking */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="enableAccountTracking">Enable Account Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track financial transactions in separate accounts
              </p>
            </div>
            <Switch
              id="enableAccountTracking"
              disabled={!isAdmin}
              checked={localSettings.enableAccountTracking}
              onCheckedChange={(checked) => handleSettingChange('enableAccountTracking', checked)}
            />
          </div>

          {/* Default Accounts */}
          {localSettings.enableAccountTracking && (
            <>
              <div className="space-y-2">
                <Label htmlFor="defaultProfitAccount">Default Profit Account</Label>
                <Select
                  disabled={!isAdmin}
                  value={localSettings.defaultProfitAccount || 'none'}
                  onValueChange={(value) => handleSettingChange('defaultProfitAccount', value === 'none' ? null : value)}
                >
                  <SelectTrigger id="defaultProfitAccount" className="w-full">
                    <SelectValue placeholder="Select profit account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts
                      .filter(account => account.isActive)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLaborAccount">Default Labor Account</Label>
                <Select
                  disabled={!isAdmin}
                  value={localSettings.defaultLaborAccount || 'none'}
                  onValueChange={(value) => handleSettingChange('defaultLaborAccount', value === 'none' ? null : value)}
                >
                  <SelectTrigger id="defaultLaborAccount" className="w-full">
                    <SelectValue placeholder="Select labor account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts
                      .filter(account => account.isActive)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRevenueAccount">Default Revenue Account</Label>
                <Select
                  disabled={!isAdmin}
                  value={localSettings.defaultRevenueAccount || 'none'}
                  onValueChange={(value) => handleSettingChange('defaultRevenueAccount', value === 'none' ? null : value)}
                >
                  <SelectTrigger id="defaultRevenueAccount" className="w-full">
                    <SelectValue placeholder="Select revenue account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts
                      .filter(account => account.isActive)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultExpenseAccount">Default Expense Account</Label>
                <Select
                  disabled={!isAdmin}
                  value={localSettings.defaultExpenseAccount || 'none'}
                  onValueChange={(value) => handleSettingChange('defaultExpenseAccount', value === 'none' ? null : value)}
                >
                  <SelectTrigger id="defaultExpenseAccount" className="w-full">
                    <SelectValue placeholder="Select expense account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts
                      .filter(account => account.isActive)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Accounts Management Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Financial Accounts
            </CardTitle>
            {canEdit && (
              <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentAccount(null);
                      setIsEditMode(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <AccountDialog
                  account={currentAccount}
                  isEditMode={isEditMode}
                  onSave={async (account) => {
                    try {
                      const url = isEditMode ? `/api/accounts/${account.id}` : '/api/accounts';
                      const method = isEditMode ? 'PUT' : 'POST';

                      const response = await fetch(url, {
                        method,
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          name: account.name,
                          description: account.description,
                          account_type: account.accountType,
                          is_active: account.isActive,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to save account');
                      }

                      toast({
                        title: isEditMode ? 'Account updated' : 'Account created',
                        description: isEditMode
                          ? `Account "${account.name}" has been updated.`
                          : `Account "${account.name}" has been created.`,
                        variant: 'default',
                      });

                      setIsAccountDialogOpen(false);
                      await fetchAccounts();
                    } catch (error) {
                      console.error('Error saving account:', error);
                      toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to save account',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onCancel={() => {
                    setIsAccountDialogOpen(false);
                    setCurrentAccount(null);
                    setIsEditMode(false);
                  }}
                />
              </Dialog>
            )}
          </div>
          <CardDescription>
            Manage financial accounts for tracking different types of funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No accounts configured. Add an account to start tracking funds.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge className={`${getAccountTypeColor(account.accountType)} text-white`}>
                        {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.balance.toLocaleString()} USh</TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTransactionsSheet(account)}
                        >
                          <BarChart4 className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentAccount(account);
                                setIsEditMode(true);
                                setIsAccountDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete the account "${account.name}"? This action cannot be undone.`)) {
                                  return;
                                }

                                try {
                                  const response = await fetch(`/api/accounts/${account.id}`, {
                                    method: 'DELETE',
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to delete account');
                                  }

                                  toast({
                                    title: 'Account deleted',
                                    description: `Account "${account.name}" has been deleted.`,
                                    variant: 'default',
                                  });

                                  await fetchAccounts();
                                } catch (error) {
                                  console.error('Error deleting account:', error);
                                  toast({
                                    title: 'Error',
                                    description: error instanceof Error ? error.message : 'Failed to delete account',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Allocation Rules Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-orange-500" />
              Allocation Rules
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setIsRuleDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            )}
          </div>
          <CardDescription>
            Configure rules for automatic allocation of funds to accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRules ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : allocationRules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No allocation rules configured. Add a rule to automatically allocate funds to accounts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocationRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium capitalize">
                      {rule.source_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      {rule.accounts?.name || 'Unknown Account'}
                    </TableCell>
                    <TableCell>{rule.percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Will implement in the next step
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete this allocation rule? This action cannot be undone.`)) {
                                  return;
                                }

                                try {
                                  const response = await fetch(`/api/account-rules/${rule.id}`, {
                                    method: 'DELETE',
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to delete rule');
                                  }

                                  toast({
                                    title: 'Rule deleted',
                                    description: 'The allocation rule has been deleted.',
                                    variant: 'default',
                                  });

                                  await fetchAllocationRules();
                                } catch (error) {
                                  console.error('Error deleting rule:', error);
                                  toast({
                                    title: 'Error',
                                    description: error instanceof Error ? error.message : 'Failed to delete rule',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Allocation Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Allocation Rule</DialogTitle>
            <DialogDescription>
              Create a rule to automatically allocate funds to an account
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Source Type Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sourceType" className="text-right">
                Source Type
              </Label>
              <Select defaultValue="profit">
                <SelectTrigger id="sourceType" className="col-span-3">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="order_payment">Order Payment</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">
                Account
              </Label>
              <Select defaultValue={accounts.filter(account => account.isActive)[0]?.id || 'placeholder'}>
                <SelectTrigger id="accountId" className="col-span-3">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(account => account.isActive).length > 0 ? (
                    accounts
                      .filter(account => account.isActive)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="placeholder" disabled>
                      No active accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Percentage Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentage" className="text-right">
                Percentage
              </Label>
              <div className="col-span-3 flex items-center">
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="100"
                  className="mr-2"
                />
                <span>%</span>
              </div>
            </div>

            {/* Is Active Toggle */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isActive"
                  defaultChecked={true}
                />
                <Label htmlFor="isActive" className="text-sm text-muted-foreground">
                  Rule is active
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: 'Feature coming soon',
                description: 'Adding allocation rules will be implemented in a future update.',
                variant: 'default',
              });
              setIsRuleDialogOpen(false);
            }}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Sheet */}
      <Sheet open={isTransactionsSheetOpen} onOpenChange={setIsTransactionsSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {selectedAccountId && accounts.find(a => a.id === selectedAccountId)?.name} Transactions
            </SheetTitle>
            <SheetDescription>
              View all transactions for this account
            </SheetDescription>
          </SheetHeader>

          {/* Add Transaction Form */}
          {canEdit && selectedAccountId && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Manual Transaction</CardTitle>
                <CardDescription>
                  Add a manual transaction to this account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddTransactionForm
                  accountId={selectedAccountId}
                  onSuccess={() => {
                    fetchTransactions(selectedAccountId);
                    fetchAccounts(); // Refresh account balances
                  }}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Transaction History</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedAccountId && fetchTransactions(selectedAccountId)}
                disabled={isLoadingTransactions}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No transactions found for this account.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
                        <div className={`mr-4 rounded-full p-2 ${transaction.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.transaction_type === 'credit' ? (
                            <ArrowUp className={`h-4 w-4 ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`} />
                          ) : (
                            <ArrowDown className={`h-4 w-4 ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {transaction.description || `${transaction.transaction_type === 'credit' ? 'Credit' : 'Debit'} from ${transaction.source_type}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), 'PPP')}
                          </div>
                        </div>
                        <div className={`font-medium ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} USh
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Dialog for adding or editing accounts
 */
function AccountDialog({
  account,
  isEditMode,
  onSave,
  onCancel
}: {
  account: Account | null;
  isEditMode: boolean;
  onSave: (account: Account) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(account?.name || '');
  const [description, setDescription] = useState(account?.description || '');
  const [accountType, setAccountType] = useState<AccountType>(account?.accountType || 'custom');
  const [isActive, setIsActive] = useState(account?.isActive !== false);

  const handleSave = () => {
    if (!name) return;

    onSave({
      id: account?.id || '',
      name,
      description,
      accountType,
      balance: account?.balance || 0,
      isActive,
      createdAt: account?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? 'Update account details' : 'Create a new financial account'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Name Input */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            placeholder="Account name"
          />
        </div>

        {/* Description Input */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
            placeholder="Account description (optional)"
          />
        </div>

        {/* Account Type Selection */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="accountType" className="text-right">
            Type
          </Label>
          <Select value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
            <SelectTrigger id="accountType" className="col-span-3">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="labor">Labor</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Is Active Toggle */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isActive" className="text-right">
            Active
          </Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="text-sm text-muted-foreground">
              {isActive ? 'Account is active' : 'Account is inactive'}
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name}>
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Form for adding a manual transaction
 */
function AddTransactionForm({
  accountId,
  onSuccess
}: {
  accountId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/accounts/${accountId}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transaction_type: transactionType,
          source_type: 'manual',
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add transaction');
      }

      toast({
        title: 'Transaction added',
        description: 'The transaction has been added successfully.',
        variant: 'default',
      });

      // Reset form
      setAmount('');
      setDescription('');

      // Notify parent
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USh)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transactionType">Transaction Type</Label>
          <Select value={transactionType} onValueChange={(value) => setTransactionType(value as 'credit' | 'debit')}>
            <SelectTrigger id="transactionType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit (Add Funds)</SelectItem>
              <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Transaction'
        )}
      </Button>
    </form>
  );
}

export default AccountsSettingsTab;
