import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true
    },

    watchedSeconds: {
      type: Number,
      default: 0
    },

    completed: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// One progress record per user + training
progressSchema.index(
  {
    user: 1,
    training: 1
  },
  {
    unique: true
  }
);

const Progress = mongoose.model(
  "Progress",
  progressSchema
);

export default Progress;