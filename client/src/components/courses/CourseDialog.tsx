import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertCourseSchema, InsertCourse, Course } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCourse: Course | null;
}

// Extend the insert schema with validation
const courseFormSchema = insertCourseSchema.extend({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  content: z.string().min(1, { message: 'Content is required' }),
});

const CourseDialog: React.FC<CourseDialogProps> = ({ 
  open, 
  onOpenChange,
  editCourse 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!editCourse;
  
  const form = useForm<InsertCourse>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      isActive: true,
    },
  });

  // Update form values when editing a course
  useEffect(() => {
    if (editCourse) {
      form.reset({
        title: editCourse.title,
        description: editCourse.description,
        content: editCourse.content,
        isActive: editCourse.isActive,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        content: '',
        isActive: true,
      });
    }
  }, [editCourse, form]);

  // Create/Update course mutation
  const courseMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      if (isEditMode && editCourse) {
        const response = await apiRequest('PUT', `/api/courses/${editCourse.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/courses', data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Success',
        description: isEditMode ? 'Course updated successfully' : 'Course created successfully',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : `Failed to ${isEditMode ? 'update' : 'create'} course`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertCourse) => {
    courseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update course details. All verified users will see these changes.'
              : 'Create a new course. All verified users will have access to it.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Course title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the course" 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Course content (supports Markdown)" 
                      className="resize-none"
                      rows={8}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    defaultValue={field.value ? 'true' : 'false'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={courseMutation.isPending}
              >
                {courseMutation.isPending
                  ? (isEditMode ? 'Saving...' : 'Creating...')
                  : (isEditMode ? 'Save Changes' : 'Create Course')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDialog;
