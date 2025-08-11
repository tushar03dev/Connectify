import * as mongoose from "mongoose";

export interface IUser extends Document{
    name: string;
    email:string;
    rooms?: mongoose.Types.ObjectId[];
    videos?: mongoose.Types.ObjectId[];
    picture?: string;
    password?: string | null;
    authProvider?: string;
}
const UserSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rooms:{type:[mongoose.Types.ObjectId]},
    videos:{type:[mongoose.Types.ObjectId]},
    picture: String,
    password: { type: String, default: null },
    authProvider: { type: String, default: "local" },
})

export const User = mongoose.model<IUser>('User',UserSchema);