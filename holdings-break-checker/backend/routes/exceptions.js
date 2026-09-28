const express = require('express');
const mongoose = require('mongoose');
const Exception = require('../models/Exception');

const router = express.Router();

/**
 * GET /api/exceptions
 * Returns all stored exceptions, most recent first.
 */
router.get('/', async (req, res) => {
  try {
    const exceptions = await Exception.find().sort({ createdAt: -1 });
    return res.status(200).json(exceptions);
  } catch (err) {
    console.error('Failed to fetch exceptions:', err);
    return res.status(500).json({ error: 'Failed to fetch exceptions.' });
  }
});

/**
 * DELETE /api/exceptions
 * Clears all stored exceptions. Placed before the /:id routes so it
 * is not shadowed by them.
 */
router.delete('/', async (req, res) => {
  try {
    const result = await Exception.deleteMany({});
    return res.status(200).json({ message: 'Exceptions cleared.', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Failed to clear exceptions:', err);
    return res.status(500).json({ error: 'Failed to clear exceptions.' });
  }
});

/**
 * GET /api/exceptions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid exception id.' });
    }
    const exception = await Exception.findById(req.params.id);
    if (!exception) {
      return res.status(404).json({ error: 'Exception not found.' });
    }
    return res.status(200).json(exception);
  } catch (err) {
    console.error('Failed to fetch exception:', err);
    return res.status(500).json({ error: 'Failed to fetch exception.' });
  }
});

/**
 * PATCH /api/exceptions/:id
 * Body: { "status": "OPEN" | "IN_REVIEW" | "RESOLVED" }
 */
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid exception id.' });
    }

    const { status } = req.body;
    const allowedStatuses = Exception.STATUSES;
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const updated = await Exception.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Exception not found.' });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Failed to update exception:', err);
    return res.status(500).json({ error: 'Failed to update exception.' });
  }
});

module.exports = router;
