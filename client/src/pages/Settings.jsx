import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header  from "../components/Header";
import { CameraIcon } from "@heroicons/react/24/outline";
import * as settingsApi from "../api/settings";
import "./Settings.css";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "Francais" },
  { value: "fr", label: "English" },
  { value: "ar", label: "العربية" },
];

const CURRENCY_OPTIONS = [
  { value: "TND", label: "TND — Dinar Tunisien" },
  { value: "EUR", label: "EUR — Euro €" },
  { value: "USD", label: "USD — Dollar $" },
];

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 200;
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ── Sub-components ── */
const FormField = ({ label, type = "text", value, onChange, disabled = false, placeholder }) => (
  <div className="settings-field">
    <label className="settings-field__label">{label}</label>
    <input className="settings-field__input" type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} autoComplete="off" />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="settings-field">
    <label className="settings-field__label">{label}</label>
    <div className="settings-select-wrapper">
      <select className="settings-select" value={value} onChange={onChange}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <span className="settings-select-wrapper__arrow">▼</span>
    </div>
  </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-switch__track" />
  </label>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="settings-toggle-row">
    <span className="settings-toggle-row__label">{label}</span>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

const AvatarUploader = ({ avatar, name, onUpload, onRemove, uploading }) => {
  const fileRef = useRef(null);
  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__preview" onClick={() => !uploading && fileRef.current?.click()} title="Changer la photo">
        {avatar
          ? <img src={avatar} alt="avatar" className="avatar-uploader__img" />
          : <span className="avatar-uploader__initials">{name ? name.charAt(0).toUpperCase() : "?"}</span>
        }
        <div className="avatar-uploader__overlay">
          {uploading ? "…" : <CameraIcon width={16} height={16} />}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
      {avatar && <button className="avatar-uploader__remove" onClick={onRemove} disabled={uploading}>Supprimer</button>}
    </div>
  );
};

const Toast = ({ message, type }) => {
  if (!message) return null;
  const colors = { success: "var(--green)", error: "var(--red)" };
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 999,
      background: "var(--card-2)", border: `1px solid ${colors[type] ?? "var(--border-md)"}`,
      borderRadius: "var(--r-md)", padding: "12px 20px",
      color: colors[type] ?? "var(--text-1)",
      fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "0.85rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "modalIn 0.3s var(--spring) both",
    }}>{message}</div>
  );
};

