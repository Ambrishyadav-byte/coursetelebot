import { 
  users, 
  adminUsers, 
  courses, 
  activities,
  type User, 
  type InsertUser, 
  type AdminUser, 
  type InsertAdminUser, 
  type Course, 
  type InsertCourse,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(id: number): Promise<User | undefined>;
  banUser(id: number): Promise<User | undefined>;
  unbanUser(id: number): Promise<User | undefined>;
  
  // Admin user methods
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  validateAdminPassword(username: string, password: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  
  // Course methods
  getAllCourses(): Promise<Course[]>;
  getActiveCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Activity methods
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async verifyUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isVerified: true });
  }

  async banUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isBanned: true });
  }

  async unbanUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isBanned: false });
  }

  // Admin user methods
  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    return admin;
  }

  async validateAdminPassword(username: string, password: string): Promise<AdminUser | undefined> {
    const admin = await this.getAdminUserByUsername(username);
    if (!admin) return undefined;
    
    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : undefined;
  }

  async createAdminUser(admin: Omit<InsertAdminUser, "password"> & { password: string }): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({ ...admin, password: hashedPassword })
      .returning();
    return newAdmin;
  }

  // Course methods
  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getActiveCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning({ id: courses.id });
    return result.length > 0;
  }

  // Activity methods
  async getRecentActivities(limit: number): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }
}

// Using the DatabaseStorage implementation
export const storage = new DatabaseStorage();
