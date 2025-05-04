'use client';

import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, Plus, Trash2, Edit2, Save, HelpCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/app/context/settings';
import { CalculationBasisOption, ProfitOverride, ProfitSettings } from '@/app/context/settings/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/app/context/auth-context';
import { SettingSection, SettingItem } from '@/components/settings';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Profit Settings Tab Component
 * Allows configuration of profit calculation settings
 */
export function ProfitSettingsTab() {
  const { settings, updateSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Get profit settings or use defaults
  const profitSettings = settings.profit || {
    calculationBasis: 'unit_price' as CalculationBasisOption,
    defaultProfitPercentage: 30,
    includeLabor: false,
    laborPercentage: 10,
    overrides: [],
  };

  // Local state for form values
  const [localSettings, setLocalSettings] = useState<ProfitSettings>(profitSettings);

  // State for override dialog
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [currentOverride, setCurrentOverride] = useState<ProfitOverride | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingEnabledState, setPendingEnabledState] = useState<boolean | null>(null);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  // Handle form changes
  const handleSettingChange = (field: keyof ProfitSettings, value: any) => {
    // If trying to disable profit calculations and there are overrides, show confirmation dialog
    if (field === 'enabled' && value === false && localSettings.enabled === true && localSettings.overrides.length > 0) {
      setPendingEnabledState(false);
      setIsConfirmDialogOpen(true);
      return;
    }

    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle confirmation dialog result
  const handleConfirmDisable = () => {
    if (pendingEnabledState !== null) {
      setLocalSettings(prev => ({
        ...prev,
        enabled: pendingEnabledState
      }));
      setPendingEnabledState(null);
    }
    setIsConfirmDialogOpen(false);
  };

  // Handle confirmation dialog cancel
  const handleCancelDisable = () => {
    setPendingEnabledState(null);
    setIsConfirmDialogOpen(false);
  };

  // Save settings with optimistic updates
  const saveSettings = async () => {
    // Store the current settings in case we need to revert
    const previousSettings = { ...localSettings };

    // Show optimistic toast
    const { dismiss } = toast({
      title: 'Saving settings...',
      description: 'Your changes are being saved.',
      variant: 'default',
    });

    try {
      // Update settings in the context (this will trigger UI updates immediately)
      await updateSettings('profit', localSettings);

      // Dismiss the "saving" toast and show success toast
      dismiss();
      toast({
        title: 'Settings saved',
        description: 'Profit calculation settings have been updated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving profit settings:', error);

      // Dismiss the "saving" toast and show error toast
      dismiss();
      toast({
        title: 'Error',
        description: 'Failed to save profit calculation settings.',
        variant: 'destructive',
      });

      // Revert to previous settings in the UI
      setLocalSettings(previousSettings);
    }
  };

  // Add or update override with optimistic UI update
  const addOrUpdateOverride = (override: ProfitOverride) => {
    // Create a new override with a UUID if it's a new override
    const updatedOverride = isEditMode
      ? { ...override, lastUpdated: new Date().toISOString() }
      : { ...override, id: crypto.randomUUID(), lastUpdated: new Date().toISOString() };

    // Update the local state optimistically
    const newOverrides = isEditMode
      ? localSettings.overrides.map(o => o.id === updatedOverride.id ? updatedOverride : o)
      : [...localSettings.overrides, updatedOverride];

    setLocalSettings(prev => ({
      ...prev,
      overrides: newOverrides
    }));

    // Show a toast notification
    toast({
      title: isEditMode ? 'Override updated' : 'Override added',
      description: `${updatedOverride.type} override for "${updatedOverride.name}" has been ${isEditMode ? 'updated' : 'added'}.`,
      variant: 'default',
    });

    // Close the dialog and reset state
    setIsOverrideDialogOpen(false);
    setCurrentOverride(null);
    setIsEditMode(false);
  };

  // Delete override with optimistic UI update
  const deleteOverride = (id: string) => {
    // Find the override to be deleted (for the toast message)
    const overrideToDelete = localSettings.overrides.find(o => o.id === id);

    // Update the local state optimistically
    setLocalSettings(prev => ({
      ...prev,
      overrides: prev.overrides.filter(o => o.id !== id)
    }));

    // Show a toast notification
    if (overrideToDelete) {
      toast({
        title: 'Override deleted',
        description: `${overrideToDelete.type} override for "${overrideToDelete.name}" has been removed.`,
        variant: 'default',
      });
    }
  };

  // Edit override
  const editOverride = (override: ProfitOverride) => {
    setCurrentOverride(override);
    setIsEditMode(true);
    setIsOverrideDialogOpen(true);
  };

  // Show a loading skeleton when settings are loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-6 animate-pulse">
          <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
          <div className="h-4 w-2/3 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
        <div className="rounded-lg border p-6 animate-pulse">
          <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
          <div className="h-4 w-2/3 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Profit Settings Section */}
      <SettingSection
        title="Profit Calculation Settings"
        description="Configure how profit is calculated for all orders"
        icon={Calculator}
        footer={
          <Button onClick={saveSettings} disabled={isLoading} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Enable Profit Calculations */}
          <SettingItem
            title="Enable Profit Calculations"
            description={
              localSettings.enabled
                ? "Profit calculations are currently enabled"
                : "Profit calculations are currently disabled - no profit or labor amounts will be calculated"
            }
          >
            <div className="flex items-center gap-2">
              <Switch
                id="enableProfitCalculations"
                disabled={!isAdmin}
                checked={localSettings.enabled}
                onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
              />
              <span className={`text-xs font-medium ${localSettings.enabled ? 'text-green-500' : 'text-amber-500'}`}>
                {localSettings.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </SettingItem>

          {!localSettings.enabled && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4 mt-2">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Profit Calculations Disabled</h3>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    <p>When profit calculations are disabled:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>No profit or labor amounts will be calculated for any orders</li>
                      <li>Profit and labor fields will show zero values</li>
                      <li>No profit or labor allocations will be made to accounts</li>
                    </ul>
                    <p className="mt-2">Enable profit calculations to start tracking profit and labor amounts.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {localSettings.enabled && (
            <>
              {/* Calculation Basis */}
              <SettingItem
                title="Calculation Basis"
                description={
                  localSettings.calculationBasis === 'unit_price'
                    ? 'Profit percentage will be applied to the unit price of each item'
                    : 'Profit percentage will be applied to the total cost of the order'
                }
              >
                <Select
                  disabled={!isAdmin}
                  value={localSettings.calculationBasis}
                  onValueChange={(value) => handleSettingChange('calculationBasis', value as CalculationBasisOption)}
                >
                  <SelectTrigger id="calculationBasis" className="w-[200px]">
                    <SelectValue placeholder="Select calculation basis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit_price">Unit Price</SelectItem>
                    <SelectItem value="total_cost">Total Cost</SelectItem>
                  </SelectContent>
                </Select>
              </SettingItem>

              {/* Default Profit Percentage */}
              <SettingItem
                title="Default Profit Percentage"
                description="Default profit percentage applied to all items without specific overrides"
              >
                <div className="flex items-center space-x-2">
                  <Input
                    id="defaultProfitPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={!isAdmin}
                    value={localSettings.defaultProfitPercentage}
                    onChange={(e) => handleSettingChange('defaultProfitPercentage', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </SettingItem>

              {/* Include Labor */}
              <SettingItem
                title="Include Labor Costs"
                description="Track labor costs as a percentage of production cost"
              >
                <Switch
                  id="includeLabor"
                  disabled={!isAdmin}
                  checked={localSettings.includeLabor}
                  onCheckedChange={(checked) => handleSettingChange('includeLabor', checked)}
                />
              </SettingItem>

              {/* Labor Percentage (conditional) */}
              {localSettings.includeLabor && (
                <SettingItem
                  title="Labor Percentage"
                  description="Percentage of production cost allocated to labor"
                >
                  <div className="flex items-center space-x-2">
                    <Input
                      id="laborPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={!isAdmin}
                      value={localSettings.laborPercentage}
                      onChange={(e) => handleSettingChange('laborPercentage', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </SettingItem>
              )}
            </>
          )}
        </div>
      </SettingSection>

      {/* Item/Category Overrides Section - Only show if profit calculations are enabled */}
      {localSettings.enabled && (
        <SettingSection
          title="Item/Category Overrides"
          description="Set specific profit percentages for individual items or categories"
          icon={DollarSign}
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentOverride(null);
                      setIsEditMode(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Override
                  </Button>
                </DialogTrigger>
                <OverrideDialog
                  override={currentOverride}
                  isEditMode={isEditMode}
                  includeLabor={localSettings.includeLabor}
                  onSave={addOrUpdateOverride}
                  onCancel={() => {
                    setIsOverrideDialogOpen(false);
                    setCurrentOverride(null);
                    setIsEditMode(false);
                  }}
                />
              </Dialog>
            </div>

            {localSettings.overrides.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No overrides configured. Add an override to set specific profit percentages.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Profit %</TableHead>
                      {localSettings.includeLabor && <TableHead>Labor %</TableHead>}
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localSettings.overrides.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell className="capitalize">{override.type}</TableCell>
                        <TableCell>{override.name}</TableCell>
                        <TableCell>{override.profitPercentage}%</TableCell>
                        {localSettings.includeLabor && (
                          <TableCell>{override.laborPercentage || '-'}%</TableCell>
                        )}
                        <TableCell>{new Date(override.lastUpdated).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editOverride(override)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOverride(override.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SettingSection>
      )}

      {/* Explanation Section - Only show if profit calculations are enabled */}
      {localSettings.enabled && (
        <SettingSection
          title="How Profit Calculation Works"
          icon={HelpCircle}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="explanation" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Click to show/hide explanation
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <p>
                  <strong>Unit Price Basis:</strong> Profit is calculated as a percentage of each item's unit price.
                  For example, if an item costs 200 USH and the profit percentage is 20%, the profit amount is 40 USH per item.
                </p>
                <p>
                  <strong>Total Cost Basis:</strong> Profit is calculated as a percentage of the total order cost.
                  For example, if 10 items cost 2000 USH total and the profit percentage is 20%, the profit amount is 400 USH for the order.
                </p>
                {localSettings.includeLabor && (
                  <p>
                    <strong>Labor Cost:</strong> Labor is calculated as a percentage of the production cost (unit price minus profit).
                    For example, if an item costs 200 USH, profit is 40 USH, and labor percentage is 10%, the labor amount is 16 USH.
                  </p>
                )}
                <p>
                  <strong>Overrides:</strong> Item or category-specific profit percentages take precedence over the default percentage.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SettingSection>
      )}

      {/* Confirmation Dialog for Disabling Profit Calculations */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Disable Profit Calculations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                You have {localSettings.overrides.length} custom profit overrides configured.
                Disabling profit calculations will not delete these overrides, but they will not be applied
                until you enable profit calculations again.
              </p>
              <p>
                Are you sure you want to disable profit calculations?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDisable}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDisable}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Disable Profit Calculations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Dialog for adding or editing overrides
 */
function OverrideDialog({
  override,
  isEditMode,
  includeLabor,
  onSave,
  onCancel
}: {
  override: ProfitOverride | null;
  isEditMode: boolean;
  includeLabor: boolean;
  onSave: (override: ProfitOverride) => void;
  onCancel: () => void;
}) {
  // Get current settings to check for duplicate names
  const { settings } = useSettings();
  const [type, setType] = useState<'item' | 'category'>(override?.type || 'item');
  const [name, setName] = useState(override?.name || '');
  const [profitPercentage, setProfitPercentage] = useState(override?.profitPercentage || 0);
  const [laborPercentage, setLaborPercentage] = useState(override?.laborPercentage || 0);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [profitError, setProfitError] = useState<string | null>(null);
  const [laborError, setLaborError] = useState<string | null>(null);

  // Validate name when it changes
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }

    // Check for minimum length
    if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }

    // Check for duplicate names
    const existingOverrides = settings.profit?.overrides || [];
    const isDuplicate = existingOverrides.some(o =>
      o.type === type &&
      o.name.toLowerCase() === value.trim().toLowerCase() &&
      (!isEditMode || o.id !== override?.id)
    );

    if (isDuplicate) {
      setNameError(`A ${type} with this name already exists`);
      return false;
    }

    setNameError(null);
    return true;
  };

  // Validate profit percentage when it changes
  const validateProfitPercentage = (value: number) => {
    if (value < 0) {
      setProfitError('Profit percentage cannot be negative');
      return false;
    }

    if (value > 100) {
      setProfitError('Profit percentage cannot exceed 100%');
      return false;
    }

    setProfitError(null);
    return true;
  };

  // Validate labor percentage when it changes
  const validateLaborPercentage = (value: number) => {
    if (value < 0) {
      setLaborError('Labor percentage cannot be negative');
      return false;
    }

    if (value > 100) {
      setLaborError('Labor percentage cannot exceed 100%');
      return false;
    }

    setLaborError(null);
    return true;
  };

  // Handle name change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  // Handle profit percentage change with validation
  const handleProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setProfitPercentage(value);
    validateProfitPercentage(value);
  };

  // Handle labor percentage change with validation
  const handleLaborChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setLaborPercentage(value);
    validateLaborPercentage(value);
  };

  const handleSave = () => {
    // Validate all fields before saving
    const isNameValid = validateName(name);
    const isProfitValid = validateProfitPercentage(profitPercentage);
    const isLaborValid = includeLabor ? validateLaborPercentage(laborPercentage) : true;

    if (!isNameValid || !isProfitValid || !isLaborValid) {
      return;
    }

    onSave({
      id: override?.id || '',
      type,
      name,
      profitPercentage,
      laborPercentage: includeLabor ? laborPercentage : undefined,
      lastUpdated: new Date().toISOString()
    });
  };

  return (
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Override' : 'Add Override'}</DialogTitle>
        <DialogDescription>
          Set specific profit percentages for an item or category
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as 'item' | 'category');
              // Revalidate name when type changes to check for duplicates in the new type
              if (name) {
                setTimeout(() => validateName(name), 0);
              }
            }}
          >
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder={type === 'item' ? 'Item name' : 'Category name'}
            className={nameError ? 'border-red-500' : ''}
          />
          {nameError && (
            <p className="text-xs text-red-500">{nameError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Profit Percentage */}
          <div className="space-y-2">
            <Label htmlFor="profitPercentage">Profit %</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="profitPercentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={profitPercentage}
                onChange={handleProfitChange}
                className={profitError ? 'border-red-500' : ''}
              />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            {profitError && (
              <p className="text-xs text-red-500">{profitError}</p>
            )}
          </div>

          {/* Labor Percentage (conditional) */}
          {includeLabor && (
            <div className="space-y-2">
              <Label htmlFor="laborPercentage">Labor %</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="laborPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={laborPercentage}
                  onChange={handleLaborChange}
                  className={laborError ? 'border-red-500' : ''}
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              {laborError && (
                <p className="text-xs text-red-500">{laborError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name || !!nameError || !!profitError || (includeLabor && !!laborError)}
        >
          {isEditMode ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default ProfitSettingsTab;
