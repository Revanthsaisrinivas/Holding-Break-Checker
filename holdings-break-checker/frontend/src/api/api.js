const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

/**
 * Uploads the two CSV files and runs reconciliation on the server.
 * @param {File} internalBookFile
 * @param {File} custodianFile
 */
export async function runReconciliation(internalBookFile, custodianFile) {
  const formData = new FormData();
  formData.append('internalBook', internalBookFile);
  formData.append('custodianFile', custodianFile);

  const response = await fetch(`${API_BASE_URL}/reconcile`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function fetchExceptions() {
  const response = await fetch(`${API_BASE_URL}/exceptions`);
  return handleResponse(response);
}

export async function updateExceptionStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/exceptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}
