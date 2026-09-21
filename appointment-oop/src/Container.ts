import { AppointmentController } from "./controllers/AppointmentController";
import { CustomerController } from "./controllers/CustomerController";
import { ProviderController } from "./controllers/ProviderController";
import { ServiceController } from "./controllers/ServiceController";
import { AppointmentRepository } from "./repositories/AppointmentRepository";
import { CustomerRepository } from "./repositories/CustomerRepository";
import { ProviderRepository } from "./repositories/ProviderRepository";
import { ServiceRepository } from "./repositories/ServiceRepository";
import { AppointmentRoutes } from "./routes/AppointmentRoutes";
import { CustomerRoutes } from "./routes/CustomerRoutes";
import { ProviderRoutes } from "./routes/ProviderRoutes";
import { ServiceRoutes } from "./routes/ServiceRoutes";
import { AppointmentService } from "./services/AppointmentService";
import { CustomerService } from "./services/CustomerService";
import { ProviderService } from "./services/ProviderService";
import { ServiceService } from "./services/ServiceService";

/**
 * The one place where objects are created and wired together.
 *
 * This is what makes constructor injection worth the typing. Every other class
 * declares what it needs and receives it; this class decides what "it" is. So
 * there is exactly one file to change to swap a repository for a fake one, and
 * exactly one file to read to see how the whole system is assembled.
 *
 * Order matters, bottom up: repositories, then services, then controllers,
 * then routes. Each layer is built from the one below it.
 */
export class Container {
    // Repositories - the only objects that touch Mongoose models.
    public readonly customerRepository = new CustomerRepository();
    public readonly providerRepository = new ProviderRepository();
    public readonly serviceRepository = new ServiceRepository();
    public readonly appointmentRepository = new AppointmentRepository();

    // Services - every business rule, given the repositories they need.
    public readonly customerService = new CustomerService(this.customerRepository, this.appointmentRepository);
    public readonly providerService = new ProviderService(
        this.providerRepository,
        this.serviceRepository,
        this.appointmentRepository
    );
    public readonly serviceService = new ServiceService(
        this.serviceRepository,
        this.providerRepository,
        this.appointmentRepository
    );
    public readonly appointmentService = new AppointmentService(
        this.appointmentRepository,
        this.customerRepository,
        this.providerRepository,
        this.serviceRepository
    );

    // Controllers - HTTP in, HTTP out.
    public readonly customerController = new CustomerController(this.customerService);
    public readonly providerController = new ProviderController(this.providerService);
    public readonly serviceController = new ServiceController(this.serviceService);
    public readonly appointmentController = new AppointmentController(this.appointmentService);

    // Routes - each owns a Router, ready to mount.
    public readonly customerRoutes = new CustomerRoutes(this.customerController);
    public readonly providerRoutes = new ProviderRoutes(this.providerController);
    public readonly serviceRoutes = new ServiceRoutes(this.serviceController);
    public readonly appointmentRoutes = new AppointmentRoutes(this.appointmentController);
}
