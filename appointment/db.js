const mongoose = require("mongoose");

// MongoDB connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

//customer schema 

const customerSchema = new mongoose.Schema({

    /* 

    {
        "name": "Niranjan",
        "phone": "9876543210",
        "email": "niranjan@example.com"
    }

    */
    name: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        required: true,
        unique: true,
    },

    email: {
        type: String,
        //email : {type: String, unique: true}; ----> strict schema
    },
});

//provider schema

const providerSchema = new mongoose.Schema({


    /* 
    
    {
        "name": "Niranjan",
        "type": "cardio"
        "phone": "9876543210",
        "email": "niranjan@example.com"
    }

    */
    name: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: true,
        //enum: ["admin","cardio","neuro"] - but this leads to strict boundaries as of now 
        // Examples: admin, cardio, neuro, barber, consultant
    },

    phone: {
        type: String,
    },

    email: {
        type: String,
    },
});

//service schema

const serviceSchema = new mongoose.Schema({

    /* 
    
    {
     "name": "Heart Consultation",
     "description": "General cardiac consultation",
     "price": 800,
     "durationMinutes": 30,
     "providerId": "PASTE_PROVIDER_ID_HERE"
    }

    */


    name: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

    price: {
        type: Number,
        required: true,
    },

    durationMinutes: {
        type: Number,
        required: true,
    },

    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
    },
});

//appointment schema

const appointmentSchema = new mongoose.Schema({

    /* 
    
    {
        "customerId": "PASTE_CUSTOMER_ID_HERE",
        "providerId": "PASTE_PROVIDER_ID_HERE",
        "serviceId": "PASTE_SERVICE_ID_HERE",
        "appointmentDate": "2026-08-01T10:30:00.000Z"
    }

    */

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },

    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
    },

    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },

    appointmentDate: {
        type: Date,
        required: true,
    },

    status: {
        type: String,
        enum: ["booked", "completed", "cancelled"],
        default: "booked",
    },
});

//models

const Customer = mongoose.model("Customer", customerSchema);
const Provider = mongoose.model("Provider", providerSchema);
const Service = mongoose.model("Service", serviceSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = {
    connectDB,
    Customer,
    Provider,
    Service,
    Appointment,
};