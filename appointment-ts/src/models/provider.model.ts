import { Schema, model, type HydratedDocument } from "mongoose";

export interface IProvider {
    name: string;
    type: string;
    phone?: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProviderDocument = HydratedDocument<IProvider>;

const providerSchema = new Schema<IProvider>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Provider = model<IProvider>("Provider", providerSchema);

export default Provider;
