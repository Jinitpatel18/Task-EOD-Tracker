import mongoose, { Schema, Document, Model } from "mongoose";
import { TaskStatus } from "./Task";

export interface IEodReportItem extends Document {
  _id: mongoose.Types.ObjectId;
  eodReport: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  workDone: string;
  status: TaskStatus;
  hoursSpent: number;
  blockers?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EodReportItemSchema = new Schema<IEodReportItem>(
  {
    eodReport: {
      type: Schema.Types.ObjectId,
      ref: "EodReport",
      required: [true, "EOD report reference is required"],
      index: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
      index: true,
    },
    workDone: {
      type: String,
      required: [true, "Work done description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Blocked"],
      required: [true, "Status is required"],
    },
    hoursSpent: {
      type: Number,
      required: [true, "Hours spent is required"],
      min: [0, "Hours spent cannot be negative"],
      default: 1,
    },
    blockers: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const EodReportItem: Model<IEodReportItem> =
  mongoose.models.EodReportItem ||
  mongoose.model<IEodReportItem>("EodReportItem", EodReportItemSchema);

