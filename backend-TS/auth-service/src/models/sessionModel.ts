import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
    userId: string;
    token: string;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
    userId: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model<ISession>("Session", SessionSchema);
