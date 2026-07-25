'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PackagePlus, Users, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useSheets } from '@/context/sheet-host';
import { useOrganization } from '@/hooks/organization/useOrganization';
import { apiRequest, PLATFORM_API } from '@/lib/api/client';
import { CURRENCY_OPTIONS } from '@/lib/organization/presets';
import EntityFieldSetupStep from './EntityFieldSetupStep';

type StepId = 'welcome' | 'currency' | 'product' | 'client' | 'order';
const STEP_ORDER: StepId[] = ['welcome', 'currency', 'product', 'client', 'order'];

/** The setup steps that show a progress count (welcome is the intro). */
const NUMBERED: StepId[] = STEP_ORDER.filter(s => s !== 'welcome');

/**
 * First-run wizard: teaches the model by walking product -> client ->
 * order in dependency order, configuring each entity's fields in place and
 * offering to create the first record. Currency comes first (an org-level
 * scalar). Finishing marks onboarding complete so the gate stops routing
 * here. See docs/v2-migration/FIRST_RUN_AND_FIELD_SETUP.md.
 */
export default function GettingStartedWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate } = useOrganization();
  const { openCreateProduct, openCreateClient, openCreateOrder } = useSheets();

  const [step, setStep] = useState<StepId>('welcome');
  const [currency, setCurrency] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const goto = (s: StepId) => setStep(s);
  const stepNumber = NUMBERED.indexOf(step) + 1;

  const saveCurrency = async () => {
    if (!currency) return goto('product');
    setBusy(true);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { currency });
      await mutate();
      goto('product');
    } catch (error) {
      toast({
        title: 'Could not save currency',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await apiRequest(PLATFORM_API.ORGANIZATION, 'PATCH', { onboarding: { completed: true } });
      await mutate();
      router.replace('/dashboard/orders');
    } catch (error) {
      toast({
        title: 'Could not finish setup',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 py-2">
      {step !== 'welcome' && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {stepNumber} of {NUMBERED.length}
        </p>
      )}

      {step === 'welcome' && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Let&apos;s set up your workspace</h1>
            <p className="text-sm text-muted-foreground">
              Your business runs on three linked things — <strong>products</strong> you sell,
              the <strong>clients</strong> you sell to, and the <strong>orders</strong> that tie
              them together. We&apos;ll set up what each one tracks, so the app fits how you work.
              You can change anything later.
            </p>
          </div>
          <Button onClick={() => goto('currency')}>Get started</Button>
        </div>
      )}

      {step === 'currency' && (
        <div className="space-y-5">
          <StepHeading title="Your currency" hint="Used across orders, payments, and documents." />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => goto('product')} disabled={busy}>
              Skip
            </Button>
            <Button onClick={saveCurrency} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'product' && (
        <div className="space-y-5">
          <StepHeading
            icon={<PackagePlus className="h-5 w-5 text-primary" />}
            title="Your product catalog"
            hint="What you sell. Keep the fields that fit, add your own, or create your first product."
          />
          <EntityFieldSetupStep
            entity="product"
            onContinue={() => goto('client')}
            onCreateFirst={openCreateProduct}
            createLabel="Create your first product"
          />
        </div>
      )}

      {step === 'client' && (
        <div className="space-y-5">
          <StepHeading
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Your clients"
            hint="Who you sell to. Only a name is required — everything else is yours to define."
          />
          <EntityFieldSetupStep
            entity="client"
            onContinue={() => goto('order')}
            onCreateFirst={openCreateClient}
            createLabel="Create your first client"
          />
        </div>
      )}

      {step === 'order' && (
        <div className="space-y-5">
          <StepHeading
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            title="Your orders"
            hint="This includes your status workflow — the stages an order moves through."
          />
          <EntityFieldSetupStep
            entity="order"
            onContinue={finish}
            onCreateFirst={openCreateOrder}
            createLabel="Create your first order"
          />
        </div>
      )}
    </div>
  );
}

function StepHeading({
  title,
  hint,
  icon,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
