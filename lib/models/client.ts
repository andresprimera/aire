import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  industry?: string;
  description?: string;
  website?: string;

  // Branding
  branding: {
    logo?: string; // Base64 or URL
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
  };

  // Documents/Context
  documents: {
    name: string;
    content?: string; // Extracted text or summary
    type?: string; // 'docx', 'pdf', 'text'
    fileId?: mongoose.Types.ObjectId; // Reference to GeneratedFile if created by system
    uploadedAt: Date;
    version?: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const ClientDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    content: String,
    type: String,
    fileId: { type: Schema.Types.ObjectId, ref: "GeneratedFile" },
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { _id: false }, // Avoid creating _id for subdocuments unless necessary
);

const ClientSchema = new Schema<IClient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    branding: {
      logo: String,
      primaryColor: String,
      secondaryColor: String,
      font: String,
    },
    documents: [ClientDocumentSchema],
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate names for the same user
ClientSchema.index({ userId: 1, name: 1 }, { unique: true });

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
