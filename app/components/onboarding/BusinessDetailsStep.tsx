'use client';

import { useState } from 'react';
import { Loader2, Store } from 'lucide-react';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { Button } from '@/components/ui/button';
import { STEP_COUNT } from '@/lib/onboarding/steps';
import CurrencyPicker, { findCurrency } from './CurrencyPicker';
import OrgLogo from './OrgLogo';
import { StepFooter, StepHeading } from './SetupShell';
import {
  Field,
  IndustryPicker,
  OpenBox,
  Screen,
  TextBox,
} from './business-details-parts';

export interface BusinessDetails {
  /** settings.identity.legal_name — what an invoice calls the sender. */
  legal_name: string;
  /** settings.identity.industry */
  industry: string;
  /** settings.identity.address */
  address: string;
  /** settings.identity.phone */
  phone: string;
  /** settings.identity.email */
  email: string;
  /** settings.locale.currency — ISO 4217. */
  currency: string;
}

interface BusinessDetailsStepProps {
  value: BusinessDetails;
  onChange: (next: BusinessDetails) => void;
  onContinue: () => void;
  busy?: boolean;
  /**
   * Which shell the same form renders in.
   * - `frame` (mobile): the bare A1 hero — big org mark, "Let's Set You Up", no
   *   step counter. The frame's deliberate "form, no narration" intent.
   * - `panel` (desktop): the form as step 1 *inside* SetupShell, so it carries
   *   the same rail and pinned Back/Continue as steps 2–5 instead of the whole
   *   viewport switching layout between step 1 and step 2. Progress lives in the
   *   rail there, which is why the hero counter it omits is no loss on desktop.
   * The field block itself is identical either way.
   */
  chrome?: 'frame' | 'panel';
}

type Drill = 'industry' | 'currency' | null;

/**
 * A1 — "Let's set you up · Business details". The first thing setup asks.
 *
 * Transcribed from the frame rather than approximated: 48px org mark at 14px
 * radius, 24/600 title over a 13.5px subtitle, then six fields of an 11/500
 * uppercase label and a 44px box (8px radius, 1px border, 12px side padding)
 * with its value at 14.5/500, 14px apart, closing on a full-width 48px action.
 *
 * **On mobile it renders without the setup shell** (`chrome='frame'`), and that
 * is the design's point rather than an omission. The frame's own subtitle is
 * "the form, no narration": the step it replaced was a welcome page explaining
 * products, clients and orders before the user could touch anything, and a
 * "Step 1 of 5" counter above an empty form is the same instinct in miniature.
 * **On desktop it renders inside the shell** (`chrome='panel'`) so step 1 no
 * longer switches the whole viewport's layout before step 2 — the rail already
 * carries progress there, so the counter the mobile hero drops is no loss.
 *
 * **Industry and currency open in a sheet, not a nested screen.** Each is a
 * single choice, and CLAUDE.md's screen-vs-sheet rule reserves nested screens
 * for composing a record — deciding one thing is a sheet. They open the app's
 * one `OrderSheet` primitive (a bottom drawer on mobile), so the form keeps its
 * state and scroll underneath while a value is picked, and no bespoke
 * full-screen swap or back-arrow is re-implemented here.
 *
 * **Every field here except industry ends up on an invoice.**
 * `issue_document()` freezes `settings.identity` as the issuer block, so this
 * form is what stops a shop's first invoice going out with a blank letterhead —
 * the gap STATE.md flagged on 2026-08-02, when onboarding collected currency
 * and nothing else.
 *
 * Only **currency** is required, because `issue_document()` refuses to raise
 * anything without `settings.locale.currency`, quoting "complete setup first".
 * Letting Continue pass without one would stamp onboarding complete and then
 * fail every document the shop tried to raise.
 */
