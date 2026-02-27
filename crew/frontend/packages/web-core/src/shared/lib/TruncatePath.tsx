import { cn } from '@/shared/lib/utils';

export function DisplayTruncatedPath({ path }: { path: string }) {
  const isWindows = path.includes('\\');
  const parts = isWindows ? path.split('\\') : path.split('/');

  return (
    <div className="h-[1lh] overflow-hidden">
      <div className="flex flex-row-reverse flex-wrap justify-end relative pl-2">
        <EllipsisComponent className="bottom-[1lh]" />
        <EllipsisComponent className="bottom-[2lh]" />
        <EllipsisComponent className="bottom-[3lh]" />
        <EllipsisComponent className="bottom-[4lh]" />
        <EllipsisComponent className="bottom-[5lh]" />
        <EllipsisComponent className="bottom-[6lh]" />
        <EllipsisComponent className="bottom-[7lh]" />
        <EllipsisComponent className="bottom-[8lh]" />
        <EllipsisComponent className="bottom-[9lh]" />
        <EllipsisComponent className="bottom-[10lh]" />

        {parts.reverse().map((part, index) => (
          <span className="flex-none font-ibm-plex-mono " key={index}>
            {isWindows ? '\\' : '/'}
            {part}
          </span>
        ))}
      </div>
    </div>
  );
}

const EllipsisComponent = ({ className }: { className: string }) => {
  return (
    <div
      className={cn('absolute -translate-x-full tracking-tighter', className)}
    >
      ...
    </div>
  );
};
