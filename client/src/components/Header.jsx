import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePayments } from "../context/PaymentContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { io } from "socket.io-client";
import {
  BellIcon as BellHeroIcon,
  NoSymbolIcon,
  ExclamationCircleIcon,
  StarIcon,
  MegaphoneIcon,
  CreditCardIcon,
  CheckCircleIcon,
  BellSlashIcon,
  ClockIcon,
  XCircleIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import * as familiesApi from "../api/families";
import * as expensesApi from "../api/expenses";
import "./Header.css";
import { API_URL } from "../config";

/* ── Socket singleton ── */
let socket = null;
const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { 
      transports: ["websocket"], 
      autoConnect: false,
      extraHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    });
  }
  return socket;
};

/* ── Icons ── */
const BellIcon = () => (
  <BellHeroIcon width={18} height={18} />
);
const ChevronIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const LeaveGroupIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const WalletIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <circle cx="18" cy="12" r="2" />
  </svg>
);

/* Icone selon type de notification */
const notifIcon = (type) => {
  if (type === "ping")          return BellHeroIcon;
  if (type === "removed")       return NoSymbolIcon;
  if (type === "group_deleted") return ExclamationCircleIcon;
  if (type === "promoted")      return StarIcon;
  if (type === "payment_request") return ClockIcon;
  if (type === "payment_approved") return CheckCircleIcon;
  if (type === "payment_rejected") return XCircleIcon;
  return MegaphoneIcon;
};

/* ============================================================
   HEADER
   ============================================================ */
