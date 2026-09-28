const BREAK_TYPES = [
  'QUANTITY_BREAK',
  'VALUE_BREAK',
  'CASH_BREAK',
  'MISSING_IN_CUSTODIAN',
  'MISSING_IN_INTERNAL',
];
const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

export default function Filters({ filters, onChange, accounts }) {
  const update = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="filter-breakType">Break type</label>
        <select id="filter-breakType" value={filters.breakType} onChange={update('breakType')}>
          <option value="">All</option>
          {BREAK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-severity">Severity</label>
        <select id="filter-severity" value={filters.severity} onChange={update('severity')}>
          <option value="">All</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-status">Status</label>
        <select id="filter-status" value={filters.status} onChange={update('status')}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-account">Account</label>
        <select id="filter-account" value={filters.account} onChange={update('account')}>
          <option value="">All</option>
          {accounts.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { BREAK_TYPES, SEVERITIES, STATUSES };
