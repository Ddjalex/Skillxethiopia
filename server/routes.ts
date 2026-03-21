import type { Express } from "express";
import { createServer, type Server } from "http";
import { db, pool } from "./db";
import { eq, or, and, ilike } from "drizzle-orm";
import {
  users, categories, courses, seasons, episodes, purchases, accessGrants,
  type InsertUser, type Category, type InsertCategory,
  type Course, type InsertCourse, type Season, type InsertSeason,
  type Episode, type InsertEpisode, type Purchase, type InsertPurchase,
  type AccessGrant, type InsertAccessGrant,
  insertCourseRatingSchema
} from "@shared/schema";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { hash, compare } from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

async function getTelegramCredentials() {
  const token = await storage.getSetting("TELEGRAM_BOT_TOKEN") || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = await storage.getSetting("TELEGRAM_CHAT_ID") || process.env.TELEGRAM_CHAT_ID;
  return { token, chatId };
}

async function callTelegramSendMessage(token: string, chatId: string, message: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      signal: controller.signal,
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) throw new Error(data.description ?? "Telegram API returned an error");
  } finally {
    clearTimeout(timeout);
  }
}

async function callTelegramSendPhoto(token: string, chatId: string, photoUrl: string, caption: string): Promise<void> {
  // Method 1: Try sending via URL (fast, but may fail for CDN-restricted images)
  try {
    const urlRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" }),
    });
    const urlData = await urlRes.json() as { ok: boolean; description?: string };
    if (urlData.ok) return; // Success — done
    console.log("Telegram sendPhoto via URL failed:", urlData.description, "— trying binary upload");
  } catch (err: any) {
    console.log("Telegram sendPhoto via URL error:", err.message, "— trying binary upload");
  }

  // Method 2: Download image on our server and upload as binary (works even for CDN-restricted images)
  try {
    const imgRes = await fetch(photoUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) throw new Error(`Image fetch returned ${imgRes.status}`);
    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
    formData.append("photo", new Blob([imgBuffer], { type: contentType }), "thumbnail.jpg");

    const uploadRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json() as { ok: boolean; description?: string };
    if (uploadData.ok) return; // Success
    console.error("Telegram sendPhoto binary upload also failed:", uploadData.description);
  } catch (err: any) {
    console.error("Telegram sendPhoto binary upload error:", err.message);
  }

  // Final fallback: plain text message
  await callTelegramSendMessage(token, chatId, caption);
}

async function sendTelegramNotification(message: string) {
  const { token, chatId } = await getTelegramCredentials();
  if (!token || !chatId) return;
  try {
    await callTelegramSendMessage(token, chatId, message);
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

// Fetch Bunny Stream video metadata (returns PascalCase fields per Bunny API spec)
async function getBunnyVideoMeta(libraryId: string, videoId: string, apiKey: string): Promise<any | null> {
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
      headers: { AccessKey: apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`Bunny video metadata API returned ${res.status} for ${videoId}`);
      return null;
    }
    const data = await res.json() as any;
    console.log("Bunny video meta — ThumbnailFileName:", data.ThumbnailFileName, "| Status:", data.Status);
    return data;
  } catch (err: any) {
    console.log("Bunny video metadata fetch failed:", err.message);
    return null;
  }
}