/* ── Modals ── */
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState(profile.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Le nom est obligatoire"); return; }
    setLoading(true);
    try {
      const updated = await settingsApi.updateProfile({ name });
      onSave(updated); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Modifier le profil</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <FormField label="Nom complet" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Ton nom" />
        {error && <p style={{ color: "var(--red)", fontSize: "0.78rem", marginBottom: 12 }}>{error}</p>}
        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn--modal-save" onClick={handleSave} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (field) => (e) => { setForm((p) => ({ ...p, [field]: e.target.value })); setError(""); };

  const handleSave = async () => {
    if (!form.current || !form.newPass || !form.confirm) { setError("Remplis tous les champs"); return; }
    if (form.newPass !== form.confirm) { setError("Les mots de passe ne sont pas pareils"); return; }
    if (form.newPass.length < 6) { setError("Minimum 6 caracteres"); return; }
    setLoading(true);
    try {
      await settingsApi.updatePassword({ currentPassword: form.current, newPassword: form.newPass });
      onSuccess("Mot de passe change"); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Changer le mot de passe</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <FormField label="Mot de passe actuel"    type="password" value={form.current} onChange={set("current")} placeholder="••••••••" />
        <FormField label="Nouveau mot de passe"   type="password" value={form.newPass} onChange={set("newPass")} placeholder="••••••••" />
        <FormField label="Confirmer le mot de passe" type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" />
        {error && <p style={{ color: "var(--red)", fontSize: "0.78rem", marginBottom: 12 }}>{error}</p>}
        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn--modal-save" onClick={handleSave} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
};

const DeleteAccountModal = ({ onClose, onDeleted }) => {
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Password, 2: Confirmation Text

  const EXPECTED_TEXT = "supprimer mon compte";

  const handleVerifyPassword = async () => {
    if (!password) { setError("Mot de passe requis"); return; }
    setLoading(true);
    try {
      await settingsApi.verifyPassword(password);
      setStep(2);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmationText !== EXPECTED_TEXT) { setError(`Ecris "${EXPECTED_TEXT}"`); return; }
    
    setLoading(true);
    try {
      await settingsApi.deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ borderColor: "var(--red)" }}>
        <div className="modal__header">
          <h3 className="modal__title" style={{ color: "var(--red)" }}>
            {step === 1 ? "Verification de securite" : "Confirmation finale"}
          </h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        
        <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginBottom: 20, lineHeight: 1.5 }}>
          {step === 1 
            ? "Pour continuer, entre ton mot de passe." 
            : `Attention : c'est definitif. Ecris "${EXPECTED_TEXT}" pour confirmer.`
          }
        </p>

        {step === 1 ? (
          <FormField 
            label="Ton mot de passe" 
            type="password" 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); setError(""); }} 
            placeholder="Entre ton mot de passe" 
          />
        ) : (
          <FormField 
            label="Texte de confirmation" 
            value={confirmationText} 
            onChange={(e) => { setConfirmationText(e.target.value); setError(""); }} 
            placeholder={EXPECTED_TEXT} 
          />
        )}

        {error && <p style={{ color: "var(--red)", fontSize: "0.78rem", marginBottom: 12 }}>{error}</p>}
        
        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose} disabled={loading}>Annuler</button>
          {step === 1 ? (
            <button 
              className="btn--modal-save" 
              onClick={handleVerifyPassword} 
              disabled={loading || !password}
            >
              {loading ? "Verification…" : "Continuer"}
            </button>
          ) : (
            <button 
              className="btn--modal-save" 
              style={{ background: "var(--red)", color: "white" }} 
              onClick={handleDelete} 
              disabled={loading || confirmationText !== EXPECTED_TEXT}
            >
              {loading ? "Suppression…" : "Supprimer mon compte"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Columns ── */
const AccountColumn = ({ profile, avatar, onEditClick, onAvatarUpload, onAvatarRemove, avatarUploading, loading }) => (
  <div className="settings-col">
    <h2 className="settings-col__title">Compte &amp; Profil</h2>
    <AvatarUploader avatar={avatar} name={profile.name} onUpload={onAvatarUpload} onRemove={onAvatarRemove} uploading={avatarUploading} />
    <div className="profile-info" style={{ marginTop: 14 }}>
      <div>
        <div className="profile-info__name">{profile.name || "—"}</div>
        <div className="profile-info__handle">{profile.handle || ""}</div>
      </div>
    </div>
    <FormField label="Email" type="email" value={profile.email ?? ""} disabled />
    <button className="btn--edit-profile" onClick={onEditClick} disabled={loading}>{loading ? "Chargement…" : "Modifier le profil"}</button>
  </div>
);

const PreferencesColumn = ({ prefs, onChange }) => (
  <div className="settings-col">
    <h2 className="settings-col__title">Preferences</h2>
    <SelectField label="Langue" value={prefs.language} onChange={(e) => onChange("language", e.target.value)} options={LANGUAGE_OPTIONS} />
    <SelectField label="Devise" value={prefs.currency} onChange={(e) => onChange("currency", e.target.value)} options={CURRENCY_OPTIONS} />
    <ToggleRow label="Notifications" checked={prefs.notifications} onChange={() => onChange("notifications", !prefs.notifications)} />
  </div>
);

const SecurityColumn = ({ onChangePasswordClick, onDeleteAccountClick, onLogout }) => (
  <div className="settings-col">
    <div className="settings-block">
      <h2 className="settings-block__title">Securite</h2>
      <button className="btn--change-password" onClick={onChangePasswordClick}>Changer le mot de passe</button>
      <button 
        className="btn--delete-account" 
        onClick={onDeleteAccountClick}
        style={{ 
          marginTop: 12, 
          background: "rgba(239, 68, 68, 0.1)", 
          color: "var(--red)", 
          border: "1px solid rgba(239, 68, 68, 0.2)",
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          fontSize: "0.82rem",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        Supprimer mon compte
      </button>
    </div>
    <div className="settings-block">
      <h2 className="settings-block__title">Aide &amp; Support</h2>
      <button className="btn--logout" onClick={onLogout}>Se deconnecter</button>
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Settings = () => {
  const { user: authUser, setUser: authSetUser, updateAvatar, logout: authLogout } = useAuth(); // ← updateAvatar pour sync Header/Sidebar

  const [profile, setProfile] = useState({ name: "", handle: "", email: "" });
  const [avatar,  setAvatar]  = useState("");
  const [prefs,   setPrefs]   = useState({ language: "en", currency: "TND", notifications: true });
  const [loading,         setLoading]         = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast,           setToast]           = useState({ message: "", type: "success" });
  const [showEditProfile,    setShowEditProfile]    = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount,  setShowDeleteAccount]  = useState(false);

  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  }, []);

  /* ── Fetch profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await settingsApi.fetchProfile();
        setProfile({ name: data.name ?? "", handle: data.handle ?? "", email: data.email ?? "" });
        setAvatar(data.avatar ?? "");
        setPrefs({
          language:      data.preferences?.language      ?? "en",
          currency:      data.preferences?.currency      ?? "TND",
          notifications: data.preferences?.notifications ?? true,
        });
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  /* ── Upload avatar ── */
  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Fichier non supporte", "error"); return; }
    setAvatarUploading(true);
    try {
      const base64 = await compressImage(file);
      const data   = await settingsApi.uploadAvatar(base64);
      setAvatar(data.avatar);
      updateAvatar(data.avatar); // ← sync Header + Sidebar
      showToast("Photo mise a jour");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }, [showToast, updateAvatar]);

  /* ── Remove avatar ── */
  const handleAvatarRemove = useCallback(async () => {
    setAvatarUploading(true);
    try {
      await settingsApi.deleteAvatar();
      setAvatar("");
      updateAvatar(""); // ← sync Header + Sidebar
      showToast("Photo supprimee");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAvatarUploading(false);
    }
  }, [showToast, updateAvatar]);

  /* ── Preferences ── */
  const handlePrefsChange = useCallback(async (key, value) => {
    const previous = prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsApi.updatePreferences({ [key]: value });
      showToast("Preferences sauvegardees");
    } catch (err) {
      setPrefs((prev) => ({ ...prev, [key]: previous }));
      showToast(err.message, "error");
    }
  }, [prefs, showToast]);

  /* ── Save profile ── */
  const handleSaveProfile = useCallback((updated) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    showToast("Profil mis a jour");
  }, [showToast]);

  /* ── Logout ── */
  const handleLogout = useCallback(() => {
    authLogout();
    window.location.href = "/login";
  }, [authLogout]);

  /* ── Custom cursor ── */
  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my, rafId;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + "px"; dot.style.top = my + "px"; };
    const loop = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.left = rx + "px"; ring.style.top = ry + "px"; rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
    const onHover = (e) => { const over = e.target.closest("button, a, input, select, label, [role='button']"); dot.classList.toggle("is-hovering", !!over); ring.classList.toggle("is-hovering", !!over); };
    const onDown = () => { dot.classList.add("is-clicking");    ring.classList.add("is-clicking"); };
    const onUp   = () => { dot.classList.remove("is-clicking"); ring.classList.remove("is-clicking"); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousemove", onHover);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("mousemove", onMove); window.removeEventListener("mousemove", onHover); window.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-cursor__dot"  ref={dotRef} />
      <div className="settings-cursor__ring" ref={ringRef} />
      <Sidebar />
      <div className="settings-page__main">
        <Header title="Settings" hasNotif={true} />
        <div className="settings-content">
          <div className="settings-card">
            <AccountColumn
              profile={profile} avatar={avatar}
              onEditClick={() => setShowEditProfile(true)}
              onAvatarUpload={handleAvatarUpload}
              onAvatarRemove={handleAvatarRemove}
              avatarUploading={avatarUploading}
              loading={loading}
            />
            <PreferencesColumn 
              prefs={prefs} 
              onChange={handlePrefsChange} 
            />
            <SecurityColumn 
              onChangePasswordClick={() => setShowChangePassword(true)} 
              onDeleteAccountClick={() => setShowDeleteAccount(true)}
              onLogout={handleLogout} 
            />
          </div>
        </div>
      </div>
      {showEditProfile    && <EditProfileModal    profile={profile} onClose={() => setShowEditProfile(false)}    onSave={handleSaveProfile} />}
      {showChangePassword && <ChangePasswordModal                   onClose={() => setShowChangePassword(false)} onSuccess={(msg) => showToast(msg)} />}
      {showDeleteAccount  && <DeleteAccountModal                   onClose={() => setShowDeleteAccount(false)}  onDeleted={() => { showToast("Compte supprime. Au revoir !"); handleLogout(); }} />}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
};

export default Settings;