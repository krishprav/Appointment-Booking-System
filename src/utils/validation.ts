import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["USER", "SERVICE_PROVIDER"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "MEDICAL",
    "HOUSE_HELP",
    "BEAUTY",
    "FITNESS",
    "EDUCATION",
    "OTHER",
  ]),
  durationMinutes: z.number().min(30).max(120).refine((val) => val % 30 === 0, {
    message: "Duration must be a multiple of 30 minutes",
  }),
});

export const setAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):(00|30)$/, {
    message: "Time must be in HH:MM format and minutes must be 00 or 30",
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):(00|30)$/, {
    message: "Time must be in HH:MM format and minutes must be 00 or 30",
  }),
}).refine((data) => {
  return data.startTime < data.endTime;
}, {
  message: "Start time must be before end time",
  path: ["startTime"],
});