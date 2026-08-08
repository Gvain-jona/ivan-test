'use client';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Users, Pencil, Archive, SlidersHorizontal } from 'lucide-react';
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
import { useClients, useClientMutations } from '@/hooks/clients/useClients';
import type { Client, ClientListParams } from '@/hooks/clients/useClients';
import { useFieldDefinitions } from '@/hooks/fields/useFieldDefinitions';
import ClientFormSheet from '@/components/clients/ClientFormSheet';
import EntityFieldsManager from '@/components/fields/EntityFieldsManager';
import { useToast } from '@/components/ui/use-toast';

/**
 * Client management. Only `name` is a fixed column in v2 — the extra
 * columns shown here are the org's own client fields from the field
 * registry (first two, e.g. phone and type).
 */
export default function ClientsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<NonNullable<ClientListParams['status']>>('active');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [showFields, setShowFields] = useState(false);

  const { clients, total, isLoading, mutate } = useClients({
    status,
    search: search || undefined,
    limit: 100,
  });
  const { archiveClient } = useClientMutations();
  const { fieldDefinitions } = useFieldDefinitions('client');
  // Show the org's first two client fields as list columns
  const listFields = fieldDefinitions.slice(0, 2);

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
      router.replace('/dashboard/clients');
    }
  }, [searchParams, router]);

  const openEdit = (client: Client) => {
    setEditing(client);
    setSheetOpen(true);
  };

  const handleArchive = async (client: Client) => {
    try {
      await archiveClient(client.id);
      toast({ title: 'Client archived', description: client.name });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive client',
        variant: 'destructive',
      });
    }
  };

  const customValue = (client: Client, fieldName: string): string => {
    const value = (client.custom_data as Record<string, unknown> | null)?.[fieldName];
    if (value == null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="space-y-5 min-h-screen px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Everyone you take orders for — fields beyond the name come from the Fields panel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFields(v => !v)}
            aria-pressed={showFields}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Fields
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Client
          </Button>
        </div>
      </div>

      {showFields && (
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <EntityFieldsManager entity="client" entityLabel="client" />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search clients…"
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
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full divide-y divide-border">
          <thead className="bg-muted/10">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
              {listFields.map(field => (
                <th
                  key={field.field_name}
                  className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                >
                  {field.field_label}
                </th>
              ))}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && clients.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + listFields.length}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Loading clients…
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + listFields.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">No clients yet — create the first one</p>
                </td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2.5 text-sm">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-foreground hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  {listFields.map(field => (
                    <td
                      key={field.field_name}
                      className="px-4 py-2.5 text-sm text-muted-foreground"
                    >
                      {customValue(client, field.field_name)}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        client.status === 'active'
                          ? 'bg-opt-green-bg text-opt-green-fg'
                          : 'bg-opt-slate-bg text-opt-slate-fg'
                      }
                    >
                      {client.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {client.name}</span>
                      </Button>
                      {client.status !== 'archived' && (
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(client)}>
                          <Archive className="h-4 w-4" />
                          <span className="sr-only">Archive {client.name}</span>
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
      <p className="text-xs text-muted-foreground">{total} client{total === 1 ? '' : 's'}</p>

      <ClientFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        client={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
