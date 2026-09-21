/**
 * Dependency-free test runner: `npm test` (or `node tests/run.js`).
 *
 * The repository layer is replaced with in-memory fakes before the service is
 * required, so the booking rules can be verified without Mongo or a network.
 * The fakes reproduce the same overlap predicate the Mongo query uses.
 */

const path = require("path");
const assert = require("assert");

const { isOverlapping, resolveSlot, addMinutes } = require("../src/utils/time");

/* ------------------------------------------------------------------ */
/* tiny test framework                                                 */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        const result = fn();
        if (result && typeof result.then === "function") {
            return result.then(
                () => {
                    passed++;
                    console.log(`  PASS  ${name}`);
                },
                (err) => {
                    failed++;
                    console.log(`  FAIL  ${name}\n        ${err.message}`);
                }
            );
        }
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
    return Promise.resolve();
}

async function expectError(fn, statusCode, messageMatch) {
    try {
        await fn();
    } catch (error) {
        assert.strictEqual(
            error.statusCode,
            statusCode,
            `expected status ${statusCode}, got ${error.statusCode} (${error.message})`
        );
        if (messageMatch) {
            assert.ok(
                error.message.includes(messageMatch),
                `expected message to include "${messageMatch}", got "${error.message}"`
            );
        }
        return error;
    }
    throw new Error(`expected an error with status ${statusCode}, none thrown`);
}

/* ------------------------------------------------------------------ */
/* in-memory fakes injected into the module cache                      */
/* ------------------------------------------------------------------ */

const db = { customers: [], providers: [], services: [], appointments: [] };
let idCounter = 0;
const nextId = () => `id_${++idCounter}`;

const SLOT_BLOCKING = ["booked", "completed"];

function stub(modulePath, exports) {
    const resolved = require.resolve(modulePath);
    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        path: path.dirname(resolved),
        loaded: true,
        exports,
    };
}

stub("../src/repositories/customer.repository", {
    findById: async (id) => db.customers.find((c) => c._id === id) || null,
});

stub("../src/repositories/provider.repository", {
    findById: async (id) => db.providers.find((p) => p._id === id) || null,
});

stub("../src/repositories/service.repository", {
    findById: async (id) => db.services.find((s) => s._id === id) || null,
});

function findOverlappingFake(field, id, startTime, endTime, excludeId) {
    return (
        db.appointments.find(
            (a) =>
                String(a[field]) === String(id) &&
                SLOT_BLOCKING.includes(a.status) &&
                (!excludeId || a._id !== excludeId) &&
                isOverlapping(a.startTime, a.endTime, startTime, endTime)
        ) || null
    );
}

