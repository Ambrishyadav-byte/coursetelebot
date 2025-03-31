import React, { useState } from 'react';
import { useRoute, Link as WouterLink } from 'wouter';
import Layout from '@/components/layout/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Course, CourseSubcontent } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/components/ui/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import SubcontentDialog from '@/components/courses/SubcontentDialog';

const CourseDetail: React.FC = () => {
  const [, params] = useRoute('/courses/:id');
  const id = params?.id ? parseInt(params.id, 10) : null;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubcontentDialogOpen, setIsSubcontentDialogOpen] = useState(false);
  const [selectedSubcontent, setSelectedSubcontent] = useState<CourseSubcontent | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteSubcontentId, setDeleteSubcontentId] = useState<number | null>(null);
  
  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });
  
  // Fetch course subcontents
  const { data: subcontents = [], isLoading: isLoadingSubcontents } = useQuery<CourseSubcontent[]>({
    queryKey: [`/api/courses/${id}/subcontents`],
    enabled: !!id,
  });
  
  // Sort subcontents by order index
  const sortedSubcontents = [...subcontents].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Delete subcontent mutation
  const deleteSubcontentMutation = useMutation({
    mutationFn: async (subcontentId: number) => {
      const response = await apiRequest('DELETE', `/api/subcontents/${subcontentId}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/subcontents`] });
      toast({
        title: 'Success',
        description: 'Lesson content deleted successfully',
      });
      setDeleteSubcontentId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete lesson content',
        variant: 'destructive',
      });
    },
  });
  
  // Reorder subcontent mutations
  const moveSubcontentMutation = useMutation({
    mutationFn: async ({
      subcontentId,
      newOrderIndex,
    }: {
      subcontentId: number;
      newOrderIndex: number;
    }) => {
      const response = await apiRequest('PUT', `/api/subcontents/${subcontentId}`, {
        orderIndex: newOrderIndex,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/subcontents`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reorder lesson content',
        variant: 'destructive',
      });
    },
  });
  
  // Action handlers
  const handleAddSubcontent = () => {
    setSelectedSubcontent(null);
    setDialogMode('create');
    setIsSubcontentDialogOpen(true);
  };
  
  const handleEditSubcontent = (subcontent: CourseSubcontent) => {
    setSelectedSubcontent(subcontent);
    setDialogMode('edit');
    setIsSubcontentDialogOpen(true);
  };
  
  const handleDeleteSubcontent = (subcontentId: number) => {
    setDeleteSubcontentId(subcontentId);
  };
  
  const confirmDeleteSubcontent = () => {
    if (deleteSubcontentId) {
      deleteSubcontentMutation.mutate(deleteSubcontentId);
    }
  };
  
  const cancelDeleteSubcontent = () => {
    setDeleteSubcontentId(null);
  };
  
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    
    const current = sortedSubcontents[index];
    const previous = sortedSubcontents[index - 1];
    
    moveSubcontentMutation.mutate({
      subcontentId: current.id,
      newOrderIndex: previous.orderIndex,
    });
  };
  
  const handleMoveDown = (index: number) => {
    if (index >= sortedSubcontents.length - 1) return;
    
    const current = sortedSubcontents[index];
    const next = sortedSubcontents[index + 1];
    
    moveSubcontentMutation.mutate({
      subcontentId: current.id,
      newOrderIndex: next.orderIndex,
    });
  };
  
  if (isLoadingCourse) {
    return (
      <Layout>
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  if (!course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <h2 className="text-xl font-semibold">Course not found</h2>
          <p className="text-muted-foreground">
            The course you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <WouterLink href="/courses">Back to Courses</WouterLink>
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <WouterLink href="/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </WouterLink>
        </Button>
        <h1 className="text-2xl font-bold">Course Details</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>
            {course.isActive ? (
              <span className="text-green-500 font-medium">Active</span>
            ) : (
              <span className="text-yellow-500 font-medium">Inactive</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{course.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
              <p className="mt-1 whitespace-pre-line">{course.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lesson Content</h2>
        <Button onClick={handleAddSubcontent}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>
      
      {isLoadingSubcontents ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : sortedSubcontents.length === 0 ? (
        <div className="bg-muted rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No lesson content available for this course yet.</p>
          <Button variant="outline" className="mt-4" onClick={handleAddSubcontent}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Lesson
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubcontents.map((subcontent, index) => (
              <TableRow key={subcontent.id}>
                <TableCell className="w-24">
                  <div className="flex items-center space-x-2">
                    <span>{subcontent.orderIndex}</span>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedSubcontents.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {subcontent.title}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {subcontent.content}
                </TableCell>
                <TableCell>
                  {subcontent.url ? (
                    <Link href={subcontent.url} target="_blank" className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      URL
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditSubcontent(subcontent)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSubcontent(subcontent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      {/* Subcontent Dialog */}
      <SubcontentDialog
        open={isSubcontentDialogOpen}
        onOpenChange={setIsSubcontentDialogOpen}
        courseId={course.id}
        subcontent={selectedSubcontent || undefined}
        mode={dialogMode}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSubcontentId} onOpenChange={(open) => !open && setDeleteSubcontentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson content? 
              This action cannot be undone and the content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteSubcontent}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSubcontent}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CourseDetail;