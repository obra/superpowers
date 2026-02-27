import type { ScrollModifier } from '@virtuoso.dev/message-list';

export const INITIAL_TOP_ITEM = {
  index: 'LAST' as const,
  align: 'end' as const,
};

export const InitialDataScrollModifier: ScrollModifier = {
  type: 'item-location',
  location: INITIAL_TOP_ITEM,
  purgeItemSizes: true,
};

export const ScrollToBottomModifier: ScrollModifier = {
  type: 'item-location',
  location: INITIAL_TOP_ITEM,
};
