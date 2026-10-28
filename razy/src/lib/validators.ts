import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const registrationSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const uploadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
  contentType: z.string().trim().min(1).max(200),
});

export const favoriteSchema = z.object({
  projectId: z.string().min(1),
});

export const reportSchema = z.object({
  projectId: z.string().min(1).optional(),
  reason: z.string().trim().min(2).max(120),
  details: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
});

export const projectStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const projectDraftSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().min(20).max(280),
  description: z.string().trim().min(20).max(5000),
  type: z.enum(["APK", "ZIP", "SOURCE_CODE", "WEBSITE", "GAME", "APP", "OTHER"]),
  categoryId: z.string().min(1),
  developer: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  requirements: z.string().trim().max(3000).optional().or(z.literal("")),
  license: z.string().trim().max(120).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(120).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  supportedPlatforms: z.array(z.string().trim().min(1)).max(12).optional().default([]),
  demoUrl: z.string().trim().url().optional().or(z.literal("")),
  storedFileId: z.string().min(1).optional(),
  version: z.string().trim().max(40).optional(),
});

export const projectSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  type: z.enum(["APK", "ZIP", "SOURCE_CODE", "WEBSITE", "GAME", "APP", "OTHER"]).optional(),
  sort: z.enum(["newest", "title", "updated"]).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export const analyticsEventSchema = z.object({
  eventType: z.string().trim().min(2).max(80),
  projectId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const siteSettingsSchema = z.object({
  announcement: z.string().trim().max(500).nullable().optional(),
  adsEnabled: z.boolean().optional(),
  newsletterUrl: z.string().trim().url().nullable().optional(),
  defaultTitle: z.string().trim().min(1).max(120).optional(),
  defaultDescription: z.string().trim().min(1).max(320).optional(),
  canonicalBaseUrl: z.string().trim().url().optional(),
  verificationCode: z.string().trim().max(200).optional(),
});
