import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoaderProps {
  message?: string | React.ReactElement;
  size?: number;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  size = 32,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 ${className}`}
  >
    <Loader2
      className="animate-spin text-muted-foreground"
      style={{ width: size, height: size }}
    />
    {!!message && (
      <div className="text-center text-muted-foreground">{message}</div>
    )}
  </div>
);
