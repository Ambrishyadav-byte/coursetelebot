import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bot } from "./services/telegramBot";
import {
  insertUserSchema,
  insertCourseSchema,
  loginSchema,
  insertAdminUserSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  insertCourseSubcontentSchema,
} from "@shared/schema";
import { authenticateJWT, login } from "./middlewares/auth";
import { loginRateLimiter, apiRateLimiter } from "./middlewares/rateLimiter";
import { validateRequest } from "./utils/validation";
import { logAdminEvent, logError } from "./utils/logger";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/auth/login", loginRateLimiter, validateRequest(loginSchema), login);
  
  // Password reset route (does not require authentication)
  app.post("/api/auth/reset-password", loginRateLimiter, validateRequest(passwordResetSchema), async (req, res) => {
    try {
      const { username, passphrase, newPassword } = req.body;
      
      const admin = await storage.resetAdminPassword(username, passphrase, newPassword);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid username or security passphrase" });
      }
      
      logAdminEvent(`Admin reset password using passphrase: ${admin.username}`);
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Check if passphrase exists for a username
  app.post("/api/auth/check-passphrase", loginRateLimiter, validateRequest(passwordResetRequestSchema), async (req, res) => {
    try {
      const { username } = req.body;
      
      const admin = await storage.getAdminUserByUsername(username);
      
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      // Only check if passphrase exists, don't return the actual passphrase
      res.json({ 
        success: true, 
        hasPassphrase: Boolean(admin.passphrase && admin.passphrase.length > 0) 
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Admin routes - all require JWT authentication
  const adminRouter = express.Router();
  adminRouter.use(authenticateJWT);
  adminRouter.use(apiRateLimiter);

  // User management routes
  adminRouter.get("/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.post("/users", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      logAdminEvent(`Admin created new user: ${user.email}`, req.user?.id);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.patch("/users/:id/verify", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.verifyUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logAdminEvent(`Admin verified user: ${user.email}`, req.user?.id);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.patch("/users/:id/ban", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.banUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logAdminEvent(`Admin banned user: ${user.email}`, req.user?.id);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.patch("/users/:id/unban", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.unbanUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logAdminEvent(`Admin unbanned user: ${user.email}`, req.user?.id);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Course management routes
  adminRouter.get("/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.get("/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.post("/courses", validateRequest(insertCourseSchema), async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      logAdminEvent(`Admin created new course: ${course.title}`, req.user?.id);
      res.status(201).json(course);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.put("/courses/:id", validateRequest(insertCourseSchema), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await storage.updateCourse(courseId, req.body);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      logAdminEvent(`Admin updated course: ${course.title}`, req.user?.id);
      res.json(course);
    } catch (error) {
      handleError(res, error);
    }
  });

  adminRouter.delete("/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const success = await storage.deleteCourse(courseId);
      
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      logAdminEvent(`Admin deleted course with ID: ${courseId}`, req.user?.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Course Subcontent routes
  adminRouter.get("/courses/:courseId/subcontents", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const subcontents = await storage.getCourseSubcontents(courseId);
      res.json(subcontents);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  adminRouter.get("/subcontents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const subcontent = await storage.getCourseSubcontent(id);
      
      if (!subcontent) {
        return res.status(404).json({ message: "Course subcontent not found" });
      }
      
      res.json(subcontent);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  adminRouter.post("/courses/:courseId/subcontents", validateRequest(insertCourseSubcontentSchema), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const subcontent = await storage.createCourseSubcontent({
        ...req.body,
        courseId
      });
      
      logAdminEvent(`Admin created subcontent for course ID: ${courseId}`, req.user?.id);
      res.status(201).json(subcontent);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  adminRouter.put("/subcontents/:id", validateRequest(insertCourseSubcontentSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const subcontent = await storage.updateCourseSubcontent(id, req.body);
      
      if (!subcontent) {
        return res.status(404).json({ message: "Course subcontent not found" });
      }
      
      logAdminEvent(`Admin updated subcontent ID: ${id}`, req.user?.id);
      res.json(subcontent);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  adminRouter.delete("/subcontents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteCourseSubcontent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Course subcontent not found" });
      }
      
      logAdminEvent(`Admin deleted subcontent ID: ${id}`, req.user?.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Admin user management routes
  adminRouter.post("/admins", validateRequest(insertAdminUserSchema), async (req, res) => {
    try {
      const admin = await storage.createAdminUser(req.body);
      logAdminEvent(`Admin created new admin user: ${admin.username}`, req.user?.id);
      res.status(201).json({ ...admin, password: undefined });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Password change route (requires authentication)
  adminRouter.post("/change-password", validateRequest(passwordChangeSchema), async (req, res) => {
    try {
      const { username } = req.user!;
      const { currentPassword, newPassword } = req.body;
      
      const admin = await storage.changeAdminPassword(username, currentPassword, newPassword);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid current password" });
      }
      
      logAdminEvent(`Admin changed password: ${admin.username}`, admin.id);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Set or update passphrase route (requires authentication)
  adminRouter.post("/update-passphrase", async (req, res) => {
    try {
      const { id } = req.user!;
      const { passphrase } = req.body;
      
      if (!passphrase || typeof passphrase !== 'string' || passphrase.length < 4) {
        return res.status(400).json({ message: "Passphrase must be at least 4 characters" });
      }
      
      const admin = await storage.updateAdminPassphrase(id, passphrase);
      
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      logAdminEvent(`Admin updated recovery passphrase`, admin.id);
      res.json({ success: true, message: "Recovery passphrase updated successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Activities routes
  adminRouter.get("/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Stats routes
  adminRouter.get("/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();
      
      const totalUsers = users.length;
      const verifiedUsers = users.filter(user => user.isVerified).length;
      const bannedUsers = users.filter(user => user.isBanned).length;
      const activeCourses = courses.filter(course => course.isActive).length;
      
      res.json({
        totalUsers,
        verifiedUsers,
        bannedUsers,
        activeCourses
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Mount admin router to /api path
  app.use("/api", adminRouter);

  // Error handling helper
  function handleError(res: Response, error: unknown) {
    if (error instanceof Error) {
      logError(`API error: ${error.message}`);
      res.status(500).json({ message: error.message });
    } else {
      logError(`Unknown API error`);
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }

  return httpServer;
}
