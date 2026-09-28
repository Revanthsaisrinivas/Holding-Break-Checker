const mongoose = require('mongoose');

const BREAK_TYPES = [
  'QUANTITY_BREAK',
  'VALUE_BREAK',
  'CASH_BREAK',
  'MISSING_IN_CUSTODIAN',
  'MISSING_IN_INTERNAL',
];

const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

const exceptionSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
  },
  securityId: {
    type: String,
    required: true,
  },
  breakType: {
    type: String,
    enum: BREAK_TYPES,
    required: true,
  },
  // Field the break was found in (quantity / value / cash), or null
  // for missing-record exceptions where no single field is being compared.
  field: {
    type: String,
    enum: ['quantity', 'value', 'cash', null],
    default: null,
  },
  internalValue: {
    type: Number,
    default: null,
  },
  custodianValue: {
    type: Number,
    default: null,
  },
  difference: {
    type: Number,
    required: true,
  },
  severity: {
    type: String,
    enum: SEVERITIES,
    required: true,
  },
  suggestedCheck: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'OPEN',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

exceptionSchema.statics.BREAK_TYPES = BREAK_TYPES;
exceptionSchema.statics.SEVERITIES = SEVERITIES;
exceptionSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Exception', exceptionSchema);
