/**
 * Rule tests with no database and no HTTP.
 *
 * Run with: npm test
 *
 * Everything checked here is a business rule, which is exactly what should be
 * tested: the clash rules, the derived end time, the status transitions.
 */
import assert from "node:assert/strict";
import { AppointmentService } from "../src/services/AppointmentService";
import { ApiError } from "../src/utils/ApiError";
import { TimeSlot } from "../src/utils/TimeSlot";
import {
    FakeAppointmentRepository,
    FakeCustomerRepository,
    FakeProviderRepository,
    FakeServiceRepository,
} from "./fakes";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
    return Promise.resolve()
        .then(fn)
        .then(() => {
            passed++;
            console.log(`  ok   ${name}`);
        })
        .catch((error: Error) => {
            failed++;
            console.log(`  FAIL ${name}\n       ${error.message}`);
        });
}

/** Asserts the call throws an ApiError with this status, and returns it. */
async function expectApiError(fn: () => Promise<unknown>, status: number): Promise<ApiError> {
    try {
        await fn();
    } catch (error) {
        assert.ok(error instanceof ApiError, `expected ApiError, got ${String(error)}`);
        assert.equal(error.statusCode, status, `expected ${status}, got ${error.statusCode}: ${error.message}`);
        return error;
    }
    throw new Error(`expected a ${status} but the call succeeded`);
}

