import { API_BASE } from "../config";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "ngrok-skip-browser-warning": "true",
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
};

export const fetchPurchases = async (familyId) => {
  const res = await fetch(`${API_BASE}/purchases?familyId=${familyId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createPurchase = async (payload) => {
  const res = await fetch(`${API_BASE}/purchases`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const updatePurchaseStatus = async (id, action) => {
  const res = await fetch(`${API_BASE}/purchases/${id}/${action}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deletePurchase = async (id) => {
  const res = await fetch(`${API_BASE}/purchases/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};
