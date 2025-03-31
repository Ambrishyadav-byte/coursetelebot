import React from 'react';
import { Link as WouterLink } from 'wouter';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const linkVariants = cva(
  'inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'text-primary hover:text-primary/80',
        destructive: 'text-destructive hover:text-destructive/80',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'text-secondary-foreground hover:text-secondary-foreground/80',
      },
      underline: {
        true: 'underline underline-offset-4',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      underline: false,
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  asChild?: boolean;
  href: string;
  underline?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, underline, href, children, ...props }, ref) => {
    // External link check
    const isExternal = href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel');

    // Render regular anchor for external links
    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          className={cn(linkVariants({ variant, underline, className }))}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }

    // Use Wouter Link for internal navigation
    return (
      <WouterLink href={href}>
        <a
          ref={ref}
          className={cn(linkVariants({ variant, underline, className }))}
          {...props}
        >
          {children}
        </a>
      </WouterLink>
    );
  }
);

Link.displayName = 'Link';