import mongoose, { Schema, type Model } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
