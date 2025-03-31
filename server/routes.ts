import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bot } from "./services/telegramBot";
import {
  insertUserSchema,
  insertCourseSchema,
  loginSchema,
  insertAdminUserSchema,
} from "@shared/schema";
import { authenticateJWT, login } from "./middlewares/auth";
import { loginRateLimiter, apiRateLimiter } from "./middlewares/rateLimiter";
import { validateRequest } from "./utils/validation";
import { logAdminEvent, logError } from "./utils/logger";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/auth/login", loginRateLimiter, validateRequest(loginSchema), login);

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
