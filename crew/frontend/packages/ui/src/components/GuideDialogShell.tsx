import { useState, type ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

export interface GuideDialogTopic {
  id: string;
  title: string;
  content: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

interface GuideDialogShellProps {
  topics: GuideDialogTopic[];
  closeLabel: string;
  onClose: () => void;
  className?: string;
}

export function GuideDialogShell({
  topics,
  closeLabel,
  onClose,
  className,
}: GuideDialogShellProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (topics.length === 0) {
    return null;
  }

  const selectedTopic = topics[selectedIndex] ?? topics[0];

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]">
        <div
          className={cn(
            'w-[800px] h-[600px] flex rounded-sm overflow-hidden',
            'bg-panel/95 backdrop-blur-sm border border-border/50 shadow-lg',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200',
            className
          )}
        >
          <div className="w-52 bg-secondary/80 border-r border-border/50 p-3 flex flex-col gap-1 overflow-y-auto">
            {topics.map((topic, idx) => (
              <button
                key={topic.id}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'text-left px-3 py-2 rounded-sm text-sm transition-colors',
                  idx === selectedIndex
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-normal hover:bg-primary/10'
                )}
              >
                {topic.title}
              </button>
            ))}
          </div>
          <div className="flex-1 p-6 flex flex-col relative overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-panel transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              <XIcon className="h-4 w-4 text-normal" />
              <span className="sr-only">{closeLabel}</span>
            </button>
            <h2 className="text-xl font-semibold text-high mb-4 pr-8">
              {selectedTopic.title}
            </h2>
            {selectedTopic.imageSrc && (
              <img
                src={selectedTopic.imageSrc}
                alt={selectedTopic.imageAlt ?? selectedTopic.title}
                className="w-full rounded-sm border border-border/30 mb-4"
              />
            )}
            <div className="text-normal text-sm leading-relaxed space-y-3">
              {typeof selectedTopic.content === 'string' ? (
                <p>{selectedTopic.content}</p>
              ) : (
                selectedTopic.content
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
