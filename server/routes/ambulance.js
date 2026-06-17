const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const AmbulanceBooking = require('../models/AmbulanceBooking');
const CallLog = require('../models/CallLog');
const crypto = require('crypto');

// @route   GET /api/ambulance/available
// @desc    Get all available ambulances
router.get('/available', async (req, res) => {
  try {
    const availableAmbulances = await Ambulance.find({ status: 'Available' });
    res.json(availableAmbulances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/ambulance/book
// @desc    Book an ambulance and assign a driver
router.post('/book', async (req, res) => {
  console.log('Booking request received:', req.body);
  const {
    userId,
    patientName,
    location,
    coordinates,
    hospital,
    urgency,
    ambulanceType,
    paymentMethod
  } = req.body;

  try {
    // 1. Find the nearest available ambulance of the requested type
    // Note: For simplicity, we'll just find the first available one of the right type.
    // In a production app, we would use $near with geospatial indexing.
    const query = { status: 'Available' };
    if (ambulanceType === 'Government') {
      query.type = 'Government';
    } else if (ambulanceType === 'Private' || ['BLS', 'ALS', 'Air'].includes(ambulanceType)) {
      // If specific type selected, match it; otherwise just a private one
      if (['BLS', 'ALS', 'Air'].includes(ambulanceType)) {
        query.type = ambulanceType;
      } else {
        query.type = 'Private';
      }
    }

    console.log('Executing query:', query);
    const assignedAmbulance = await Ambulance.findOne(query);
    console.log('Assigned ambulance:', assignedAmbulance);

    if (!assignedAmbulance) {
      return res.status(404).json({ 
        msg: 'No available ambulances found for the requested type',
        query: query
      });
    }

    // 2. Create tracking token
    const trackingToken = crypto.randomBytes(16).toString('hex');

    // 3. Create booking
    const mongoose = require('mongoose');
    const isValidUser = mongoose.Types.ObjectId.isValid(userId);

    const newBooking = new AmbulanceBooking({
      userId: isValidUser ? userId : undefined,
      patientName,
      ambulanceId: assignedAmbulance._id,
      location,
      coordinates,
      hospital,
      urgency,
      ambulanceType,
      paymentMethod,
      trackingToken,
      status: 'Dispatched',
      statusTimeline: [{ status: 'Dispatched' }]
    });

    const booking = await newBooking.save();

    // 4. Update ambulance status
    assignedAmbulance.status = 'En Route';
    await assignedAmbulance.save();

    // 5. Respond with booking and driver details
    res.json({
      booking,
      driver: {
        name: assignedAmbulance.driverName,
        phone: assignedAmbulance.driverPhone,
        number: assignedAmbulance.number,
        location: assignedAmbulance.location
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/ambulance/tracking/:token
// @desc    Get tracking details by token
router.get('/tracking/:token', async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findOne({ trackingToken: req.params.token })
      .populate('ambulanceId');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Tracking session not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/ambulance/call-log
// @desc    Log a call to a driver
router.post('/call-log', async (req, res) => {
  const { bookingId, userId, driverPhone } = req.body;
  try {
    const log = new CallLog({
      bookingId,
      userId,
      driverPhone
    });
    await log.save();
    res.json({ msg: 'Call logged successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/ambulance/booking/:id/status
// @desc    Update booking status (Admin/Simulation use)
router.patch('/booking/:id/status', async (req, res) => {
  const { status, lat, lng, eta } = req.body;
  try {
    const booking = await AmbulanceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (status) {
      booking.status = status;
      booking.statusTimeline.push({ status });
      
      // If completed or cancelled, free up the ambulance
      if (status === 'Completed' || status === 'Cancelled') {
        const ambulance = await Ambulance.findById(booking.ambulanceId);
        if (ambulance) {
          ambulance.status = 'Available';
          await ambulance.save();
        }
      }
    }

    if (lat && lng) {
      booking.coordinates = { lat, lng };
    }
    if (eta) {
      booking.eta = eta;
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