// Fetch Bunny Stream library metadata to get PullZoneName
async function getBunnyLibraryMeta(libraryId: string, apiKey: string): Promise<any | null> {
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}`, {
      headers: { AccessKey: apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`Bunny library metadata API returned ${res.status}`);
      return null;
    }
    const data = await res.json() as any;
    console.log("Bunny library meta — PullZoneName:", data.PullZoneName, "| Name:", data.Name);
    return data;
  } catch (err: any) {
    console.log("Bunny library metadata fetch failed:", err.message);
    return null;
  }
}

// Download a Bunny Stream video thumbnail via the CDN (using PullZone from metadata)
async function getBunnyPullZone(libraryId: string, videoId: string, apiKey: string): Promise<{ pullZone: string | null; thumbnailFile: string | null }> {
  // PullZoneName is a library-level field, not on the video object — fetch both
  const [libMeta, videoMeta] = await Promise.all([
    getBunnyLibraryMeta(libraryId, apiKey),
    getBunnyVideoMeta(libraryId, videoId, apiKey),
  ]);
  const pullZone: string | null = libMeta?.PullZoneName ?? libMeta?.pullZoneName ?? null;
  const thumbnailFile: string | null = videoMeta?.ThumbnailFileName ?? videoMeta?.thumbnailFileName ?? null;
  console.log("Bunny resolved — PullZone:", pullZone, "| ThumbnailFile:", thumbnailFile);
  return { pullZone, thumbnailFile };
}

async function downloadBunnyThumbnail(videoRef: string, apiKey: string): Promise<Buffer | null> {
  const parts = videoRef.split("/");
  if (parts.length < 2) return null;
  const [libraryId, videoId] = [parts[0], parts[1]];

  const { pullZone, thumbnailFile } = await getBunnyPullZone(libraryId, videoId, apiKey);

  if (pullZone) {
    // Try exact thumbnail filename first, then generic thumbnail.jpg
    const thumbFiles = thumbnailFile ? [thumbnailFile, "thumbnail.jpg"] : ["thumbnail.jpg"];
    for (const file of thumbFiles) {
      try {
        const thumbUrl = `https://${pullZone}.b-cdn.net/${videoId}/${file}`;
        console.log("Trying Bunny CDN thumbnail:", thumbUrl);
        const res = await fetch(thumbUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        console.log(`Bunny CDN thumbnail ${file} returned ${res.status}`);
      } catch (err: any) {
        console.log("Bunny CDN thumbnail download failed:", err.message);
      }
    }
  }

  return null;
}

// Try sending a Bunny CDN MP4 URL directly to Telegram (no download needed).
async function sendBunnyVideoByUrl(
  pullZone: string,
  videoId: string,
  token: string,
  channelId: string,
  caption: string,
): Promise<boolean> {
  const resolutions = ["360", "480", "720"];
  for (const res of resolutions) {
    const videoUrl = `https://${pullZone}.b-cdn.net/${videoId}/play_${res}p.mp4`;
    console.log(`Bunny: trying sendVideo by URL at ${res}p: ${videoUrl}`);
    try {
      const res2 = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          video: videoUrl,
          caption,
          parse_mode: "HTML",
          supports_streaming: true,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res2.json() as { ok: boolean; description?: string };
      if (data.ok) {
        console.log(`Bunny ${res}p video sent to Telegram via URL successfully`);
        return true;
      }
      console.log(`Telegram sendVideo URL failed for ${res}p:`, data.description);
    } catch (err: any) {
      console.log(`sendVideo URL attempt failed for ${res}p:`, err.message);
    }
  }
  return false;
}

// Download a Bunny Stream video binary and upload it directly to Telegram.
// We try multiple resolutions (lowest first to stay within Telegram's 50MB limit).
async function downloadAndSendBunnyVideoToTelegram(
  videoRef: string,
  apiKey: string,
  token: string,
  channelId: string,
  caption: string,
): Promise<boolean> {
  const parts = videoRef.split("/");
  if (parts.length < 2) return false;
  const [libraryId, videoId] = [parts[0], parts[1]];

  const { pullZone } = await getBunnyPullZone(libraryId, videoId, apiKey);

  if (!pullZone) {
    console.log("Bunny: no PullZone found in library metadata, cannot build CDN URL");
    return false;
  }

  // 1. First try sending the video by URL (fast, no download)
  const sentByUrl = await sendBunnyVideoByUrl(pullZone, videoId, token, channelId, caption);
  if (sentByUrl) return true;

  // 2. Fall back to binary download
  const resolutions = ["360", "480", "720"];
  for (const res of resolutions) {
    const videoUrl = `https://${pullZone}.b-cdn.net/${videoId}/play_${res}p.mp4`;
    console.log(`Bunny: trying binary download ${res}p at ${videoUrl}`);
    try {
      const videoRes = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
      if (!videoRes.ok) {
        console.log(`Bunny CDN ${res}p returned ${videoRes.status}`);
        continue;
      }

      const contentLength = Number(videoRes.headers.get("content-length") ?? 0);
      if (contentLength > 50 * 1024 * 1024) {
        console.log(`Bunny ${res}p too large (${contentLength} bytes), skipping`);
        continue;
      }

      const videoBuffer = await videoRes.arrayBuffer();
      if (videoBuffer.byteLength > 50 * 1024 * 1024) {
        console.log(`Bunny ${res}p buffer too large after download, skipping`);
        continue;
      }

      const formData = new FormData();
      formData.append("chat_id", channelId);
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
      formData.append("supports_streaming", "true");
      formData.append("video", new Blob([videoBuffer], { type: "video/mp4" }), "video.mp4");

      const uploadRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json() as { ok: boolean; description?: string };
      if (uploadData.ok) {
        console.log(`Bunny ${res}p video sent to Telegram (binary) successfully`);
        return true;
      }
      console.log(`Telegram sendVideo binary failed for ${res}p:`, uploadData.description);
    } catch (err: any) {
      console.log(`Failed to download/send Bunny ${res}p video:`, err.message);
    }
  }
  return false;
}

