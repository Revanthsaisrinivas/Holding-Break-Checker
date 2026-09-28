export default function SummaryCards({ exceptions }) {
  const total = exceptions.length;
  const high = exceptions.filter((e) => e.severity === 'HIGH').length;
  const medium = exceptions.filter((e) => e.severity === 'MEDIUM').length;
  const low = exceptions.filter((e) => e.severity === 'LOW').length;

  const stats = [
    { label: 'Total exceptions', value: total, tone: 'ink' },
    { label: 'High severity', value: high, tone: 'high' },
    { label: 'Medium severity', value: medium, tone: 'medium' },
    { label: 'Low severity', value: low, tone: 'low' },
  ];

  return (
    <div className="summary-strip">
      {stats.map((stat, i) => (
        <div className={`summary-stat tone-${stat.tone}`} key={stat.label}>
          <span className="summary-value">{stat.value}</span>
          <span className="summary-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
