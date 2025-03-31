import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, BookOpen, AlertTriangle } from 'lucide-react';
import { Activity } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardContent className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.length === 0 ? (
              <li className="text-center py-4 text-muted-foreground">No recent activities</li>
            ) : (
              activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < activities.length - 1 && (
                      <span 
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border" 
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-background
                          ${getActivityIconBg(activity.type)}
                        `}>
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <a href="#" className="font-medium text-primary">
                              {getActivityTypeLabel(activity.type)}
                            </a>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>
                            {activity.createdAt 
                              ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) 
                              : 'recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions for activity styling
const getActivityIconBg = (type: string): string => {
  switch (type.toUpperCase()) {
    case 'USER':
    case 'INFO':
      return 'bg-primary';
    case 'ADMIN':
      return 'bg-info';
    case 'WARNING':
      return 'bg-warning';
    case 'ERROR':
      return 'bg-destructive';
    default:
      return 'bg-primary';
  }
};

const getActivityIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'USER':
    case 'INFO':
      return <User className="h-6 w-6 text-white" />;
    case 'ADMIN':
      return <BookOpen className="h-6 w-6 text-white" />;
    case 'WARNING':
    case 'ERROR':
      return <AlertTriangle className="h-6 w-6 text-white" />;
    default:
      return <User className="h-6 w-6 text-white" />;
  }
};

const getActivityTypeLabel = (type: string): string => {
  switch (type.toUpperCase()) {
    case 'USER':
      return 'User Activity';
    case 'ADMIN':
      return 'Admin Action';
    case 'INFO':
      return 'Information';
    case 'WARNING':
      return 'Warning';
    case 'ERROR':
      return 'Error';
    default:
      return type;
  }
};

export default ActivityFeed;
