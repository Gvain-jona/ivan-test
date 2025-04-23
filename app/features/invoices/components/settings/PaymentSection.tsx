'use client';

import React, { useState } from 'react';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SettingsSectionProps, BankDetail, MobileMoneyDetail } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payment details section for invoice settings
 */
const PaymentSection: React.FC<SettingsSectionProps> = ({ control }) => {
  // State for new bank detail
  const [newBank, setNewBank] = useState<Partial<BankDetail>>({
    bankName: '',
    accountName: '',
    accountNumber: '',
  });

  // State for new mobile money detail
  const [newMobile, setNewMobile] = useState<Partial<MobileMoneyDetail>>({
    provider: '',
    contactName: '',
    phoneNumber: '',
  });

  // Add a new bank detail
  const addBankDetail = () => {
    if (!newBank.bankName || !newBank.accountName || !newBank.accountNumber) {
      return; // Don't add if fields are empty
    }

    const bankDetails = [...(control._formValues.bankDetails || [])];
    bankDetails.push({
      id: uuidv4(),
      bankName: newBank.bankName || '',
      accountName: newBank.accountName || '',
      accountNumber: newBank.accountNumber || '',
    });

    // Update form values
    control._formValues.bankDetails = bankDetails;
    
    // Trigger form change
    control._subjects.state.next({
      name: 'bankDetails',
      type: 'change',
    });

    // Reset new bank state
    setNewBank({
      bankName: '',
      accountName: '',
      accountNumber: '',
    });
  };

  // Remove a bank detail
  const removeBankDetail = (id: string) => {
    const bankDetails = [...(control._formValues.bankDetails || [])];
    const updatedBankDetails = bankDetails.filter(bank => bank.id !== id);

    // Update form values
    control._formValues.bankDetails = updatedBankDetails;
    
    // Trigger form change
    control._subjects.state.next({
      name: 'bankDetails',
      type: 'change',
    });
  };

  // Add a new mobile money detail
  const addMobileMoneyDetail = () => {
    if (!newMobile.provider || !newMobile.contactName || !newMobile.phoneNumber) {
      return; // Don't add if fields are empty
    }

    const mobileMoneyDetails = [...(control._formValues.mobileMoneyDetails || [])];
    mobileMoneyDetails.push({
      id: uuidv4(),
      provider: newMobile.provider || '',
      contactName: newMobile.contactName || '',
      phoneNumber: newMobile.phoneNumber || '',
    });

    // Update form values
    control._formValues.mobileMoneyDetails = mobileMoneyDetails;
    
    // Trigger form change
    control._subjects.state.next({
      name: 'mobileMoneyDetails',
      type: 'change',
    });

    // Reset new mobile state
    setNewMobile({
      provider: '',
      contactName: '',
      phoneNumber: '',
    });
  };

  // Remove a mobile money detail
  const removeMobileMoneyDetail = (id: string) => {
    const mobileMoneyDetails = [...(control._formValues.mobileMoneyDetails || [])];
    const updatedMobileMoneyDetails = mobileMoneyDetails.filter(mobile => mobile.id !== id);

    // Update form values
    control._formValues.mobileMoneyDetails = updatedMobileMoneyDetails;
    
    // Trigger form change
    control._subjects.state.next({
      name: 'mobileMoneyDetails',
      type: 'change',
    });
  };

  return (
    <div className="space-y-6">
      {/* Bank Details */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Bank Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Bank Details */}
          {control._formValues.bankDetails?.map((bank, index) => (
            <div key={bank.id} className="p-4 border border-[#2B2B40] rounded-md bg-card/30 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeBankDetail(bank.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Bank Name</FormLabel>
                  <p className="text-sm mt-1">{bank.bankName}</p>
                </div>
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Account Name</FormLabel>
                  <p className="text-sm mt-1">{bank.accountName}</p>
                </div>
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Account Number</FormLabel>
                  <p className="text-sm mt-1">{bank.accountNumber}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Bank Detail */}
          <div className="p-4 border border-dashed border-[#2B2B40] rounded-md bg-card/10">
            <h4 className="text-sm font-medium mb-3 text-[#D1D5DB]">Add Bank Account</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Bank Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABSA Bank"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newBank.bankName}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Account Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Company Name"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newBank.accountName}
                    onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1234567890"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newBank.accountNumber}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  />
                </FormControl>
              </FormItem>
            </div>
            <Button
              className="mt-4 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              onClick={addBankDetail}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Money Details */}
      <Card className="border-border/40 bg-background/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg font-medium">Mobile Money</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Mobile Money Details */}
          {control._formValues.mobileMoneyDetails?.map((mobile, index) => (
            <div key={mobile.id} className="p-4 border border-[#2B2B40] rounded-md bg-card/30 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeMobileMoneyDetail(mobile.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Provider</FormLabel>
                  <p className="text-sm mt-1">{mobile.provider}</p>
                </div>
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Contact Name</FormLabel>
                  <p className="text-sm mt-1">{mobile.contactName}</p>
                </div>
                <div>
                  <FormLabel className="text-[#D1D5DB] text-xs">Phone Number</FormLabel>
                  <p className="text-sm mt-1">{mobile.phoneNumber}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Mobile Money Detail */}
          <div className="p-4 border border-dashed border-[#2B2B40] rounded-md bg-card/10">
            <h4 className="text-sm font-medium mb-3 text-[#D1D5DB]">Add Mobile Money</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Provider</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Airtel Money"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newMobile.provider}
                    onChange={(e) => setNewMobile({ ...newMobile, provider: e.target.value })}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Contact Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Contact Person"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newMobile.contactName}
                    onChange={(e) => setNewMobile({ ...newMobile, contactName: e.target.value })}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-[#D1D5DB]">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0755 123 456"
                    className="bg-transparent border-[#2B2B40] focus:border-[#F97316]"
                    value={newMobile.phoneNumber}
                    onChange={(e) => setNewMobile({ ...newMobile, phoneNumber: e.target.value })}
                  />
                </FormControl>
              </FormItem>
            </div>
            <Button
              className="mt-4 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              onClick={addMobileMoneyDetail}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Mobile Money
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSection;
