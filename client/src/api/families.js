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

export const fetchFamilies = async () => {
  const res = await fetch(`${API_BASE}/families`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchFamilyById = async (familyId) => {
  const res = await fetch(`${API_BASE}/families/${familyId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createFamily = async (payload) => {
  const res = await fetch(`${API_BASE}/families`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const joinFamily = async (code) => {
  const res = await fetch(`${API_BASE}/families/join`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
  return handleResponse(res);
};

export const removeMember = async (familyId, memberId) => {
  const res = await fetch(`${API_BASE}/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const updateMemberRole = async (familyId, memberId, role) => {
  const res = await fetch(`${API_BASE}/families/${familyId}/members/${memberId}/role`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
};

export const pingMember = async (familyId, memberId) => {
  const res = await fetch(`${API_BASE}/families/${familyId}/ping/${memberId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const leaveFamily = async (familyId) => {
  const res = await fetch(`${API_BASE}/families/${familyId}/leave`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const deleteFamily = async (familyId) => {
  const res = await fetch(`${API_BASE}/families/${familyId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchNotifications = async () => {
  const res = await fetch(`${API_BASE}/families/notifications`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const markNotificationsRead = async () => {
  const res = await fetch(`${API_BASE}/families/notifications/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const clearNotifications = async () => {
  const res = await fetch(`${API_BASE}/families/notifications`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const handleJoinRequest = async (familyId, userId, action) => {
  const res = await fetch(`${API_BASE}/families/${familyId}/requests/${userId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
};