export default function BusinessDetailsStep({
  value,
  onChange,
  onContinue,
  busy,
  chrome = 'frame',
}: BusinessDetailsStepProps) {
  const [drill, setDrill] = useState<Drill>(null);
  const set = <K extends keyof BusinessDetails>(key: K, next: BusinessDetails[K]) =>
    onChange({ ...value, [key]: next });

  const currency = value.currency ? findCurrency(value.currency) : null;
  // `settingsBlocks.identity.email` is `.email()`, so a malformed address comes
  // back as a 400 with a zod path in it. Cheaper to say so next to the field
  // than to let the save fail and make the user work out which one it meant.
  const emailInvalid = value.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());
  const canContinue = !busy && !!value.currency && !emailInvalid;

  // The one field block, shared by both chromes — the form is the same form
  // whether it wears the mobile hero or the desktop shell panel.
  const fields = (
    <div className="flex flex-col gap-[14px]">
      <Field label="BUSINESS NAME">
        <TextBox
          value={value.legal_name}
          onChange={next => set('legal_name', next)}
          placeholder="The name customers know you by"
          label="Business name"
        />
      </Field>

      {/* A chevron means it opens something, and these two do. */}
      <Field label="INDUSTRY">
        <OpenBox
          value={value.industry}
          placeholder="What you do"
          label="Industry"
          onOpen={() => setDrill('industry')}
        />
      </Field>

      {/* The frame draws a chevron here too, and it is the one signifier not
          reproduced: `identity.address` is a single string and there is no
          address picker behind it. A caret promising a surface that doesn't
          exist is worse than a plain field that takes what you type. */}
      <Field label="LOCATION">
        <TextBox
          value={value.address}
          onChange={next => set('address', next)}
          placeholder="Where customers find you"
          label="Location"
        />
      </Field>

      <Field label="PHONE">
        <TextBox
          type="tel"
          value={value.phone}
          onChange={next => set('phone', next)}
          placeholder="A number customers can reach you on"
          label="Phone"
        />
      </Field>

      <Field label="EMAIL">
        <TextBox
          type="email"
          value={value.email}
          onChange={next => set('email', next)}
          placeholder="An address customers can reach you at"
          label="Email"
        />
        {emailInvalid && (
          <p className="mt-1.5 text-[11px] text-destructive">
            That doesn&apos;t look like an email address.
          </p>
        )}
      </Field>

      <Field label="CURRENCY">
        <OpenBox
          value={currency ? `${currency.code} · ${currency.name}` : ''}
          placeholder="Choose a currency"
          label="Currency"
          onOpen={() => setDrill('currency')}
        />
        {!value.currency && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Required — every order, payment and invoice is priced in it.
          </p>
        )}
      </Field>
    </div>
  );

  // Deciding one thing is a sheet, not a screen (CLAUDE.md → screen-vs-sheet).
  // Industry and currency each open the app's one sheet primitive — a bottom
  // drawer on mobile — rather than a hand-rolled full-screen swap, so the form
  // underneath keeps its state and its scroll while a choice is made. Choosing
  // sets the value and closes.
  const sheets = (
    <>
      <OrderSheet
        open={drill === 'industry'}
        onOpenChange={open => setDrill(open ? 'industry' : null)}
        title="Industry"
        description="What you do — pick the closest, or name your own."
      >
        <div className="p-5">
          <IndustryPicker
            value={value.industry}
            onChange={next => {
              set('industry', next);
              setDrill(null);
            }}
          />
        </div>
      </OrderSheet>

      <OrderSheet
        open={drill === 'currency'}
        onOpenChange={open => setDrill(open ? 'currency' : null)}
        title="Currency"
        description="Every order, payment and invoice is priced in it."
      >
        <div className="p-5">
          <CurrencyPicker
            value={value.currency}
            onChange={code => {
              set('currency', code);
              setDrill(null);
            }}
          />
        </div>
      </OrderSheet>
    </>
  );

  // Desktop: the form as a step inside SetupShell — StepHeading and StepFooter
  // portal into the shell's pinned slots, so it matches steps 2–5 exactly.
  if (chrome === 'panel') {
    return (
      <>
        <StepHeading
          stepNumber={1}
          stepCount={STEP_COUNT}
          icon={<Store className="h-5 w-5" />}
          title="Your business"
          hint="How your business shows up to customers — its name, contact details and the currency you work in."
        />
        {fields}
        <StepFooter disabled={busy}>
          <Button type="button" onClick={onContinue} disabled={!canContinue}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Started
          </Button>
        </StepFooter>
        {sheets}
      </>
    );
  }

  // Mobile: the bare A1 hero frame.
  return (
    <Screen>
      <OrgLogo size={48} className="rounded-[14px]" />

      <h1 className="mt-[18px] text-2xl font-semibold text-foreground">Let&apos;s Set You Up</h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">Tell us about your business</p>

      <div className="mt-[26px]">{fields}</div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Get Started
      </button>

      {sheets}
    </Screen>
  );
}

