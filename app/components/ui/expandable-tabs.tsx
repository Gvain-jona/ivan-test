"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
// No need to import LucideIcon anymore

interface Tab {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
  isContextMenu?: boolean;
  menuType?: 'notifications' | 'search' | 'profile';
  type?: never;
  badge?: number;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null, event?: React.MouseEvent) => void;
  initialSelectedIndex?: number | null;
  activeContextMenuIndex?: number | null;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  initialSelectedIndex = null,
  activeContextMenuIndex = null,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(initialSelectedIndex);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  // Update selected state when initialSelectedIndex changes
  React.useEffect(() => {
    console.log('initialSelectedIndex changed:', initialSelectedIndex);
    // Always update the selected state when initialSelectedIndex changes
    // This ensures the UI stays in sync with the navigation state
    setSelected(initialSelectedIndex);
  }, [initialSelectedIndex]);

  // Log selected state changes for debugging
  React.useEffect(() => {
    console.log('Selected tab changed:', selected);
  }, [selected]);

  // We're not resetting the selected state on outside clicks anymore
  // This allows the active tab to persist until explicitly changed

  const handleSelect = (index: number, event?: React.MouseEvent) => {
    setSelected(index);
    // Make sure we're passing the event to the onChange handler
    if (onChange) {
      onChange(index, event);
    }
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={(event) => handleSelect(index, event)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              // Regular navigation items are active based on the selected state
              !tab.isContextMenu && selected === index
                ? cn("bg-muted", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              // Context menu items have special handling
              tab.isContextMenu && "context-menu-item",
              // Context menu items can be active based on activeContextMenuIndex
              tab.isContextMenu && activeContextMenuIndex === index && cn("bg-muted", activeColor, "active-context-menu-item"),
              // Always keep the current page tab active even when a context menu is open
              initialSelectedIndex === index && cn("bg-muted", activeColor)
            )}
            role="tab"
            aria-selected={selected === index || activeContextMenuIndex === index || initialSelectedIndex === index}
          >
            <div className="relative inline-flex items-center justify-center">
              {typeof Icon === 'function' && typeof Icon({}).type === 'undefined' ?
                <Icon /> :
                <Icon size={20} />
              }
              {tab.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ${tab.badge === 0 ? 'opacity-0' : ''}`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <AnimatePresence initial={false}>
              {(selected === index || initialSelectedIndex === index) && !tab.isContextMenu && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}