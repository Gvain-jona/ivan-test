'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Laptop, Moon, Sun } from 'lucide-react';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Laptop },
] as const;

/**
 * Light / dark / system, persisted by next-themes.
 *
 * A per-person device preference, not org config — which is why it saves
 * nowhere the org can see. It sits on the organization page only because
 * that is where appearance lives; the brand colour beside it is the org
 * setting.
 *
 * The `mounted` guard is the documented next-themes pattern: `theme` is
 * undefined on the server and on the first client render, so rendering the
 * selected state before mount would either mismatch hydration or force a
 * theme-dependent SSR tree — the exact flash the pre-paint script exists to
 * prevent.
 */
export default function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">Appearance</h3>
        <p className="text-[13px] text-muted-foreground">
          Applies to this device only. System follows your OS setting.
        </p>
      </div>

      <div role="radiogroup" aria-label="Appearance" className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]',
                'transition-colors focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
