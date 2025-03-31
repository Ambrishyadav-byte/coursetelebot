import React from 'react';
import { useLocation } from 'wouter';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [location] = useLocation();
  
  // Get current page title based on the route
  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/users': 'User Management',
      '/courses': 'Course Management',
      '/settings': 'Settings'
    };
    
    return routes[location] || 'Dashboard';
  };

  return (
    <header className="bg-background-surface shadow-sm z-10 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 lg:hidden" 
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
            <h2 className="text-lg font-medium">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">View notifications</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
