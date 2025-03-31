import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import RecentUsers from '@/components/dashboard/RecentUsers';
import { Users, Shield, BookOpen } from 'lucide-react';
import { User, Activity } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  activeCourses: number;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  // Fetch activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // Fetch recent users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    select: (data) => data.slice(0, 5), // Get only 5 most recent users
  });

  // User mutations
  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/users/${id}/verify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
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

  // Handle user actions
  const handleVerifyUser = (id: number) => {
    verifyMutation.mutate(id);
  };

  const handleBanUser = (id: number) => {
    banMutation.mutate(id);
  };

  const handleUnbanUser = (id: number) => {
    unbanMutation.mutate(id);
  };

  return (
    <Layout>
      {/* Stats Cards */}
      <h3 className="text-lg leading-6 font-medium">Overview</h3>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={isLoadingStats ? '...' : stats?.totalUsers || 0}
          icon={Users}
          bgColor="bg-primary"
        />
        <StatsCard
          title="Verified Users"
          value={isLoadingStats ? '...' : stats?.verifiedUsers || 0}
          change={
            !isLoadingStats && stats?.totalUsers
              ? {
                  value: `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%`,
                  positive: true,
                }
              : undefined
          }
          icon={Shield}
          bgColor="bg-success"
        />
        <StatsCard
          title="Active Courses"
          value={isLoadingStats ? '...' : stats?.activeCourses || 0}
          icon={BookOpen}
          bgColor="bg-info"
        />
      </div>

      {/* Recent Activity */}
      <h3 className="mt-10 text-lg leading-6 font-medium">Recent Activity</h3>
      <div className="mt-5">
        <ActivityFeed 
          activities={activities} 
          isLoading={isLoadingActivities} 
        />
      </div>

      {/* Recent Users */}
      <h3 className="mt-10 text-lg leading-6 font-medium">Recent Users</h3>
      <RecentUsers 
        users={users} 
        isLoading={isLoadingUsers}
        onVerifyUser={handleVerifyUser}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
      />
    </Layout>
  );
};

export default Dashboard;
