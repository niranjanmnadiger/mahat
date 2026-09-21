import { Schema, model, type Document, type Types } from "mongoose";

export interface CustomerAttrs {
    name: string;
    phone: string;
    email?: string;
}

export interface CustomerDocument extends CustomerAttrs, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        // Zod normalises "+91 98765-43210" down to 10 digits before this sees it.
        // The unique index is the real guarantee; the regex is a second net.
        phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
        email: { type: String, trim: true, lowercase: true },
    },
    { timestamps: true }
);

export const Customer = model<CustomerDocument>("Customer", customerSchema);
