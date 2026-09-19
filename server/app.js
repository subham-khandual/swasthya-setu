const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const bloodRoutes = require('./routes/blood');
const accidentRoutes = require('./routes/accident');
const patientRoutes = require("./routes/patient");
const doctorProfileRoutes = require("./routes/doctorProfile");
const adminRoutes = require("./routes/admin");
const medicineRoutes = require('./routes/medicine');
const orderRoutes = require('./routes/order');
const billingRoutes = require('./routes/billing');
const notificationRoutes = require('./routes/notification');
const ambulanceRoutes = require('./routes/ambulance');
const bloodTestRoutes = require('./routes/bloodTest');
const aiRoutes = require('./routes/ai');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : null;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3002",
  frontendUrl, 
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const sessionSecret = process.env.SESSION_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: SESSION_SECRET is not defined in production environment variables!");
    process.exit(1);
  }
  console.warn("WARNING: SESSION_SECRET is missing. Generating a temporary random secret key for this session.");
  return require('crypto').randomBytes(32).toString('hex');
})();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  proxy: process.env.NODE_ENV === 'production', // Trust Render proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true for HTTPS on Render
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // none for cross-domain cookies on Render
    maxAge: 1000 * 60 * 60 * 24 * 365 * 100
  },
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/accident', accidentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/blood-tests', bloodTestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', patientRoutes);
app.use('/api', doctorProfileRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Swasthya Setu Backend Server Running 🚀");
});

module.exports = app;
