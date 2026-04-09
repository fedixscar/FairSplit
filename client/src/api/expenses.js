import { API_BASE as CONFIG_API_BASE } from "../config";

const API_BASE = CONFIG_API_BASE;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "ngrok-skip-browser-warning": "true",
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Erreur serveur");
  }
  return res.json();
};

export const fetchExpenses = async (familyId) => {
  const res = await fetch(`${API_BASE}/expenses/${familyId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createExpense = async (data) => {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),   // data inclut status, category, date
  });
  return handleResponse(res);
};

export const updateExpense = async (id, data) => {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const markExpenseAsPaid = async (expenseId, userId) => {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}/pay`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  return handleResponse(res);
};

export const cancelExpensePayment = async (expenseId) => {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}/unpay`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchBalance = async (familyId) => {
  const res = await fetch(`${API_BASE}/expenses/${familyId}/balance`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const handlePaymentDecision = async (expenseId, participantId, decision) => {
  const endpoint = `${API_BASE}/expenses/${expenseId}/payments/${participantId}/${decision}`;
  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse(res);
};