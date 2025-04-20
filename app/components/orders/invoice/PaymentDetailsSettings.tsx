import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CreditCard, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceSettings, BankDetail, MobileMoneyDetail } from './types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Component for managing payment details in the invoice settings
 */
const PaymentDetailsSettings: React.FC = () => {
  const { control, register } = useFormContext<InvoiceSettings>();

  // Bank details field array
  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank
  } = useFieldArray({
    control,
    name: 'bankDetails'
  });

  // Mobile money field array
  const {
    fields: mobileFields,
    append: appendMobile,
    remove: removeMobile
  } = useFieldArray({
    control,
    name: 'mobileMoneyDetails'
  });

  // Add a new bank detail
  const handleAddBank = () => {
    appendBank({
      id: uuidv4(),
      bankName: '',
      accountName: '',
      accountNumber: ''
    });
  };

  // Add a new mobile money detail
  const handleAddMobile = () => {
    appendMobile({
      id: uuidv4(),
      provider: '',
      phoneNumber: '',
      contactName: ''
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground text-sm">
        Add payment details that will appear on your invoices. These details help your clients know how to pay you.
      </p>

      {/* Bank Details Section */}
      <Card className="border-border/40 bg-background/50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-medium">Bank Details</CardTitle>
              {bankFields.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {bankFields.length} {bankFields.length === 1 ? 'account' : 'accounts'}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddBank}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Bank
            </Button>
          </div>
          <CardDescription>
            Add bank account details for invoice payments
          </CardDescription>
        </CardHeader>

        <CardContent>
          {bankFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
              No bank details added. Click "Add Bank" to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {bankFields.map((field, index) => (
                <Card key={field.id} className="bg-card/50 border-border/60 overflow-hidden">
                  <CardHeader className="pb-2 pt-3 px-4 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-sm">Bank Account #{index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeBank(index)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-3">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`bankDetails.${index}.bankName`} className="text-xs font-medium text-muted-foreground">Bank Name</Label>
                          <Input
                            id={`bankDetails.${index}.bankName`}
                            {...register(`bankDetails.${index}.bankName`)}
                            placeholder="e.g. ABSA BANK"
                            className="h-8"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`bankDetails.${index}.accountName`} className="text-xs font-medium text-muted-foreground">Account Name</Label>
                          <Input
                            id={`bankDetails.${index}.accountName`}
                            {...register(`bankDetails.${index}.accountName`)}
                            placeholder="e.g. IVAN PRINTS"
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`bankDetails.${index}.accountNumber`} className="text-xs font-medium text-muted-foreground">Account Number</Label>
                        <Input
                          id={`bankDetails.${index}.accountNumber`}
                          {...register(`bankDetails.${index}.accountNumber`)}
                          placeholder="e.g. 6008084570"
                          className="h-8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Money Section */}
      <Card className="border-border/40 bg-background/50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-medium">Mobile Money</CardTitle>
              {mobileFields.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {mobileFields.length} {mobileFields.length === 1 ? 'account' : 'accounts'}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddMobile}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Mobile Money
            </Button>
          </div>
          <CardDescription>
            Add mobile money details for invoice payments
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mobileFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
              No mobile money details added. Click "Add Mobile Money" to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {mobileFields.map((field, index) => (
                <Card key={field.id} className="bg-card/50 border-border/60 overflow-hidden">
                  <CardHeader className="pb-2 pt-3 px-4 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-sm">Mobile Money #{index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeMobile(index)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-3">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`mobileMoneyDetails.${index}.provider`} className="text-xs font-medium text-muted-foreground">Provider</Label>
                          <Input
                            id={`mobileMoneyDetails.${index}.provider`}
                            {...register(`mobileMoneyDetails.${index}.provider`)}
                            placeholder="e.g. Airtel"
                            className="h-8"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`mobileMoneyDetails.${index}.phoneNumber`} className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                          <Input
                            id={`mobileMoneyDetails.${index}.phoneNumber`}
                            {...register(`mobileMoneyDetails.${index}.phoneNumber`)}
                            placeholder="e.g. 0755 541 373"
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`mobileMoneyDetails.${index}.contactName`} className="text-xs font-medium text-muted-foreground">Contact Name</Label>
                        <Input
                          id={`mobileMoneyDetails.${index}.contactName`}
                          {...register(`mobileMoneyDetails.${index}.contactName`)}
                          placeholder="e.g. Vuule Abdul"
                          className="h-8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDetailsSettings;
