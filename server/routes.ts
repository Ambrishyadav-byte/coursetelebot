import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getBot } from "./services/telegramBot";
import { bootstrapTelegramBot } from "./services/telegramBot";
import { verifyOrderPayment } from "./services/woocommerce";
import {
  insertUserSchema,
  insertCourseSchema,
  loginSchema,
  insertAdminUserSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  insertCourseSubcontentSchema,
  wooCommerceConfigSchema,
  telegramConfigSchema,
} from "@shared/schema";
import { authenticateJWT, login } from "./middlewares/auth";
import { loginRateLimiter, apiRateLimiter } from "./middlewares/rateLimiter";
import { validateRequest } from "./utils/validation";
import { logAdminEvent, logError } from "./utils/logger";
import { API_CONFIGS } from "./services/apiConfigManager";

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
  
  // Get user by ID
  adminRouter.get("/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
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
  adminRouter.get("/admins", async (req, res) => {
    try {
      const admins = await storage.getAllAdminUsers();
      // Remove sensitive information but add hasPassphrase flag
      const safeAdmins = admins.map(admin => ({
        ...admin,
        password: undefined,
        hasPassphrase: Boolean(admin.passphrase && admin.passphrase.length > 0),
        passphrase: undefined,
        // Add last activity timestamp - using created_at for now
        // In a production app, this would come from a sessions table or activity log
        lastActivity: admin.createdAt
      }));
      res.json(safeAdmins);
    } catch (error) {
      handleError(res, error);
    }
  });
  
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
  
  // API Configuration routes
  adminRouter.get("/api-configs", async (req, res) => {
    try {
      const configs = await storage.getAllApiConfigurations();
      // Mask sensitive credentials
      const safeConfigs = configs.map(config => {
        // Create a safe version with masked credentials
        const maskedConfig = {
          ...config,
          credentials: {} as any
        };
        
        // Mask Telegram credentials
        if (config.name === API_CONFIGS.TELEGRAM) {
          maskedConfig.credentials = {
            botToken: '•••••••••••••••••••••••••••••••'
          };
        } 
        // Mask WooCommerce credentials
        else if (config.name === API_CONFIGS.WOOCOMMERCE) {
          maskedConfig.credentials = {
            consumerKey: '•••••••••••••••••••••••••',
            consumerSecret: '•••••••••••••••••••••••••'
          };
        } 
        // For any other config types
        else if (config.credentials) {
          maskedConfig.credentials = JSON.parse(JSON.stringify(config.credentials));
        }
        
        return maskedConfig;
      });
      res.json(safeConfigs);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // API Config - Telegram Bot update
  adminRouter.put("/api-configs/telegram", validateRequest(telegramConfigSchema), async (req, res) => {
    try {
      const { botToken } = req.body;
      
      // Get existing config
      const config = await storage.getApiConfigurationByName(API_CONFIGS.TELEGRAM);
      
      if (!config) {
        return res.status(404).json({ message: "Telegram API configuration not found" });
      }
      
      // Update configuration
      const updatedConfig = await storage.updateApiConfiguration(config.id, {
        credentials: { botToken },
        updatedBy: req.user!.id
      });
      
      if (!updatedConfig) {
        return res.status(500).json({ message: "Failed to update Telegram API configuration" });
      }
      
      // Restart the Telegram bot with new configuration
      try {
        await bootstrapTelegramBot();
        logAdminEvent(`Admin updated Telegram Bot configuration`, req.user?.id);
        res.json({ 
          success: true, 
          message: "Telegram Bot configuration updated and bot restarted" 
        });
      } catch (error) {
        res.status(200).json({ 
          success: true, 
          message: "Telegram Bot configuration updated but failed to restart the bot",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // API Config - WooCommerce update
  adminRouter.put("/api-configs/woocommerce", validateRequest(wooCommerceConfigSchema), async (req, res) => {
    try {
      const { consumerKey, consumerSecret, apiUrl } = req.body;
      
      // Get existing config
      const config = await storage.getApiConfigurationByName(API_CONFIGS.WOOCOMMERCE);
      
      if (!config) {
        return res.status(404).json({ message: "WooCommerce API configuration not found" });
      }
      
      // Update configuration
      const updates: any = {
        credentials: { consumerKey, consumerSecret },
        updatedBy: req.user!.id
      };
      
      // If API URL is provided, update it
      if (apiUrl) {
        updates.url = apiUrl;
      }
      
      const updatedConfig = await storage.updateApiConfiguration(config.id, updates);
      
      if (!updatedConfig) {
        return res.status(500).json({ message: "Failed to update WooCommerce API configuration" });
      }
      
      logAdminEvent(`Admin updated WooCommerce API configuration`, req.user?.id);
      res.json({ 
        success: true, 
        message: "WooCommerce API configuration updated successfully" 
      });
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
  // Test order validation endpoint
  adminRouter.get("/test-order-validation", async (req, res) => {
    try {
      const { orderId, email } = req.query;
      
      if (!orderId || !email) {
        return res.status(400).json({ error: 'Missing orderId or email parameter' });
      }
      
      const result = await verifyOrderPayment(orderId.toString(), email.toString());
      
      logAdminEvent(`Admin tested order validation for orderId: ${orderId}, email: ${email}, result: ${result ? 'SUCCESS' : 'FAILED'}`, req.user?.id);
      
      return res.status(200).json({ 
        success: result,
        orderId,
        email,
        message: result ? 'Order verified successfully' : 'Order verification failed'
      });
    } catch (error) {
      handleError(res, error);
    }
  });

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
