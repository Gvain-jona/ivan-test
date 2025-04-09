import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Order, OrderItem } from '@/types/orders';
import { useForm } from 'react-hook-form';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FilePlus, FileText, Save, Download, Printer, ArrowLeft } from 'lucide-react';
import { generateInvoice } from '@/lib/api';

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onClose: () => void;
}

interface InvoiceSettings {
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  format: 'a4' | 'letter';
  template: 'standard' | 'minimal' | 'detailed';
  notes: string;
  paymentTerms: string;
  customHeader: string;
  customFooter: string;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  open,
  onOpenChange,
  order,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  
  const form = useForm<InvoiceSettings>({
    defaultValues: {
      includeHeader: true,
      includeFooter: true,
      includeLogo: true,
      includeSignature: false,
      format: 'a4',
      template: 'standard',
      notes: `Thank you for your business!`,
      paymentTerms: 'Payment due within 30 days.',
      customHeader: '',
      customFooter: '',
    },
  });
  
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // Get current form values
      const settings = form.getValues();
      
      // Here we would normally pass the settings to the API
      // For now, we'll just call the placeholder function
      const url = await generateInvoice(order.id);
      
      setInvoiceUrl(url);
      setActiveTab('preview');
      
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      // Here you would show an error toast or message
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    // In a real app, this would download the PDF file
    // For now, we'll just open the URL in a new tab
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };
  
  const handlePrint = () => {
    // In a real app, this would print the invoice
    // For now, we'll just simulate printing by opening the URL
    if (invoiceUrl) {
      const printWindow = window.open(invoiceUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-gray-950 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Invoice for Order #{order.id.substring(0, 8)}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 border-b border-gray-800 w-full justify-start">
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4 bg-white rounded-md shadow-md">
            {invoiceUrl ? (
              <div className="bg-white p-8 rounded-md text-gray-900">
                {/* This would be a real invoice preview in production */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-bold">INVOICE</h2>
                      <p className="text-gray-600">#{order.id.substring(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold">Ivan Prints</h3>
                      <p className="text-sm text-gray-600">123 Print Avenue</p>
                      <p className="text-sm text-gray-600">Pretoria, South Africa</p>
                      <p className="text-sm text-gray-600">info@ivanprints.com</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Bill To:</h4>
                      <p className="font-medium">{order.client_name}</p>
                      <p className="text-sm text-gray-600">Client Address Line 1</p>
                      <p className="text-sm text-gray-600">Client Address Line 2</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Invoice Details:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Invoice Date:</span>
                          <span className="text-sm">{formatDate(new Date().toISOString())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Order Date:</span>
                          <span className="text-sm">{formatDate(order.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Terms:</span>
                          <span className="text-sm">30 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="my-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="py-3 text-sm font-bold text-gray-600">Item</th>
                        <th className="py-3 text-sm font-bold text-gray-600">Category</th>
                        <th className="py-3 text-sm font-bold text-gray-600 text-right">Qty</th>
                        <th className="py-3 text-sm font-bold text-gray-600 text-right">Price</th>
                        <th className="py-3 text-sm font-bold text-gray-600 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.items?.map((item: OrderItem) => (
                        <tr key={item.id}>
                          <td className="py-4">{item.item_name}</td>
                          <td className="py-4">{item.category_name}</td>
                          <td className="py-4 text-right">{item.quantity}</td>
                          <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-4 text-right">{formatCurrency(item.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium">
                        <td colSpan={3} className="pt-6"></td>
                        <td className="pt-6 text-right">Subtotal:</td>
                        <td className="pt-6 text-right">{formatCurrency(order.total_amount)}</td>
                      </tr>
                      <tr className="font-medium">
                        <td colSpan={3}></td>
                        <td className="text-right">Tax (0%):</td>
                        <td className="text-right">{formatCurrency(0)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3}></td>
                        <td className="text-right border-t border-gray-300 pt-2">Total:</td>
                        <td className="text-right border-t border-gray-300 pt-2">{formatCurrency(order.total_amount)}</td>
                      </tr>
                      <tr className="font-medium text-sm text-gray-600">
                        <td colSpan={3}></td>
                        <td className="text-right pt-2">Amount Paid:</td>
                        <td className="text-right pt-2">{formatCurrency(order.amount_paid)}</td>
                      </tr>
                      <tr className="font-bold text-orange-600">
                        <td colSpan={3}></td>
                        <td className="text-right pt-2">Balance Due:</td>
                        <td className="text-right pt-2">{formatCurrency(order.balance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="font-bold text-sm uppercase text-gray-600 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{form.getValues().notes}</p>
                  
                  <h4 className="font-bold text-sm uppercase text-gray-600 mt-4 mb-2">Payment Terms</h4>
                  <p className="text-sm text-gray-600">{form.getValues().paymentTerms}</p>
                  
                  {form.getValues().includeFooter && (
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                      <p>Thank you for your business!</p>
                      {form.getValues().customFooter && <p className="mt-1">{form.getValues().customFooter}</p>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-white text-gray-800">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Invoice Preview</h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                  Configure your invoice settings and click 'Generate Invoice' to see a preview.
                </p>
                <Button
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <Form {...form}>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Layout Options</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeHeader" 
                          checked={form.getValues().includeHeader}
                          onCheckedChange={(checked: boolean) => form.setValue('includeHeader', checked)}
                        />
                        <Label htmlFor="includeHeader">Include Header</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeFooter" 
                          checked={form.getValues().includeFooter}
                          onCheckedChange={(checked: boolean) => form.setValue('includeFooter', checked)}
                        />
                        <Label htmlFor="includeFooter">Include Footer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeLogo" 
                          checked={form.getValues().includeLogo}
                          onCheckedChange={(checked: boolean) => form.setValue('includeLogo', checked)}
                        />
                        <Label htmlFor="includeLogo">Include Logo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeSignature" 
                          checked={form.getValues().includeSignature}
                          onCheckedChange={(checked: boolean) => form.setValue('includeSignature', checked)}
                        />
                        <Label htmlFor="includeSignature">Include Signature</Label>
                      </div>
                    </div>
                    
                    <Separator className="my-4 bg-gray-800" />
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="format">Paper Format</Label>
                        <Select 
                          value={form.getValues().format} 
                          onValueChange={(value) => form.setValue('format', value as 'a4' | 'letter')}
                        >
                          <SelectTrigger id="format" className="bg-gray-900 border-gray-800 mt-1">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-950 border-gray-800">
                            <SelectItem value="a4">A4</SelectItem>
                            <SelectItem value="letter">Letter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="template">Template Style</Label>
                        <Select 
                          value={form.getValues().template} 
                          onValueChange={(value) => form.setValue('template', value as 'standard' | 'minimal' | 'detailed')}
                        >
                          <SelectTrigger id="template" className="bg-gray-900 border-gray-800 mt-1">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-950 border-gray-800">
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Invoice Content</h3>
                    
                    <div>
                      <Label htmlFor="customHeader">Custom Header</Label>
                      <Input
                        id="customHeader"
                        value={form.getValues().customHeader}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setValue('customHeader', e.target.value)}
                        placeholder="Enter custom header text"
                        className="bg-gray-900 border-gray-800 mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={form.getValues().notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => form.setValue('notes', e.target.value)}
                        placeholder="Enter notes to appear on the invoice"
                        className="bg-gray-900 border-gray-800 mt-1 min-h-[100px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Textarea
                        id="paymentTerms"
                        value={form.getValues().paymentTerms}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => form.setValue('paymentTerms', e.target.value)}
                        placeholder="Enter payment terms"
                        className="bg-gray-900 border-gray-800 mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customFooter">Custom Footer</Label>
                      <Input
                        id="customFooter"
                        value={form.getValues().customFooter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setValue('customFooter', e.target.value)}
                        placeholder="Enter custom footer text"
                        className="bg-gray-900 border-gray-800 mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button
                    type="button"
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Invoice Preview'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between mt-4 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handlePrint}
              disabled={!invoiceUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleDownload}
              disabled={!invoiceUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal; 