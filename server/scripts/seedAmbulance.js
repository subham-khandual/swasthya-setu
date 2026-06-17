const mongoose = require('mongoose');
const Ambulance = require('../models/Ambulance');
require('dotenv').config({ path: '../.env' });
const dns = require('dns');

// Fix for ECONNREFUSED on some systems by using Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const ambulances = [
  { number: "AMB-GOV-001", type: "Government", driverName: "Ravi Kumar", driverPhone: "+91 8888888888", paramedicName: "Anita Singh", location: { lat: 20.298071, lng: 85.822539 }, status: "Available" },
  { number: "AMB-GOV-002", type: "Government", driverName: "Sita Devi", driverPhone: "+91 7777777777", paramedicName: "Vikram Singh", location: { lat: 20.297071, lng: 85.823539 }, status: "Available" },
  { number: "AMB-PVT-BLS-01", type: "BLS", driverName: "Arun Mehta", driverPhone: "+91 9999999999", paramedicName: "Neha Kapoor", location: { lat: 20.294071, lng: 85.826539 }, status: "Available", cost: 1500 },
  { number: "AMB-PVT-BLS-02", type: "BLS", driverName: "Sanjay Gupta", driverPhone: "+91 9888888888", paramedicName: "Meera Bai", location: { lat: 20.295071, lng: 85.825539 }, status: "Available", cost: 1400 },
  { number: "AMB-PVT-ALS-01", type: "ALS", driverName: "Karan Singh", driverPhone: "+91 8888777777", paramedicName: "Rita Verma", location: { lat: 20.299071, lng: 85.821539 }, status: "Available", cost: 2000 },
  { number: "AMB-PVT-AIR-01", type: "Air", driverName: "Sunil Rao", driverPhone: "+91 7777888888", paramedicName: "Anjali Desai", location: { lat: 20.296071, lng: 85.824539 }, status: "Available", cost: 50000 },
];

async function seedAmbulances() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB for seeding...");
    
    // Clear existing ambulances
    await Ambulance.deleteMany({});
    console.log("Cleared existing ambulances.");
    
    // Insert new ones
    await Ambulance.insertMany(ambulances);
    
    console.log("Ambulances seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedAmbulances();
