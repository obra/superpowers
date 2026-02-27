import '@tanstack/history';

declare module '@tanstack/history' {
  interface HistoryState {
    [key: string]: unknown;
  }
}
