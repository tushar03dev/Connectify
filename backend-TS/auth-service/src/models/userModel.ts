import * as mongoose from "mongoose";

export interface IUser extends Document{
    name: string;
    email:string;
    password: string;
    rooms?: mongoose.Types.ObjectId[];
    videos?: mongoose.Types.ObjectId[];
}
const UserSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rooms:{type:[mongoose.Types.ObjectId]},
    videos:{type:[mongoose.Types.ObjectId]}
})

export const User = mongoose.model<IUser>('User',UserSchema);