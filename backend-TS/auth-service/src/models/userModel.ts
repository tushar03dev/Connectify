import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    rooms?: mongoose.Types.ObjectId[];
    photo?: Buffer;
    photoIV?: string;
    photoTag?: string;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rooms:{type:[Schema.Types.ObjectId]},
    photo: { type: Buffer }, // Store binary image data
    photoIV: { type: String }, // Store IV for decryption
    photoTag: { type: String }, // Store AuthTag for AES-GCM

});

export const User = mongoose.model<IUser>('users', userSchema);