stub("../src/repositories/appointment.repository", {
    create: async (data) => {
        const doc = { _id: nextId(), status: "booked", ...data };
        db.appointments.push(doc);
        return doc;
    },
    findById: async (id) => db.appointments.find((a) => a._id === id) || null,
    findByIdPopulated: async (id) =>
        db.appointments.find((a) => a._id === id) || null,
    findOverlappingForProvider: async (providerId, s, e, exclude) =>
        findOverlappingFake("providerId", providerId, s, e, exclude),
    findOverlappingForCustomer: async (customerId, s, e, exclude) =>
        findOverlappingFake("customerId", customerId, s, e, exclude),
    updateById: async (id, update) => {
        const doc = db.appointments.find((a) => a._id === id);
        Object.assign(doc, update);
        return doc;
    },
    deleteById: async (id) => {
        const i = db.appointments.findIndex((a) => a._id === id);
        return i === -1 ? null : db.appointments.splice(i, 1)[0];
    },
    countActiveByField: async (field, id) =>
        db.appointments.filter(
            (a) => String(a[field]) === String(id) && a.status === "booked"
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
const serviceA = { _id: "svc_a", name: "Consult", providerId: "prov_a", durationMinutes: 30 };
const serviceB = { _id: "svc_b", name: "Checkup", providerId: "prov_b", durationMinutes: 60 };

db.providers.push(providerA, providerB);
db.customers.push(customer1, customer2);
db.services.push(serviceA, serviceB);

// A fixed future day so tests never trip the "in the past" rule.
const DAY = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
DAY.setUTCHours(0, 0, 0, 0);

const at = (hour, minute = 0) => {
    const d = new Date(DAY);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
};

const reset = () => {
    db.appointments.length = 0;
};

const book = (over = {}) =>
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

async function main() {
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

    await test("endTime derived from service duration", () => {
        const slot = resolveSlot(at(10), undefined, 45);
        assert.strictEqual(slot.endTime.getTime(), at(10, 45).getTime());
        assert.strictEqual(slot.durationMinutes, 45);
    });

    await test("explicit endTime is respected", () => {
        const slot = resolveSlot(at(10), at(11), 30);
        assert.strictEqual(slot.durationMinutes, 60);
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
        await expectError(
            () => book({ startTime: new Date(Date.now() - 60000) }),
            400,
            "past"
        );
    });

    await test("rejects a service that belongs to another provider", async () => {
        await expectError(
            () => book({ serviceId: serviceB._id }),
            400,
            "does not belong"
        );
    });

    await test("rejects an unknown customer", async () => {
        await expectError(() => book({ customerId: "nope" }), 404, "Customer");
    });

    console.log("\nProvider double-booking");
    reset();

    await test("same provider, exact same slot -> 409", async () => {
        await book();
        const err = await expectError(() => book({ customerId: customer2._id }), 409, "Provider is already booked");
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

    console.log("\nCustomer double-booking");
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

    console.log("\nRescheduling");
    reset();

    await test("an appointment does not conflict with its own current slot", async () => {
        const appt = await book({ startTime: at(10) });
        const moved = await appointmentService.rescheduleAppointment(appt._id, {
            startTime: at(10, 10),
        });
        assert.strictEqual(moved.startTime.getTime(), at(10, 10).getTime());
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
            () =>
                appointmentService.rescheduleAppointment(appt._id, {
                    startTime: at(15),
                }),
            400,
            "Only a booked appointment"
        );
    });

    /* -------------------------------------------------------------- */
    /* middleware contract (no zod / express needed)                   */
    /* -------------------------------------------------------------- */

    console.log("\nValidation + error middleware");

    const { validate } = require("../src/middlewares/validate");
    const { errorHandler } = require("../src/middlewares/error.middleware");
    const ApiError = require("../src/utils/ApiError");

    const fakeRes = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (payload) => {
            res.body = payload;
            return res;
        };
        return res;
    };

    await test("validate() replaces body/params with parsed values", async () => {
        const schema = {
            safeParse: () => ({
                success: true,
                data: { body: { name: "trimmed" }, params: { id: "abc" }, query: { a: 1 } },
            }),
        };
        const req = { body: { name: "  trimmed  " }, params: {}, query: {} };
        let nextArg = "untouched";
        validate(schema)(req, fakeRes(), (e) => (nextArg = e));

        assert.strictEqual(nextArg, undefined);
        assert.strictEqual(req.body.name, "trimmed");
        assert.strictEqual(req.params.id, "abc");
        assert.deepStrictEqual(req.validatedQuery, { a: 1 });
    });

    await test("validate() forwards a 400 ApiError when parsing fails", async () => {
        const schema = {
            safeParse: () => ({
                success: false,
                error: {
                    issues: [
                        { path: ["body", "startTime"], message: "Invalid date" },
                    ],
                },
            }),
        };
        let err = null;
        validate(schema)({ body: {}, params: {}, query: {} }, fakeRes(), (e) => (err = e));

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

    await test("errorHandler reports a duplicate key as 409", async () => {
        const res = fakeRes();
        errorHandler({ code: 11000, keyValue: { phone: "9876543210" } }, {}, res, () => {});
        assert.strictEqual(res.statusCode, 409);
        assert.ok(res.body.message.includes("phone"));
    });

    console.log(
        `\n${passed} passed, ${failed} failed\n`
    );

    process.exit(failed === 0 ? 0 : 1);
}

main();
