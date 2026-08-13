'use client';

import Image from 'next/image';
import { useOrganization as useClerkOrganization } from '@clerk/nextjs';
import { cn, getInitials } from '@/lib/utils';

interface OrgLogoProps {
  /** Rendered size in px — square. */
  size: number;
  className?: string;
}

/**
 * The organization's own mark, read from Clerk (the display source of truth
 * for org name and image). Clerk always supplies an `imageUrl`, generating a
 * default avatar when nothing has been uploaded, so initials are only a
 * fallback for the moment before the org loads — not the normal case.
 *
 * The org is the tenant; nothing here is ever a hardcoded shop.
 */
export default function OrgLogo({ size, className }: OrgLogoProps) {
  const { organization } = useClerkOrganization();
  const name = organization?.name ?? '';
  const imageUrl = organization?.imageUrl;

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        // Explicit CSS width/height, not just the HTML attributes: as a child of
        // a column flex (align-items: stretch) the bare <img> gets stretched to
        // the container width while its height holds, distorting the mark into a
        // squished oval. A fixed square box plus object-cover keeps it round and
        // crops a non-square upload rather than warping it.
        style={{ width: size, height: size }}
        className={cn('flex-shrink-0 rounded-lg object-cover', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-lg bg-primary font-extrabold text-primary-foreground',
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
