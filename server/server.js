const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./app');
const connectDB = require('./config/db');
require('socket.io'); // If you're using Socket.IO, you'll need to implement it properly

const PORT = process.env.PORT || 2001;



const startServer = async () => {
  await connectDB();

  // Auto-seed ambulances if none exist
  try {
    const Ambulance = require('./models/Ambulance');
    const count = await Ambulance.countDocuments();
    if (count === 0) {
      console.log('No ambulances found in the database. Auto-seeding default ambulances...');
      const defaultAmbulances = [
        { number: "AMB-GOV-001", type: "Government", driverName: "Ravi Kumar", driverPhone: "+91 8888888888", paramedicName: "Anita Singh", location: { lat: 20.298071, lng: 85.822539 }, status: "Available" },
        { number: "AMB-GOV-002", type: "Government", driverName: "Sita Devi", driverPhone: "+91 7777777777", paramedicName: "Vikram Singh", location: { lat: 20.297071, lng: 85.823539 }, status: "Available" },
        { number: "AMB-PVT-BLS-01", type: "BLS", driverName: "Arun Mehta", driverPhone: "+91 9999999999", paramedicName: "Neha Kapoor", location: { lat: 20.294071, lng: 85.826539 }, status: "Available", cost: 1500 },
        { number: "AMB-PVT-BLS-02", type: "BLS", driverName: "Sanjay Gupta", driverPhone: "+91 9888888888", paramedicName: "Meera Bai", location: { lat: 20.295071, lng: 85.825539 }, status: "Available", cost: 1400 },
        { number: "AMB-PVT-ALS-01", type: "ALS", driverName: "Karan Singh", driverPhone: "+91 8888777777", paramedicName: "Rita Verma", location: { lat: 20.299071, lng: 85.821539 }, status: "Available", cost: 2000 },
        { number: "AMB-PVT-AIR-01", type: "Air", driverName: "Sunil Rao", driverPhone: "+91 7777888888", paramedicName: "Anjali Desai", location: { lat: 20.296071, lng: 85.824539 }, status: "Available", cost: 50000 },
      ];
      await Ambulance.insertMany(defaultAmbulances);
      console.log('Default ambulances auto-seeded successfully.');
    }
  } catch (seedErr) {
    console.error('Error auto-seeding default ambulances:', seedErr);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Background processor for Blood Tests
  const BloodTest = require('./models/BloodTest');
  setInterval(async () => {
    try {
      const now = new Date();
      const pendingTests = await BloodTest.find({
        status: 'Pending',
        reportReadyAt: { $lte: now }
      });

      for (const test of pendingTests) {
        const testNames = test.tests.map(t => t.name.toLowerCase());
        const reportData = {};
        
        // Populate based on test types
        if (testNames.some(n => n.includes("cbc") || n.includes("count") || n.includes("full body") || n.includes("package"))) {
          reportData.rbc = (Math.random() * (6.0 - 4.0) + 4.0).toFixed(2);
          reportData.wbc = (Math.random() * (11000 - 4000) + 4000).toFixed(0);
          reportData.platelets = (Math.random() * (450000 - 150000) + 150000).toFixed(0);
          reportData.hemoglobin = (Math.random() * (17.0 - 12.0) + 12.0).toFixed(1);
        }
        
        if (testNames.some(n => n.includes("diabetic") || n.includes("glucose") || n.includes("sugar"))) {
          reportData.glucose = (Math.random() * (140 - 70) + 70).toFixed(0);
        }
        
        if (testNames.some(n => n.includes("lipid") || n.includes("cholesterol") || n.includes("fat"))) {
          reportData.cholesterol = (Math.random() * (240 - 150) + 150).toFixed(0);
        }

        // Default if none matched specifically (basic health metrics)
        if (Object.keys(reportData).length === 0) {
          reportData.rbc = (Math.random() * (6.0 - 4.0) + 4.0).toFixed(2);
          reportData.hemoglobin = (Math.random() * (17.0 - 12.0) + 12.0).toFixed(1);
        }

        test.reportData = reportData;
        test.status = 'Completed';
        await test.save();
        console.log(`Test-specific report generated for test: ${test._id}`);
      }
    } catch (error) {
      console.error('Error in blood test background processor:', error);
    }
  }, 10000); // Check every 10 seconds
};

startServer();