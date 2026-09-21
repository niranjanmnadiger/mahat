import { Schema, model, type HydratedDocument } from "mongoose";

export interface ICustomer {
    name: string;
    phone: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type CustomerDocument = HydratedDocument<ICustomer>;

const customerSchema = new Schema<ICustomer>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
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

export const Customer = model<ICustomer>("Customer", customerSchema);

export default Customer;
