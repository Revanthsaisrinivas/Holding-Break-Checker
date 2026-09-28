const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

function formatValue(v) {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function severityClass(severity) {
  return `badge severity-${severity.toLowerCase()}`;
}

function exportToCsv(exceptions) {
  const headers = [
    'account',
    'securityId',
    'breakType',
    'internalValue',
    'custodianValue',
    'difference',
    'severity',
    'status',
    'suggestedCheck',
  ];

  const rows = exceptions.map((e) =>
    headers
      .map((h) => {
        const raw = e[h] ?? '';
        const cell = String(raw).replace(/"/g, '""');
        return `"${cell}"`;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exceptions-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExceptionTable({ exceptions, onStatusChange }) {
  if (exceptions.length === 0) {
    return (
      <div className="empty-state">
        <p>No exceptions to show.</p>
        <p className="empty-state-sub">
          Upload an internal book and custodian CSV above and run a reconciliation, or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="table-panel">
      <div className="table-panel-header">
        <span>{exceptions.length} exception{exceptions.length === 1 ? '' : 's'}</span>
        <button type="button" className="btn btn-secondary" onClick={() => exportToCsv(exceptions)}>
          Export exceptions CSV
        </button>
      </div>

      <div className="table-scroll">
        <table className="exception-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Security ID</th>
              <th>Break type</th>
              <th className="num">Internal value</th>
              <th className="num">Custodian value</th>
              <th className="num">Difference</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Suggested check</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map((exc) => (
              <tr key={exc._id} className={`row-severity-${exc.severity.toLowerCase()}`}>
                <td>{exc.account}</td>
                <td className="mono">{exc.securityId}</td>
                <td>{exc.breakType.replaceAll('_', ' ')}</td>
                <td className="num mono">{formatValue(exc.internalValue)}</td>
                <td className="num mono">{formatValue(exc.custodianValue)}</td>
                <td className="num mono">{formatValue(exc.difference)}</td>
                <td>
                  <span className={severityClass(exc.severity)}>{exc.severity}</span>
                </td>
                <td>
                  <select
                    value={exc.status}
                    onChange={(e) => onStatusChange(exc._id, e.target.value)}
                    className="status-select"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="suggested-check">{exc.suggestedCheck}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() =>
                      onStatusChange(exc._id, exc.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')
                    }
                  >
                    {exc.status === 'RESOLVED' ? 'Reopen' : 'Mark resolved'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
