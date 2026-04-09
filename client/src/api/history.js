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

/**
 * GET /api/expenses/:familyId/history
 * Controller complet avec .populate("paid_by", "name email")
 *
 * @param {string} familyId   - requis, depuis useAuth().familyId
 * @param {string} startDate  - YYYY-MM-DD (optionnel)
 * @param {string} endDate    - YYYY-MM-DD (optionnel)
 */
export const getHistory = async ({ familyId, startDate, endDate } = {}) => {
  if (!familyId) throw new Error("familyId manquant — rejoins ou cree une famille d'abord");

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate",   endDate);

  const qs = params.toString() ? `?${params}` : "";
  const res = await fetch(`${API_BASE}/expenses/${familyId}/history${qs}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};