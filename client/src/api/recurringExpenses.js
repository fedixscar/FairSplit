import { API_BASE } from "../config";

const getToken = () => localStorage.getItem("token");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
  "ngrok-skip-browser-warning": "true",
});

const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type");
  if (!res.ok) {
    let errorMessage = "Erreur serveur";
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } else {
      const text = await res.text();
      console.error("Non-JSON error response:", text);
    }
    throw new Error(errorMessage);
  }
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
};

export const getRecurringExpenses = async (familyId) => {
  const res = await fetch(`${API_BASE}/expenses/recurring/${familyId}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const createRecurringExpense = async (payload) => {
  const res = await fetch(`${API_BASE}/expenses/recurring`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const deleteRecurringExpense = async (id) => {
  const res = await fetch(`${API_BASE}/expenses/recurring/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res);
};
