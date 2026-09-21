/**
 * Fills an empty database with something worth demoing.
 *
 * It writes through the REPOSITORIES, not the services, on purpose: the
 * service layer refuses to book a time in the past, and a demo needs this
 * morning's appointments to already exist. Seeding is not a user action, so
 * skipping the user-facing rules is the right call here - and it is the one
 * place in the codebase that does.
 *
 * Run with: npm run seed
 */
import mongoose from "mongoose";
import { Container } from "./Container";
import { Database } from "./config/Database";
import { Env } from "./config/Env";
import { TimeSlot } from "./utils/TimeSlot";

/** Today (or a day offset) at a local hour, e.g. at(10, 30) -> today 10:30. */
function at(hours: number, minutes = 0, dayOffset = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

async function seed(): Promise<void> {
    const env = Env.load();
    const database = new Database(env.mongoUri);
    await database.connect();

    const container = new Container();

    // Start from scratch so the script can be run repeatedly.
    await mongoose.connection.dropDatabase();
    console.log("[seed] database cleared");

    const [gagan, niranjan, priya, anil] = await Promise.all([
        container.customerRepository.create({ name: "Gagan V", phone: "9876543210", email: "gagan@example.com" }),
        container.customerRepository.create({ name: "Niranjan N", phone: "9876543211" }),
        container.customerRepository.create({ name: "Priya K", phone: "9845012345" }),
        container.customerRepository.create({ name: "Anil Kumar", phone: "9900112233" }),
    ]);

    const [rao, meera, arjun] = await Promise.all([
        container.providerRepository.create({ name: "Dr Rao", type: "Cardiology", phone: "9800000001" }),
        container.providerRepository.create({ name: "Dr Meera Iyer", type: "Dermatology" }),
        container.providerRepository.create({ name: "Arjun Shetty", type: "Physiotherapy" }),
    ]);

    const [consult, echo, skin, physio] = await Promise.all([
        container.serviceRepository.create({ name: "Heart consultation", price: 800, durationMinutes: 30, providerId: rao._id }),
        container.serviceRepository.create({ name: "Echo review", price: 1500, durationMinutes: 45, providerId: rao._id }),
        container.serviceRepository.create({ name: "Skin consult", price: 700, durationMinutes: 20, providerId: meera._id }),
        container.serviceRepository.create({ name: "Physio session", price: 1200, durationMinutes: 60, providerId: arjun._id }),
    ]);

    const book = async (
        customer: { _id: unknown },
        provider: { _id: unknown },
        service: { _id: unknown; durationMinutes: number },
        startTime: Date,
        status: "booked" | "completed" | "cancelled" = "booked"
    ): Promise<void> => {
        const slot = TimeSlot.fromStart(startTime, service.durationMinutes);
        await container.appointmentRepository.create({
            customerId: customer._id as never,
            providerId: provider._id as never,
            serviceId: service._id as never,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationMinutes: slot.durationMinutes,
            status,
        });
    };

    // Today: a finished morning, a busy middle of the day, free afternoon slots
    // left open on Dr Rao so the clash demo has somewhere to land.
    await book(anil!, rao!, consult!, at(9), "completed");
    await book(gagan!, rao!, consult!, at(10));
    await book(priya!, rao!, echo!, at(11, 30));
    await book(niranjan!, meera!, skin!, at(9, 40));
    await book(gagan!, meera!, skin!, at(14), "cancelled");
    await book(priya!, meera!, skin!, at(16, 20));
    await book(anil!, arjun!, physio!, at(12));
    await book(niranjan!, arjun!, physio!, at(13));

    // Tomorrow, so the day navigation has something to show.
    await book(gagan!, rao!, echo!, at(10, 30, 1));
    await book(priya!, arjun!, physio!, at(15, 0, 1));

    const counts = await Promise.all([
        container.customerRepository.count(),
        container.providerRepository.count(),
        container.serviceRepository.count(),
        container.appointmentRepository.count(),
    ]);

    console.log(`[seed] ${counts[0]} customers, ${counts[1]} providers, ${counts[2]} services, ${counts[3]} appointments`);
    console.log(`[seed] Dr Rao is free today after 12:15 - book 10:15 to trigger a clash`);

    await database.disconnect();
}

seed().catch((error: unknown) => {
    console.error("[seed] failed:", error);
    process.exit(1);
});
