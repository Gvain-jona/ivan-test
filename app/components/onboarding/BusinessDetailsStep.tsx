'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import CurrencyPicker, { findCurrency } from './CurrencyPicker';
import OrgLogo from './OrgLogo';
import {
  DrillIn,
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
 * It renders **without the setup shell**, and that is the design's point rather
 * than an omission. The frame's own subtitle is "the form, no narration": the
 * step it replaced was a welcome page explaining products, clients and orders
 * before the user could touch anything, and a "Step 1 of 5" counter above an
 * empty form is the same instinct in miniature. The rail returns for the field
 * setup steps, which genuinely are a sequence.
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
}: BusinessDetailsStepProps) {
  const [drill, setDrill] = useState<Drill>(null);
  const set = <K extends keyof BusinessDetails>(key: K, next: BusinessDetails[K]) =>
    onChange({ ...value, [key]: next });

  if (drill === 'currency') {
    return (
      <DrillIn title="Currency" onBack={() => setDrill(null)}>
        <CurrencyPicker
          value={value.currency}
          onChange={code => {
            set('currency', code);
            setDrill(null);
          }}
        />
      </DrillIn>
    );
  }

  if (drill === 'industry') {
    return (
      <DrillIn title="Industry" onBack={() => setDrill(null)}>
        <IndustryPicker
          value={value.industry}
          onChange={next => {
            set('industry', next);
            setDrill(null);
          }}
        />
      </DrillIn>
    );
  }

  const currency = value.currency ? findCurrency(value.currency) : null;
  // `settingsBlocks.identity.email` is `.email()`, so a malformed address comes
  // back as a 400 with a zod path in it. Cheaper to say so next to the field
  // than to let the save fail and make the user work out which one it meant.
  const emailInvalid = value.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());

  return (
    <Screen>
      <OrgLogo size={48} className="rounded-[14px]" />

      <h1 className="mt-[18px] text-2xl font-semibold text-foreground">Let&apos;s Set You Up</h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">Business Details</p>

      <div className="mt-[26px] flex flex-col gap-[14px]">
        <Field label="BUSINESS NAME">
          <TextBox
            value={value.legal_name}
            onChange={next => set('legal_name', next)}
            placeholder="What your invoices should say"
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
            placeholder="Shown on your invoices"
            label="Phone"
          />
        </Field>

        <Field label="EMAIL">
          <TextBox
            type="email"
            value={value.email}
            onChange={next => set('email', next)}
            placeholder="Shown on your invoices"
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

      <div className="flex-1" />

      <button
        type="button"
        onClick={onContinue}
        disabled={busy || !value.currency || emailInvalid}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Get Started
      </button>
    </Screen>
  );
}

