'use client';

import { 
  BarChart3, 
  DollarSign, 
  Package, 
  TrendingUp, 
  ArrowUpCircle, 
  ArrowDownCircle,
  RefreshCw,
  Clock,
  Tag,
  FileText,
  Image as ImageIcon,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Business performance and insights</p>
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Sales</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(3484)}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>+21% vs prev</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Average</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">486</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>+2% vs last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <Percent className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8%</div>
            <p className="text-xs text-red-500 mt-1 flex items-center">
              <ArrowDownCircle className="h-3 w-3 mr-1" />
              <span>-0.5% vs last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <div className="w-8 h-8 bg-muted/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,944</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              <span>+3% vs last week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Sales Trend</CardTitle>
              <div className="flex items-center text-xs text-muted-foreground">
                <Badge variant="outline" className="mr-2">+21% vs prev</Badge>
                <span>3,484</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {/* Placeholder for chart - in a real implementation, you'd use a proper chart library */}
              <div className="relative h-full w-full">
                <div className="absolute left-0 top-0 h-full w-full flex items-end space-x-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className={`bg-orange-500/20 hover:bg-orange-500/40 w-full rounded-t-md transition-all duration-200 ease-in-out relative group`}
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {Math.floor(100 + Math.random() * 200)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
                  <span>Monday</span>
                  <span>Tuesday</span>
                  <span>Wednesday</span>
                  <span>Thursday</span>
                  <span>Friday</span>
                  <span>Saturday</span>
                  <span>Sunday</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                Details
              </Button>
            </div>
            <CardDescription>5 new activities today</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="week">This week</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Inventory Updated</p>
                    <p className="text-xs text-muted-foreground">Women's Summer Dress - Blue</p>
                    <p className="text-xs text-muted-foreground">Stock +150 units added</p>
                  </div>
                  <div className="text-xs text-muted-foreground">11:30 AM</div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Tag className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Price Change</p>
                    <p className="text-xs text-muted-foreground">Seasonal discount applied</p>
                    <p className="text-xs text-muted-foreground">$89.99 → $69.99 (-22%)</p>
                  </div>
                  <div className="text-xs text-muted-foreground">11:30 AM</div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Product Added</p>
                    <p className="text-xs text-muted-foreground">Women's Summer Dress - Red</p>
                    <p className="text-xs text-muted-foreground">Listed in Women's Fashion</p>
                  </div>
                  <div className="text-xs text-muted-foreground">11:30 AM</div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Product Images Updated</p>
                    <p className="text-xs text-muted-foreground">Women's Summer Dress - Blue</p>
                    <p className="text-xs text-muted-foreground">5 new images added</p>
                  </div>
                  <div className="text-xs text-muted-foreground">11:30 AM</div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Description Updated</p>
                    <p className="text-xs text-muted-foreground">Women's Summer Dress - Blue</p>
                    <p className="text-xs text-muted-foreground">Added size guide and materials</p>
                  </div>
                  <div className="text-xs text-muted-foreground">11:30 AM</div>
                </div>
              </TabsContent>
              <TabsContent value="yesterday" className="space-y-4">
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No activities from yesterday
                </div>
              </TabsContent>
              <TabsContent value="week" className="space-y-4">
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  View all activities from this week
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Categories */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Product Categories</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                Details
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold">58%</span>
              <Badge variant="outline" className="text-red-500">-2% vs last week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Accessories</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">45 products</span>
                    <Badge variant="outline" className="text-green-500">+3.2%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Clothing</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">32 products</span>
                    <Badge variant="outline" className="text-red-500">-1.5%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Electronics</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">28 products</span>
                    <Badge variant="outline" className="text-green-500">+2.8%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Home Goods</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">21 products</span>
                    <Badge variant="outline" className="text-green-500">+0.7%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Channels */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Marketing Channels</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                Details
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold">82%</span>
              <Badge variant="outline" className="text-green-500">+2.1% vs last week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Organic Search</span>
                  <span className="text-sm text-muted-foreground">42%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Social Media</span>
                  <span className="text-sm text-muted-foreground">35%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Direct</span>
                  <span className="text-sm text-muted-foreground">23%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>Acquisition</span>
                  </div>
                  <span className="font-medium">$38.25</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>Conversion</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">4.2 days</span>
                    <Badge variant="outline" className="text-green-500">+3.8%</Badge>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>ROI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">324%</span>
                    <Badge variant="outline" className="text-green-500">+4.5%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card className="bg-transparent border-border/40 hover:bg-muted/10 transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Customer Segments</CardTitle>
              <Badge variant="outline" className="text-green-500">+5.8% vs last week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-40 mb-4">
              {/* Placeholder for pie chart - in a real implementation, you'd use a proper chart library */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-orange-500 relative">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 46%, 0 46%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(0 46%, 100% 46%, 100% 79%, 0 79%)' }}></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(9450)}</span>
                  <span className="text-xs text-muted-foreground">32%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Regular</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(8320)}</span>
                  <span className="text-xs text-muted-foreground">46%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">New</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(3280)}</span>
                  <span className="text-xs text-muted-foreground">22%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}