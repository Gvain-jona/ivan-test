declare module 'react-intersection-observer' {
  import { RefObject } from 'react';
  interface IntersectionOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    triggerOnce?: boolean;
    skip?: boolean;
    initialInView?: boolean;
  }
  interface InViewHookResponse {
    ref: (node?: Element | null) => void;
    inView: boolean;
    entry?: IntersectionObserverEntry;
  }
  export function useInView(options?: IntersectionOptions): InViewHookResponse;
  export function InView(props: any): JSX.Element;
}
