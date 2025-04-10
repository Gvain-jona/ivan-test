/**
 * Animation variants for use with Framer Motion throughout the application
 * These can be applied directly to motion components to maintain consistent animations
 */

export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const tableRowHover = {
  initial: { backgroundColor: 'rgba(0, 0, 0, 0)' },
  hover: { backgroundColor: 'rgba(255, 255, 255, 0.03)', transition: { duration: 0.2 } }
};

export const tableRowExpand = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.3 } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const tablePaginationVariant = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } },
  exit: { y: -10, opacity: 0, transition: { duration: 0.2 } }
};

export const listItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export const buttonHover = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

export const sheetContent = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.2, duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
}; 