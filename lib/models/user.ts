import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Branding information for business plans
  logo?: string; // Base64 encoded image
  primaryColor?: string; // Hex color for headings
  secondaryColor?: string; // Hex color for subheadings
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    logo: {
      type: String,
      required: false,
    },
    primaryColor: {
      type: String,
      required: false,
    },
    secondaryColor: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
