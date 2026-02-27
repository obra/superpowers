export function RunningDots() {
  return (
    <div className="flex items-center gap-[2px] shrink-0">
      <span className="size-dot rounded-full bg-brand animate-running-dot-1" />
      <span className="size-dot rounded-full bg-brand animate-running-dot-2" />
      <span className="size-dot rounded-full bg-brand animate-running-dot-3" />
    </div>
  );
}
