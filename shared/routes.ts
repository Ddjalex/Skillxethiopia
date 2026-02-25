import { z } from 'zod';
import { 
  insertUserSchema, loginSchema, insertCategorySchema, 
  insertCourseSchema, insertSeasonSchema, insertEpisodeSchema,
  users, categories, courses, seasons, episodes, purchases, accessGrants
} from './schema';

export {
  insertUserSchema, loginSchema, insertCategorySchema, 
  insertCourseSchema, insertSeasonSchema, insertEpisodeSchema,
  users, categories, courses, seasons, episodes, purchases, accessGrants
};

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.any(),
});

export const episodePublicSchema = z.object({
  id: z.number(),
  seasonId: z.number(),
  title: z.string(),
  episodeNumber: z.number(),
  description: z.string().nullable(),
  durationSec: z.number(),
  isPreview: z.boolean().nullable(),
  price: z.string(),
  createdAt: z.any(),
});

export const courseDetailSchema = z.object({
  course: z.custom<typeof courses.$inferSelect>(),
  category: z.custom<typeof categories.$inferSelect>().optional(),
  seasons: z.array(
    z.custom<typeof seasons.$inferSelect>().and(z.object({
      episodes: z.array(episodePublicSchema)
    }))
  ),
});

export const dashboardDetailSchema = z.object({
  course: z.custom<typeof courses.$inferSelect>(),
  seasons: z.array(
    z.custom<typeof seasons.$inferSelect>().and(z.object({
      episodes: z.array(z.custom<typeof episodes.$inferSelect>().and(z.object({ isUnlocked: z.boolean().optional() }))),
      isUnlocked: z.boolean(),
    }))
  ),
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: userResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema.nullable(),
      },
    },
  },
  public: {
    categories: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      }
    },
    courses: {
      method: 'GET' as const,
      path: '/api/courses' as const,
      input: z.object({ categoryId: z.coerce.number().optional(), search: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>().and(z.object({ category: z.custom<typeof categories.$inferSelect>().optional() }))),
      }
    },
    courseDetail: {
      method: 'GET' as const,
      path: '/api/courses/:slug' as const,
      responses: {
        200: courseDetailSchema,
        404: errorSchemas.notFound,
      }
    }
  },
  protected: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/dashboard/courses' as const,
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    dashboardCourse: {
      method: 'GET' as const,
      path: '/api/dashboard/courses/:id' as const,
      responses: {
        200: dashboardDetailSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    purchases: {
      method: 'GET' as const,
      path: '/api/purchases' as const,
      responses: {
        200: z.array(z.custom<typeof purchases.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    buy: {
      method: 'POST' as const,
      path: '/api/purchases' as const,
      input: z.object({ 
        itemType: z.enum(["SEASON", "EPISODE"]), 
        itemId: z.number(),
        amount: z.string(),
        transactionRef: z.string(),
        paymentProofUrl: z.string().optional(),
        provider: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof purchases.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    stream: {
      method: 'GET' as const,
      path: '/api/episodes/:id/stream' as const,
      responses: {
        200: z.object({ videoProvider: z.string(), videoRef: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    }
  },
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.any(),
        403: errorSchemas.forbidden,
      }
    },
    users: {
      method: 'GET' as const,
      path: '/api/admin/users' as const,
      responses: {
        200: z.array(userResponseSchema),
        403: errorSchemas.forbidden,
      }
    },
    updateUser: {
      method: 'PATCH' as const,
      path: '/api/admin/users/:id' as const,
      input: z.object({ role: z.enum(["USER", "ADMIN"]) }),
      responses: {
        200: userResponseSchema,
        403: errorSchemas.forbidden,
      }
    },
    createCategory: {
      method: 'POST' as const,
      path: '/api/admin/categories' as const,
      input: insertCategorySchema,
      responses: { 201: z.custom<typeof categories.$inferSelect>() }
    },
    updateCategory: {
      method: 'PUT' as const,
      path: '/api/admin/categories/:id' as const,
      input: insertCategorySchema.partial(),
      responses: { 200: z.custom<typeof categories.$inferSelect>() }
    },
    deleteCategory: {
      method: 'DELETE' as const,
      path: '/api/admin/categories/:id' as const,
      responses: { 204: z.void() }
    },
    createCourse: {
      method: 'POST' as const,
      path: '/api/admin/courses' as const,
      input: insertCourseSchema,
      responses: { 201: z.custom<typeof courses.$inferSelect>() }
    },
    updateCourse: {
      method: 'PUT' as const,
      path: '/api/admin/courses/:id' as const,
      input: insertCourseSchema.partial(),
      responses: { 200: z.custom<typeof courses.$inferSelect>() }
    },
    deleteCourse: {
      method: 'DELETE' as const,
      path: '/api/admin/courses/:id' as const,
      responses: { 204: z.void() }
    },
    createSeason: {
      method: 'POST' as const,
      path: '/api/admin/seasons' as const,
      input: insertSeasonSchema,
      responses: { 201: z.custom<typeof seasons.$inferSelect>() }
    },
    updateSeason: {
      method: 'PUT' as const,
      path: '/api/admin/seasons/:id' as const,
      input: insertSeasonSchema.partial(),
      responses: { 200: z.custom<typeof seasons.$inferSelect>() }
    },
    deleteSeason: {
      method: 'DELETE' as const,
      path: '/api/admin/seasons/:id' as const,
      responses: { 204: z.void() }
    },
    createEpisode: {
      method: 'POST' as const,
      path: '/api/admin/episodes' as const,
      input: insertEpisodeSchema,
      responses: { 201: z.custom<typeof episodes.$inferSelect>() }
    },
    updateEpisode: {
      method: 'PUT' as const,
      path: '/api/admin/episodes/:id' as const,
      input: insertEpisodeSchema.partial(),
      responses: { 200: z.custom<typeof episodes.$inferSelect>() }
    },
    deleteEpisode: {
      method: 'DELETE' as const,
      path: '/api/admin/episodes/:id' as const,
      responses: { 204: z.void() }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type UserResponse = z.infer<typeof userResponseSchema>;
export type EpisodePublic = z.infer<typeof episodePublicSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type DashboardDetail = z.infer<typeof dashboardDetailSchema>;
