require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const reconcileRoutes = require('./routes/reconcile');
const exceptionRoutes = require('./routes/exceptions');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/reconcile', reconcileRoutes);
app.use('/api/exceptions', exceptionRoutes);

// Fallback error handler for anything that slips past route-level try/catch.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Holdings Break Checker API listening on port ${PORT}`);
  });
});
