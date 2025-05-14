import * as Mongoose from "mongoose";

export interface IRoom extends Document {
    name: string;
    code: string;
    members?: Mongoose.Types.ObjectId[];
}

const RoomSchema = new Mongoose.Schema<IRoom>({
    name:{type:String, required: true},
    code:{type:String, required: true},
    members:{type:[Mongoose.Types.ObjectId]},
});

const RoomModel = Mongoose.model<IRoom>('rooms',RoomSchema);