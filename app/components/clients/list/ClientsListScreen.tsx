'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, SlidersHorizontal, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Divided } from '@/components/patterns/screen';
import { Figure, QuickAction, Chip } from '@/components/patterns/list';
import MobileFeedHeader from '@/components/navigation/MobileFeedHeader';
import { useSheets } from '@/context/sheet-host';
import { useFormatCurrency } from '@/hooks/organization/useFormatCurrency';
import EntityFieldsManager from '@/components/fields/EntityFieldsManager';
import ClientListRow from './ClientListRow';
import { useClientsList } from './useClientsList';

/**
 * Clients — the working list (C1).
 *
 * The same list language as B1: a two-figure summary card, quick actions, a
 * search box and a row of filter chips over a divided list. What's specific to
 * clients is the money — "Still to collect" up top and "Owes …" per row — which
 * is summed from orders and shown only when that sum is exact (see
 * useClientsList). Tapping a row opens the client (C2); the org header and tab
 * bar come from the dashboard layout.
 */
export default function ClientsListScreen() {
  const router = useRouter();
  const fmt = useFormatCurrency();
  const list = useClientsList();
  const { openCreateClient, openCreateOrder } = useSheets();
  const [showFields, setShowFields] = useState(false);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <MobileFeedHeader />
      <h1 className="text-[22px] font-semibold text-foreground">Clients</h1>

      <div className="mt-3.5 flex items-center rounded-2xl border border-border bg-card px-1 py-3.5">
        <Figure
          value={list.exact ? fmt(list.outstanding.totals.total) : '—'}
          label="Still to collect"
          tone="warning"
        />
        <div className="h-[38px] w-px bg-border" />
        <Figure value={String(list.total)} label={list.total === 1 ? 'Client' : 'Clients'} />
      </div>

      {!list.exact && list.total > 0 && (
        // The client count is exact either way; the money owed isn't when there
        // are more orders than the rollup cap, and a partial figure is worse.
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Too many orders to total what&apos;s owed here yet.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-[7px]">
        <QuickAction icon={UserPlus} label="New client" onClick={() => openCreateClient()} primary />
        <QuickAction icon={Plus} label="New order" onClick={openCreateOrder} />
      </div>

      {!list.isEmptyOrg && (
        <>
          <div className="mt-4 flex h-10 items-center gap-[9px] rounded-[10px] bg-muted px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              value={list.search}
              onChange={event => list.setSearch(event.target.value)}
              placeholder="Search name or phone"
              aria-label="Search name or phone"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-3 flex items-center gap-[7px] overflow-x-auto pb-1">
            <Chip
              label="All"
              active={!list.owingOnly && list.typeFilter === null}
              onClick={() => {
                list.setOwingOnly(false);
                list.setTypeFilter(null);
              }}
            />
            {/* "Owing" reads the orders rollup, so it's only offered when that
                rollup is exact — otherwise it would filter on partial data. */}
            {list.exact && (
              <Chip
                label="Owing"
                active={list.owingOnly}
                onClick={() => {
                  list.setOwingOnly(!list.owingOnly);
                  list.setTypeFilter(null);
                }}
              />
            )}
            {list.typeOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                active={list.typeFilter === option.value}
                onClick={() => {
                  list.setTypeFilter(list.typeFilter === option.value ? null : option.value);
                  list.setOwingOnly(false);
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowFields(v => !v)}
              aria-pressed={showFields}
              className={cn(
                'ml-auto flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showFields
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Fields
            </button>
          </div>
        </>
      )}

      {showFields && (
        <div className="mt-3 rounded-2xl border border-border bg-card/40 p-4">
          <EntityFieldsManager entity="client" entityLabel="client" />
        </div>
      )}

      <div className="mt-3.5">
        {list.isLoading && list.clients.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : list.clients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <Users className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {list.isEmptyOrg
                ? 'No clients yet'
                : list.searching
                  ? 'Nothing matches that search'
                  : 'Nothing here'}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {list.isEmptyOrg
                ? 'Everyone you take orders for lives here — add the first one.'
                : list.searching
                  ? 'Try a name or a phone number.'
                  : 'No clients under this filter right now.'}
            </p>
            {list.isEmptyOrg && (
              <button
                type="button"
                onClick={() => openCreateClient()}
                className="mt-4 inline-flex items-center gap-[7px] rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <UserPlus className="h-4 w-4" strokeWidth={2} />
                New client
              </button>
            )}
          </div>
        ) : (
          <Card>
            <Divided>
              {list.clients.map(client => (
                <ClientListRow
                  key={client.id}
                  client={client}
                  rollup={list.rollups[client.id]}
                  exact={list.exact}
                  typeField={list.typeField}
                  fmt={fmt}
                  onOpen={() => router.push(`/dashboard/clients/${client.id}`)}
                />
              ))}
            </Divided>
          </Card>
        )}
      </div>
    </div>
  );
}
