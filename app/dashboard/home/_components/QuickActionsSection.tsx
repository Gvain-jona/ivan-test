'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  UserPlus, 
  Receipt, 
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { QUICK_ACTIONS } from '../_data/home-data';

/**
 * Quick actions section with cards for common tasks
 */
const QuickActionsSection: React.FC = () => {
  // Function to get the icon component based on the icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package':
        return <Package className="h-5 w-5" />;
      case 'UserPlus':
        return <UserPlus className="h-5 w-5" />;
      case 'Receipt':
        return <Receipt className="h-5 w-5" />;
      case 'CheckSquare':
        return <CheckSquare className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link href={action.href} key={action.id}>
            <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <span className={action.color}>
                    {getIcon(action.icon)}
                  </span>
                </div>
                
                <h3 className="font-medium mb-2">{action.title}</h3>
                
                <div className="mt-auto pt-4 flex items-center text-sm text-muted-foreground group-hover:text-foreground">
                  <span>Get started</span>
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default QuickActionsSection;
