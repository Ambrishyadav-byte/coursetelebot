import React from 'react';
import { Link as WouterLink } from 'wouter';

interface CustomLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// This component solves the issue of nesting <a> inside <a> from wouter Link
export const CustomLink: React.FC<CustomLinkProps> = ({ href, className, children, onClick }) => {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  
  if (isExternal) {
    return (
      <a 
        href={href} 
        className={className} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  
  return (
    <WouterLink href={href}>
      <div className={className} onClick={onClick}>
        {children}
      </div>
    </WouterLink>
  );
};

export default CustomLink;