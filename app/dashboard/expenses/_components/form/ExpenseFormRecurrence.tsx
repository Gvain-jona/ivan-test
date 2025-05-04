import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Control, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { RefreshCw } from 'lucide-react';
import {
  RECURRENCE_FREQUENCIES,
  DAYS_OF_WEEK,
  WEEKS_OF_MONTH,
  MONTHS_OF_YEAR
} from './schema';

interface ExpenseFormRecurrenceProps {
  control: Control<any>;
  isRecurring: boolean;
}

/**
 * Recurrence settings section of the expense form
 * Enhanced with advanced recurrence pattern options
 */
export function ExpenseFormRecurrence({ control, isRecurring }: ExpenseFormRecurrenceProps) {
  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode;

  // Watch all form values at the top level to avoid hook order issues
  const recurrenceFrequency = useWatch({
    control,
    name: "recurrence_frequency",
    defaultValue: "",
  });

  // Watch all other values we need for patterns and summary
  const reminderDays = useWatch({ control, name: "reminder_days" });
  const time = useWatch({ control, name: "recurrence_time" });
  const dayOfWeek = useWatch({ control, name: "recurrence_day_of_week" });
  const dayOfMonth = useWatch({ control, name: "recurrence_day_of_month" });
  const weekOfMonth = useWatch({ control, name: "recurrence_week_of_month" });
  const monthOfYear = useWatch({ control, name: "recurrence_month_of_year" });
  const monthlyRecurrenceType = useWatch({ control, name: "monthly_recurrence_type" });

  // Render specific recurrence pattern options based on frequency
  const renderRecurrencePatternOptions = () => {
    switch (recurrenceFrequency) {
      case 'daily':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Daily Pattern</h4>
            <FormField
              control={control}
              name="recurrence_time"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium">Time of Day (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Set a specific time for this daily expense
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'weekly':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Weekly Pattern</h4>
            <FormField
              control={control}
              name="recurrence_day_of_week"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium">Day of Week</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select day of week" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Which day of the week should this expense recur?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'monthly':
        // Using the monthlyRecurrenceType from the top-level hooks
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Monthly Pattern</h4>

            {/* Radio group for selecting the monthly recurrence type */}
            <FormField
              control={control}
              name="monthly_recurrence_type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-medium">Recurrence Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="day_of_month" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Same day each month
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="day_of_week" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Specific day of a specific week
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show fields based on selected recurrence type */}
            {monthlyRecurrenceType === 'day_of_month' ? (
              <FormField
                control={control}
                name="recurrence_day_of_month"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Day of Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Which day of the month? (1-31)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="recurrence_week_of_month"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Week of Month</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEEKS_OF_MONTH.map((week) => (
                            <SelectItem key={week.value} value={week.value}>
                              {week.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Which week of the month?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="recurrence_day_of_week"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Day of Week</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Which day of the week?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );

      case 'yearly':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Yearly Pattern</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="recurrence_month_of_year"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Month</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS_OF_YEAR.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="recurrence_day_of_month"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render the human-readable recurrence summary
  const renderRecurrenceSummary = () => {
    if (!recurrenceFrequency) return null;

    // Build the summary using the values watched at the top level
    let summary = "This expense will recur ";

    switch (recurrenceFrequency) {
      case 'daily':
        summary += `daily${time ? ` at ${time}` : ''}`;
        break;

      case 'weekly':
        const dayName = DAYS_OF_WEEK.find(d => parseInt(d.value) === dayOfWeek)?.label || '';
        summary += `weekly on ${dayName || 'the selected day'}`;
        break;

      case 'monthly':
        // Using the monthlyRecurrenceType from the top-level hooks
        if (monthlyRecurrenceType === 'day_of_month') {
          summary += `monthly on day ${dayOfMonth || '(select a day)'}`;
        } else if (monthlyRecurrenceType === 'day_of_week') {
          const weekName = WEEKS_OF_MONTH.find(w => parseInt(w.value) === weekOfMonth)?.label || '';
          const dayNameMonthly = DAYS_OF_WEEK.find(d => parseInt(d.value) === dayOfWeek)?.label || '';

          if (weekName && dayNameMonthly) {
            summary += `monthly on the ${weekName.toLowerCase()} ${dayNameMonthly}`;
          } else {
            summary += `monthly on a specific week and day (please complete selection)`;
          }
        } else {
          summary += `monthly (please select recurrence type)`;
        }
        break;

      case 'quarterly':
        summary += `quarterly`;
        if (dayOfMonth) {
          summary += ` on day ${dayOfMonth} of the month`;
        }
        break;

      case 'yearly':
        summary += `yearly`;

        if (monthOfYear && dayOfMonth) {
          const monthName = MONTHS_OF_YEAR.find(m => parseInt(m.value) === monthOfYear)?.label || '';
          summary += ` on ${monthName} ${dayOfMonth}`;
        } else if (monthOfYear) {
          const monthName = MONTHS_OF_YEAR.find(m => parseInt(m.value) === monthOfYear)?.label || '';
          summary += ` in ${monthName}`;
        } else if (dayOfMonth) {
          summary += ` on day ${dayOfMonth}`;
        }
        break;

      default:
        summary += recurrenceFrequency;
    }

    if (reminderDays) {
      summary += `, with a reminder ${reminderDays} day${reminderDays > 1 ? 's' : ''} before`;
    }

    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <p className="text-sm">{summary}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">

      {/* Basic Recurrence Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="recurrence_frequency"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-medium">Frequency</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RECURRENCE_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="reminder_days"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-medium">Reminder (Days Before)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Advanced Pattern Options */}
      {recurrenceFrequency && (
        <Card className="border border-border/50 bg-muted/5">
          <CardContent className="p-4 space-y-4">
            {/* Date Range - Now inside the frequency-specific section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="recurrence_start_date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Frequency-specific options */}
            {renderRecurrencePatternOptions()}

            {/* Summary */}
            {renderRecurrenceSummary()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
