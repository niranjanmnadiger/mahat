import { Schema, model, type Document, type Types } from "mongoose";

export interface ServiceAttrs {
    name: string;
    price: number;
    durationMinutes: number;
    providerId: Types.ObjectId;
    description?: string;
}

export interface ServiceDocument extends ServiceAttrs, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const serviceSchema = new Schema<ServiceDocument>(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        price: { type: Number, required: true, min: 0 },
        // This is the ONLY source of an appointment's length.
        durationMinutes: { type: Number, required: true, min: 5, max: 480 },
        providerId: { type: Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
        description: { type: String, trim: true, maxlength: 500 },
    },
    { timestamps: true }
);

export const Service = model<ServiceDocument>("Service", serviceSchema);
