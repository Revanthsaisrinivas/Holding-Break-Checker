import { useEffect, useMemo, useState } from 'react';
import UploadSection from './components/UploadSection.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import Filters from './components/Filters.jsx';
import ExceptionTable from './components/ExceptionTable.jsx';
import { runReconciliation, fetchExceptions, updateExceptionStatus } from './api/api.js';
import './App.css';

const EMPTY_FILTERS = { breakType: '', severity: '', status: '', account: '' };

export default function App() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRunSummary, setLastRunSummary] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    loadExceptions();
  }, []);

  async function loadExceptions() {
    setPageLoading(true);
    setError(null);
    try {
      const data = await fetchExceptions();
      setExceptions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleRun(internalFile, custodianFile) {
    setLoading(true);
    setError(null);
    try {
      const result = await runReconciliation(internalFile, custodianFile);
      setExceptions(result.exceptions);
      setLastRunSummary(result);
      setFilters(EMPTY_FILTERS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    const previous = exceptions;
    setExceptions((prev) => prev.map((e) => (e._id === id ? { ...e, status } : e)));
    try {
      await updateExceptionStatus(id, status);
    } catch (err) {
      setError(err.message);
      setExceptions(previous);
    }
  }

  const accounts = useMemo(
    () => Array.from(new Set(exceptions.map((e) => e.account))).sort(),
    [exceptions]
  );

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((e) => {
      if (filters.breakType && e.breakType !== filters.breakType) return false;
      if (filters.severity && e.severity !== filters.severity) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.account && e.account !== filters.account) return false;
      return true;
    });
  }, [exceptions, filters]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Holdings Break Checker & Exception Board</h1>
          <p className="app-subtitle">Reconcile the internal book against custodian records and work the breaks.</p>
        </div>
      </header>

      <main className="app-main">
        <UploadSection onRun={handleRun} loading={loading} />

        {lastRunSummary && (
          <p className="run-note">
            Compared {lastRunSummary.recordsCompared.internal} internal record
            {lastRunSummary.recordsCompared.internal === 1 ? '' : 's'} against{' '}
            {lastRunSummary.recordsCompared.custodian} custodian record
            {lastRunSummary.recordsCompared.custodian === 1 ? '' : 's'} — found{' '}
            {lastRunSummary.exceptionsFound} exception{lastRunSummary.exceptionsFound === 1 ? '' : 's'}.
          </p>
        )}

        {error && <div className="error-banner">{error}</div>}

        <SummaryCards exceptions={exceptions} />

        <Filters filters={filters} onChange={setFilters} accounts={accounts} />

        {pageLoading ? (
          <div className="loading-state">Loading exceptions…</div>
        ) : (
          <ExceptionTable exceptions={filteredExceptions} onStatusChange={handleStatusChange} />
        )}
      </main>
    </div>
  );
}
