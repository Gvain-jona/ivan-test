import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, Loader2, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Expense } from '@/hooks/expenses';
import {
  RECURRENCE_FREQUENCIES,
  DAYS_OF_WEEK,
  WEEKS_OF_MONTH,
  MONTHS_OF_YEAR
} from '../form/schema';
import { toast } from 'sonner';

interface EditRecurringExpenseFormProps {
  expense: Expense;
  onSubmit: (updatedExpense: Partial<Expense>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EditRecurringExpenseForm: React.FC<EditRecurringExpenseFormProps> = ({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    id: expense.id,
    is_recurring: expense.is_recurring || false,
    recurrence_frequency: expense.recurrence_frequency || 'monthly',
    recurrence_start_date: expense.recurrence_start_date || new Date().toISOString(),
    recurrence_end_date: expense.recurrence_end_date || undefined,
    recurrence_day_of_month: expense.recurrence_day_of_month || new Date().getDate(),
    recurrence_month_of_year: expense.recurrence_month_of_year || new Date().getMonth() + 1,
    recurrence_day_of_week: expense.recurrence_day_of_week || new Date().getDay(),
    recurrence_week_of_month: expense.recurrence_week_of_month || Math.ceil(new Date().getDate() / 7),
    recurrence_time: expense.recurrence_time || undefined,
    monthly_recurrence_type: expense.monthly_recurrence_type || 'day_of_month',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Expense, string>>>({});

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_recurring: checked
    }));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    } else if (type === 'date') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? new Date(value).toISOString() : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle number select change
  const handleNumberSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors: Partial<Record<keyof Expense, string>> = {};

    if (formData.is_recurring) {
      // Validate frequency
      if (!formData.recurrence_frequency) {
        errors.recurrence_frequency = 'Frequency is required';
      }

      // Validate start date
      if (!formData.recurrence_start_date) {
        errors.recurrence_start_date = 'Start date is required';
      }

      // Validate end date is after start date
      if (formData.recurrence_end_date && formData.recurrence_start_date) {
        const startDate = new Date(formData.recurrence_start_date);
        const endDate = new Date(formData.recurrence_end_date);
        if (endDate <= startDate) {
          errors.recurrence_end_date = 'End date must be after start date';
        }
      }

      // Validate frequency-specific fields
      if (formData.recurrence_frequency === 'weekly') {
        if (formData.recurrence_day_of_week === undefined) {
          errors.recurrence_day_of_week = 'Day of week is required for weekly recurrence';
        }
      } else if (formData.recurrence_frequency === 'monthly') {
        if (!formData.monthly_recurrence_type) {
          errors.monthly_recurrence_type = 'Please select a monthly recurrence type';
        } else if (formData.monthly_recurrence_type === 'day_of_month') {
          if (!formData.recurrence_day_of_month) {
            errors.recurrence_day_of_month = 'Day of month is required';
          } else if (formData.recurrence_day_of_month < 1 || formData.recurrence_day_of_month > 31) {
            errors.recurrence_day_of_month = 'Day of month must be between 1 and 31';
          }
        } else if (formData.monthly_recurrence_type === 'day_of_week') {
          if (formData.recurrence_day_of_week === undefined) {
            errors.recurrence_day_of_week = 'Day of week is required';
          }
          if (!formData.recurrence_week_of_month) {
            errors.recurrence_week_of_month = 'Week of month is required';
          }
        }
      } else if (formData.recurrence_frequency === 'yearly') {
        if (!formData.recurrence_month_of_year) {
          errors.recurrence_month_of_year = 'Month is required for yearly recurrence';
        }
        if (!formData.recurrence_day_of_month) {
          errors.recurrence_day_of_month = 'Day of month is required for yearly recurrence';
        } else if (formData.recurrence_day_of_month < 1 || formData.recurrence_day_of_month > 31) {
          errors.recurrence_day_of_month = 'Day of month must be between 1 and 31';
        }

        // Check if the day is valid for the selected month
        if (formData.recurrence_month_of_year && formData.recurrence_day_of_month) {
          const year = new Date().getFullYear();
          const month = formData.recurrence_month_of_year - 1; // 0-based month
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

          if (formData.recurrence_day_of_month > lastDayOfMonth) {
            errors.recurrence_day_of_month = `The selected month has only ${lastDayOfMonth} days`;
          }
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate the form
    if (!validateForm()) {
      // Show error toast for validation errors
      const errorMessages = Object.values(formErrors).join(', ');
      toast.error(`Please fix the following errors: ${errorMessages}`);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error updating recurring expense settings:', error);
      toast.error('Failed to update recurring settings');
    }
  };

  // Render recurrence pattern options based on frequency
  const renderRecurrencePatternOptions = () => {
    switch (formData.recurrence_frequency) {
      case 'daily':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Daily Pattern</h4>
            <div>
              <Label htmlFor="recurrence_time">Time of Day (Optional)</Label>
              <Input
                id="recurrence_time"
                name="recurrence_time"
                type="time"
                value={formData.recurrence_time || ''}
                onChange={handleInputChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set a specific time for this daily expense
              </p>
            </div>
          </div>
        );

      case 'weekly':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Weekly Pattern</h4>
            <div>
              <Label htmlFor="recurrence_day_of_week">Day of Week</Label>
              <Select
                value={formData.recurrence_day_of_week?.toString() || '0'}
                onValueChange={(value) => handleNumberSelectChange('recurrence_day_of_week', value)}
              >
                <SelectTrigger id="recurrence_day_of_week" className="mt-1">
                  <SelectValue placeholder="Select day of week" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Which day of the week should this expense recur?
              </p>
            </div>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Monthly Pattern</h4>

            <div>
              <Label className="font-medium">Recurrence Type</Label>
              <RadioGroup
                value={formData.monthly_recurrence_type || 'day_of_month'}
                onValueChange={(value) => handleSelectChange('monthly_recurrence_type', value)}
                className="flex flex-col space-y-1 mt-1"
              >
                <div className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="day_of_month" id="day_of_month" />
                  <Label htmlFor="day_of_month" className="font-normal">
                    Same day each month
                  </Label>
                </div>
                <div className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="day_of_week" id="day_of_week" />
                  <Label htmlFor="day_of_week" className="font-normal">
                    Specific day of a specific week
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.monthly_recurrence_type === 'day_of_month' ? (
              <div>
                <Label htmlFor="recurrence_day_of_month">Day of Month</Label>
                <Input
                  id="recurrence_day_of_month"
                  name="recurrence_day_of_month"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.recurrence_day_of_month || 1}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Which day of the month? (1-31)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrence_week_of_month">Week of Month</Label>
                  <Select
                    value={formData.recurrence_week_of_month?.toString() || '1'}
                    onValueChange={(value) => handleNumberSelectChange('recurrence_week_of_month', value)}
                  >
                    <SelectTrigger id="recurrence_week_of_month" className="mt-1">
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKS_OF_MONTH.map((week) => (
                        <SelectItem key={week.value} value={week.value}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recurrence_day_of_week">Day of Week</Label>
                  <Select
                    value={formData.recurrence_day_of_week?.toString() || '0'}
                    onValueChange={(value) => handleNumberSelectChange('recurrence_day_of_week', value)}
                  >
                    <SelectTrigger id="recurrence_day_of_week" className="mt-1">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );

      case 'yearly':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Yearly Pattern</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurrence_month_of_year">Month</Label>
                <Select
                  value={formData.recurrence_month_of_year?.toString() || '1'}
                  onValueChange={(value) => handleNumberSelectChange('recurrence_month_of_year', value)}
                >
                  <SelectTrigger id="recurrence_month_of_year" className="mt-1">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_OF_YEAR.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurrence_day_of_month">Day</Label>
                <Input
                  id="recurrence_day_of_month"
                  name="recurrence_day_of_month"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.recurrence_day_of_month || 1}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recurring Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
        <div className="space-y-1">
          <div>
            <Label className="font-medium">Enable Recurring</Label>
            <p className="text-xs text-muted-foreground">
              Turn on for expenses that repeat regularly
            </p>
          </div>
        </div>
        <Switch
          checked={formData.is_recurring}
          onCheckedChange={handleToggleChange}
        />
      </div>

      {formData.is_recurring && (
        <div className="space-y-6">
          {/* Basic Recurrence Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-1">
                <Label htmlFor="recurrence_frequency">Frequency</Label>
                <Select
                  value={formData.recurrence_frequency || 'monthly'}
                  onValueChange={(value) => handleSelectChange('recurrence_frequency', value)}
                >
                  <SelectTrigger
                    id="recurrence_frequency"
                    className={`mt-1 ${formErrors.recurrence_frequency ? 'border-red-500' : ''}`}
                  >
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.recurrence_frequency && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.recurrence_frequency}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="recurrence_start_date">Start Date</Label>
              <Input
                id="recurrence_start_date"
                name="recurrence_start_date"
                type="date"
                value={formData.recurrence_start_date ? format(new Date(formData.recurrence_start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                onChange={handleInputChange}
                className={`mt-1 ${formErrors.recurrence_start_date ? 'border-red-500' : ''}`}
              />
              {formErrors.recurrence_start_date && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.recurrence_start_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                The date when the recurrence pattern begins
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="recurrence_end_date">End Date (Optional)</Label>
              <Input
                id="recurrence_end_date"
                name="recurrence_end_date"
                type="date"
                value={formData.recurrence_end_date ? format(new Date(formData.recurrence_end_date), 'yyyy-MM-dd') : ''}
                onChange={handleInputChange}
                className={`mt-1 ${formErrors.recurrence_end_date ? 'border-red-500' : ''}`}
              />
              {formErrors.recurrence_end_date && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.recurrence_end_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                The date when the recurrence pattern stops (leave empty for indefinite)
              </p>
            </div>
          </div>

          <Separator />

          {/* Frequency-specific options */}
          {renderRecurrencePatternOptions()}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditRecurringExpenseForm;
