import type { Express } from "express";
import { createServer, type Server } from "http";
import { db, pool } from "./db";
import { eq, or, and, ilike } from "drizzle-orm";
import {
  users, categories, courses, seasons, episodes, purchases, accessGrants,
  type InsertUser, type Category, type InsertCategory,
  type Course, type InsertCourse, type Season, type InsertSeason,
  type Episode, type InsertEpisode, type Purchase, type InsertPurchase,
  type AccessGrant, type InsertAccessGrant
} from "@shared/schema";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { hash, compare } from "bcrypt";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}

type UserSchema = import("@shared/schema").User;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth setup
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false);
      const isMatch = await compare(password, user.passwordHash);
      if (!isMatch) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    next();
  };

  // --- Auth Routes ---
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) return res.status(400).json({ message: "Email already exists" });
      
      const passwordHash = await hash(input.password, 10);
      const user = await storage.createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });
      
      req.login(user, (err) => {
        if (err) throw err;
        const { passwordHash: _, ...userSafe } = user;
        res.status(201).json(userSafe);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    const { passwordHash: _, ...userSafe } = req.user as any;
    res.status(200).json(userSafe);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      const { passwordHash: _, ...userSafe } = req.user as any;
      res.json(userSafe);
    } else {
      res.json(null);
    }
  });

  // --- Public Routes ---
  app.get(api.public.categories.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.public.courses.path, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = req.query.search as string;
    const courses = await storage.getCourses(categoryId, search);
    res.json(courses);
  });

  app.get(api.public.courseDetail.path, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    const category = await storage.getCategory(course.categoryId);
    const seasons = await storage.getSeasonsByCourse(course.id);
    const seasonsWithEpisodes = await Promise.all(seasons.map(async s => {
      const eps = await storage.getEpisodesBySeason(s.id);
      return {
        ...s,
        episodes: eps.map(e => ({
          id: e.id, seasonId: e.seasonId, title: e.title, episodeNumber: e.episodeNumber,
          description: e.description, durationSec: e.durationSec, isPreview: e.isPreview, price: e.price,
          createdAt: e.createdAt
        }))
      };
    }));
    
    res.json({ course, category, seasons: seasonsWithEpisodes });
  });

  // --- Protected Routes ---
  app.get(api.protected.dashboard.path, requireAuth, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get(api.protected.dashboardCourse.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const course = await storage.getCourse(Number(req.params.id));
    if (!course) return res.status(404).json({ message: "Not found" });
    
    const seasons = await storage.getSeasonsByCourse(course.id);
    const seasonsWithEpisodes = await Promise.all(seasons.map(async s => {
      const eps = await storage.getEpisodesBySeason(s.id);
      
      // Check if season is unlocked
      const seasonGrant = await db.select().from(accessGrants).where(
        and(
          eq(accessGrants.userId, userId),
          eq(accessGrants.itemType, "SEASON"),
          eq(accessGrants.itemId, s.id)
        )
      ).limit(1);
      
      const isSeasonUnlocked = seasonGrant.length > 0;

      return {
        ...s,
        isUnlocked: isSeasonUnlocked,
        episodes: await Promise.all(eps.map(async e => {
          // Check if individual episode is unlocked (either via season or directly)
          let isEpisodeUnlocked = isSeasonUnlocked || e.isPreview || e.price === "0";
          
          if (!isEpisodeUnlocked) {
            const epGrant = await db.select().from(accessGrants).where(
              and(
                eq(accessGrants.userId, userId),
                eq(accessGrants.itemType, "EPISODE"),
                eq(accessGrants.itemId, e.id)
              )
            ).limit(1);
            isEpisodeUnlocked = epGrant.length > 0;
          }

          return { ...e, isUnlocked: isEpisodeUnlocked };
        }))
      };
    }));
    
    res.json({ course, seasons: seasonsWithEpisodes });
  });

  app.get(api.protected.purchases.path, requireAuth, async (req, res) => {
    const purchases = await storage.getPurchasesByUser((req.user as any).id);
    res.json(purchases);
  });

  app.post(api.protected.buy.path, requireAuth, async (req, res) => {
    try {
      const input = req.body;
      const userId = (req.user as any).id;
      
      const purchase = await storage.createPurchase({
        userId,
        itemType: input.itemType,
        itemId: input.itemId,
        amount: input.amount,
        currency: "ETB",
        provider: input.provider || "TELEBIRR",
        transactionRef: input.transactionRef,
        paymentProofUrl: input.paymentProofUrl,
      });
      
      res.status(201).json(purchase);
    } catch(err) {
       res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.protected.stream.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const episodeId = Number(req.params.id);
    const episode = await storage.getEpisode(episodeId);
    if (!episode) return res.status(404).json({ message: "Not found" });

      // Verify access before showing video ref
    let hasAccess = episode.isPreview || episode.price === "0";
    
    if (!hasAccess) {
      // Check episode grant
      const epGrant = await db.select().from(accessGrants).where(
        and(
          eq(accessGrants.userId, userId),
          eq(accessGrants.itemType, "EPISODE"),
          eq(accessGrants.itemId, episodeId)
        )
      ).limit(1);
      
      if (epGrant.length > 0) {
        hasAccess = true;
      } else {
        // Check season grant
        const seasonGrant = await db.select().from(accessGrants).where(
          and(
            eq(accessGrants.userId, userId),
            eq(accessGrants.itemType, "SEASON"),
            eq(accessGrants.itemId, episode.seasonId)
          )
        ).limit(1);
        hasAccess = seasonGrant.length > 0;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Payment required or pending approval" });
    }

    res.json({ videoProvider: episode.videoProvider, videoRef: episode.videoRef });
  });

  // --- Admin Routes ---
  app.get(api.admin.users.path, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => { const { passwordHash: _, ...safe } = u; return safe; }));
  });

  app.patch(api.admin.updateUser.path, requireAdmin, async (req, res) => {
    const { role } = api.admin.updateUser.input.parse(req.body);
    const user = await storage.updateUserRole(Number(req.params.id), role);
    const { passwordHash: _, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUser((req.user as any).id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const passwordHash = await hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    res.json({ success: true });
  });

  app.post(api.admin.createCategory.path, requireAdmin, async (req, res) => {
    const created = await storage.createCategory(req.body);
    res.status(201).json(created);
  });
  app.post(api.admin.createCourse.path, requireAdmin, async (req, res) => {
    const created = await storage.createCourse(req.body);
    res.status(201).json(created);
  });
  app.post(api.admin.createSeason.path, requireAdmin, async (req, res) => {
    const created = await storage.createSeason(req.body);
    res.status(201).json(created);
  });
  app.post(api.admin.createEpisode.path, requireAdmin, async (req, res) => {
    const created = await storage.createEpisode(req.body);
    res.status(201).json(created);
  });

  app.put(api.admin.updateCategory.path, requireAdmin, async (req, res) => {
    const updated = await storage.updateCategory(Number(req.params.id), req.body);
    res.json(updated);
  });
  app.delete(api.admin.deleteCategory.path, requireAdmin, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).end();
  });
  app.put(api.admin.updateCourse.path, requireAdmin, async (req, res) => {
    const updated = await storage.updateCourse(Number(req.params.id), req.body);
    res.json(updated);
  });
  app.delete(api.admin.deleteCourse.path, requireAdmin, async (req, res) => {
    await storage.deleteCourse(Number(req.params.id));
    res.status(204).end();
  });
  app.put(api.admin.updateSeason.path, requireAdmin, async (req, res) => {
    const updated = await storage.updateSeason(Number(req.params.id), req.body);
    res.json(updated);
  });
  app.delete(api.admin.deleteSeason.path, requireAdmin, async (req, res) => {
    await storage.deleteSeason(Number(req.params.id));
    res.status(204).end();
  });
  app.put(api.admin.updateEpisode.path, requireAdmin, async (req, res) => {
    const updated = await storage.updateEpisode(Number(req.params.id), req.body);
    res.json(updated);
  });
  app.delete(api.admin.deleteEpisode.path, requireAdmin, async (req, res) => {
    await storage.deleteEpisode(Number(req.params.id));
    res.status(204).end();
  });

  app.get("/api/admin/purchases", requireAdmin, async (req, res) => {
    const allPurchases = await db.select({
      purchase: purchases,
      user: users,
    })
    .from(purchases)
    .leftJoin(users, eq(purchases.userId, users.id));
    
    res.json(allPurchases.map(r => ({ ...r.purchase, user: r.user ? { name: r.user.name, email: r.user.email } : null })));
  });

  app.post("/api/admin/purchases/:id/approve", requireAdmin, async (req, res) => {
    const purchaseId = Number(req.params.id);
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
    
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    if (purchase.status !== "PENDING") return res.status(400).json({ message: "Already processed" });

    // Update status
    await db.update(purchases).set({ status: "PAID" }).where(eq(purchases.id, purchaseId));

    // Grant access
    await storage.createAccessGrant({
      userId: purchase.userId,
      itemType: purchase.itemType,
      itemId: purchase.itemId,
      grantedBy: "ADMIN"
    });

    res.json({ success: true });
  });

  // --- Payment Option Routes ---
  app.get("/api/payment-options", async (req, res) => {
    const options = await storage.getPaymentOptions();
    res.json(options);
  });

  app.post("/api/admin/payment-options", requireAdmin, async (req, res) => {
    try {
      const option = await storage.createPaymentOption(req.body);
      res.status(201).json(option);
    } catch (err) {
      console.error("Error creating payment option:", err);
      res.status(500).json({ message: "Failed to create payment option" });
    }
  });

  app.patch("/api/admin/payment-options/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updatePaymentOption(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      console.error("Error updating payment option:", err);
      res.status(500).json({ message: "Failed to update payment option" });
    }
  });

  app.delete("/api/admin/payment-options/:id", requireAdmin, async (req, res) => {
    await storage.deletePaymentOption(Number(req.params.id));
    res.status(204).end();
  });

  await seedDatabase();

  return httpServer;
}

