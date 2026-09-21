import { Types } from "mongoose";

import {
    Appointment,
    type AppointmentDocument,
    type AppointmentStatus,
    type PopulatedAppointment,
} from "../models/appointment.model";
import type { Id } from "./types";

/** A cancelled appointment frees its slot. Everything else still occupies it. */
export const SLOT_BLOCKING_STATUSES: AppointmentStatus[] = ["booked", "completed"];

const POPULATE = [
    { path: "customerId", select: "name phone email" },
    { path: "providerId", select: "name type phone email" },
    { path: "serviceId", select: "name price durationMinutes" },
];

export interface CreateAppointmentData {
    customerId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    notes?: string;
}

export interface Slot {
    startTime: number;
    endTime: number;

}

export interface AppointmentQueryFilters {
    providerId?: string;
    customerId?: string;
    serviceId?: string;
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
}

export type ConflictField = "providerId" | "customerId";

export interface OverlapQuery {
    field: ConflictField;
    id: Id;
    startTime: Date;
    endTime: Date;
    excludeId?: Id;
}

export function create(data: CreateAppointmentData): Promise<AppointmentDocument> {
    return Appointment.create({
        ...data,
        customerId: new Types.ObjectId(data.customerId),
        providerId: new Types.ObjectId(data.providerId),
        serviceId: new Types.ObjectId(data.serviceId),
        status: "booked",
    });
}

/**
 * `from`/`to` bound the window by start time.
 */
export async function findAll(
    filters: AppointmentQueryFilters = {}
): Promise<PopulatedAppointment[]> {
    const query: Record<string, unknown> = {};

    if (filters.providerId) query.providerId = filters.providerId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.serviceId) query.serviceId = filters.serviceId;
    if (filters.status) query.status = filters.status;

    if (filters.from || filters.to) {
        const range: Record<string, Date> = {};
        if (filters.from) range.$gte = filters.from;
        if (filters.to) range.$lte = filters.to;
        query.startTime = range;
    }

    const docs = await Appointment.find(query)
        .sort({ startTime: 1 })
        .populate(POPULATE)
        .exec();

    return docs as unknown as PopulatedAppointment[];
}

export function findById(id: Id): Promise<AppointmentDocument | null> {
    return Appointment.findById(id).exec();
}

export async function findByIdPopulated(id: Id): Promise<PopulatedAppointment | null> {
    const doc = await Appointment.findById(id).populate(POPULATE).exec();

    return doc as unknown as PopulatedAppointment | null;
}

/**
 * Core clash query.
 *
 * Finds the first slot-blocking appointment for `field` (providerId or
 * customerId) that overlaps [startTime, endTime).
 *
 * Overlap in Mongo terms: existing.startTime < newEnd AND existing.endTime > newStart.
 * Strict comparison means back-to-back bookings are not treated as conflicts.
 *
 * Note that the provider query is NOT filtered by serviceId - a provider busy
 * with any of their services is busy for all of them.
 *
 * `excludeId` is passed when rescheduling so an appointment does not conflict
 * with its own current slot.
 */
export async function findOverlapping({
    field,
    id,
    startTime,
    endTime,
    excludeId,
}: OverlapQuery): Promise<PopulatedAppointment | null> {
    const query: Record<string, unknown> = {
        [field]: id,
        status: { $in: SLOT_BLOCKING_STATUSES },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
    };


    /*

    slot : 12pm to 1pm
    if (startTime>)

    let arr = []

    */

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const doc = await Appointment.findOne(query).populate(POPULATE).exec();

    return doc as unknown as PopulatedAppointment | null;
}

export function getAvaliableSlots(
    providerId: Id,
    Date: Date,

) {

    let startTime: number = 900;
    let maxStartTime: number = 2100;
    let avalibleSlots: Slot[] = [];
    let slots: [] = [];
    let currentSlots: Slot[] = [{ startTime: 1100, endTime: 1130 }, { startTime: 1300, endTime: 1330 }, { startTime: 1500, endTime: 1530 }, { startTime: 1700, endTime: 1730 }];

    for (let start = startTime; start < maxStartTime; start + 100) {
        let end = start + 60;

        for (let slot of currentSlots) {
            if (start >= slot.startTime && start < slot.endTime && end > slot.startTime && end <= slot.endTime) {
                continue;
            } else {
                avalibleSlots.push({ startTime: start, endTime: end });
            }
        }
    }
    for (let slot of avalibleSlots) {
        //display as 9am - 9:30am or 9:30am - 10am
        slots.push({ startTime: new Date(slot.startTime), endTime: new Date(slot.endTime) });
    }
    return slots;


    //currentSlots.for

    //get all the avalible slots in a day 

    // provider has his slots 10am - 10pm - 1hr slot 

}

export function findOverlappingForProvider(
    providerId: Id,
    startTime: Date,
    endTime: Date,
    excludeId?: Id
): Promise<PopulatedAppointment | null> {
    return findOverlapping({ field: "providerId", id: providerId, startTime, endTime, excludeId });
}

export function findOverlappingForCustomer(
    customerId: Id,
    startTime: Date,
    endTime: Date,
    excludeId?: Id
): Promise<PopulatedAppointment | null> {
    return findOverlapping({ field: "customerId", id: customerId, startTime, endTime, excludeId });
}

/**
 * Counts still-live bookings pointing at a customer, provider or service.
 * Used to stop deletion of an entity that upcoming appointments depend on.
 */
export function countActiveByField(
    field: "customerId" | "providerId" | "serviceId",
    id: Id
): Promise<number> {
    return Appointment.countDocuments({ [field]: id, status: "booked" }).exec();
}

export async function updateById(
    id: Id,
    update: Partial<Pick<CreateAppointmentData, "startTime" | "endTime" | "durationMinutes">> & {
        status?: AppointmentStatus;
    }
): Promise<PopulatedAppointment | null> {
    const doc = await Appointment.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    })
        .populate(POPULATE)
        .exec();

    return doc as unknown as PopulatedAppointment | null;
}

export function deleteById(id: Id): Promise<AppointmentDocument | null> {
    return Appointment.findByIdAndDelete(id).exec();
}
