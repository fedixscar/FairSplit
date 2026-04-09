// src/components/Sidebar.jsx
import { FaThLarge, FaWallet, FaUsers, FaHistory, FaCog, FaSignOutAlt, FaDoorOpen, FaShoppingBag } from "react-icons/fa";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import * as familiesApi from "../api/families";
import "./Sidebar.css";
import logo from "../assets/logo.png";

const NAV_ITEMS = [
  { icon: FaThLarge,     label: "Accueil",    path: "/dashboard" },
  { icon: FaWallet,      label: "Depenses",   path: "/expenses"  },
  { icon: FaShoppingBag, label: "Courses",    path: "/purchases" },
  { icon: FaUsers,       label: "Groupe",     path: "/group"     },
  { icon: FaHistory,     label: "Historique", path: "/history"   },
  { icon: FaCog,         label: "Reglages",   path: "/settings"  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, confirm } = useToast();

  const familyId = localStorage.getItem("familyId");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleLeaveGroup = async () => {
    const ok = await confirm("Quitter definitivement ce groupe ? Cette action est irreversible.");
    if (!ok) return;
    
    try {
      await familiesApi.leaveFamily(familyId);
      localStorage.removeItem("familyId");
      toast("Groupe quitte avec succes.", "success");
      navigate("/group");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast(err.message || "Erreur lors du depart du groupe.", "error");
    }
  };

  const firstLetter = (user?.name || "U")[0].toUpperCase();

  return (
    <div className="sidebar">
      <div className="sidebar__edge" />

      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">
          <img src={logo} alt="FairSplit logo" />
        </div>
        <h2>FairSplit</h2>
      </div>

      <div className="sidebar__divider" />
      <div className="sidebar__section-label">Navigation</div>

      {/* Menu */}
      <ul className="menu">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          // Utiliser le path pour générer une className unique pour Joyride
          const navClassName = `nav-${path.replace("/", "")}`;
          
          return (
            <li key={path} className={`${isActive ? "active" : ""} ${navClassName}`}>
              <Link
                to={path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Icon className="icon" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}

        {/* Quitter groupe — seulement si dans un groupe */}
        {familyId && (
          <li>
            <button
              onClick={handleLeaveGroup}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                background: "none",
                border: "none",
                color: "inherit",
                padding: "12px 16px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "inherit",
                fontFamily: "inherit",
              }}
            >
              <FaDoorOpen className="icon" />
              <span>Quitter le groupe</span>
            </button>
          </li>
        )}
      </ul>

      <div className="sidebar__divider" style={{ marginTop: "auto" }} />

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(45,212,191,0.3)" }} />
            : <div className="sidebar__avatar">{firstLetter}</div>
          }
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="sidebar__user-name">{user?.name || "Utilisateur"}</div>
            <div className="sidebar__user-role">{familyId ? "Membre" : "Sans groupe"}</div>
          </div>

          <button
            onClick={handleLogout}
            title="Se deconnecter"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ff6b6b"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <FaSignOutAlt size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}