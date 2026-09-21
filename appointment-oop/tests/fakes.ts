/**
 * In-memory stand-ins for the four repositories.
 *
 * This is the payoff of constructor injection: AppointmentService takes
 * repository objects, so the tests hand it these instead of the real ones and
 * every scheduling rule can be checked with no MongoDB running at all.
 *
 * They are cast to the real repository types at the call site. The service
 * only ever calls the handful of methods implemented here.
 */

interface Row {
    _id: string;
    [key: string]: unknown;
}

let counter = 0;
const nextId = (): string => (++counter).toString(16).padStart(24, "0");

class FakeCollection {
    protected rows: Row[] = [];

    public async findById(id: string): Promise<Row | null> {
        return this.rows.find((r) => r._id === id) ?? null;
    }

    public async findAll(): Promise<Row[]> {
        return [...this.rows];
    }

    public async create(data: Record<string, unknown>): Promise<Row> {
        const row: Row = { _id: nextId(), ...data };
        this.rows.push(row);
        return row;
    }

    public async deleteById(id: string): Promise<Row | null> {
        const index = this.rows.findIndex((r) => r._id === id);
        if (index === -1) return null;
        return this.rows.splice(index, 1)[0] ?? null;
    }

    public seed(data: Record<string, unknown>): Row {
        const row: Row = { _id: nextId(), ...data };
        this.rows.push(row);
        return row;
    }
}

export class FakeCustomerRepository extends FakeCollection {
    public async findByPhone(phone: string): Promise<Row | null> {
        return this.rows.find((r) => r["phone"] === phone) ?? null;
    }
}

export class FakeProviderRepository extends FakeCollection {}

export class FakeServiceRepository extends FakeCollection {
    public async findByProvider(providerId: string): Promise<Row[]> {
        return this.rows.filter((r) => String(r["providerId"]) === providerId);
    }
}

export class FakeAppointmentRepository extends FakeCollection {
    public constructor(
        private readonly customers: FakeCustomerRepository,
        private readonly providers: FakeProviderRepository,
        private readonly services: FakeServiceRepository
    ) {
        super();
    }

    /** Mirrors what .populate() does on the real repository. */
    private async populate(row: Row | null): Promise<Row | null> {
        if (!row) return null;
        return {
            ...row,
            customerId: await this.customers.findById(String(row["customerId"])),
            providerId: await this.providers.findById(String(row["providerId"])),
            serviceId: await this.services.findById(String(row["serviceId"])),
        };
    }

    public async findByIdPopulated(id: string): Promise<Row | null> {
        return this.populate(await this.findById(id));
    }

    public async findAllPopulated(): Promise<Row[]> {
        return Promise.all(this.rows.map((r) => this.populate(r) as Promise<Row>));
    }

    /** The same half-open overlap rule the Mongo query expresses. */
    private overlapping(field: string, id: string, start: Date, end: Date, excludeId?: string): Row | null {
        return (
            this.rows.find(
                (r) =>
                    String(r[field]) === id &&
                    r["status"] === "booked" &&
                    r._id !== excludeId &&
                    (r["startTime"] as Date).getTime() < end.getTime() &&
                    (r["endTime"] as Date).getTime() > start.getTime()
            ) ?? null
        );
    }

    public async findProviderClash(id: string, start: Date, end: Date, excludeId?: string): Promise<Row | null> {
        return this.populate(this.overlapping("providerId", id, start, end, excludeId));
    }

    public async findCustomerClash(id: string, start: Date, end: Date, excludeId?: string): Promise<Row | null> {
        return this.populate(this.overlapping("customerId", id, start, end, excludeId));
    }

    public async updateById(id: string, update: Record<string, unknown>): Promise<Row | null> {
        const row = this.rows.find((r) => r._id === id);
        if (!row) return null;
        Object.assign(row, update);
        return row;
    }

    public async countBookedByField(field: string, id: string): Promise<number> {
        return this.rows.filter((r) => String(r[field]) === id && r["status"] === "booked").length;
    }
}
