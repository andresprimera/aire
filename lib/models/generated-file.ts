import mongoose, { Schema, Document } from "mongoose";

export interface IGeneratedFile extends Document {
  filename: string;
  contentType: string;
  data: Buffer;
  createdAt: Date;
}

const GeneratedFileSchema = new Schema<IGeneratedFile>({
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Auto-delete after 24 hours
  },
});

export default mongoose.models.GeneratedFile ||
  mongoose.model<IGeneratedFile>("GeneratedFile", GeneratedFileSchema);
