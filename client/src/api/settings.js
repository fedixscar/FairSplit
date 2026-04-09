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
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur serveur");
    return data;
  }
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return null;
};

export const fetchProfile = async () => {
  const res = await fetch(`${API_BASE}/settings/profile`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const updateProfile = async (payload) => {
  const res = await fetch(`${API_BASE}/settings/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const updatePassword = async (payload) => {
  const res = await fetch(`${API_BASE}/settings/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const updatePreferences = async (payload) => {
  const res = await fetch(`${API_BASE}/settings/preferences`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const uploadAvatar = async (base64) => {
  const res = await fetch(`${API_BASE}/settings/avatar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ avatar: base64 }),
  });
  return handleResponse(res);
};

export const deleteAvatar = async () => {
  const res = await fetch(`${API_BASE}/settings/avatar`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const verifyPassword = async (password) => {
  const res = await fetch(`${API_BASE}/settings/verify-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
};

export const deleteAccount = async (password) => {
  const res = await fetch(`${API_BASE}/settings/account`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
};
