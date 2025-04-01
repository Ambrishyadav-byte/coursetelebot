import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import CoursesTable from '@/components/courses/CoursesTable';
import CourseDialog from '@/components/courses/CourseDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Course } from '@shared/schema';

const Courses: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  
  const handleAddCourse = () => {
    setEditCourse(null);
    setIsDialogOpen(true);
  };
  
  const handleEditCourse = (course: Course) => {
    setEditCourse(course);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditCourse(null);
    }
  };
  
  return (
    <Layout>
      <div className="pb-5 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Course Management</h1>
        <Button onClick={handleAddCourse}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <CoursesTable onEditCourse={handleEditCourse} />
      </div>

      <CourseDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogClose}
        editCourse={editCourse}
      />
    </Layout>
  );
};

export default Courses;
