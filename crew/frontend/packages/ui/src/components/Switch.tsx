import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../lib/cn';

const switchRootClassName =
  'peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center ' +
  'rounded-full border-2 border-transparent transition-colors ' +
  'data-[state=checked]:bg-foreground ' +
  'data-[state=unchecked]:bg-foreground/35 ' +
  'data-[state=unchecked]:border-foreground/15 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const switchThumbClassName =
  'pointer-events-none block h-3.5 w-3.5 rounded-full shadow-sm ring-0 ' +
  'transition-transform data-[state=checked]:translate-x-3.5 ' +
  'data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-secondary ' +
  'data-[state=unchecked]:bg-low';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(switchRootClassName, className)}
    {...props}
  >
    <SwitchPrimitives.Thumb className={switchThumbClassName} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
