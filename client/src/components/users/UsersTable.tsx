import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge-colored';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UsersTable: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dialogAction, setDialogAction] = useState<'ban' | 'unban' | null>(null);
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/users/${id}/verify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User successfully verified',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify user',
        variant: 'destructive',
      });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/users/${id}/ban`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User successfully banned',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to ban user',
        variant: 'destructive',
      });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/users/${id}/unban`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User successfully unbanned',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unban user',
        variant: 'destructive',
      });
    },
  });

  // Action handlers
  const handleVerifyUser = (id: number) => {
    verifyMutation.mutate(id);
  };

  const handleBanUser = (id: number) => {
    setSelectedUserId(id);
    setDialogAction('ban');
  };

  const handleUnbanUser = (id: number) => {
    setSelectedUserId(id);
    setDialogAction('unban');
  };

  const confirmAction = () => {
    if (!selectedUserId) return;
    
    if (dialogAction === 'ban') {
      banMutation.mutate(selectedUserId);
    } else if (dialogAction === 'unban') {
      unbanMutation.mutate(selectedUserId);
    }
    
    setSelectedUserId(null);
    setDialogAction(null);
  };

  const cancelAction = () => {
    setSelectedUserId(null);
    setDialogAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="shadow overflow-hidden border border-border rounded-lg">
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
          <tbody className="bg-background divide-y divide-border">
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
                    <div className="text-sm font-medium text-foreground">{user.email}</div>
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
                        onClick={() => handleVerifyUser(user.id)}
                        disabled={verifyMutation.isPending}
                      >
                        Verify
                      </Button>
                    )}
                    
                    {user.isBanned ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success"
                        onClick={() => handleUnbanUser(user.id)}
                        disabled={unbanMutation.isPending}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleBanUser(user.id)}
                        disabled={banMutation.isPending}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={() => !selectedUserId && setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'ban' ? 'Ban User' : 'Unban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'ban'
                ? 'Are you sure you want to ban this user? They will lose access to all courses and the bot.'
                : 'Are you sure you want to unban this user? They will regain access to courses and the bot.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={dialogAction === 'ban' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {dialogAction === 'ban' ? 'Ban' : 'Unban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTable;
