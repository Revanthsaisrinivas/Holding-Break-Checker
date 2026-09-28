const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['account', 'security_id', 'quantity', 'value', 'cash'];

class CsvValidationError extends Error {}

/**
 * Parses a CSV file buffer into an array of plain row objects, and
 * validates that every required column is present.
 *
 * @param {Buffer} buffer - raw file contents
 * @param {string} label - human-readable name of the file, for error messages
 * @returns {Array<{account: string, security_id: string, quantity: number, value: number, cash: number}>}
 */
function parseAndValidateCsv(buffer, label) {
  let records;
  try {
    records = parse(buffer, {
      columns: (headerRow) => headerRow.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new CsvValidationError(`${label}: could not parse CSV (${err.message})`);
  }

  if (records.length === 0) {
    throw new CsvValidationError(`${label}: file is empty or has no data rows.`);
  }

  const columns = Object.keys(records[0]);
  const missing = REQUIRED_COLUMNS.filter((col) => !columns.includes(col));
  if (missing.length > 0) {
    throw new CsvValidationError(
      `${label}: missing required column(s): ${missing.join(', ')}. Required columns are: ${REQUIRED_COLUMNS.join(', ')}.`
    );
  }

  return records.map((row, index) => {
    const rowNum = index + 2; // +1 for header, +1 for 0-index
    const quantity = Number(row.quantity);
    const value = Number(row.value);
    const cash = Number(row.cash);

    if (!row.account || !row.security_id) {
      throw new CsvValidationError(`${label}: row ${rowNum} is missing account or security_id.`);
    }
    if (Number.isNaN(quantity) || Number.isNaN(value) || Number.isNaN(cash)) {
      throw new CsvValidationError(`${label}: row ${rowNum} has a non-numeric quantity, value, or cash.`);
    }

    return {
      account: row.account.trim(),
      security_id: row.security_id.trim(),
      quantity,
      value,
      cash,
    };
  });
}

module.exports = { parseAndValidateCsv, CsvValidationError, REQUIRED_COLUMNS };
