require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Routes
const debateRoutes = require("./routes/debateRoutes");
const authRoutes = require("./routes/AuthRoutes");
app.use('/api/debates', debateRoutes);
app.use('/api', authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connection successful"))
  .catch((e) => console.log("MongoDB connection error:", e));

module.exports = app;
