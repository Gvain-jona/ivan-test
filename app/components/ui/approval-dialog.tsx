import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export type DeletionType = 'item' | 'payment' | 'note';

export interface DeletionRequest {
  id: string;
  itemId: string; // ID of the item being deleted
  type: DeletionType;
  reason: string;
  additionalNotes?: string;
  linkedId: string; // Order ID or parent entity ID
  linkedType: string; // 'order', 'expense', etc
  requestedBy: string; // User ID
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  type: DeletionType;
  linkedId: string;
  linkedType: string;
  onSubmit: (request: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>) => void;
  onCancel: () => void;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  type,
  linkedId,
  linkedType,
  onSubmit,
  onCancel,
}) => {
  const [reason, setReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const { toast } = useToast();

  const predefinedReasons = {
    item: [
      'Duplicate item',
      'Entered incorrectly',
      'Client cancelled item',
      'Item no longer needed',
      'Pricing error',
      'Wrong quantity',
      'Other'
    ],
    payment: [
      'Duplicate payment',
      'Incorrect amount',
      'Wrong payment method',
      'Payment not received',
      'Client refund',
      'Other'
    ],
    note: [
      'Incorrect information',
      'No longer relevant',
      'Sensitive information',
      'Duplicate note',
      'Other'
    ]
  };
  
  const typeNames = {
    item: 'Item',
    payment: 'Payment',
    note: 'Note'
  };

  const handleSubmit = () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for deletion",
        variant: "destructive",
      });
      return;
    }

    // Mock user ID - in a real app, this would come from authentication context
    const requestedBy = 'current-user-id';
    
    onSubmit({
      type,
      reason,
      additionalNotes: additionalNotes.trim(),
      linkedId,
      linkedType,
      itemId,
      requestedBy,
    });
    
    // Clear form
    setReason('');
    setAdditionalNotes('');
    
    // Close dialog
    onOpenChange(false);
    
    // Show success message
    toast({
      title: "Deletion request submitted",
      description: `The ${typeNames[type].toLowerCase()} will be removed once approved by an admin`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Request to Delete {typeNames[type]}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            This {typeNames[type].toLowerCase()} will be removed from the UI immediately but requires admin approval for permanent deletion.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gray-900/50 p-3 rounded-md border border-gray-800">
            <p className="text-sm font-medium text-white mb-1">Item to delete:</p>
            <p className="text-sm text-gray-300">{itemName}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for deletion</Label>
            <Select 
              value={reason} 
              onValueChange={setReason}
            >
              <SelectTrigger className="bg-gray-900 border-gray-800 text-white" id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                {predefinedReasons[type].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional notes (optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Provide any additional context..."
              className="bg-gray-900 border-gray-800 text-white resize-none min-h-[80px]"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleSubmit}
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog; 