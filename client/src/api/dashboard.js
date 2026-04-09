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

export const fetchDashboardData = async (familyId) => {
  const res = await fetch(`${API_BASE}/expenses/dashboard`, {
    headers: {
      ...authHeaders(),
      "x-family-id": familyId,
    },
  });
  return handleResponse(res);
};
