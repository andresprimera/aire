import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserAgentParams extends Document {
  userId: mongoose.Types.ObjectId;
  agentId: string; // 'sales', 'support', or 'business'
  promptComplement: string; // Business-specific prompt addition
  createdAt: Date;
  updatedAt: Date;
}

const UserAgentParamsSchema = new Schema<IUserAgentParams>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    agentId: {
      type: String,
      required: [true, "Agent ID is required"],
      enum: ["sales", "support", "business"],
    },
    promptComplement: {
      type: String,
      required: [true, "Prompt complement is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create a compound unique index to ensure one params entry per user per agent
UserAgentParamsSchema.index({ userId: 1, agentId: 1 }, { unique: true });

const UserAgentParams: Model<IUserAgentParams> =
  mongoose.models.UserAgentParams ||
  mongoose.model<IUserAgentParams>("UserAgentParams", UserAgentParamsSchema);

export default UserAgentParams;
