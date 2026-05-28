const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Patient.updateOne(
    { _id: '67ccc44c671f5aa635f458e1' },
    {
      $set: {
        name: 'Subham Khandual',
        dob: new Date('2005-11-07'),
        gender: 'Male',
        bloodType: 'O+',
        weight: 60,
        height: 163,
        lastDonationDate: new Date('2025-05-04')
      }
    },
    { upsert: true }
  );
  console.log('Successfully updated patient data in MongoDB!');
  process.exit(0);
}

update().catch(console.error);
