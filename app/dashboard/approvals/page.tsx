'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/app/lib/supabase/client';

// Define the approval type
type Approval = {
  id: string;
  requester_id: string;
  approver_id: string | null;
  action: string;
  item_type: string;
  item_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requester_name?: string;
  item_name?: string;
};

export default function ApprovalsPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  
  // Check if user is admin or manager
  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this page.",
          variant: "destructive",
        });
        router.push('/dashboard/orders');
      }
    }
  }, [authLoading, profile, router, toast]);
  
  // Fetch approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Get approvals based on user role
        const { data, error } = await supabase
          .from('approvals')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Fetch additional data for each approval
        const enhancedApprovals = await Promise.all(
          (data || []).map(async (approval) => {
            // Get requester name
            const { data: requesterData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', approval.requester_id)
              .single();
              
            // Get item name based on type
            let itemName = 'Unknown Item';
            if (approval.item_type === 'item') {
              const { data: itemData } = await supabase
                .from('order_items')
                .select('name')
                .eq('id', approval.item_id)
                .single();
              itemName = itemData?.name || 'Order Item';
            } else if (approval.item_type === 'payment') {
              const { data: paymentData } = await supabase
                .from('order_payments')
                .select('payment_method')
                .eq('id', approval.item_id)
                .single();
              itemName = `Payment (${paymentData?.payment_method || 'Unknown'})`;
            } else if (approval.item_type === 'note') {
              itemName = 'Note';
            }
            
            return {
              ...approval,
              requester_name: requesterData?.full_name || 'Unknown User',
              item_name: itemName,
            };
          })
        );
        
        setApprovals(enhancedApprovals);
      } catch (error) {
        console.error('Error fetching approvals:', error);
        toast({
          title: "Error",
          description: "Failed to load approvals. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && (profile?.role === 'admin' || profile?.role === 'manager')) {
      fetchApprovals();
    }
  }, [user, profile, toast]);
  
  // Handle approval action
  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const supabase = createClient();
      
      // Update approval status
      const { error } = await supabase
        .from('approvals')
        .update({
          status,
          approver_id: user?.id,
        })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setApprovals(approvals.map(approval => 
        approval.id === id ? { ...approval, status } : approval
      ));
      
      toast({
        title: status === 'approved' ? "Approved" : "Rejected",
        description: `The request has been ${status}.`,
        variant: status === 'approved' ? "default" : "destructive",
      });
    } catch (error) {
      console.error(`Error ${status} approval:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} the request. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  // Filter approvals based on active tab
  const filteredApprovals = approvals.filter(approval => {
    if (activeTab === 'pending') return approval.status === 'pending';
    if (activeTab === 'approved') return approval.status === 'approved';
    if (activeTab === 'rejected') return approval.status === 'rejected';
    return true;
  });
  
  // Render loading state
  if (authLoading || (isLoading && !approvals.length)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <Skeleton className="h-10 w-full max-w-md" />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // If user doesn't have permission, don't render anything (they'll be redirected)
  if (profile && profile.role !== 'admin' && profile.role !== 'manager') {
    return null;
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Requests</h1>
          <p className="text-muted-foreground">
            Review and manage deletion requests from staff members.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {approvals.filter(a => a.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2">
                {approvals.filter(a => a.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          {filteredApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No pending approval requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApprovals.map(approval => (
                <Card key={approval.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Delete {approval.item_type}
                      </CardTitle>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                        Pending
                      </Badge>
                    </div>
                    <CardDescription>
                      {approval.item_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested by:</span>
                        <span>{approval.requester_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Action:</span>
                        <span>{approval.action}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApproval(approval.id, 'rejected')}
                      className="border-red-700 text-red-600 hover:bg-red-900/10"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApproval(approval.id, 'approved')}
                      className="border-green-700 text-green-600 hover:bg-green-900/10"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          {filteredApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No approved requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApprovals.map(approval => (
                <Card key={approval.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Delete {approval.item_type}
                      </CardTitle>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Approved
                      </Badge>
                    </div>
                    <CardDescription>
                      {approval.item_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested by:</span>
                        <span>{approval.requester_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Action:</span>
                        <span>{approval.action}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          {filteredApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No rejected requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApprovals.map(approval => (
                <Card key={approval.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Delete {approval.item_type}
                      </CardTitle>
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                        Rejected
                      </Badge>
                    </div>
                    <CardDescription>
                      {approval.item_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested by:</span>
                        <span>{approval.requester_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Action:</span>
                        <span>{approval.action}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
