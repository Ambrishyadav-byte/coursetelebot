import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Badge } from '@/components/ui/badge-colored';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface RecentUsersProps {
  users: User[];
  isLoading: boolean;
  onVerifyUser: (id: number) => void;
  onBanUser: (id: number) => void;
  onUnbanUser: (id: number) => void;
}

const RecentUsers: React.FC<RecentUsersProps> = ({ 
  users, 
  isLoading,
  onVerifyUser,
  onBanUser,
  onUnbanUser 
}) => {
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border border-border sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Telegram ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-foreground">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground font-mono">{user.telegramId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isBanned ? (
                          <Badge variant="error">Banned</Badge>
                        ) : user.isVerified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                        {user.orderId ? `#${user.orderId}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.createdAt 
                          ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) 
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary mr-2"
                          asChild
                        >
                          <Link href={`/users/${user.id}`}>View</Link>
                        </Button>
                        
                        {!user.isVerified && !user.isBanned && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success mr-2"
                            onClick={() => onVerifyUser(user.id)}
                          >
                            Verify
                          </Button>
                        )}
                        
                        {user.isBanned ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success"
                            onClick={() => onUnbanUser(user.id)}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => onBanUser(user.id)}
                          >
                            Ban
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/users">
          <a className="text-sm font-medium text-primary hover:text-primary/80">
            View all users <span aria-hidden="true">&rarr;</span>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default RecentUsers;
