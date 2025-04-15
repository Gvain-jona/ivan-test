import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceSettings, BankDetail, MobileMoneyDetail } from './types';

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
    <div className="space-y-6">
      {/* Bank Details Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Bank Details</h3>
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
        
        {bankFields.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No bank details added. Click "Add Bank" to add one.
          </div>
        ) : (
          <div className="space-y-4">
            {bankFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-border rounded-md bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Bank #{index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeBank(index)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`bankDetails.${index}.bankName`}>Bank Name</Label>
                    <Input
                      id={`bankDetails.${index}.bankName`}
                      {...register(`bankDetails.${index}.bankName`)}
                      placeholder="e.g. ABSA BANK"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`bankDetails.${index}.accountName`}>Account Name</Label>
                    <Input
                      id={`bankDetails.${index}.accountName`}
                      {...register(`bankDetails.${index}.accountName`)}
                      placeholder="e.g. IVAN PRINTS"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`bankDetails.${index}.accountNumber`}>Account Number</Label>
                    <Input
                      id={`bankDetails.${index}.accountNumber`}
                      {...register(`bankDetails.${index}.accountNumber`)}
                      placeholder="e.g. 6008084570"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile Money Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Mobile Money</h3>
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
        
        {mobileFields.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No mobile money details added. Click "Add Mobile Money" to add one.
          </div>
        ) : (
          <div className="space-y-4">
            {mobileFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-border rounded-md bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Mobile Money #{index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeMobile(index)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`mobileMoneyDetails.${index}.provider`}>Provider</Label>
                    <Input
                      id={`mobileMoneyDetails.${index}.provider`}
                      {...register(`mobileMoneyDetails.${index}.provider`)}
                      placeholder="e.g. Airtel"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`mobileMoneyDetails.${index}.phoneNumber`}>Phone Number</Label>
                    <Input
                      id={`mobileMoneyDetails.${index}.phoneNumber`}
                      {...register(`mobileMoneyDetails.${index}.phoneNumber`)}
                      placeholder="e.g. 0755 541 373"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`mobileMoneyDetails.${index}.contactName`}>Contact Name</Label>
                    <Input
                      id={`mobileMoneyDetails.${index}.contactName`}
                      {...register(`mobileMoneyDetails.${index}.contactName`)}
                      placeholder="e.g. Vuule Abdul"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetailsSettings;
