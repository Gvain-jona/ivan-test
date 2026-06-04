declare module '@tanstack/react-virtual' {
  export interface VirtualizerOptions<TScrollElement, TItemElement> {
    count: number;
    getScrollElement: () => TScrollElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
    horizontal?: boolean;
    paddingStart?: number;
    paddingEnd?: number;
    scrollPaddingStart?: number;
    scrollPaddingEnd?: number;
  }
  export interface VirtualItem {
    key: string | number;
    index: number;
    start: number;
    end: number;
    size: number;
    lane: number;
  }
  export function useVirtualizer<TScrollElement extends Element, TItemElement extends Element>(
    options: VirtualizerOptions<TScrollElement, TItemElement>
  ): { getVirtualItems: () => VirtualItem[]; getTotalSize: () => number; measureElement?: (el: TItemElement | null) => void };
}
