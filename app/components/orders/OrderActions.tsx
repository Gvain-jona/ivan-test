import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Edit, Eye, Trash2, Copy, FileText, 
  MoreVertical, CheckCircle, Truck, 
  PauseCircle, AlertCircle, Printer, 
  ClipboardCopy, ArrowRightCircle, Clock
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/orders';
import { cn } from '@/lib/utils';

interface OrderActionsProps {
  order: Order;
  userRole: 'admin' | 'manager' | 'employee';
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onInvoice: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  userRole,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onInvoice,
  onStatusChange,
}) => {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canModify = isAdmin || isManager;

  const getStatusMenuItemColor = (itemStatus: OrderStatus) => {
    if (order.status === itemStatus) {
      switch (itemStatus) {
        case 'paused': return 'text-status-paused bg-status-paused/10';
        case 'pending': return 'text-status-pending bg-status-pending/10';
        case 'in_progress': return 'text-status-in_progress bg-status-in_progress/10';
        case 'completed': return 'text-status-completed bg-status-completed/10';
        case 'delivered': return 'text-status-delivered bg-status-delivered/10';
        case 'cancelled': return 'text-status-cancelled bg-status-cancelled/10';
        default: return '';
      }
    }
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-table-header hover:text-white hover:bg-table-hover"
        >
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border-table-border">
        <DropdownMenuLabel className="text-table-header">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-table-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-white focus:bg-table-hover focus:text-white"
            onClick={() => onView(order)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {canModify && (
            <DropdownMenuItem
              className="text-white focus:bg-table-hover focus:text-white"
              onClick={() => onEdit(order)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-white focus:bg-table-hover focus:text-white"
            onClick={() => onInvoice(order)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Invoice
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-white focus:bg-table-hover focus:text-white"
            onClick={() => onDuplicate(order)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Order
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        {canModify && (
          <>
            <DropdownMenuSeparator className="bg-table-border" />
            <DropdownMenuLabel className="text-table-header">Change Status</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('pending')
                )}
                onClick={() => onStatusChange(order, 'pending')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('paused')
                )}
                onClick={() => onStatusChange(order, 'paused')}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('in_progress')
                )}
                onClick={() => onStatusChange(order, 'in_progress')}
              >
                <ArrowRightCircle className="mr-2 h-4 w-4" />
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('completed')
                )}
                onClick={() => onStatusChange(order, 'completed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('delivered')
                )}
                onClick={() => onStatusChange(order, 'delivered')}
              >
                <Truck className="mr-2 h-4 w-4" />
                Delivered
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  "text-white focus:bg-table-hover focus:text-white",
                  getStatusMenuItemColor('cancelled')
                )}
                onClick={() => onStatusChange(order, 'cancelled')}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        
        {canModify && (
          <>
            <DropdownMenuSeparator className="bg-table-border" />
            <DropdownMenuItem
              className="text-status-cancelled focus:bg-status-cancelled/10 focus:text-status-cancelled"
              onClick={() => onDelete(order)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderActions; 
