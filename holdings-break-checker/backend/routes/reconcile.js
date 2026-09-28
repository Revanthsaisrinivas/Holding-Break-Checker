const express = require('express');
const multer = require('multer');
const Exception = require('../models/Exception');
const { parseAndValidateCsv, CsvValidationError } = require('../services/csvParser');
const { reconcile } = require('../services/reconciliationService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/reconcile
 * Expects multipart/form-data with two files:
 *   - internalBook
 *   - custodianFile
 *
 * Parses and validates both CSVs, runs the reconciliation, replaces any
 * previously stored exceptions with the fresh results, and returns them.
 * Replacing (rather than appending) keeps re-running a reconciliation
 * idempotent instead of piling up duplicate exceptions.
 */
router.post(
  '/',
  upload.fields([
    { name: 'internalBook', maxCount: 1 },
    { name: 'custodianFile', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const internalFile = req.files?.internalBook?.[0];
      const custodianFile = req.files?.custodianFile?.[0];

      if (!internalFile || !custodianFile) {
        return res.status(400).json({
          error: 'Both internalBook and custodianFile CSV files are required.',
        });
      }

      const internalRows = parseAndValidateCsv(internalFile.buffer, 'Internal book CSV');
      const custodianRows = parseAndValidateCsv(custodianFile.buffer, 'Custodian CSV');

      const exceptionDrafts = reconcile(internalRows, custodianRows);

      await Exception.deleteMany({});
      const saved = exceptionDrafts.length > 0
        ? await Exception.insertMany(exceptionDrafts)
        : [];

      return res.status(200).json({
        message: 'Reconciliation complete.',
        recordsCompared: {
          internal: internalRows.length,
          custodian: custodianRows.length,
        },
        exceptionsFound: saved.length,
        exceptions: saved,
      });
    } catch (err) {
      if (err instanceof CsvValidationError) {
        return res.status(400).json({ error: err.message });
      }
      console.error('Reconciliation failed:', err);
      return res.status(500).json({ error: 'Reconciliation failed due to a server error.' });
    }
  }
);

module.exports = router;
