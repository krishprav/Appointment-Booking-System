import type { Response } from "express";
import { prisma } from "../../db";
import { createServiceSchema, setAvailabilitySchema } from "../utils/validation";
import type { AuthRequest } from "../middleware/authMiddleware";
import { timeToMinutes } from "../utils/timeUtils";

export async function createService(req: AuthRequest, res: Response): Promise<void> {
    try {
        const validatedData = createServiceSchema.parse(req.body);
        const userId = req.user!.id;

        const service = await prisma.service.create({
            data: {
                ...validatedData,
                providerId: userId,
            },
        });

        res.status(201).json(service);
    } catch (error: any) {
        if (error.name === "ZodError") {
            res.status(400).json({ error: "Invalid input", details: error });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function setAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { serviceId } = req.params;
        const validatedData = setAvailabilitySchema.parse(req.body);
        const userId = req.user!.id;

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            res.status(404).json({ error: "Service not found" });
            return;
        }

        if (service.providerId !== userId) {
            res.status(403).json({ error: "Service does not belong to provider" });
            return;
        }

        const existingAvailabilities = await prisma.availability.findMany({
            where: {
                serviceId,
                dayOfWeek: validatedData.dayOfWeek,
            },
        });

        const newStart = timeToMinutes(validatedData.startTime);
        const newEnd = timeToMinutes(validatedData.endTime);

        const hasOverlap = existingAvailabilities.some((a) => {
            const existingStart = timeToMinutes(a.startTime);
            const existingEnd = timeToMinutes(a.endTime);
            return newStart < existingEnd && newEnd > existingStart;
        });

        if (hasOverlap) {
            res.status(409).json({ error: "Overlapping availability" });
            return;
        }

        await prisma.availability.create({
            data: {
                serviceId: serviceId!, 
                dayOfWeek: validatedData.dayOfWeek,
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
            },
        });

        res.status(201).json({ message: "Availability set successfully" });
    } catch (error: any) {
        if (error.name === "ZodError") {
            res.status(400).json({ error: "Invalid input", details: error });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getServices(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { type } = req.query;

        const where = type ? { type: String(type) as any } : {};

        const services = await prisma.service.findMany({
            where,
            include: {
                provider: {
                    select: { name: true },
                },
            },
        });

        const formattedServices = services.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            durationMinutes: s.durationMinutes,
            providerName: s.provider.name,
        }));

        res.status(200).json(formattedServices);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
