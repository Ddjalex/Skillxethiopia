import { db } from "./db";
import {
  users, categories, courses, seasons, episodes, purchases, accessGrants,
  type User, type InsertUser, type Category, type InsertCategory,
  type Course, type InsertCourse, type Season, type InsertSeason,
  type Episode, type InsertEpisode, type Purchase, type InsertPurchase,
  type AccessGrant, type InsertAccessGrant
} from "@shared/schema";
import { eq, or, and, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Courses
  getCourses(categoryId?: number, search?: string): Promise<(Course & { category?: Category })[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Seasons
  getSeasonsByCourse(courseId: number): Promise<Season[]>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season>;
  deleteSeason(id: number): Promise<void>;

  // Episodes
  getEpisodesBySeason(seasonId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode>;
  deleteEpisode(id: number): Promise<void>;

  // Purchases
  getPurchasesByUser(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Access Grants
  getAccessGrantsByUser(userId: number): Promise<AccessGrant[]>;
  createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant>;
  deleteAccessGrant(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  async updateUserRole(id: number, role: string): Promise<User> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  async getCategory(id: number): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }
  async createCategory(cat: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(cat).returning();
    return created;
  }
  async updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db.update(categories).set(cat).where(eq(categories.id, id)).returning();
    return updated;
  }
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Courses
  async getCourses(categoryId?: number, search?: string): Promise<(Course & { category?: Category })[]> {
    let query = db.select({
      course: courses,
      category: categories,
    }).from(courses).leftJoin(categories, eq(courses.categoryId, categories.id)).$dynamic();
    
    const conditions = [];
    if (categoryId) conditions.push(eq(courses.categoryId, categoryId));
    if (search) conditions.push(ilike(courses.title, `%${search}%`));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query;
    return results.map(r => ({ ...r.course, category: r.category || undefined }));
  }
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }
  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }
  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }
  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const [updated] = await db.update(courses).set(course).where(eq(courses.id, id)).returning();
    return updated;
  }
  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Seasons
  async getSeasonsByCourse(courseId: number): Promise<Season[]> {
    return await db.select().from(seasons).where(eq(seasons.courseId, courseId));
  }
  async createSeason(season: InsertSeason): Promise<Season> {
    const [created] = await db.insert(seasons).values(season).returning();
    return created;
  }
  async updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season> {
    const [updated] = await db.update(seasons).set(season).where(eq(seasons.id, id)).returning();
    return updated;
  }
  async deleteSeason(id: number): Promise<void> {
    await db.delete(seasons).where(eq(seasons.id, id));
  }

  // Episodes
  async getEpisodesBySeason(seasonId: number): Promise<Episode[]> {
    return await db.select().from(episodes).where(eq(episodes.seasonId, seasonId));
  }
  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode;
  }
  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [created] = await db.insert(episodes).values(episode).returning();
    return created;
  }
  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode> {
    const [updated] = await db.update(episodes).set(episode).where(eq(episodes.id, id)).returning();
    return updated;
  }
  async deleteEpisode(id: number): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  // Purchases
  async getPurchasesByUser(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId));
  }
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [created] = await db.insert(purchases).values({
      ...purchase,
      status: "PENDING"
    }).returning();
    return created;
  }

  // Access Grants
  async getAccessGrantsByUser(userId: number): Promise<AccessGrant[]> {
    return await db.select().from(accessGrants).where(eq(accessGrants.userId, userId));
  }
  async createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant> {
    const [created] = await db.insert(accessGrants).values(grant).returning();
    return created;
  }
  async deleteAccessGrant(id: number): Promise<void> {
    await db.delete(accessGrants).where(eq(accessGrants.id, id));
  }
}

export const storage = new DatabaseStorage();
