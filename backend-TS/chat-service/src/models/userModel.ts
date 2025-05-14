import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    rooms?: mongoose.Types.ObjectId[];
    photo?: string;
}

const userSchema = new Schema<IUser>({
    id: { type: Schema.Types.ObjectId, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rooms:{type:[Schema.Types.ObjectId],ref:'Room'},
    photo: { type: String },
});

export const User = mongoose.model<IUser>('users', userSchema);


