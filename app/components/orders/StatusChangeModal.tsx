import React from 'react';
import { OrderStatus } from '@/types/orders';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  PauseCircle, 
  AlertCircle, 
  ArrowRightCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  open,
  onOpenChange,
  currentStatus,
  onStatusChange,
}) => {
  const statuses: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { 
      status: 'pending', 
      label: 'Pending', 
      icon: <Clock className="mr-2 h-4 w-4" /> 
    },
    { 
      status: 'in_progress', 
      label: 'In Progress', 
      icon: <ArrowRightCircle className="mr-2 h-4 w-4" /> 
    },
    { 
      status: 'paused', 
      label: 'Paused', 
      icon: <PauseCircle className="mr-2 h-4 w-4" /> 
    },
    { 
      status: 'completed', 
      label: 'Completed', 
      icon: <CheckCircle className="mr-2 h-4 w-4" /> 
    },
    { 
      status: 'delivered', 
      label: 'Delivered', 
      icon: <Truck className="mr-2 h-4 w-4" /> 
    },
    { 
      status: 'cancelled', 
      label: 'Cancelled', 
      icon: <AlertCircle className="mr-2 h-4 w-4" /> 
    }
  ];

  // Get color class based on status
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500 hover:bg-yellow-500/10';
      case 'in_progress':
        return 'text-blue-500 hover:bg-blue-500/10';
      case 'paused':
        return 'text-orange-500 hover:bg-orange-500/10';
      case 'completed':
        return 'text-green-500 hover:bg-green-500/10';
      case 'delivered':
        return 'text-purple-500 hover:bg-purple-500/10';
      case 'cancelled':
        return 'text-red-500 hover:bg-red-500/10';
      default:
        return 'text-gray-500 hover:bg-gray-500/10';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px] sm:w-[400px] bg-gray-950 border-gray-800">
        <SheetHeader>
          <SheetTitle className="text-white">Change Order Status</SheetTitle>
          <SheetDescription className="text-gray-400">
            Select a new status for this order
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-2">
          {statuses.map(({ status, label, icon }) => (
            <Button
              key={status}
              variant={currentStatus === status ? "default" : "outline"}
              className={cn(
                "w-full justify-start text-left mb-2 border-gray-800",
                currentStatus === status 
                  ? "bg-gray-800 text-white hover:bg-gray-700" 
                  : `bg-transparent ${getStatusColor(status)}`
              )}
              onClick={() => {
                onStatusChange(status);
                onOpenChange(false);
              }}
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
        <SheetFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default StatusChangeModal;
