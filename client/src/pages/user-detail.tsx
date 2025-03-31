import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-colored';
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

const UserDetail = () => {
  const [, params] = useRoute('/users/:id');
  const id = params?.id ? parseInt(params.id, 10) : null;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogAction, setDialogAction] = useState<'ban' | 'unban' | null>(null);
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });
  
  // Mutations
  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("User ID is required");
      const response = await apiRequest('PATCH', `/api/users/${id}/verify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
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
    mutationFn: async () => {
      if (!id) throw new Error("User ID is required");
      const response = await apiRequest('PATCH', `/api/users/${id}/ban`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User successfully banned',
      });
      setDialogAction(null);
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
    mutationFn: async () => {
      if (!id) throw new Error("User ID is required");
      const response = await apiRequest('PATCH', `/api/users/${id}/unban`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User successfully unbanned',
      });
      setDialogAction(null);
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
  const handleVerifyUser = () => {
    verifyMutation.mutate();
  };

  const handleBanUser = () => {
    setDialogAction('ban');
  };

  const handleUnbanUser = () => {
    setDialogAction('unban');
  };

  const confirmAction = () => {
    if (dialogAction === 'ban') {
      banMutation.mutate();
    } else if (dialogAction === 'unban') {
      unbanMutation.mutate();
    }
  };

  const cancelAction = () => {
    setDialogAction(null);
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-6">
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container px-4 py-6">
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <AlertCircle className="text-destructive w-12 h-12" />
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-muted-foreground">
            The user you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link href="/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-3">{user.email}</span>
              {user.isBanned ? (
                <Badge variant="error">Banned</Badge>
              ) : user.isVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Telegram ID: <span className="font-mono">{user.telegramId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
                <p className="font-mono">{user.orderId || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Joined</h3>
                <p>{user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {!user.isVerified && !user.isBanned && (
              <Button
                variant="outline"
                onClick={handleVerifyUser}
                disabled={verifyMutation.isPending}
                className="flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify User
              </Button>
            )}
            
            {user.isBanned ? (
              <Button
                variant="outline"
                onClick={handleUnbanUser}
                disabled={unbanMutation.isPending}
                className="flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleBanUser}
                disabled={banMutation.isPending}
                className="text-destructive border-destructive hover:bg-destructive/10 flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>User account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>Verification: {user.isVerified ? 'Verified' : 'Pending'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${user.isBanned ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span>Access: {user.isBanned ? 'Banned' : 'Active'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
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
    </div>
  );
};

export default UserDetail;