import React from 'react';
import { Link as WouterLink } from 'wouter';
import { cn } from '@/lib/utils';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Custom Link component that wraps wouter's Link for internal navigation
 * and regular anchor tags for external links
 */
export const Link = ({
  href,
  external = false,
  className,
  children,
  ...props
}: LinkProps) => {
  // External links or links that don't start with /
  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={cn(
          'text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50',
          className
        )}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Internal navigation with wouter
  return (
    <WouterLink href={href}>
      <a
        className={cn(
          'text-primary hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50',
          className
        )}
        {...props}
      >
        {children}
      </a>
    </WouterLink>
  );
};