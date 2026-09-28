import { useState } from 'react';

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

export default function UploadSection({ onRun, loading }) {
  const [internalFile, setInternalFile] = useState(null);
  const [custodianFile, setCustodianFile] = useState(null);

  const canRun = internalFile && custodianFile && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canRun) return;
    onRun(internalFile, custodianFile);
  };

  return (
    <form className="upload-strip" onSubmit={handleSubmit}>
      <div className="upload-field">
        <label htmlFor="internal-file">Internal book CSV</label>
        <input
          id="internal-file"
          type="file"
          accept=".csv"
          onChange={(e) => setInternalFile(e.target.files?.[0] || null)}
        />
        {internalFile && <span className="upload-filename">{internalFile.name}</span>}
      </div>

      <div className="upload-field">
        <label htmlFor="custodian-file">Custodian CSV</label>
        <input
          id="custodian-file"
          type="file"
          accept=".csv"
          onChange={(e) => setCustodianFile(e.target.files?.[0] || null)}
        />
        {custodianFile && <span className="upload-filename">{custodianFile.name}</span>}
      </div>

      <button type="submit" className="btn btn-primary" disabled={!canRun}>
        {loading ? 'Running reconciliation…' : 'Run reconciliation'}
      </button>
    </form>
  );
}

export { STATUSES };
