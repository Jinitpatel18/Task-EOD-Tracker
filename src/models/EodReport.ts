import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEodReport extends Document {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  reportDate: string; // YYYY-MM-DD
  summary?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EodReportSchema = new Schema<IEodReport>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee is required"],
      index: true,
    },
    reportDate: {
      type: String, // e.g. "2026-11-06"
      required: [true, "Report date is required"],
      index: true,
    },
    summary: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Only one EOD report per employee per date
EodReportSchema.index({ employee: 1, reportDate: 1 }, { unique: true });

export const EodReport: Model<IEodReport> =
  mongoose.models.EodReport ||
  mongoose.model<IEodReport>("EodReport", EodReportSchema);

