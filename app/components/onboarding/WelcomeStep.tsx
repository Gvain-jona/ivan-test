'use client';

import { ArrowRight } from 'lucide-react';
import { useOrganization as useClerkOrganization, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import OrgLogo from './OrgLogo';

/**
 * The intro. Names the org and the person, because "let's set up Ivan Prints"
 * lands differently than "let's set up your workspace" — but the name is the
 * tenant's, read from Clerk, never a hardcoded shop. Both fall back cleanly:
 * Clerk may not have loaded, and a user may have no first name set.
 */
export default function WelcomeStep({ onStart }: { onStart: () => void }) {
  const { organization } = useClerkOrganization();
  const { user } = useUser();
  const orgName = organization?.name;
  const firstName = user?.firstName;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 py-6 text-center">
      <OrgLogo size={64} className="rounded-2xl" />
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          {orgName ? `Let's set up ${orgName}` : "Let's set up your workspace"}
        </h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {firstName ? `Hi ${firstName} — your` : 'Your'} business runs on three linked things:
          the <strong className="font-semibold text-foreground">products</strong> you sell, the{' '}
          <strong className="font-semibold text-foreground">clients</strong> you sell to, and the{' '}
          <strong className="font-semibold text-foreground">orders</strong> that tie them
          together. We&apos;ll set up what each one tracks, so the app fits how you already work.
        </p>
      </div>
      <Button onClick={onStart}>
        Get started
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
