import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import UsersTable from '@/components/users/UsersTable';
import UserDialog from '@/components/users/UserDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Users: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <Layout>
      <div className="pb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UsersTable />
      
      <UserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </Layout>
  );
};

export default Users;
