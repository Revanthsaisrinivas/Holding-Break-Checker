const { computeSeverity, suggestedCheckFor, MISSING_RECORD_SEVERITY } = require('../utils/severity');

const FIELDS_TO_COMPARE = [
  { field: 'quantity', breakType: 'QUANTITY_BREAK' },
  { field: 'value', breakType: 'VALUE_BREAK' },
  { field: 'cash', breakType: 'CASH_BREAK' },
];

function makeKey(row) {
  return `${row.account}__${row.security_id}`;
}

/**
 * Compares the internal book against the custodian file and produces a
 * flat array of exception objects (not yet saved to the database).
 *
 * Matching is done on account + security_id. For matched records, each
 * of quantity/value/cash is compared independently, so a single account
 * + security_id pair can generate more than one break. Records present
 * on only one side produce a single MISSING_* exception instead.
 *
 * @param {Array} internalRows - parsed & validated internal book rows
 * @param {Array} custodianRows - parsed & validated custodian rows
 * @returns {Array} exception objects matching the Exception schema (minus _id/status/createdAt)
 */
function reconcile(internalRows, custodianRows) {
  const exceptions = [];

  const internalMap = new Map();
  for (const row of internalRows) {
    internalMap.set(makeKey(row), row);
  }

  const matchedKeys = new Set();

  for (const custodianRow of custodianRows) {
    const key = makeKey(custodianRow);
    const internalRow = internalMap.get(key);

    if (!internalRow) {
      // Present in custodian file only.
      exceptions.push({
        account: custodianRow.account,
        securityId: custodianRow.security_id,
        breakType: 'MISSING_IN_INTERNAL',
        field: null,
        internalValue: null,
        custodianValue: custodianRow.value,
        difference: custodianRow.value,
        severity: MISSING_RECORD_SEVERITY,
        suggestedCheck: suggestedCheckFor('MISSING_IN_INTERNAL'),
      });
      continue;
    }

    matchedKeys.add(key);

    for (const { field, breakType } of FIELDS_TO_COMPARE) {
      const internalValue = internalRow[field];
      const custodianValue = custodianRow[field];

      if (internalValue !== custodianValue) {
        exceptions.push({
          account: custodianRow.account,
          securityId: custodianRow.security_id,
          breakType,
          field,
          internalValue,
          custodianValue,
          difference: custodianValue - internalValue,
          severity: computeSeverity(internalValue, custodianValue),
          suggestedCheck: suggestedCheckFor(breakType),
        });
      }
    }
  }

  // Anything left in the internal map that wasn't matched exists only
  // in the internal book.
  for (const [key, internalRow] of internalMap.entries()) {
    if (!matchedKeys.has(key)) {
      exceptions.push({
        account: internalRow.account,
        securityId: internalRow.security_id,
        breakType: 'MISSING_IN_CUSTODIAN',
        field: null,
        internalValue: internalRow.value,
        custodianValue: null,
        difference: -internalRow.value,
        severity: MISSING_RECORD_SEVERITY,
        suggestedCheck: suggestedCheckFor('MISSING_IN_CUSTODIAN'),
      });
    }
  }

  return exceptions;
}

module.exports = { reconcile };
