'use client';

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function OrdersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders, track status, and generate invoices.
        </p>
      </div>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>
    </div>
  );
}