/** Tomorrow at the given local hour, so nothing is ever in the past. */
function tomorrowAt(hours: number, minutes = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function buildWorld() {
    const customers = new FakeCustomerRepository();
    const providers = new FakeProviderRepository();
    const services = new FakeServiceRepository();
    const appointments = new FakeAppointmentRepository(customers, providers, services);

    const gagan = customers.seed({ name: "Gagan", phone: "9876543210" });
    const niranjan = customers.seed({ name: "Niranjan", phone: "9876543211" });
    const rao = providers.seed({ name: "Dr Rao", type: "Cardiology" });
    const meera = providers.seed({ name: "Dr Meera", type: "Dermatology" });
    const consult = services.seed({ name: "Consultation", price: 800, durationMinutes: 30, providerId: rao._id });
    const skin = services.seed({ name: "Skin consult", price: 700, durationMinutes: 20, providerId: meera._id });

    const service = new AppointmentService(
        appointments as never,
        customers as never,
        providers as never,
        services as never
    );

    return { service, appointments, ids: { gagan: gagan._id, niranjan: niranjan._id, rao: rao._id, meera: meera._id, consult: consult._id, skin: skin._id } };
}

async function run(): Promise<void> {
    console.log("\nTimeSlot");

    await test("derives endTime from the duration", () => {
        const slot = TimeSlot.fromStart(new Date("2026-09-15T10:00:00.000Z"), 30);
        assert.equal(slot.endTime.toISOString(), "2026-09-15T10:30:00.000Z");
        assert.equal(slot.durationMinutes, 30);
    });

    await test("back-to-back slots do not overlap", () => {
        const first = TimeSlot.fromStart(new Date("2026-09-15T10:00:00Z"), 30);
        const second = TimeSlot.fromStart(new Date("2026-09-15T10:30:00Z"), 30);
        assert.equal(first.overlaps(second), false);
        assert.equal(second.overlaps(first), false);
    });

    await test("partial overlap is detected both ways", () => {
        const first = TimeSlot.fromStart(new Date("2026-09-15T10:00:00Z"), 30);
        const second = TimeSlot.fromStart(new Date("2026-09-15T10:15:00Z"), 30);
        assert.equal(first.overlaps(second), true);
        assert.equal(second.overlaps(first), true);
    });

    await test("a fully contained slot overlaps", () => {
        const outer = TimeSlot.fromStart(new Date("2026-09-15T10:00:00Z"), 60);
        const inner = TimeSlot.fromStart(new Date("2026-09-15T10:15:00Z"), 15);
        assert.equal(outer.overlaps(inner), true);
    });

    await test("rejects a zero or negative duration", () => {
        assert.throws(() => TimeSlot.fromStart(new Date(), 0));
        assert.throws(() => TimeSlot.fromStart(new Date(), -30));
    });

    console.log("\nAppointmentService.create");

    await test("books a valid appointment and derives the end time", async () => {
        const { service, ids } = buildWorld();
        const created = await service.create({
            customerId: ids.gagan,
            providerId: ids.rao,
            serviceId: ids.consult,
            startTime: tomorrowAt(10),
        });
        assert.equal(created.status, "booked");
        assert.equal(created.durationMinutes, 30);
        assert.equal(created.endTime.getTime() - created.startTime.getTime(), 30 * 60_000);
    });

    await test("rejects a service that belongs to another provider", async () => {
        const { service, ids } = buildWorld();
        const error = await expectApiError(
            () => service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.skin, startTime: tomorrowAt(10) }),
            400
        );
        assert.match(error.message, /does not offer/);
    });

    await test("rejects a start time in the past", async () => {
        const { service, ids } = buildWorld();
        await expectApiError(
            () => service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: new Date(Date.now() - 60_000) }),
            400
        );
    });

    await test("rejects an unknown customer id", async () => {
        const { service, ids } = buildWorld();
        await expectApiError(
            () => service.create({ customerId: "0".repeat(24), providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) }),
            400
        );
    });

    console.log("\nClash detection");

    await test("409 when the provider is already booked, naming the clash", async () => {
        const { service, ids } = buildWorld();
        await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });

        const error = await expectApiError(
            () => service.create({ customerId: ids.niranjan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10, 15) }),
            409
        );

        const details = error.details as { conflictsWith: { customer: string; provider: string } };
        assert.equal(details.conflictsWith.customer, "Gagan");
        assert.equal(details.conflictsWith.provider, "Dr Rao");
    });

    await test("allows a back-to-back booking at the exact end time", async () => {
        const { service, ids } = buildWorld();
        await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });
        const second = await service.create({
            customerId: ids.niranjan,
            providerId: ids.rao,
            serviceId: ids.consult,
            startTime: tomorrowAt(10, 30),
        });
        assert.equal(second.status, "booked");
    });

    await test("409 when the customer is double-booked with a different provider", async () => {
        const { service, ids } = buildWorld();
        await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });

        const error = await expectApiError(
            () => service.create({ customerId: ids.gagan, providerId: ids.meera, serviceId: ids.skin, startTime: tomorrowAt(10, 10) }),
            409
        );
        assert.match(error.message, /Customer already has another appointment/);
    });

    await test("a cancelled appointment frees its slot", async () => {
        const { service, ids } = buildWorld();
        const first = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });

        await service.changeStatus(String(first._id), "cancelled");

        const rebooked = await service.create({
            customerId: ids.niranjan,
            providerId: ids.rao,
            serviceId: ids.consult,
            startTime: tomorrowAt(10),
        });
        assert.equal(rebooked.status, "booked");
    });

    console.log("\nReschedule");

    await test("moves an appointment without clashing with itself", async () => {
        const { service, ids } = buildWorld();
        const created = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });

        // Overlaps its own current window, which must not count as a clash.
        const moved = await service.reschedule(String(created._id), tomorrowAt(10, 15));
        assert.equal(moved.startTime.getTime(), tomorrowAt(10, 15).getTime());
        assert.equal(moved.durationMinutes, 30);
    });

    await test("409 when the new time clashes with someone else", async () => {
        const { service, ids } = buildWorld();
        const first = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });
        await service.create({ customerId: ids.niranjan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(12) });

        await expectApiError(() => service.reschedule(String(first._id), tomorrowAt(12, 15)), 409);
    });

    await test("refuses to reschedule a cancelled appointment", async () => {
        const { service, ids } = buildWorld();
        const created = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });
        await service.changeStatus(String(created._id), "cancelled");

        await expectApiError(() => service.reschedule(String(created._id), tomorrowAt(14)), 400);
    });

    console.log("\nStatus transitions");

    await test("cannot complete an appointment that has not started", async () => {
        const { service, ids } = buildWorld();
        const created = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });

        const error = await expectApiError(() => service.changeStatus(String(created._id), "completed"), 400);
        assert.match(error.message, /has not started yet/);
    });

    await test("cannot change the status of a cancelled appointment", async () => {
        const { service, ids } = buildWorld();
        const created = await service.create({ customerId: ids.gagan, providerId: ids.rao, serviceId: ids.consult, startTime: tomorrowAt(10) });
        await service.changeStatus(String(created._id), "cancelled");

        await expectApiError(() => service.changeStatus(String(created._id), "completed"), 400);
    });

    await test("404 for an unknown appointment id", async () => {
        const { service } = buildWorld();
        await expectApiError(() => service.getById("0".repeat(24)), 404);
    });

    console.log(`\n${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
}

void run();
