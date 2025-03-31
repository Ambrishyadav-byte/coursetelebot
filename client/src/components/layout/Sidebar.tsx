import React from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { CustomLink } from '@/components/ui/custom-link';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  
  // Active route matchers
  const [isDashboard] = useRoute('/dashboard');
  const [isUsers] = useRoute('/users');
  const [isCourses] = useRoute('/courses');
  const [isNotifications] = useRoute('/notifications');
  const [isSettings] = useRoute('/settings');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-background-surface border-r border-border">
      <div className="flex items-center justify-center h-16 px-4 border-b border-border">
        <h1 className="text-xl font-semibold">Telegram Bot Admin</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-5 px-2 space-y-1">
          <CustomLink 
            href="/dashboard"
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isDashboard 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
            `}
          >
              <LayoutDashboard className="mr-3 h-6 w-6" />
              Dashboard
          </CustomLink>
          
          <CustomLink 
            href="/users"
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isUsers 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
            `}
          >
              <Users className="mr-3 h-6 w-6" />
              Users
          </CustomLink>
          
          <CustomLink 
            href="/courses"
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isCourses 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
            `}
          >
              <BookOpen className="mr-3 h-6 w-6" />
              Courses
          </CustomLink>
          
          <CustomLink 
            href="/notifications"
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isNotifications 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
            `}
          >
              <Bell className="mr-3 h-6 w-6" />
              Notifications
          </CustomLink>
          
          <CustomLink 
            href="/settings"
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isSettings 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
            `}
          >
              <Settings className="mr-3 h-6 w-6" />
              Settings
          </CustomLink>
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">{user?.username || 'Admin User'}</p>
              <button 
                onClick={handleLogout}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center mt-1"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
