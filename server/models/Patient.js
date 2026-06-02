const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  bloodType: { type: String, required: true },
  phone: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  address: { type: String },
  occupation: { type: String },
  insuranceProvider: { type: String },
  insurancePolicyNumber: { type: String },
  insuranceFile: { type: String }, // Store file path
  lastDonationDate: { type: Date },
  totalDonations: { type: Number, default: 0 },
  eligibleForDonation: { type: Boolean, default: true },
  bloodPressure: { type: String },
  weight: { type: Number },
  height: { type: Number },
  chronicConditions: [{ type: String }],
  surgeries: { type: Boolean, default: false },
  surgeryDetails: { type: String },
  medicationAllergies: [{ type: String }],
  otherAllergies: { type: String },
  familyHistory: [{ type: String }],
  otherFamilyHistory: { type: String },
  currentMeds: { type: Boolean, default: false },
  medsList: [{ type: String }],
  pastMeds: { type: String },
  ongoingTherapies: [{ type: String }],
  ongoingTherapiesOthers: { type: String },
  bloodReport: { type: String }, // Store file path
  imagingReport: { type: String }, // Store file path
  geneticOrBiopsyTest: { type: Boolean, default: false },
  polioVaccine: { type: Boolean, default: false },
  tetanusShot: { type: Date },
  covidVaccine: { type: String },
  covidBooster: { type: Boolean, default: false },
  smokingStatus: { type: String },
  cigarettesPerDay: { type: Number },
  exerciseFrequency: { type: String },
  sleepHours: { type: Number },
  dietType: [{ type: String }],
  dietTypeOther: { type: String },
  alcoholConsumption: { type: String },
  alcoholFrequency: { type: String },
  primarySymptoms: { type: String },
  initialDiagnosis: { type: String },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  doctorVisits: [{
    doctorName: { type: String },
    visitDate: { type: Date },
    diagnosis: { type: String },
    notes: { type: String }
  }],
  prescriptions: [{
    medicineName: { type: String },
    dosage: { type: String },
    duration: { type: String }
  }],
  vitals: [{
    date: { type: Date },
    bloodPressure: { type: String },
    sugarLevel: { type: Number },
    heartRate: { type: Number },
    temperature: { type: Number }
  }],
  billingRecords: [{
    consultationFee: { type: Number },
    medicinePurchase: { type: Number },
    paymentStatus: { type: String },
    date: { type: Date }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Patient", patientSchema);
