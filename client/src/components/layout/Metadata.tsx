import React from 'react';

interface MetadataProps {
  title?: string;
  description?: string;
}

// A simple component to handle page metadata
export const Metadata: React.FC<MetadataProps> = ({ 
  title = "Admin Panel",
  description = "Telegram Bot Admin Panel" 
}) => {
  React.useEffect(() => {
    // Update document title
    document.title = title ? `${title} | Admin Panel` : "Admin Panel";
    
    // Update meta description if it exists
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    return () => {
      // Reset title on unmount (optional)
      // document.title = "Admin Panel";
    };
  }, [title, description]);
  
  // This component doesn't render anything
  return null;
};