'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Boxes, Pencil, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import { useProducts, useProductMutations } from '@/hooks/products/useProducts';
import type { Product, ProductListParams } from '@/hooks/products/useProducts';
import ProductFormSheet from '@/components/products/ProductFormSheet';
import { useToast } from '@/components/ui/use-toast';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  draft: 'bg-amber-500/10 text-amber-400',
  archived: 'bg-slate-500/10 text-slate-400',
};

/**
 * Product catalog management. Products feed the order form's item
 * picker (price prefill); custom columns come from the org's field
 * registry (entity: product).
 */
export default function ProductsPage() {
  const { toast } = useToast();
  const fmt = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<NonNullable<ProductListParams['status']>>('active');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { products, total, isLoading, mutate } = useProducts({
    status,
    search: search || undefined,
    limit: 100,
  });
  const { archiveProduct } = useProductMutations();

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  // Deep-link: `?new=1` (e.g. the Home quick-action chip) opens the create
  // sheet, then strips the param so a refresh doesn't reopen it.
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditing(null);
      setSheetOpen(true);
      router.replace('/dashboard/products');
    }
  }, [searchParams, router]);

  const openEdit = (product: Product) => {
    setEditing(product);
    setSheetOpen(true);
  };

  const handleArchive = async (product: Product) => {
    try {
      await archiveProduct(product.id);
      toast({ title: 'Product archived', description: product.name });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive product',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Products</h1>
          <p className="text-sm text-muted-foreground">
            The catalog that feeds order items — prices are defaults, always overridable per order.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Product
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-[#2B2B40] rounded-lg overflow-x-auto">
        <table className="w-full divide-y divide-[#2B2B40]">
          <thead className="bg-muted/10">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Selling Price</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B2B40]">
            {isLoading && products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading products…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Boxes className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">No products yet — create the first one</p>
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2.5 text-sm text-white">{product.name}</td>
                  <td className="px-4 py-2.5 text-sm text-white text-right">
                    {product.selling_price != null ? fmt(product.selling_price) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className={STATUS_BADGE[product.status] ?? ''}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {product.name}</span>
                      </Button>
                      {product.status !== 'archived' && (
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(product)}>
                          <Archive className="h-4 w-4" />
                          <span className="sr-only">Archive {product.name}</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{total} product{total === 1 ? '' : 's'}</p>

      <ProductFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
