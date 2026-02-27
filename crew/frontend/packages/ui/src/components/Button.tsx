import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground hover:bg-primary/90 border border-foreground',
        destructive:
          'border border-destructive text-destructive hover:bg-destructive/10',
        outline:
          'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'text-secondary-foreground hover:bg-secondary/80 border',
        ghost: 'hover:text-primary-foreground/50',
        link: 'hover:underline',
        icon: 'bg-transparent rounded text-muted-foreground hover:text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-8 px-2 text-xs',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    compoundVariants: [{ variant: 'icon', class: 'p-0 h-4' }],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={twMerge(cn(buttonVariants({ variant, size, className })))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
