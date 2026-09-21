import { Schema, model, type Document, type Types } from "mongoose";

export interface ProviderAttrs {
    name: string;
    type: string;
    phone?: string;
    email?: string;
}

export interface ProviderDocument extends ProviderAttrs, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const providerSchema = new Schema<ProviderDocument>(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        type: { type: String, required: true, trim: true, maxlength: 80 },
        phone: { type: String, match: /^\d{10}$/ },
        email: { type: String, trim: true, lowercase: true },
    },
    { timestamps: true }
);

export const Provider = model<ProviderDocument>("Provider", providerSchema);
