/**
 * Dependency-free test runner: `npm test` (or `tsx tests/run.ts`).
 *
 * The repository layer is replaced with in-memory fakes before the service is
 * loaded, so the booking rules can be verified without Mongo or a network.
 * The fakes reproduce the same overlap predicate the Mongo query uses.
 */

import path from "path";
import assert from "assert";

import { addMinutes, isOverlapping, resolveSlot } from "../src/utils/time";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

/* ------------------------------------------------------------------ */
/* tiny test framework                                                 */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => unknown): Promise<void> {
    try {
        await fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${(err as Error).message}`);
    }
}

async function expectError(
    fn: () => Promise<unknown>,
    statusCode: number,
    messageMatch?: string
): Promise<Any> {
    try {
        await fn();
    } catch (error) {
        const err = error as Any;
        assert.strictEqual(
            err.statusCode,
            statusCode,
            `expected status ${statusCode}, got ${err.statusCode} (${err.message})`
        );
        if (messageMatch) {
            assert.ok(
                String(err.message).includes(messageMatch),
                `expected message to include "${messageMatch}", got "${err.message}"`
            );
        }
        return err;
    }
    throw new Error(`expected an error with status ${statusCode}, none thrown`);
}

/* ------------------------------------------------------------------ */
/* in-memory fakes injected into the module cache                      */
/* ------------------------------------------------------------------ */

interface FakeAppointment {
    _id: string;
    customerId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    status: string;
    notes?: string;
}

const db = {
    customers: [] as Any[],
    providers: [] as Any[],
    services: [] as Any[],
    appointments: [] as FakeAppointment[],
};

let idCounter = 0;
const nextId = (): string => `id_${++idCounter}`;

const SLOT_BLOCKING = ["booked", "completed"];

function stub(modulePath: string, exports: Any): void {
    const resolved = require.resolve(modulePath);
    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        path: path.dirname(resolved),
        loaded: true,
        exports,
    } as Any;
}

stub("../src/repositories/customer.repository", {
    findById: async (id: string) => db.customers.find((c) => c._id === id) ?? null,
});

stub("../src/repositories/provider.repository", {
    findById: async (id: string) => db.providers.find((p) => p._id === id) ?? null,
});

stub("../src/repositories/service.repository", {
    findById: async (id: string) => db.services.find((s) => s._id === id) ?? null,
});

function findOverlappingFake(
    field: "providerId" | "customerId",
    id: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
): FakeAppointment | null {
    return (
        db.appointments.find(
            (a) =>
                String(a[field]) === String(id) &&
                SLOT_BLOCKING.includes(a.status) &&
                (!excludeId || a._id !== excludeId) &&
                isOverlapping(a.startTime, a.endTime, startTime, endTime)
        ) ?? null
    );
}

stub("../src/repositories/appointment.repository", {
    SLOT_BLOCKING_STATUSES: SLOT_BLOCKING,
    create: async (data: Any) => {
        const doc: FakeAppointment = { _id: nextId(), status: "booked", ...data };
        db.appointments.push(doc);
        return doc;
    },
    findById: async (id: string) => db.appointments.find((a) => a._id === id) ?? null,
    findByIdPopulated: async (id: string) =>
        db.appointments.find((a) => a._id === id) ?? null,
    findOverlappingForProvider: async (
        providerId: string,
        s: Date,
        e: Date,
        exclude?: string
    ) => findOverlappingFake("providerId", providerId, s, e, exclude),
    findOverlappingForCustomer: async (
        customerId: string,
        s: Date,
        e: Date,
        exclude?: string
    ) => findOverlappingFake("customerId", customerId, s, e, exclude),
    updateById: async (id: string, update: Any) => {
        const doc = db.appointments.find((a) => a._id === id);
        Object.assign(doc as Any, update);
        return doc ?? null;
    },
    deleteById: async (id: string) => {
        const i = db.appointments.findIndex((a) => a._id === id);
        return i === -1 ? null : db.appointments.splice(i, 1)[0];
    },
    countActiveByField: async (field: string, id: string) =>
        db.appointments.filter(
            (a) => String((a as Any)[field]) === String(id) && a.status === "booked"
        ).length,
});

const appointmentService = require("../src/services/appointment.service");

/* ------------------------------------------------------------------ */
/* fixtures                                                            */
/* ------------------------------------------------------------------ */

const providerA = { _id: "prov_a", name: "Dr A" };
const providerB = { _id: "prov_b", name: "Dr B" };
const customer1 = { _id: "cust_1", name: "Gagan" };
const customer2 = { _id: "cust_2", name: "Niranjan" };

// Two different services owned by the SAME provider - used to prove a provider
// busy with one service is busy for all of them.
const serviceA = {
    _id: "svc_a",
    name: "Consult",
    providerId: "prov_a",
    durationMinutes: 30,
};
const serviceA2 = {
    _id: "svc_a2",
    name: "Follow-up",
    providerId: "prov_a",
    durationMinutes: 45,
};
const serviceB = {
    _id: "svc_b",
    name: "Checkup",
    providerId: "prov_b",
    durationMinutes: 60,
};

db.providers.push(providerA, providerB);
db.customers.push(customer1, customer2);
db.services.push(serviceA, serviceA2, serviceB);

// A fixed future day so tests never trip the "in the past" rule.
const DAY = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
DAY.setUTCHours(0, 0, 0, 0);

const at = (hour: number, minute = 0): Date => {
    const d = new Date(DAY);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
};

const reset = (): void => {
    db.appointments.length = 0;
};

const book = (over: Record<string, unknown> = {}): Promise<Any> =>
    appointmentService.createAppointment({
        customerId: customer1._id,
        providerId: providerA._id,
        serviceId: serviceA._id,
        startTime: at(10),
        ...over,
    });

/* ------------------------------------------------------------------ */
/* tests                                                               */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
    console.log("\nPure time helpers");

    await test("identical windows overlap", () => {
        assert.ok(isOverlapping(at(10), at(11), at(10), at(11)));
    });

    await test("partial overlap detected", () => {
        assert.ok(isOverlapping(at(10), at(11), at(10, 30), at(11, 30)));
    });

    await test("fully contained window overlaps", () => {
        assert.ok(isOverlapping(at(10), at(12), at(10, 30), at(11)));
    });

    await test("back-to-back slots do NOT overlap", () => {
        assert.ok(!isOverlapping(at(10), at(10, 30), at(10, 30), at(11)));
    });

    await test("disjoint slots do not overlap", () => {
        assert.ok(!isOverlapping(at(9), at(10), at(14), at(15)));
    });

    await test("addMinutes does not mutate its input", () => {
        const base = at(10);
        const moved = addMinutes(base, 45);
        assert.strictEqual(base.getTime(), at(10).getTime());
        assert.strictEqual(moved.getTime(), at(10, 45).getTime());
    });

    await test("endTime is always derived from the service duration", () => {
        const slot = resolveSlot(at(10), 45);
        assert.strictEqual(slot.endTime.getTime(), at(10, 45).getTime());
        assert.strictEqual(slot.durationMinutes, 45);
    });

    console.log("\nBooking a slot");
    reset();

    await test("creates an appointment and derives the end time", async () => {
        const appt = await book();
        assert.strictEqual(appt.startTime.getTime(), at(10).getTime());
        assert.strictEqual(appt.endTime.getTime(), at(10, 30).getTime());
        assert.strictEqual(appt.durationMinutes, 30);
        assert.strictEqual(appt.status, "booked");
    });

    await test("rejects a slot in the past", async () => {
        await expectError(() => book({ startTime: new Date(Date.now() - 60000) }), 400, "past");
    });

    await test("rejects a service that belongs to another provider", async () => {
        await expectError(() => book({ serviceId: serviceB._id }), 400, "does not belong");
    });

    await test("rejects an unknown customer", async () => {
        await expectError(() => book({ customerId: "nope" }), 404, "Customer");
    });

    await test("rejects an unknown service", async () => {
        await expectError(() => book({ serviceId: "nope" }), 404, "Service");
    });

    console.log("\nProvider clash");
    reset();

    await test("same provider, exact same slot -> 409", async () => {
        await book();
        const err = await expectError(
            () => book({ customerId: customer2._id }),
            409,
            "Provider is already booked"
        );
        assert.ok(err.details.conflictsWith.appointmentId);
    });

    reset();
    await test("same provider, partial overlap -> 409", async () => {
        await book({ startTime: at(10) });
        await expectError(
            () => book({ customerId: customer2._id, startTime: at(10, 15) }),
            409,
            "Provider is already booked"
        );
    });

    reset();
    await test("same provider, new booking swallows the old one -> 409", async () => {
        // 45 minute service starting 15 minutes earlier fully contains the 30 minute one.
        await book({ startTime: at(10, 15) });
        await expectError(
            () =>
                book({
                    customerId: customer2._id,
                    serviceId: serviceA2._id,
                    startTime: at(10),
                }),
            409,
            "Provider is already booked"
        );
    });

    reset();
    await test("same provider, DIFFERENT service, overlapping -> 409", async () => {
        await book({ startTime: at(10) });
        await expectError(
            () =>
                book({
                    customerId: customer2._id,
                    serviceId: serviceA2._id,
                    startTime: at(10, 20),
                }),
            409,
            "Provider is already booked"
        );
    });

    reset();
    await test("same provider, back-to-back slot -> allowed", async () => {
        await book({ startTime: at(10) });
        const second = await book({ customerId: customer2._id, startTime: at(10, 30) });
        assert.strictEqual(second.startTime.getTime(), at(10, 30).getTime());
    });

    reset();
    await test("different providers at the same time -> allowed", async () => {
        await book({ startTime: at(10) });
        const other = await appointmentService.createAppointment({
            customerId: customer2._id,
            providerId: providerB._id,
            serviceId: serviceB._id,
            startTime: at(10),
        });
        assert.ok(other._id);
    });

    console.log("\nCustomer clash");
    reset();

    await test("same customer with two providers at once -> 409", async () => {
        await book({ startTime: at(10) });
        await expectError(
            () =>
                appointmentService.createAppointment({
                    customerId: customer1._id,
                    providerId: providerB._id,
                    serviceId: serviceB._id,
                    startTime: at(10, 15),
                }),
            409,
            "Customer already has another appointment"
        );
    });

    console.log("\nCancellation frees the slot");
    reset();

    await test("a cancelled appointment no longer blocks the slot", async () => {
        const first = await book({ startTime: at(10) });
        await appointmentService.updateAppointmentStatus(first._id, "cancelled");

        const second = await book({ customerId: customer2._id, startTime: at(10) });
        assert.ok(second._id);
    });

    reset();
    await test("a completed appointment still blocks the slot", async () => {
        const first = await book({ startTime: at(10) });
        await appointmentService.updateAppointmentStatus(first._id, "completed");

        await expectError(
            () => book({ customerId: customer2._id, startTime: at(10) }),
            409,
            "Provider is already booked"
        );
    });

    reset();
    await test("cannot cancel an already cancelled appointment", async () => {
        const appt = await book();
        await appointmentService.updateAppointmentStatus(appt._id, "cancelled");
        await expectError(
            () => appointmentService.updateAppointmentStatus(appt._id, "cancelled"),
            400,
            "already cancelled"
        );
    });

    reset();
    await test("cannot move a completed appointment back to booked", async () => {
        const appt = await book();
        await appointmentService.updateAppointmentStatus(appt._id, "completed");
        await expectError(
            () => appointmentService.updateAppointmentStatus(appt._id, "booked"),
            400,
            "Cannot change status"
        );
    });

    console.log("\nRescheduling");
    reset();

    await test("an appointment does not conflict with its own current slot", async () => {
        const appt = await book({ startTime: at(10) });
        const moved = await appointmentService.rescheduleAppointment(appt._id, {
            startTime: at(10, 10),
        });
        assert.strictEqual(moved.startTime.getTime(), at(10, 10).getTime());
        assert.strictEqual(moved.endTime.getTime(), at(10, 40).getTime());
    });

    reset();
    await test("rescheduling onto someone else's slot -> 409", async () => {
        const mine = await book({ startTime: at(10) });
        await book({ customerId: customer2._id, startTime: at(12) });

        await expectError(
            () =>
                appointmentService.rescheduleAppointment(mine._id, {
                    startTime: at(12, 15),
                }),
            409,
            "Provider is already booked"
        );
    });

    reset();
    await test("a cancelled appointment cannot be rescheduled", async () => {
        const appt = await book();
        await appointmentService.updateAppointmentStatus(appt._id, "cancelled");
        await expectError(
            () => appointmentService.rescheduleAppointment(appt._id, { startTime: at(15) }),
            400,
            "Only a booked appointment"
        );
    });

    reset();
    await test("cannot reschedule into the past", async () => {
        const appt = await book();
        await expectError(
            () =>
                appointmentService.rescheduleAppointment(appt._id, {
                    startTime: new Date(Date.now() - 60000),
                }),
            400,
            "past"
        );
    });

    /* -------------------------------------------------------------- */
    /* middleware contract (no zod / express needed)                   */
    /* -------------------------------------------------------------- */

    console.log("\nValidation + error middleware");

    const { validate } = require("../src/middlewares/validate");
    const { errorHandler } = require("../src/middlewares/error.middleware");
    const { ApiError } = require("../src/utils/ApiError");

    const fakeRes = (): Any => {
        const res: Any = {};
        res.status = (code: number) => {
            res.statusCode = code;
            return res;
        };
        res.json = (payload: Any) => {
            res.body = payload;
            return res;
        };
        return res;
    };

    await test("validate() replaces the body and exposes the parsed query", async () => {
        const schema = {
            safeParse: () => ({
                success: true,
                data: { body: { name: "trimmed" }, params: { id: "abc" }, query: { a: 1 } },
            }),
        };
        const req: Any = { body: { name: "  trimmed  " }, params: {}, query: {} };
        let nextArg: Any = "untouched";
        validate(schema)(req, fakeRes(), (e: Any) => (nextArg = e));

        assert.strictEqual(nextArg, undefined);
        assert.strictEqual(req.body.name, "trimmed");
        assert.deepStrictEqual(req.validatedQuery, { a: 1 });
    });

    await test("validate() forwards a 400 ApiError when parsing fails", async () => {
        const schema = {
            safeParse: () => ({
                success: false,
                error: {
                    issues: [{ path: ["body", "startTime"], message: "Invalid date" }],
                },
            }),
        };
        let err: Any = null;
        validate(schema)({ body: {}, params: {}, query: {} } as Any, fakeRes(), (e: Any) => (err = e));

        assert.strictEqual(err.statusCode, 400);
        assert.deepStrictEqual(err.details, [
            { field: "body.startTime", message: "Invalid date" },
        ]);
    });

    await test("errorHandler maps an ApiError to its status code", async () => {
        const res = fakeRes();
        errorHandler(new ApiError(409, "Provider is already booked"), {}, res, () => {});
        assert.strictEqual(res.statusCode, 409);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.message, "Provider is already booked");
    });

    await test("errorHandler hides unexpected errors behind a 500", async () => {
        const res = fakeRes();
        const noisy = console.error;
        console.error = () => {};
        errorHandler(new Error("secret db string"), {}, res, () => {});
        console.error = noisy;

        assert.strictEqual(res.statusCode, 500);
        assert.strictEqual(res.body.message, "Something went wrong");
    });

    await test("errorHandler reports a duplicate phone as 409", async () => {
        const res = fakeRes();
        errorHandler({ code: 11000, keyValue: { phone: "9876543210" } }, {}, res, () => {});
        assert.strictEqual(res.statusCode, 409);
        assert.ok(res.body.message.includes("phone"));
    });

    await test("errorHandler turns the clash index violation into a slot 409", async () => {
        const res = fakeRes();
        errorHandler(
            {
                code: 11000,
                message: "E11000 duplicate key error ... index: uniq_provider_start_when_booked",
                keyValue: { providerId: "x", startTime: "y" },
            },
            {},
            res,
            () => {}
        );
        assert.strictEqual(res.statusCode, 409);
        assert.strictEqual(res.body.message, "Provider is already booked during this time slot");
    });

    console.log(`\n${passed} passed, ${failed} failed\n`);

    process.exit(failed === 0 ? 0 : 1);
}

void main();
