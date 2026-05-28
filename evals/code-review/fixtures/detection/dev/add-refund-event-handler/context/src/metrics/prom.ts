// Minimal stub for fixture purposes — the real exporter speaks to
// the prom-client registry. Not under review here.
export function incrementCounter(name: string, labels: Record<string, string>): void {
    void name; void labels;
}
export function observeHistogram(name: string, value: number, labels: Record<string, string>): void {
    void name; void value; void labels;
}