export async function seedDatabase() {
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    const passwordHash = await hash("password", 10);
    const admin = await storage.createUser({ name: "Admin", email: "admin@example.com", passwordHash });
    await storage.updateUserRole(admin.id, "ADMIN");
    await storage.createUser({ name: "User", email: "user@example.com", passwordHash });

    const cat1 = await storage.createCategory({ name: "Web Development", slug: "web-development" });
    const course1 = await storage.createCourse({
      categoryId: cat1.id,
      title: "Fullstack Masterclass",
      slug: "fullstack-masterclass",
      description: "Learn everything about web development. A comprehensive masterclass.",
      instructorName: "John Doe",
      priceStrategy: "PAID",
      thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=2128"
    });

    const season1 = await storage.createSeason({
      courseId: course1.id,
      title: "Getting Started",
      seasonNumber: 1,
      price: "500"
    });

    await storage.createEpisode({
      seasonId: season1.id,
      title: "Introduction",
      episodeNumber: 1,
      description: "Welcome to the course",
      durationSec: 300,
      isPreview: true,
      price: "0",
      videoProvider: "VIMEO",
      videoRef: "123456789"
    });
    await storage.createEpisode({
      seasonId: season1.id,
      title: "Setting up your environment",
      episodeNumber: 2,
      description: "Install Node and VSCode",
      durationSec: 600,
      isPreview: false,
      price: "150",
      videoProvider: "VIMEO",
      videoRef: "123456789"
    });
  }
}