async function getChannelCredentials(): Promise<{ token: string | undefined; channelId: string | undefined }> {
  const token = (await storage.getSetting("TELEGRAM_BOT_TOKEN")) || process.env.TELEGRAM_BOT_TOKEN;
  // TELEGRAM_CHAT_ID holds the channel ID (set by auto-detect). TELEGRAM_CHANNEL_ID is an optional override.
  const channelId =
    (await storage.getSetting("TELEGRAM_CHAT_ID")) ||
    process.env.TELEGRAM_CHAT_ID ||
    (await storage.getSetting("TELEGRAM_CHANNEL_ID")) ||
    process.env.TELEGRAM_CHANNEL_ID;
  return { token, channelId };
}

async function sendBroadcastToChannel(message: string): Promise<boolean> {
  const { token, channelId } = await getChannelCredentials();
  if (!token || !channelId) return false;
  try {
    await callTelegramSendMessage(token, channelId, message);
    return true;
  } catch (err) {
    console.error("Telegram channel broadcast failed:", err);
    return false;
  }
}

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}

type UserSchema = import("@shared/schema").User;

// Multer file upload setup
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

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
  app.get(api.public.categories.path, requireAuth, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.public.courses.path, requireAuth, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = req.query.search as string;
    const courses = await storage.getCourses(categoryId, search);
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const stats = await storage.getCourseStats(course.id);
        return { ...course, avgRating: stats.avgRating, totalStudents: stats.totalStudents };
      })
    );
    res.json(coursesWithStats);
  });

  app.get("/api/courses/:slug/related", requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) return res.status(404).json({ message: "Not found" });
    const related = await storage.getRelatedCourses(course.id, 5);
    res.json(related);
  });

  app.get(api.public.courseDetail.path, requireAuth, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    const [category, courseStats] = await Promise.all([
      storage.getCategory(course.categoryId),
      storage.getCourseStats(course.id),
    ]);
    const allSeasons = await storage.getSeasonsByCourse(course.id);
    const seasonsWithEpisodes = await Promise.all(allSeasons.map(async s => {
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

    // Include user's existing rating if logged in
    const userId = req.isAuthenticated() ? (req.user as any).id : null;
    const userRating = userId ? await storage.getCourseRating(userId, course.id) : null;
    
    res.json({
      course: {
        ...course,
        avgRating: courseStats.avgRating,
        totalStudents: courseStats.totalStudents,
      },
      category,
      seasons: seasonsWithEpisodes,
      userRating: userRating?.rating || null,
    });
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
    
    const isFree = course.priceStrategy === "FREE";
    const seasons = await storage.getSeasonsByCourse(course.id);
    const seasonsWithEpisodes = await Promise.all(seasons.map(async s => {
      const eps = await storage.getEpisodesBySeason(s.id);
      
      // Free courses: all content is unlocked
      if (isFree) {
        return {
          ...s,
          isUnlocked: true,
          isPending: false,
          episodes: eps.map(e => ({ ...e, isUnlocked: true, isPending: false }))
        };
      }

      // Check if season is unlocked
      const seasonGrant = await db.select().from(accessGrants).where(
        and(
          eq(accessGrants.userId, userId),
          eq(accessGrants.itemType, "SEASON"),
          eq(accessGrants.itemId, s.id)
        )
      ).limit(1);
      
      const isSeasonUnlocked = seasonGrant.length > 0;

      // Check if season has pending purchase
      const seasonPending = await db.select().from(purchases).where(
        and(
          eq(purchases.userId, userId),
          eq(purchases.itemType, "SEASON"),
          eq(purchases.itemId, s.id),
          eq(purchases.status, "PENDING")
        )
      ).limit(1);

      return {
        ...s,
        isUnlocked: isSeasonUnlocked,
        isPending: seasonPending.length > 0,
        episodes: await Promise.all(eps.map(async e => {
          // Check if individual episode is unlocked (either via season or directly)
          let isEpisodeUnlocked = isSeasonUnlocked || e.isPreview || e.price === "0";
          let isEpisodePending = false;
          
          if (!isEpisodeUnlocked) {
            const epGrant = await db.select().from(accessGrants).where(
              and(
                eq(accessGrants.userId, userId),
                eq(accessGrants.itemType, "EPISODE"),
                eq(accessGrants.itemId, e.id)
              )
            ).limit(1);
            isEpisodeUnlocked = epGrant.length > 0;

            if (!isEpisodeUnlocked) {
              const epPending = await db.select().from(purchases).where(
                and(
                  eq(purchases.userId, userId),
                  eq(purchases.itemType, "EPISODE"),
                  eq(purchases.itemId, e.id),
                  eq(purchases.status, "PENDING")
                )
              ).limit(1);
              isEpisodePending = epPending.length > 0;
            }
          }

          return { ...e, isUnlocked: isEpisodeUnlocked, isPending: isEpisodePending };
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

  // Course rating submission
  app.post("/api/courses/:id/rate", requireAuth, async (req, res) => {
    try {
      const courseId = Number(req.params.id);
      const userId = (req.user as any).id;
      const { rating } = insertCourseRatingSchema.parse({ courseId, rating: Number(req.body.rating) });

      // Verify user has at least one paid purchase for this course
      const courseSeasons = await db.select({ id: seasons.id }).from(seasons).where(eq(seasons.courseId, courseId));
      const seasonIds = courseSeasons.map(s => s.id);
      let hasPurchase = false;
      if (seasonIds.length > 0) {
        const { sql: sqlFn } = await import("drizzle-orm");
        const paid = await db.select().from(purchases).where(
          and(
            eq(purchases.userId, userId),
            eq(purchases.status, "PAID")
          )
        ).limit(50);
        // Check if any paid purchase is for this course's seasons/episodes
        const courseEpisodes = await db.select({ id: episodes.id }).from(episodes)
          .where(sqlFn`${episodes.seasonId} = ANY(ARRAY[${sqlFn.raw(seasonIds.join(','))}]::int[])`);
        const episodeIds = new Set(courseEpisodes.map(e => e.id));
        const seasonIdSet = new Set(seasonIds);
        hasPurchase = paid.some(p =>
          (p.itemType === "SEASON" && seasonIdSet.has(p.itemId)) ||
          (p.itemType === "EPISODE" && episodeIds.has(p.itemId))
        );
      }

      if (!hasPurchase) {
        return res.status(403).json({ message: "You must purchase this course to rate it" });
      }

      const result = await storage.upsertCourseRating(userId, courseId, rating);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid rating" });
    }
  });

  // Get user's rating for a course
  app.get("/api/courses/:id/my-rating", requireAuth, async (req, res) => {
    const courseId = Number(req.params.id);
    const userId = (req.user as any).id;
    const rating = await storage.getCourseRating(userId, courseId);
    res.json({ rating: rating?.rating || null });
  });

  app.get(api.protected.stream.path, async (req, res) => {
    const episodeId = Number(req.params.id);
    const episode = await storage.getEpisode(episodeId);
    if (!episode) return res.status(404).json({ message: "Not found" });

    // Preview episodes are always accessible without login or purchase
    if (episode.isPreview) {
      return res.json({ videoProvider: episode.videoProvider, videoRef: episode.videoRef });
    }

    // All other episodes require authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req.user as any).id;

    // Verify access before showing video ref
    let hasAccess = false;
    
    // Admin always has access
    if ((req.user as any).role === "ADMIN") {
      hasAccess = true;
    }

    if (!hasAccess) {
      // Check if the course is FREE — free courses are always accessible
      const season = await db.select().from(seasons).where(eq(seasons.id, episode.seasonId)).limit(1);
      if (season.length > 0) {
        const course = await storage.getCourse(season[0].courseId);
        if (course?.priceStrategy === "FREE") {
          hasAccess = true;
        }
      }
    }

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

  // File upload endpoint
  app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
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

  // --- Analytics ---
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    // Fetch all base data
    const allCourses = await storage.getCourses();
    const allUsers = await storage.getAllUsers();
    const allSeasons = await db.select().from(seasons);
    const allEpisodes = await db.select().from(episodes);
    const allPurchases = await db.select({ purchase: purchases, user: users })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id));

    // Build lookup maps
    const seasonToCourse: Record<number, number> = {};
    allSeasons.forEach(s => { seasonToCourse[s.id] = s.courseId; });

    const episodeToCourse: Record<number, number> = {};
    allEpisodes.forEach(e => {
      const cId = seasonToCourse[e.seasonId];
      if (cId) episodeToCourse[e.id] = cId;
    });

    const paidPurchases = allPurchases.filter(p => p.purchase.status === "PAID");

    // Course stats: per course, count paid purchases and unique buyers
    const courseStatMap: Record<number, { purchaseCount: number; buyers: Set<number>; revenue: number }> = {};
    allCourses.forEach(c => { courseStatMap[c.id] = { purchaseCount: 0, buyers: new Set(), revenue: 0 }; });

    paidPurchases.forEach(({ purchase }) => {
      const courseId = purchase.itemType === "SEASON"
        ? seasonToCourse[purchase.itemId]
        : episodeToCourse[purchase.itemId];
      if (courseId && courseStatMap[courseId]) {
        courseStatMap[courseId].purchaseCount++;
        courseStatMap[courseId].buyers.add(purchase.userId);
        courseStatMap[courseId].revenue += parseFloat(purchase.amount) || 0;
      }
    });

    const courseStats = allCourses.map(c => ({
      courseId: c.id,
      courseTitle: c.title,
      instructorName: c.instructorName,
      priceStrategy: c.priceStrategy,
      totalPurchases: courseStatMap[c.id]?.purchaseCount || 0,
      uniqueBuyers: courseStatMap[c.id]?.buyers.size || 0,
      revenue: courseStatMap[c.id]?.revenue || 0,
    }));

    // User stats: per user, count paid purchases and distinct courses bought
    const userStatMap: Record<number, { purchaseCount: number; courses: Set<number>; totalSpent: number }> = {};
    allUsers.forEach(u => { userStatMap[u.id] = { purchaseCount: 0, courses: new Set(), totalSpent: 0 }; });

    paidPurchases.forEach(({ purchase }) => {
      if (!userStatMap[purchase.userId]) return;
      const courseId = purchase.itemType === "SEASON"
        ? seasonToCourse[purchase.itemId]
        : episodeToCourse[purchase.itemId];
      userStatMap[purchase.userId].purchaseCount++;
      if (courseId) userStatMap[purchase.userId].courses.add(courseId);
      userStatMap[purchase.userId].totalSpent += parseFloat(purchase.amount) || 0;
    });

    const userStats = allUsers
      .filter(u => u.role !== "ADMIN")
      .map(u => ({
        userId: u.id,
        userName: u.name,
        email: u.email,
        totalPurchases: userStatMap[u.id]?.purchaseCount || 0,
        coursesCount: userStatMap[u.id]?.courses.size || 0,
        totalSpent: userStatMap[u.id]?.totalSpent || 0,
      }));

    res.json({ courseStats, userStats });
  });

  // --- Bunny.net Stream Analytics ---
  app.get("/api/admin/bunny-analytics", requireAdmin, async (req, res) => {
    const apiKey = process.env.BUNNY_API_KEY || await storage.getSetting("BUNNY_API_KEY");
    const libraryId = "617163";

    if (!apiKey) {
      return res.json({ error: "BUNNY_API_KEY not configured", stats: null });
    }

    try {
      const [statsRes, videosRes] = await Promise.all([
        fetch(`https://video.bunnycdn.com/library/${libraryId}/statistics`, {
          headers: { AccessKey: apiKey },
        }),
        fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`, {
          headers: { AccessKey: apiKey },
        }),
      ]);

      if (!statsRes.ok) {
        const errText = await statsRes.text();
        return res.json({ error: `Bunny API error (${statsRes.status}): ${errText}`, stats: null });
      }

      const statsData = await statsRes.json();
      let totalVideoCount = 0;
      if (videosRes.ok) {
        const vd = await videosRes.json();
        totalVideoCount = vd.totalItems || 0;
      }

      const pullZoneBandwidth = Object.values(statsData.PullZoneStats || {}).reduce(
        (sum: number, zone: any) => sum + (zone.CdnResponseSize || 0),
        0
      ) as number;

      return res.json({
        error: null,
        stats: {
          numberOfPlays: statsData.NumberOfPlays || 0,
          numberOfImpressions: statsData.NumberOfImpressions || 0,
          finishRate: statsData.FinishRate || 0,
          engagementScore: statsData.EngagementScore || 0,
          bandwidthBytes: pullZoneBandwidth,
          totalVideoCount,
          viewsChart: statsData.ViewsChart || {},
          watchTimeChart: statsData.WatchTimeChart || {},
        },
      });
    } catch (e: any) {
      return res.json({ error: e.message, stats: null });
    }
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

  // --- Broadcast Routes ---
  app.get("/api/broadcasts/active", async (req, res) => {
    const all = await storage.getActiveBroadcasts();
    res.json(all);
  });

  app.get("/api/admin/broadcasts", requireAdmin, async (req, res) => {
    const all = await storage.getBroadcasts();
    res.json(all);
  });

  app.post("/api/admin/broadcasts", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      const created = await storage.createBroadcast(body);
      let telegramSent = false;
      if (created.isActive) {
        const typeEmoji: Record<string, string> = { DISCOUNT: "🏷️", SALE: "🔥", ANNOUNCEMENT: "📢", UPDATE: "🆕" };
        const emoji = typeEmoji[created.type] || "📢";
        let tgMsg = `${emoji} <b>SkillXethiopia Broadcast</b>\n\n<b>${created.title}</b>\n${created.message}`;
        if (created.discountPercent) tgMsg += `\n\n💰 <b>${created.discountPercent}% OFF</b>`;
        if (created.discountCode) tgMsg += ` | Code: <code>${created.discountCode}</code>`;
        if (created.ctaText && created.ctaUrl) tgMsg += `\n\n🔗 ${created.ctaText}: ${created.ctaUrl}`;
        telegramSent = await sendBroadcastToChannel(tgMsg);
      }
      res.status(201).json({ ...created, telegramSent });
    } catch (err) {
      console.error("Error creating broadcast:", err);
      res.status(500).json({ message: "Failed to create broadcast" });
    }
  });

  app.patch("/api/admin/broadcasts/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const body = req.body;
      const updated = await storage.updateBroadcast(id, body);
      let telegramSent = false;
      if (updated.isActive) {
        const typeEmoji: Record<string, string> = { DISCOUNT: "🏷️", SALE: "🔥", ANNOUNCEMENT: "📢", UPDATE: "🆕" };
        const emoji = typeEmoji[updated.type] || "📢";
        let tgMsg = `${emoji} <b>SkillXethiopia Broadcast</b>\n\n<b>${updated.title}</b>\n${updated.message}`;
        if (updated.discountPercent) tgMsg += `\n\n💰 <b>${updated.discountPercent}% OFF</b>`;
        if (updated.discountCode) tgMsg += ` | Code: <code>${updated.discountCode}</code>`;
        if (updated.ctaText && updated.ctaUrl) tgMsg += `\n\n🔗 ${updated.ctaText}: ${updated.ctaUrl}`;
        telegramSent = await sendBroadcastToChannel(tgMsg);
      }
      res.json({ ...updated, telegramSent });
    } catch (err) {
      console.error("Error updating broadcast:", err);
      res.status(500).json({ message: "Failed to update broadcast" });
    }
  });

  app.delete("/api/admin/broadcasts/:id", requireAdmin, async (req, res) => {
    await storage.deleteBroadcast(Number(req.params.id));
    res.status(204).end();
  });

  app.post("/api/admin/broadcasts/test-telegram", requireAdmin, async (req, res) => {
    const { token, chatId } = await getTelegramCredentials();
    if (!token || !chatId) {
      return res.status(400).json({ message: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not configured." });
    }
    try {
      await callTelegramSendMessage(token, chatId, "✅ <b>SkillXethiopia</b> — Telegram integration is working!");
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message ?? "Failed to send test message" });
    }
  });

  // Broadcast a single preview episode to Telegram channel
  app.post("/api/admin/episodes/:id/broadcast-telegram", requireAdmin, async (req, res) => {
    const episodeId = Number(req.params.id);
    try {
      // Fetch episode + season + course in one join
      const rows = await db
        .select({
          ep: episodes,
          season: seasons,
          course: courses,
        })
        .from(episodes)
        .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
        .innerJoin(courses, eq(seasons.courseId, courses.id))
        .where(eq(episodes.id, episodeId));

      if (!rows.length) return res.status(404).json({ message: "Episode not found" });

      const { ep, season, course } = rows[0];

      const { token, channelId } = await getChannelCredentials();
      if (!token || !channelId) {
        return res.status(400).json({ message: "Telegram is not configured." });
      }

      // Build video URL for shareable providers
      let videoUrl: string | null = null;
      let youtubeVideoId: string | null = null;

      if (ep.videoProvider === "YOUTUBE") {
        if (ep.videoRef.startsWith("http")) {
          videoUrl = ep.videoRef;
          const match = ep.videoRef.match(/[?&]v=([^&]+)/) || ep.videoRef.match(/youtu\.be\/([^?]+)/);
          youtubeVideoId = match ? match[1] : null;
        } else {
          youtubeVideoId = ep.videoRef;
          videoUrl = `https://www.youtube.com/watch?v=${ep.videoRef}`;
        }
      } else if (ep.videoProvider === "VIMEO") {
        videoUrl = ep.videoRef.startsWith("http")
          ? ep.videoRef
          : `https://vimeo.com/${ep.videoRef}`;
      } else if (ep.videoProvider === "DAILYMOTION") {
        videoUrl = ep.videoRef.startsWith("http")
          ? ep.videoRef
          : `https://www.dailymotion.com/video/${ep.videoRef}`;
      } else if (ep.videoRef.startsWith("http")) {
        videoUrl = ep.videoRef;
      }

      // Build caption text (used for photo/video sends)
      let caption = `🎬 <b>Free Preview — ${ep.title}</b>\n\n`;
      caption += `📚 <b>${course.title}</b>`;
      if (season.title) caption += ` · ${season.title}`;
      if (ep.description) caption += `\n\n${ep.description}`;
      caption += `\n\n🚀 <b>SkillXethiopia</b> — Learn from real-world experts.`;

      // Build message text for providers where Telegram auto-embeds the video preview
      // (the raw URL in the text body — NOT wrapped in <a> tags — triggers the embed)
      let messageText = `🎬 <b>Free Preview — ${ep.title}</b>\n\n`;
      messageText += `📚 <b>${course.title}</b>`;
      if (season.title) messageText += ` · ${season.title}`;
      if (ep.description) messageText += `\n\n${ep.description}`;
      if (videoUrl) messageText += `\n\n${videoUrl}`;
      messageText += `\n\n🚀 <b>SkillXethiopia</b> — Learn from real-world experts.`;

      if (ep.videoProvider === "BUNNY" && ep.videoRef) {
        // Bunny CDN: try to send the video clip, then thumbnail, then plain text.
        const bunnyApiKey = (await storage.getSetting("BUNNY_API_KEY")) || process.env.BUNNY_API_KEY;
        let sent = false;

        if (bunnyApiKey) {
          // 1. Try uploading the video binary to Telegram
          sent = await downloadAndSendBunnyVideoToTelegram(ep.videoRef, bunnyApiKey, token, channelId, caption);

          // 2. If video failed, try sending the thumbnail image
          if (!sent) {
            const thumbBuffer = await downloadBunnyThumbnail(ep.videoRef, bunnyApiKey);
            if (thumbBuffer) {
              const formData = new FormData();
              formData.append("chat_id", channelId);
              formData.append("caption", caption);
              formData.append("parse_mode", "HTML");
              formData.append("photo", new Blob([thumbBuffer], { type: "image/jpeg" }), "thumbnail.jpg");
              const uploadRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: "POST",
                body: formData,
              });
              const uploadData = await uploadRes.json() as { ok: boolean; description?: string };
              if (uploadData.ok) sent = true;
              else console.log("Bunny thumbnail upload to Telegram failed:", uploadData.description);
            }
          }
        }

        // 3. Try course thumbnail as photo fallback
        if (!sent) {
          const courseThumbnail = course.thumbnailUrl;
          if (courseThumbnail && courseThumbnail.startsWith("http")) {
            try {
              await callTelegramSendPhoto(token, channelId, courseThumbnail, caption);
              sent = true;
            } catch (err: any) {
              console.log("Course thumbnail fallback to Telegram failed:", err.message);
            }
          }
        }

        // 4. Final fallback: plain text message
        if (!sent) {
          await callTelegramSendMessage(token, channelId, caption);
        }
      } else if (ep.videoProvider === "YOUTUBE" || ep.videoProvider === "VIMEO" || ep.videoProvider === "DAILYMOTION") {
        // For these providers, include the raw video URL in the message text.
        // Telegram automatically generates a rich video preview card for YouTube, Vimeo, and Dailymotion URLs.
        await callTelegramSendMessage(token, channelId, messageText);
      } else {
        // Generic fallback: try thumbnail photo or plain text
        const storedThumbnail = (ep as any).thumbnailUrl || course.thumbnailUrl;
        if (storedThumbnail && storedThumbnail.startsWith("http")) {
          await callTelegramSendPhoto(token, channelId, storedThumbnail, caption);
        } else {
          await callTelegramSendMessage(token, channelId, caption);
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Episode broadcast failed:", err);
      res.status(500).json({ message: err.message ?? "Failed to broadcast episode" });
    }
  });

  // --- App Settings (API Tokens) ---
  const ALLOWED_SETTING_KEYS = ["BUNNY_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_CHANNEL_ID"];

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    const all = await storage.getAllSettings();
    const result: Record<string, string> = {};
    for (const key of ALLOWED_SETTING_KEYS) {
      result[key] = all[key] ?? "";
    }
    res.json(result);
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    const body = req.body as Record<string, string>;
    for (const key of ALLOWED_SETTING_KEYS) {
      if (key in body) {
        const val = String(body[key] ?? "").trim();
        if (val) {
          await storage.setSetting(key, val);
        }
      }
    }
    res.json({ success: true });
  });

  // Detect all Telegram channels/chats the bot is a member of
  app.get("/api/admin/telegram/detect-chats", requireAdmin, async (req, res) => {
    const { token } = await getTelegramCredentials();
    if (!token) return res.status(400).json({ message: "TELEGRAM_BOT_TOKEN is not configured." });
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=%5B%22message%22%2C%22channel_post%22%2C%22my_chat_member%22%5D`);
      const data = await r.json() as { ok: boolean; result?: any[]; description?: string };
      if (!data.ok) throw new Error(data.description ?? "Telegram API error");
      const seen = new Map<string, any>();
      for (const u of (data.result ?? [])) {
        const c = u.channel_post?.chat || u.my_chat_member?.chat || u.message?.chat;
        if (c) seen.set(String(c.id), c);
      }
      res.json({ chats: [...seen.values()] });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
      videoRef: "https://vimeo.com/76979871"
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
      videoRef: "https://vimeo.com/76979871"
    });
  }
}
