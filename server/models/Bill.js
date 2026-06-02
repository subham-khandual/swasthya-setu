const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    hospital: { type: String, required: true },
    service: { type: String, required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: { type: String }, // e.g., card, upi, insurance
    transactionId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);

