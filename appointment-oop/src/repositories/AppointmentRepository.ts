import type { FilterQuery } from "mongoose";
import {
    Appointment,
    type AppointmentAttrs,
    type AppointmentDocument,
    type PopulatedAppointment,
} from "../models/appointment.model";
import type { AppointmentStatus } from "../types/common";
import { BaseRepository } from "./BaseRepository";

/** What GET /appointments accepts. Every field is optional. */
export interface AppointmentFilters {
    providerId?: string;
    customerId?: string;
    serviceId?: string;
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
}

/**
 * Inherits CRUD from BaseRepository and adds the queries only appointments
 * need: the two overlap lookups and the populated reads.
 *
 * This is the only file in the project that knows how "two bookings collide"
 * is expressed as a MongoDB query.
 */
export class AppointmentRepository extends BaseRepository<AppointmentDocument, AppointmentAttrs> {
    /** The refs to expand, and the fields worth sending back. */
    private static readonly POPULATE = [
        { path: "customerId", select: "name phone email" },
        { path: "providerId", select: "name type" },
        { path: "serviceId", select: "name price durationMinutes" },
    ];

    public constructor() {
        super(Appointment);
    }

    public async findByIdPopulated(id: string): Promise<PopulatedAppointment | null> {
        const doc = await this.model.findById(id).populate(AppointmentRepository.POPULATE).exec();
        return doc as unknown as PopulatedAppointment | null;
    }

    public async findAllPopulated(filters: AppointmentFilters): Promise<PopulatedAppointment[]> {
        const query: FilterQuery<AppointmentDocument> = {};

        if (filters.providerId) query.providerId = filters.providerId;
        if (filters.customerId) query.customerId = filters.customerId;
        if (filters.serviceId) query.serviceId = filters.serviceId;
        if (filters.status) query.status = filters.status;

        // `from`/`to` filter on startTime, so a day view asks for
        // "everything starting inside this day".
        if (filters.from || filters.to) {
            query.startTime = {};
            if (filters.from) query.startTime.$gte = filters.from;
            if (filters.to) query.startTime.$lte = filters.to;
        }

        const docs = await this.model
            .find(query)
            .sort({ startTime: 1 })
            .populate(AppointmentRepository.POPULATE)
            .exec();

        return docs as unknown as PopulatedAppointment[];
    }

    /**
     * The overlap query, shared by the provider and customer checks.
     *
     * The condition is the database version of TimeSlot.overlaps():
     *   existing.startTime < newEnd  AND  existing.endTime > newStart
     *
     * Only `booked` rows block a slot - a cancelled appointment frees its time,
     * and a completed one is in the past.
     *
     * `excludeId` is passed while rescheduling so an appointment is not
     * reported as clashing with its own current window.
     */
    private async findOverlapping(
        field: "providerId" | "customerId",
        id: string,
        startTime: Date,
        endTime: Date,
        excludeId?: string
    ): Promise<PopulatedAppointment | null> {
        const query: FilterQuery<AppointmentDocument> = {
            [field]: id,
            status: "booked",
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        };

        if (excludeId) query._id = { $ne: excludeId };

        const doc = await this.model.findOne(query).populate(AppointmentRepository.POPULATE).exec();
        return doc as unknown as PopulatedAppointment | null;
    }

    public async findProviderClash(
        providerId: string,
        startTime: Date,
        endTime: Date,
        excludeId?: string
    ): Promise<PopulatedAppointment | null> {
        return this.findOverlapping("providerId", providerId, startTime, endTime, excludeId);
    }

    public async findCustomerClash(
        customerId: string,
        startTime: Date,
        endTime: Date,
        excludeId?: string
    ): Promise<PopulatedAppointment | null> {
        return this.findOverlapping("customerId", customerId, startTime, endTime, excludeId);
    }

    /** Used to block deleting a customer/provider/service that is still booked. */
    public async countBookedByField(
        field: "customerId" | "providerId" | "serviceId",
        id: string
    ): Promise<number> {
        return this.count({ [field]: id, status: "booked" } as FilterQuery<AppointmentDocument>);
    }
}
