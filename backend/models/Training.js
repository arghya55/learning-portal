import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    category: {
      type: String,
      default: "General",
      trim: true
    },

    videoUrl: {
      type: String,
      required: true
    },

    originalFileName: {
      type: String,
      default: ""
    },

    thumbnailUrl: {
      type: String,
      default: ""
    },

    durationSeconds: {
      type: Number,
      default: 0
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  {
    timestamps: true
  }
);

const Training = mongoose.model(
  "Training",
  trainingSchema
);

export default Training;