import React, { useState, useRef, useEffect } from "react";
import "./Header.css";

/* ============================================================
   SVG Icons — propres et nets
   ============================================================ */

const BellIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.25s",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const LeaveGroupIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

/* ============================================================
   Header — Reusable Top Bar Component

   Props:
   ─────────────────────────────────────
   title        string   — Page title (ex: "Settings", "Dashboard")
   userName     string   — Génère l'initiale de l'avatar
   hasNotif     bool     — Affiche le point rouge sur la cloche
   onLogout     func     — Action "Se déconnecter"
   onLeaveGroup func     — Action "Quitter le groupe"
   ============================================================ */
const Header = ({
  title = "Dashboard",
  userName = "A",
  hasNotif = true,
  onLogout = () => console.log("Déconnexion…"),
  onLeaveGroup = () => console.log("Quitter le groupe…"),
}) => {
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const initial = userName.charAt(0).toUpperCase();

  /* Ferme le menu si on clique en dehors */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };
  const handleLeave = () => {
    setMenuOpen(false);
    onLeaveGroup();
  };

  return (
    <header className="header">
      {/* ── Titre de la page ── */}
      <h1 className="header__title">{title}</h1>

      {/* ── Actions à droite ── */}
      <div className="header__right">
        {/* Cloche */}
        <div className="header-bell" aria-label="Notifications">
          <BellIcon />
          {hasNotif && <span className="header-bell__dot" />}
        </div>

        {/* Toggle thème */}
        <div className="header-theme">
          <button
            className={`header-theme__btn ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
            aria-label="Mode clair"
          >
            <SunIcon />
          </button>
          <button
            className={`header-theme__btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
            aria-label="Mode sombre"
          >
            <MoonIcon />
          </button>
        </div>

        {/* Avatar + dropdown */}
        <div className="header-avatar-wrap" ref={menuRef}>
          {/* Bouton déclencheur */}
          <button
            className={`header-avatar-btn ${menuOpen ? "header-avatar-btn--open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div className="header-avatar__circle">{initial}</div>
            <ChevronIcon open={menuOpen} />
          </button>

          {/* Menu déroulant */}
          {menuOpen && (
            <div className="header-dropdown">
              {/* Info utilisateur */}
              <div className="header-dropdown__user">
                <div className="header-dropdown__user-avatar">{initial}</div>
                <div>
                  <div className="header-dropdown__user-name">{userName}</div>
                  <div className="header-dropdown__user-role">Membre actif</div>
                </div>
              </div>

              <div className="header-dropdown__divider" />

              {/* Options */}
              <button className="header-dropdown__item" onClick={handleLeave}>
                <span className="header-dropdown__item-icon">
                  <LeaveGroupIcon />
                </span>
                Quitter le groupe
              </button>

              <button
                className="header-dropdown__item header-dropdown__item--danger"
                onClick={handleLogout}
              >
                <span className="header-dropdown__item-icon">
                  <LogoutIcon />
                </span>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