const Header = ({ title = "Accueil", hasNotif = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [paying,   setPaying]   = useState(null);
  const [confirmingPaymentNotifId, setConfirmingPaymentNotifId] = useState(null);

  // ── Notifications systeme (ping, removed, etc.) ──
  const [sysNotifs,    setSysNotifs]    = useState([]);  // {_id, type, message, read, createdAt}
  const [sysUnread,    setSysUnread]    = useState(0);
  const [notifTab,     setNotifTab]     = useState("payments"); // "payments" | "system"

  const { user, familyId, logout }      = useAuth();
  const { myPendingPayments, markPaid, cancelPayment } = usePayments();
  const { toast, confirm } = useToast();

  const navigate = useNavigate();
  const sysDropdownRef = useRef(null);

  const handleHelpClick = () => {
    window.dispatchEvent(new CustomEvent('trigger-onboarding'));
  };

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await familiesApi.fetchNotifications();
      setSysNotifs(data);
      setSysUnread(data.filter(n => !n.read).length);
    } catch {}
  }, []);

  const markAllAsRead = async () => {
    try {
      await familiesApi.markAllNotificationsRead();
      setSysNotifs(prev => prev.map(n => ({...n, read: true})));
      setSysUnread(0);
    } catch {}
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await familiesApi.deleteNotification(id);
      setSysNotifs(prev => prev.filter(n => n._id !== id));
      setSysUnread(prev => {
        const n = sysNotifs.find(x => x._id === id);
        return n && !n.read ? prev - 1 : prev;
      });
    } catch {}
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
      toast(err.message || "Erreur lors du depart du groupe.", "error");
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  // ── Socket IO (Notifications en temps reel) ──
  useEffect(() => {
    if (!user?._id) return;
    const s = getSocket();
    if (!s.connected) s.connect();

    s.on("connect", () => s.emit("register", user._id));
    
    s.on("notification", (notif) => {
      setSysNotifs(prev => [notif, ...prev]);
      setSysUnread(prev => prev + 1);
      toast(notif.message, "success");
    });

    fetchNotifs();
    return () => {
      s.off("connect");
      s.off("notification");
    };
  }, [user?._id, fetchNotifs, toast]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sysDropdownRef.current && !sysDropdownRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    if (bellOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bellOpen]);

  const handleConfirmPayment = async (notifId, expenseId) => {
    setConfirmingPaymentNotifId(notifId);
    try {
      await markPaid(expenseId);
      // Optionnel : supprimer la notification une fois payee
      // await familiesApi.deleteNotification(notifId);
      // setSysNotifs(prev => prev.filter(n => n._id !== notifId));
      toast("Paiement confirme !", "success");
    } catch (err) {
      toast(err.message, "error");
    }
    setConfirmingPaymentNotifId(null);
  };

  const handlePay = async (id) => {
    setPaying(id);
    try {
      const res = await markPaid(id);
      if (res.success) toast(res.message, "success");
      else toast(res.message, "error");
    } catch (err) {
      toast(err.message, "error");
    }
    setPaying(null);
  };

  const handleCancelPay = async (id) => {
    setPaying(id);
    try {
      const res = await cancelPayment(id);
      if (res.success) toast(res.message, "success");
      else toast(res.message, "error");
    } catch (err) {
      toast(err.message, "error");
    }
    setPaying(null);
  };

  const unreadTotal = myPendingPayments.length + sysUnread;

  return (
    <header className="header">
      <div className="header__left">
        <h2 className="header__title">{title}</h2>
      </div>

      <div className="header__right">
        {/* Help Icon */}
        <button 
          className="header__icon-btn help-btn" 
          onClick={handleHelpClick}
          title="Aide et visite guidée"
          style={{ 
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-soft)",
            transition: "all 0.2s"
          }}
        >
          <QuestionMarkCircleIcon width={20} height={20} />
        </button>

        {/* Notifications */}
        {hasNotif && (
          <div className="header__notif-wrapper" ref={sysDropdownRef}>
            <button className={`header__icon-btn ${bellOpen ? "active" : ""}`} onClick={() => { setBellOpen(!bellOpen); if(!bellOpen) setNotifTab("payments"); }}>
              <BellIcon />
              {unreadTotal > 0 && <span className="header__notif-badge">{unreadTotal}</span>}
            </button>

            {bellOpen && (
              <div className="header__notif-dropdown">
                <div className="header__notif-header">
                  <div className="header__notif-tabs">
                    <button className={`header__notif-tab ${notifTab === "payments" ? "active" : ""}`} onClick={() => setNotifTab("payments")}>
                      Paiements {myPendingPayments.length > 0 && <span className="tab-count">{myPendingPayments.length}</span>}
                    </button>
                    <button className={`header__notif-tab ${notifTab === "system" ? "active" : ""}`} onClick={() => setNotifTab("system")}>
                      Systeme {sysUnread > 0 && <span className="tab-count">{sysUnread}</span>}
                    </button>
                  </div>
                  {notifTab === "system" && sysUnread > 0 && (
                    <button className="btn-mark-read" onClick={markAllAsRead}>Tout lu</button>
                  )}
                </div>

                <div className="header__notif-list custom-scrollbar">
                  {notifTab === "payments" ? (
                    myPendingPayments.length === 0 ? (
                      <div className="header__notif-empty">
                        <div className="empty-icon-circle"><BellSlashIcon width={24} height={24} /></div>
                        <p>Aucun paiement en attente</p>
                      </div>
                    ) : (
                      myPendingPayments.map((p) => (
                        <div key={p.expenseId} className="header__notif-item payment-item">
                          <div className="payment-item__main">
                            <div className="payment-item__icon"><WalletIcon /></div>
                            <div className="payment-item__content">
                              <div className="payment-item__title">{p.title}</div>
                              <div className="payment-item__amount">{p.sharedAmount.toFixed(2)} TND</div>
                            </div>
                          </div>
                          <div className="payment-item__actions">
                            {p.status === "pending" ? (
                              <button className="btn-pay-small" onClick={() => handlePay(p.expenseId)} disabled={paying === p.expenseId}>
                                {paying === p.expenseId ? "..." : "Payer"}
                              </button>
                            ) : (
                              <button className="btn-cancel-small" onClick={() => handleCancelPay(p.expenseId)} disabled={paying === p.expenseId}>
                                {paying === p.expenseId ? "..." : "Annuler"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    sysNotifs.length === 0 ? (
                      <div className="header__notif-empty">
                        <div className="empty-icon-circle"><BellSlashIcon width={24} height={24} /></div>
                        <p>Aucune notification systeme</p>
                      </div>
                    ) : (
                      sysNotifs.map((n) => {
                        const Icon = notifIcon(n.type);
                        return (
                          <div key={n._id} className={`header__notif-item system-item ${!n.read ? "unread" : ""}`}>
                            <div className="system-item__icon"><Icon width={16} height={16} /></div>
                            <div className="system-item__content">
                              <p className="system-item__msg">{n.message}</p>
                              <span className="system-item__time">{new Date(n.createdAt).toLocaleDateString()}</span>
                              
                              {/* Action specifique pour les demandes d'adhesion */}
                              {n.type === "join_request" && (
                                <div style={{ marginTop: 8 }}>
                                  <button 
                                    className="btn-pay-small" 
                                    style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                                    onClick={() => navigate("/group")}
                                  >
                                    Gerer les demandes
                                  </button>
                                </div>
                              )}

                              {/* Action specifique pour les demandes de paiement */}
                              {n.type === "payment_request" && (
                                <div style={{ marginTop: 8 }}>
                                  <button 
                                    className="btn-pay-small" 
                                    style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                                    onClick={() => navigate("/expenses")}
                                  >
                                    Voir la depense
                                  </button>
                                </div>
                              )}
                            </div>
                            <button className="btn-delete-notif" onClick={(e) => deleteNotif(n._id, e)}><TrashIcon width={12} height={12} /></button>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="header__divider" />

        {/* User profile */}
        <div className="header__user" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="header__user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <div className="avatar-placeholder">{user?.name?.charAt(0) || "U"}</div>
            )}
          </div>
          <div className="header__user-info">
            <span className="header__user-name">{user?.name || "Utilisateur"}</span>
            <ChevronIcon open={menuOpen} />
          </div>

          {menuOpen && (
            <div className="header__menu-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="header__menu-header">
                <div className="menu-header__avatar">
                  {user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.charAt(0)}
                </div>
                <div className="menu-header__info">
                  <div className="menu-header__name">{user?.name}</div>
                  <div className="menu-header__email">{user?.email}</div>
                </div>
              </div>

              <div className="header__menu-list">
                <button className="header__menu-item" onClick={() => { setMenuOpen(false); navigate("/settings"); }}>
                   Mon profil
                </button>
                <button className="header__menu-item" onClick={() => { setMenuOpen(false); navigate("/group"); }}>
                   Mes groupes
                </button>
                <div className="menu-divider" />
                <button className="header__menu-item text-red" onClick={handleLeaveGroup}>
                  <LeaveGroupIcon /> Quitter le groupe
                </button>
                <button className="header__menu-item text-red" onClick={handleLogout}>
                  <LogoutIcon /> Se deconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;