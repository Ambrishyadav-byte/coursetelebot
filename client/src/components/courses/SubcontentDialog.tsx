import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertCourseSubcontentSchema, InsertCourseSubcontent, CourseSubcontent } from '@shared/schema';
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

interface SubcontentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  subcontent?: CourseSubcontent;
  mode: 'create' | 'edit';
}

// Extend the insert schema with validation
const subcontentFormSchema = insertCourseSubcontentSchema.extend({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().min(1, { message: 'Content is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  orderIndex: z.coerce.number().min(0, { message: 'Order index must be a positive number' }),
});

const SubcontentDialog: React.FC<SubcontentDialogProps> = ({ 
  open, 
  onOpenChange, 
  courseId,
  subcontent,
  mode 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InsertCourseSubcontent>({
    resolver: zodResolver(subcontentFormSchema),
    defaultValues: {
      title: '',
      content: '',
      url: '',
      orderIndex: 0,
      courseId,
    },
  });

  // Set form values when editing existing subcontent
  useEffect(() => {
    if (mode === 'edit' && subcontent) {
      form.reset({
        title: subcontent.title,
        content: subcontent.content,
        url: subcontent.url || '',
        orderIndex: subcontent.orderIndex,
        courseId: subcontent.courseId,
      });
    } else if (mode === 'create') {
      form.reset({
        title: '',
        content: '',
        url: '',
        orderIndex: 0,
        courseId,
      });
    }
  }, [form, subcontent, mode, courseId]);

  const createSubcontentMutation = useMutation({
    mutationFn: async (data: InsertCourseSubcontent) => {
      const response = await apiRequest('POST', `/api/courses/${courseId}/subcontents`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/subcontents`] });
      toast({
        title: 'Success',
        description: 'Lesson content created successfully',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create lesson content',
        variant: 'destructive',
      });
    },
  });

  const updateSubcontentMutation = useMutation({
    mutationFn: async (data: InsertCourseSubcontent) => {
      if (!subcontent) throw new Error('Subcontent ID is required for updates');
      const response = await apiRequest('PUT', `/api/subcontents/${subcontent.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/subcontents`] });
      toast({
        title: 'Success',
        description: 'Lesson content updated successfully',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update lesson content',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertCourseSubcontent) => {
    // Make sure empty string URLs are set to null/undefined
    const formData = {
      ...data,
      url: data.url && data.url.trim() !== '' ? data.url : undefined
    };
    
    if (mode === 'edit') {
      updateSubcontentMutation.mutate(formData);
    } else {
      createSubcontentMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} Lesson Content</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the lesson content details.' 
              : 'Add new lesson content to this course.'}
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
                    <Input placeholder="Introduction to the course" {...field} />
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
                      placeholder="Detailed content..." 
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource URL (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/resource" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={createSubcontentMutation.isPending || updateSubcontentMutation.isPending}
              >
                {(createSubcontentMutation.isPending || updateSubcontentMutation.isPending) 
                  ? 'Saving...' 
                  : mode === 'edit' ? 'Update Lesson' : 'Add Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubcontentDialog;