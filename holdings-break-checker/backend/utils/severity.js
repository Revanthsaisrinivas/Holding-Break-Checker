/**
 * All severity thresholds live here, in one place, so they are easy to
 * find and tune. This is a simple, illustrative rule for an interview
 * project — it is NOT a real financial-industry risk model.
 *
 * A break's severity is based on the percentage difference between the
 * internal and custodian values for that field:
 *
 *   percentDiff = |difference| / |baseline value|
 *
 * where baseline value is the internal value (or the custodian value if
 * the internal value is zero, to avoid dividing by zero).
 */
const SEVERITY_THRESHOLDS = {
  // percentDiff >= HIGH -> HIGH severity
  HIGH: 0.10, // 10%
  // percentDiff >= MEDIUM (and < HIGH) -> MEDIUM severity
  MEDIUM: 0.03, // 3%
  // anything below MEDIUM -> LOW severity
};

// Missing-record breaks are always HIGH severity: a position that only
// exists on one side is treated as the most urgent kind of break.
const MISSING_RECORD_SEVERITY = 'HIGH';

const SUGGESTED_CHECKS = {
  QUANTITY_BREAK: 'Check recent trade activity and settlement.',
  VALUE_BREAK: 'Check security price or valuation.',
  CASH_BREAK: 'Check recent cash movements or transactions.',
  MISSING_IN_CUSTODIAN: 'Check whether the position was recently opened, closed, or transferred.',
  MISSING_IN_INTERNAL: 'Check whether the position was recently opened, closed, or transferred.',
};

/**
 * Computes severity for a field-level break (quantity/value/cash).
 * @param {number} internalValue
 * @param {number} custodianValue
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
function computeSeverity(internalValue, custodianValue) {
  const difference = custodianValue - internalValue;
  const baseline = internalValue !== 0 ? Math.abs(internalValue) : Math.abs(custodianValue);

  // If both sides are zero there is no meaningful percentage difference;
  // treat any non-zero absolute difference (which can't happen here since
  // both are zero) as LOW, and a true zero/zero case never reaches this
  // function because no break would be generated.
  if (baseline === 0) {
    return 'LOW';
  }

  const percentDiff = Math.abs(difference) / baseline;

  if (percentDiff >= SEVERITY_THRESHOLDS.HIGH) {
    return 'HIGH';
  }
  if (percentDiff >= SEVERITY_THRESHOLDS.MEDIUM) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function suggestedCheckFor(breakType) {
  return SUGGESTED_CHECKS[breakType] || 'Investigate the discrepancy.';
}

module.exports = {
  SEVERITY_THRESHOLDS,
  MISSING_RECORD_SEVERITY,
  computeSeverity,
  suggestedCheckFor,
};
