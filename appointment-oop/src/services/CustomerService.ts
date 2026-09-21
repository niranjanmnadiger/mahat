import type { CustomerAttrs, CustomerDocument } from "../models/customer.model";
import type { AppointmentRepository } from "../repositories/AppointmentRepository";
import type { CustomerRepository } from "../repositories/CustomerRepository";
import { ApiError } from "../utils/ApiError";

/**
 * Constructor injection, which is the pattern every service here follows.
 *
 * The service does not `import { CustomerRepository }` and build one - it is
 * handed the instances it needs. That is what lets a test pass in a fake
 * repository, and it is why the Container exists.
 *
 * `private readonly` in the parameter list is TypeScript shorthand: it
 * declares the field and assigns it, so there is no separate `this.x = x`.
 */
export class CustomerService {
    public constructor(
        private readonly customers: CustomerRepository,
        private readonly appointments: AppointmentRepository
    ) {}

    public async create(data: CustomerAttrs): Promise<CustomerDocument> {
        // Checked here for a clear 409 message. The unique index on `phone` is
        // the actual guarantee if two requests race.
        const existing = await this.customers.findByPhone(data.phone);
        if (existing) {
            throw ApiError.conflict("A customer with this phone number already exists");
        }

        return this.customers.create(data);
    }

    public async list(): Promise<CustomerDocument[]> {
        return this.customers.findAll();
    }

    public async getById(id: string): Promise<CustomerDocument> {
        const customer = await this.customers.findById(id);
        if (!customer) throw ApiError.notFound("Customer not found");
        return customer;
    }

    public async remove(id: string): Promise<void> {
        await this.getById(id); // 404 before anything else

        // Deleting a customer with live bookings would leave appointments
        // pointing at nothing, so it is refused while any are still booked.
        const booked = await this.appointments.countBookedByField("customerId", id);
        if (booked > 0) {
            throw ApiError.badRequest(
                `Cannot delete this customer: ${booked} booked appointment(s) still reference them. Cancel those first.`
            );
        }

        await this.customers.deleteById(id);
    }
}
