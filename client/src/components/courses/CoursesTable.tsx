import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge-colored';
import { Course } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from '@/components/ui/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, ListVideo } from 'lucide-react';

interface CoursesTableProps {
  onEditCourse: (course: Course) => void;
}

const CoursesTable: React.FC<CoursesTableProps> = ({ onEditCourse }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  
  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete course',
        variant: 'destructive',
      });
    },
  });

  // Toggle course active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Course> }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Success',
        description: 'Course status updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update course',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteCourse = (id: number) => {
    setCourseToDelete(id);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete);
      setCourseToDelete(null);
    }
  };

  const handleToggleActive = (course: Course) => {
    toggleActiveMutation.mutate({
      id: course.id,
      data: { ...course, isActive: !course.isActive },
    });
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
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Updated
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-muted-foreground">
                  No courses found
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{course.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.description.length > 50
                        ? `${course.description.substring(0, 50)}...`
                        : course.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {course.createdAt
                      ? formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })
                      : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {course.updatedAt
                      ? formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })
                      : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary mr-2"
                      onClick={() => handleToggleActive(course)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {course.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="mr-2"
                    >
                      <Link href={`/courses/${course.id}`}>
                        <ListVideo className="h-4 w-4 mr-1" />
                        Manage Lessons
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1"
                      onClick={() => onEditCourse(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone and all students will lose access to the content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoursesTable;
