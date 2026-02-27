import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Settings.css";

/* ============================================================
   DATA
   ============================================================ */
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

const CURRENCY_OPTIONS = [
  { value: "TND", label: "TND — Dinar Tunisien" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — Dollar" },
  { value: "GBP", label: "GBP — Pound" },
];

/* ============================================================
   REUSABLE SUB-COMPONENTS
   ============================================================ */

/** Text / Email / Password input field */
const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  placeholder,
}) => (
  <div className="settings-field">
    <label className="settings-field__label">{label}</label>
    <input
      className="settings-field__input"
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="off"
    />
  </div>
);

/** Select / dropdown field */
const SelectField = ({ label, value, onChange, options }) => (
  <div className="settings-field">
    <label className="settings-field__label">{label}</label>
    <div className="settings-select-wrapper">
      <select className="settings-select" value={value} onChange={onChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="settings-select-wrapper__arrow">▼</span>
    </div>
  </div>
);

/** Toggle switch */
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-switch__track" />
  </label>
);

/** Toggle row (label + switch) */
const ToggleRow = ({ label, checked, onChange }) => (
  <div className="settings-toggle-row">
    <span className="settings-toggle-row__label">{label}</span>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

/* ============================================================
   MODALS
   ============================================================ */

/** Edit Profile Modal */
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Modifier le profil</h3>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <FormField
          label="Nom complet"
          value={form.name}
          onChange={set("name")}
          placeholder="Votre nom"
        />
        <FormField
          label="Adresse Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="nom@exemple.com"
        />

        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="btn--modal-save" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

/** Change Password Modal */
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Changer le mot de passe</h3>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <FormField
          label="Mot de passe actuel"
          type="password"
          value={form.current}
          onChange={set("current")}
          placeholder="••••••••"
        />
        <FormField
          label="Nouveau mot de passe"
          type="password"
          value={form.newPass}
          onChange={set("newPass")}
          placeholder="••••••••"
        />
        <FormField
          label="Confirmer mot de passe"
          type="password"
          value={form.confirm}
          onChange={set("confirm")}
          placeholder="••••••••"
        />

        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="btn--modal-save" onClick={onClose}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   COLUMNS
   ============================================================ */

/** Column 1 — Account & Profile */
const AccountColumn = ({ profile, onEditClick }) => (
  <div className="settings-col">
    <h2 className="settings-col__title">Account &amp; Profile</h2>

    <div className="profile-info">
      <div className="profile-info__avatar">
        {profile.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="profile-info__name">{profile.name}</div>
        <div className="profile-info__handle">{profile.handle}</div>
      </div>
    </div>

    <FormField label="Email" type="email" value={profile.email} disabled />

    <button className="btn--edit-profile" onClick={onEditClick}>
      Edit Profile
    </button>
  </div>
);

/** Column 2 — Preferences */
const PreferencesColumn = ({ prefs, onChange }) => (
  <div className="settings-col">
    <h2 className="settings-col__title">Preferences</h2>

    <SelectField
      label="Language"
      value={prefs.language}
      onChange={(e) => onChange("language", e.target.value)}
      options={LANGUAGE_OPTIONS}
    />

    <SelectField
      label="Currency"
      value={prefs.currency}
      onChange={(e) => onChange("currency", e.target.value)}
      options={CURRENCY_OPTIONS}
    />

    <ToggleRow
      label="Notifications"
      checked={prefs.notifications}
      onChange={() => onChange("notifications", !prefs.notifications)}
    />
  </div>
);

/** Column 3 — Security + Help & Support */
const SecurityColumn = ({
  twoFA,
  onTwoFAChange,
  onChangePasswordClick,
  onLogout,
}) => (
  <div className="settings-col">
    {/* Security */}
    <div className="settings-block">
      <h2 className="settings-block__title">Security</h2>
      <button className="btn--change-password" onClick={onChangePasswordClick}>
        Change Password
      </button>
      <ToggleRow
        label="Two-Factor Authentication"
        checked={twoFA}
        onChange={onTwoFAChange}
      />
    </div>

    {/* Help & Support */}
    <div className="settings-block">
      <h2 className="settings-block__title">Help &amp; Support</h2>
      <button className="btn--logout" onClick={onLogout}>
        Log Out
      </button>
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Settings = () => {
  /* ── State ── */
  const [profile, setProfile] = useState({
    name: "Yassine Jaouadi",
    handle: "Yassine Jaouadi",
    email: "fairslatin@gmail.com",
  });

  const [prefs, setPrefs] = useState({
    language: "en",
    currency: "TND",
    notifications: true,
  });

  const [twoFA, setTwoFA] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  /* ── Handlers ── */
  const handlePrefsChange = (key, value) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  const handleSaveProfile = (updated) =>
    setProfile((prev) => ({ ...prev, ...updated }));

  const handleLogout = () => {
    // 👉 Remplace par ta logique d'auth (ex: navigate("/login"))
    console.log("Déconnexion…");
  };

  /* ── Render ── */
  return (
    <div className="settings-page">
      {/* ── Sidebar (navigation) ── */}
      <Sidebar />

      {/* ── Main area ── */}
      <div className="settings-page__main">
        {/* ── Header (topbar réutilisable) ── */}
        <Header title="Settings" userName={profile.name} hasNotif={true} />

        {/* ── Page content ── */}
        <div className="settings-content">
          <div className="settings-card">
            <AccountColumn
              profile={profile}
              onEditClick={() => setShowEditProfile(true)}
            />

            <PreferencesColumn prefs={prefs} onChange={handlePrefsChange} />

            <SecurityColumn
              twoFA={twoFA}
              onTwoFAChange={() => setTwoFA((v) => !v)}
              onChangePasswordClick={() => setShowChangePassword(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default Settings;
