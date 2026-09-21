import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface IService {
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
    providerId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ServiceDocument = HydratedDocument<IService>;

const serviceSchema = new Schema<IService>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        // How long a booking of this service occupies the provider.
        // This is the only thing that decides an appointment's endTime.
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
            max: 1440,
        },

        providerId: {
            type: Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Service = model<IService>("Service", serviceSchema);

export default Service;
