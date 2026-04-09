import { createContext, useContext, useState } from "react";
import { API_BASE } from "../config";
import * as authApi from "../api/auth";
import { fetchFamilies } from "../api/families";
import { fetchProfile } from "../api/settings";

const AuthContext = createContext();

const API = API_BASE;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });

  const [familyId, setFamilyId] = useState(
    localStorage.getItem("familyId") || null
  );

  const _saveSession = async (data) => {
    // 1. Nettoyer toute ancienne session avant de sauvegarder la nouvelle
    localStorage.removeItem("familyId");
    localStorage.removeItem("user");
    localStorage.setItem("token", data.token);

    // 2. Resoudre le familyId — Uniquement depuis les donnees fraiches du backend
    let resolvedFamilyId = data.familyId || null;

    // 3. Si toujours null → appel /api/families en fallback pour voir si l'utilisateur a des groupes
    if (!resolvedFamilyId) {
      try {
        const families = await fetchFamilies();
        if (families && Array.isArray(families) && families.length > 0) {
          resolvedFamilyId = families[0]._id;
        }
      } catch (e) {
        console.warn("_saveSession: impossible de charger les familles", e);
      }
    }

    // 4. Persister familyId
    if (resolvedFamilyId) {
      localStorage.setItem("familyId", resolvedFamilyId);
      setFamilyId(resolvedFamilyId);
    }

    // 5. Recuperer l'avatar depuis /api/settings/profile
    let avatar = data.avatar || "";
    if (!avatar) {
      try {
        const profile = await fetchProfile();
        if (profile) avatar = profile.avatar || "";
      } catch {}
    }

    // 6. Construire et sauvegarder l'objet user avec familyId inclus
    const userObj = {
      _id:      data._id,
      name:     data.name,
      email:    data.email,
      avatar,
      familyId: resolvedFamilyId, // ← inclus dans localStorage["user"] aussi
    };

    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    await _saveSession(data);
    return data;
  };

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    await _saveSession(data);
    return data;
  };

  // ── Appele depuis Settings apres upload/suppression avatar ──
  const updateAvatar = (avatar) => {
    setUser((prev) => {
      const updated = { ...prev, avatar };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const saveFamilyId = (id) => {
    localStorage.setItem("familyId", id);
    setFamilyId(id);
    // Mettre a jour l'objet user aussi pour coherence
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, familyId: id };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const clearFamilyId = () => {
    localStorage.removeItem("familyId");
    setFamilyId(null);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, familyId: null };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("familyId");
    setUser(null);
    setFamilyId(null);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, familyId,
      register, login, logout,
      saveFamilyId, clearFamilyId,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);