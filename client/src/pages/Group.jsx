import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header  from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as familiesApi from "../api/families";
import { fetchBalance } from "../api/expenses";
import {
  HomeIcon,
  PaperAirplaneIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  MapIcon,
  CakeIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClockIcon,
  KeyIcon,
  TrashIcon,
  ArrowPathRoundedSquareIcon,
  PlusIcon as PlusIconSolid,
} from "@heroicons/react/24/outline";
import "./Group.css";
import { getRecurringExpenses, createRecurringExpense, deleteRecurringExpense } from "../api/recurringExpenses";

/* ============================================================
   HELPERS
   ============================================================ */
const initials  = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
const fmtAmount = (val)  => `${val > 0 ? "+" : ""}${val.toFixed(2)} TND`;

const ROLE_LABELS = { chef: "Admin", mod: "Moderateur", member: "Membre" };
const ROLE_COLORS = {
  chef:   { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.3)"  },
  mod:    { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  member: { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
};

/* ============================================================
   MEMBER AVATAR
   ============================================================ */
const MemberAvatar = ({ member, size = 38 }) => {
  const name   = member.user_id?.name   || "?";
  const avatar = member.user_id?.avatar || "";
  if (avatar) return (
    <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(45,212,191,0.25)", flexShrink: 0 }} />
  );
  return <div className="member-avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials(name)}</div>;
};

/* ============================================================
   CREATE GROUP MODAL
   ============================================================ */
const GROUP_ICON_MAP = {
  home: HomeIcon,
  travel: PaperAirplaneIcon,
  study: AcademicCapIcon,
  work: BriefcaseIcon,
  party: SparklesIcon,
  outdoor: MapIcon,
  food: CakeIcon,
  sport: TrophyIcon,
  // legacy emoji compatibility
  "🏠": HomeIcon,
  "✈️": PaperAirplaneIcon,
  "🎓": AcademicCapIcon,
  "💼": BriefcaseIcon,
  "🎉": SparklesIcon,
  "🏕️": MapIcon,
  "🍕": CakeIcon,
  "🏋️": TrophyIcon,
};
const ICONS = ["home", "travel", "study", "work", "party", "outdoor", "food", "sport"];
const renderGroupIcon = (icon, size = 18) => {
  const Icon = GROUP_ICON_MAP[icon] || UserGroupIcon;
  return <Icon width={size} height={size} />;
};

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName]       = useState("");
  const [icon, setIcon]       = useState("home");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await familiesApi.createFamily({ name: name.trim(), icon });
      onCreate(data); onClose();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Creer un groupe</h3>
          <button className="modal__close" onClick={onClose}>x</button>
        </div>
        <div className="form-field">
          <label>Nom du groupe</label>
          <input type="text" placeholder="ex: Appart Lac 2…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-field">
          <label>Icone</label>
          <div className="icon-picker">
            {ICONS.map((ic) => (
              <button key={ic} className={`icon-opt ${icon === ic ? "selected" : ""}`} onClick={() => setIcon(ic)}>
                {renderGroupIcon(ic)}
              </button>
            ))}
          </div>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><ExclamationTriangleIcon width={14} height={14} /> {error}</div>}
        <div className="modal__actions">
          <button className="btn-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-modal-save" onClick={handleCreate} disabled={!name.trim() || loading}>{loading ? "Creation..." : "Creer"}</button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   JOIN GROUP MODAL
   ============================================================ */
const JoinGroupModal = ({ onClose, onJoin }) => {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await familiesApi.joinFamily(code.trim());
      // data contient { message: "..." } car c'est maintenant asynchrone (attente admin)
      onJoin(data); 
      onClose();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Rejoindre un groupe</h3>
          <button className="modal__close" onClick={onClose}>x</button>
        </div>
        <div className="form-field">
          <label>Code du groupe</label>
          <input type="text" placeholder="ex: A1B2C3D4" value={code} onChange={(e) => setCode(e.target.value)} autoFocus style={{ textTransform: "uppercase" }} />
        </div>
        {error && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><ExclamationTriangleIcon width={14} height={14} /> {error}</div>}
        <div className="modal__actions">
          <button className="btn-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-modal-save" onClick={handleJoin} disabled={!code.trim() || loading}>{loading ? "Recherche..." : "Rejoindre"}</button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   GROUP CARD (tabs)
   ============================================================ */
const GroupCard = ({ group, isActive, onSelect }) => (
  <div className={`group-list-card ${isActive ? "group-list-card--active" : ""}`} onClick={() => onSelect(group)}>
    <div className="group-list-card__icon">{renderGroupIcon(group.icon)}</div>
    <div className="group-list-card__info">
      <div className="group-list-card__name">{group.name}</div>
      <div className="group-list-card__meta">{group.members?.length} membres · <strong>{group.code}</strong></div>
    </div>
    {isActive && <div className="group-list-card__dot" />}
  </div>
);

/* ============================================================
   MEMBER ROW — avec actions admin
   ============================================================ */
const MemberRow = ({ m, isYou, myRole, groupId, memberBal, onGroupUpdated, onPing }) => {
  const { toast, confirm } = useToast();
  const memberId   = m.user_id?._id || m.user_id;
  const memberName = m.user_id?.name || "?";
  const memberEmail= m.user_id?.email || "";
  const memberRole = m.role;
  const balClass   = memberBal > 0 ? "pos" : memberBal < 0 ? "neg" : "zero";
  const roleStyle  = ROLE_COLORS[memberRole] || ROLE_COLORS.member;

  const [menuOpen, setMenuOpen]   = useState(false);
  const [loadingAct, setLoadingAct] = useState("");

  const canManage = (myRole === "chef" || myRole === "mod") && !isYou;
  const canDelete = canManage && !(myRole === "mod" && (memberRole === "chef" || memberRole === "mod"));
  const canPromote= myRole === "chef" && memberRole !== "chef";
  const canPing   = canManage;

  const doRemove = async () => {
    const ok = await confirm(`Retirer ${memberName} du groupe ?`);
    if (!ok) return;
    setLoadingAct("remove");
    try {
      const data = await familiesApi.removeMember(groupId, memberId);
      onGroupUpdated(data);
      toast(`${memberName} a ete retire.`, "success");
    } catch (err) { toast(err.message || "Erreur reseau", "error"); }
    setLoadingAct("");
  };

  const doPromote = async (role) => {
    setLoadingAct("promote");
    try {
      const data = await familiesApi.updateMemberRole(groupId, memberId, role);
      onGroupUpdated(data);
      toast("Role mis a jour.", "success");
    } catch (err) { toast(err.message || "Erreur reseau", "error"); }
    setLoadingAct(""); setMenuOpen(false);
  };

  const doPing = async () => {
    setLoadingAct("ping");
    try {
      const data = await familiesApi.pingMember(groupId, memberId);
      onPing(memberName);
    } catch (err) { toast(err.message || "Erreur reseau", "error"); }
    setLoadingAct("");
  };

  return (
    <div className={`member-row ${isYou ? "member-row--you" : ""}`} style={{ position: "relative" }}>
      <MemberAvatar member={m} />
      <div className="member-info">
        <div className="member-name">
          {memberName}
          {isYou && <span className="member-you-tag">Vous</span>}
        </div>
        <div className="member-email">{memberEmail}</div>
      </div>

      {/* Badge rôle */}
      <span style={{
        padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
        background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`,
        marginRight: 8, flexShrink: 0,
      }}>
        {ROLE_LABELS[memberRole] || memberRole}
      </span>

      {/* Balance */}
      <div className={`member-balance ${balClass}`} style={{ marginRight: canManage ? 8 : 0 }}>
        {fmtAmount(memberBal)}
      </div>

      {/* Actions admin */}
      {canManage && (
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.6)",
              cursor: "pointer", fontSize: "1rem",
            }}
          >⋯</button>

          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              style={{
                position: "absolute", right: 0, top: "110%", zIndex: 100,
                background: "#0d1f2d", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "6px 0", minWidth: 180,
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              }}
            >
              {/* Ping */}
              {canPing && (
                <button
                  onClick={() => { setMenuOpen(false); doPing(); }}
                  disabled={loadingAct === "ping"}
                  style={menuItemStyle("#fbbf24")}
                >
                   {loadingAct === "ping" ? "Envoi…" : "Pinger pour payer"}
                </button>
              )}

              {/* Promouvoir mod */}
              {canPromote && memberRole === "member" && (
                <button onClick={() => doPromote("mod")} disabled={loadingAct === "promote"} style={menuItemStyle("#a78bfa")}>
                   Promouvoir Moderateur
                </button>
              )}

              {/* Retrograder member */}
              {canPromote && memberRole === "mod" && (
                <button onClick={() => doPromote("member")} disabled={loadingAct === "promote"} style={menuItemStyle("#94a3b8")}>
                  ↓ Retrograder Membre
                </button>
              )}

              {/* Supprimer */}
              {canDelete && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                  <button onClick={() => { setMenuOpen(false); doRemove(); }} disabled={loadingAct === "remove"} style={menuItemStyle("#f87171")}>
                     {loadingAct === "remove" ? "Suppression…" : "Retirer du groupe"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const menuItemStyle = (color) => ({
  display: "block", width: "100%", padding: "9px 16px",
  background: "none", border: "none", textAlign: "left",
  color, fontSize: "0.84rem", fontWeight: 600, cursor: "pointer",
  transition: "background 0.15s",
});

/* ============================================================
   PENDING REQUESTS SECTION
   ============================================================ */
const PendingRequestsSection = ({ groupId, requests = [], onUpdated }) => {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState(null);

  const handleAction = async (userId, action) => {
    setLoadingId(userId);
    try {
      const { message, family } = await familiesApi.handleJoinRequest(groupId, userId, action);
      toast(message, action === "approve" ? "success" : "warning");
      onUpdated(family);
    } catch (err) {
      toast(err.message, "error");
    }
    setLoadingId(null);
  };

  if (requests.length === 0) return null;

  return (
    <div className="group-card" style={{ marginTop: 24, border: "1px solid rgba(45,212,191,0.2)" }}>
      <div className="group-card__header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ClockIcon width={20} height={20} style={{ color: "var(--accent)" }} />
          <span className="group-card__title">Demandes d'adhesion en attente</span>
        </div>
        <span className="group-card__count">{requests.length} demande(s)</span>
      </div>

      <div className="pending-list" style={{ padding: "0 16px 16px" }}>
        {requests.map((req) => (
          <div key={req.user_id?._id} className="member-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 0" }}>
            <MemberAvatar member={req} />
            <div className="member-info">
              <div className="member-name">{req.user_id?.name || "Inconnu"}</div>
              <div className="member-email">{req.user_id?.email || ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="btn-approve" 
                disabled={loadingId === req.user_id?._id}
                onClick={() => handleAction(req.user_id?._id, "approve")}
              >
                Accepter
              </button>
              <button 
                className="btn-reject" 
                disabled={loadingId === req.user_id?._id}
                onClick={() => handleAction(req.user_id?._id, "reject")}
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .btn-approve {
          background: var(--accent);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-reject {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-approve:disabled, .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

/* ============================================================
   RECURRING EXPENSES SECTION
   ============================================================ */
const RecurringExpensesSection = ({ groupId, isChef, members = [], setBalance }) => {
  const { toast, confirm } = useToast();
  const [recurrings, setRecurrings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRec, setNewRec] = useState({ 
    title: "", 
    amount: "", 
    repeatIntervalDays: 30, 
    category: "other", 
    participants: [],
    startDate: new Date().toISOString().split('T')[0] // Par défaut aujourd'hui
  });

  const fetchRecurrings = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await getRecurringExpenses(groupId);
      setRecurrings(data);
    } catch (err) {
      console.error(err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRecurrings();
  }, [fetchRecurrings]);

  const toggleMember = (userId) => {
    setNewRec(prev => {
      const exists = prev.participants.includes(userId);
      if (exists) {
        return { ...prev, participants: prev.participants.filter(id => id !== userId) };
      } else {
        return { ...prev, participants: [...prev.participants, userId] };
      }
    });
  };

  const handleAdd = async () => {
    if (!newRec.title || !newRec.amount || !newRec.repeatIntervalDays) return;
    setLoading(true);
    try {
      // Préparer les participants pour le backend
      const payload = {
        ...newRec,
        family_id: groupId,
        participants: newRec.participants.map(id => ({ user_id: id }))
      };
      await createRecurringExpense(payload);
      setNewRec({ 
        title: "", amount: "", repeatIntervalDays: 30, category: "other", participants: [],
        startDate: new Date().toISOString().split('T')[0]
      });
      setShowAdd(false);
      fetchRecurrings();
      toast("Depense recurrente creee.", "success");
    } catch (err) {
      toast(err.message, "error");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Supprimer cette depense recurrente ?");
    if (!ok) return;
    try {
      await deleteRecurringExpense(id);
      fetchRecurrings();
      
      // ✅ Recharger le solde du groupe via la prop setBalance passée du parent
      if (setBalance) {
        setBalance();
      }
      
      toast("Depense recurrente et ses occurrences supprimees.", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="group-card" style={{ marginTop: 24 }}>
      <div className="group-card__header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ArrowPathRoundedSquareIcon width={20} height={20} style={{ color: "var(--accent)" }} />
          <span className="group-card__title">Depenses recurrentes</span>
        </div>
        {isChef && !showAdd && (
          <button className="btn-add-rec" onClick={() => setShowAdd(true)}>+ Ajouter</button>
        )}
      </div>

      <div className="recurring-list" style={{ padding: "0 16px 16px" }}>
        {showAdd && (
          <div className="add-rec-form" style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, marginBottom: 16, border: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input 
                type="text" placeholder="Titre (ex: Internet)" 
                value={newRec.title} onChange={e => setNewRec({...newRec, title: e.target.value})}
                className="group-input"
              />
              <input 
                type="number" placeholder="Montant" 
                value={newRec.amount} onChange={e => setNewRec({...newRec, amount: e.target.value})}
                className="group-input"
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" placeholder="Date de debut" 
                  value={newRec.startDate} onChange={e => setNewRec({...newRec, startDate: e.target.value})}
                  className="group-input"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-soft)', marginTop: 4 }}>Date de la premiere depense</div>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" placeholder="Intervalle (jours)" 
                  value={newRec.repeatIntervalDays} onChange={e => setNewRec({...newRec, repeatIntervalDays: e.target.value})}
                  className="group-input"
                  style={{ width: '100%' }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--text-soft)' }}>jours</span>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <select 
                value={newRec.category} onChange={e => setNewRec({...newRec, category: e.target.value})}
                className="group-input"
              >
                <option value="food">Courses</option>
                <option value="rent">Loyer</option>
                <option value="utilities">Charges</option>
                <option value="bills">Factures</option>
                <option value="entertainment">Loisirs</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Selection des participants */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 8, textTransform: 'uppercase' }}>Qui doit payer ?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {members.map(m => {
                  const uid = m.user_id?._id || m.user_id;
                  const selected = newRec.participants.includes(uid);
                  return (
                    <div 
                      key={uid} 
                      onClick={() => toggleMember(uid)}
                      style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', cursor: 'pointer',
                        background: selected ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: selected ? 'white' : 'var(--text-soft)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      {m.user_id?.name || "Utilisateur"}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-save-rec" onClick={handleAdd} disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</button>
              <button className="btn-cancel-rec" onClick={() => setShowAdd(false)}>Annuler</button>
            </div>
          </div>
        )}

        {recurrings.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-soft)", fontSize: "0.85rem" }}>
            Aucune depense recurrente configuree.
          </div>
        )}

        {recurrings.map(rec => (
          <div key={rec._id} className="rec-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{rec.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-soft)" }}>
                Tous les {rec.repeatIntervalDays} jours · {rec.amount} TND
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {rec.participants.map((p, idx) => (
                  <span key={idx} style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-soft)' }}>
                    {p.user_id?.name?.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-soft)", textTransform: "uppercase" }}>Prochain :</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)" }}>
                  {new Date(rec.nextOccurrence).toLocaleDateString()}
                </div>
              </div>
              {isChef && (
                <button onClick={() => handleDelete(rec._id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}>
                  <TrashIcon width={16} height={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .btn-add-rec {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-save-rec {
          flex: 1;
          background: var(--accent);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-cancel-rec {
          background: rgba(255,255,255,0.05);
          color: var(--text-soft);
          border: 1px solid var(--border);
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

/* ============================================================
   GROUP DETAIL
   ============================================================ */
const GroupDetail = ({ group, balance, user, onLeave, onGroupUpdated, onDeleteGroup }) => {
  const { toast, confirm } = useToast();
  const myBalance = balance?.balances?.[user._id]?.net ?? 0;
  const myMember  = group.members?.find((m) => (m.user_id?._id || m.user_id) === user._id);
  const myRole    = myMember?.role || "member";
  const isChef    = myRole === "chef";

  const handlePing = (name) => {
    toast(`Ping envoye a ${name} !`, "warning");
  };

  const handleDeleteGroup = async () => {
    const ok = await confirm(`Supprimer le groupe "${group.name}" ? C'est definitif.`);
    if (!ok) return;
    onDeleteGroup(group._id);
  };

  return (
    <div className="group-body">
      {/* Hero */}
      <div className="group-hero">
        <div className="group-hero__left">
          <div className="group-hero__icon">{renderGroupIcon(group.icon, 24)}</div>
          <div>
            <div className="group-hero__name">{group.name}</div>
            <div className="group-hero__meta">
              <span className="group-hero__badge">Actif</span>
              <span className="group-hero__since">Code : <strong style={{ color: "#2dd4bf" }}>{group.code}</strong></span>
              {/* Badge mon rôle */}
              <span style={{
                padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
                background: ROLE_COLORS[myRole]?.bg, color: ROLE_COLORS[myRole]?.color,
                border: `1px solid ${ROLE_COLORS[myRole]?.border}`, marginLeft: 6,
              }}>
                {ROLE_LABELS[myRole]}
              </span>
            </div>
          </div>
        </div>
        <div className="group-hero__right">
          <div className="group-stat">
            <span className="group-stat__val">{group.members?.length}</span>
            <span className="group-stat__label">Membres</span>
          </div>
          <div className="group-stat-divider" />
          <div className="group-stat">
            <span className="group-stat__val">{balance?.totalFamily?.toFixed(0) || 0}</span>
            <span className="group-stat__label">TND total</span>
          </div>
          <div className="group-stat-divider" />
          {/* Supprimer groupe — chef uniquement */}
          {isChef && (
            <>
              <div className="group-stat">
                <span
                  className="group-stat__val"
                  style={{ cursor: "pointer", color: "#f87171", fontSize: "0.85rem" }}
                  onClick={handleDeleteGroup}
                >
                  <TrashIcon width={14} height={14} style={{ marginRight: 6 }} />
                  Supprimer
                </span>
                <span className="group-stat__label">le groupe</span>
              </div>
              <div className="group-stat-divider" />
            </>
          )}
          <div className="group-stat">
            <span className="group-stat__val" style={{ cursor: "pointer", color: "#f87171", fontSize: "1rem" }} onClick={onLeave}>Quitter</span>
            <span className="group-stat__label">le groupe</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="group-cards-row">
        {/* Pending requests (visible only to chef/mod) */}
        {(myRole === "chef" || myRole === "mod") && (
          <PendingRequestsSection 
            groupId={group._id} 
            requests={group.pending_members} 
            onUpdated={onGroupUpdated} 
          />
        )}

        {/* Members */}
        <div className="group-card" id="group-members">
          <div className="group-card__header">
            <span className="group-card__title">Membres</span>
            <span className="group-card__count">{group.members?.length} personnes</span>
          </div>
          <div className="member-list">
            {group.members?.map((m) => {
              const memberId = m.user_id?._id || m.user_id;
              const isYou    = memberId === user._id;
              const memberBal= balance?.balances?.[memberId]?.net ?? 0;
              return (
                <MemberRow
                  key={memberId}
                  m={m}
                  isYou={isYou}
                  myRole={myRole}
                  groupId={group._id}
                  memberBal={memberBal}
                  onGroupUpdated={onGroupUpdated}
                  onPing={handlePing}
                />
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="group-card" id="group-balance-invite">
            <div className="balance-card">
              <div className="balance-card__title">Ton solde</div>
              <div className="balance-you">
                <div className="balance-you__label">Solde net</div>
                <div className={`balance-you__amount ${myBalance > 0 ? "pos" : myBalance < 0 ? "neg" : "zero"}`}>{fmtAmount(myBalance)}</div>
                <div className="balance-you__sub">
                  {myBalance > 0 ? "On te doit" : myBalance < 0 ? "Tu dois" : "Tu es a jour"}
                </div>
              </div>
              {balance?.balances && (
                <div className="owes-list">
                  {Object.entries(balance.balances).filter(([id]) => id !== user._id).map(([id, b]) => (
                    <div key={id} className="owes-row">
                      <div className={`owes-row__dot ${b.net < 0 ? "green" : "red"}`} />
                      <div className="owes-row__text">
                        {b.net < 0 ? <><strong>{b.name}</strong> te doit</> : <>Tu dois a <strong>{b.name}</strong></>}
                      </div>
                      <div className={`owes-row__amount ${b.net < 0 ? "pos" : "neg"}`}>{Math.abs(b.net).toFixed(2)} TND</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="invite-card">
              <div className="invite-card__title">Code d'invitation</div>
              <div className="invite-input-row">
                <input className="invite-input" type="text" value={group.code} readOnly style={{ letterSpacing: 4, fontWeight: "bold" }} />
                <button className="btn-invite" onClick={() => { navigator.clipboard.writeText(group.code); toast("Code copie !", "success"); }}>Copier</button>
              </div>
              <div className="invite-hint">Partage ce code pour inviter des gens.</div>
            </div>
          </div>
        </div>

        {/* Recurring Expenses (visible to all, manageable by chef) */}
        <div id="group-recurring">
          <RecurringExpensesSection groupId={group._id} isChef={isChef} members={group.members} setBalance={onGroupUpdated} />
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Group = () => {
  const { toast, confirm } = useToast();
  const [groups,      setGroups]      = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [balance,     setBalance]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showJoin,    setShowJoin]    = useState(false);

  const { saveFamilyId, clearFamilyId } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await familiesApi.fetchFamilies();
      setGroups(data);
      const savedId = localStorage.getItem("familyId");
      const first   = data.find((g) => g._id === savedId) || data[0] || null;
      if (first) selectGroup(first);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const selectGroup = useCallback(async (group) => {
    setActiveGroup(group);
    saveFamilyId(group._id);
    try {
      const data = await fetchBalance(group._id);
      setBalance(data);
    } catch { setBalance(null); }
  }, [saveFamilyId]);

  const handleCreate = useCallback((data) => {
    setGroups((prev) => [...prev, data]);
    selectGroup(data);
  }, [selectGroup]);

  const handleJoin = useCallback((data) => {
    // Si c'est un objet groupe (ancien fonctionnement ou deja membre), on l'ajoute
    if (data._id) {
      setGroups((prev) => prev.find((g) => g._id === data._id) ? prev : [...prev, data]);
      selectGroup(data);
    } else if (data.message) {
      // Si c'est juste un message (nouveau fonctionnement avec validation admin)
      toast(data.message, "success");
    }
  }, [selectGroup, toast]);

  const handleLeave = useCallback(async () => {
    if (!activeGroup) return;
    const ok = await confirm("Quitter le groupe ?");
    if (!ok) return;
    try {
      await familiesApi.leaveFamily(activeGroup._id);
      toast("Vous avez quitte le groupe.", "success");
    } catch (err) { toast(err.message || "Erreur reseau", "error"); return; }
    const remaining = groups.filter((g) => g._id !== activeGroup._id);
    setGroups(remaining);
    if (remaining.length > 0) selectGroup(remaining[0]);
    else { clearFamilyId(); setActiveGroup(null); setBalance(null); }
  }, [activeGroup, groups, selectGroup, clearFamilyId, confirm, toast]);

  /* ── Mise a jour du groupe apres action admin ── */
  const handleGroupUpdated = useCallback(async (updatedGroup) => {
    if (updatedGroup) {
      setGroups((prev) => prev.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
      setActiveGroup(updatedGroup);
    }
    // Recharger la balance systematiquement
    if (activeGroup?._id) {
      const b = await fetchBalance(activeGroup._id);
      setBalance(b);
    }
  }, [activeGroup?._id]);

  /* ── Supprimer le groupe ── */
  const handleDeleteGroup = useCallback(async (groupId) => {
    try {
      await familiesApi.deleteFamily(groupId);
      toast("Groupe supprime.", "success");
    } catch (err) { toast(err.message || "Erreur reseau", "error"); return; }
    const remaining = groups.filter((g) => g._id !== groupId);
    setGroups(remaining);
    if (remaining.length > 0) selectGroup(remaining[0]);
    else { clearFamilyId(); setActiveGroup(null); setBalance(null); }
  }, [groups, selectGroup, clearFamilyId, toast]);

  if (loading) return (
    <div className="group-page">
      <Sidebar /><div className="group-page__main"><Header title="Groups" hasNotif />
        <div className="group-content"><div className="no-group"><div className="no-group__icon"><ClockIcon width={24} height={24} /></div><div className="no-group__title">Chargement…</div></div></div>
      </div>
    </div>
  );

  return (
    <div className="group-page">
      <Sidebar />
      <div className="group-page__main">
        <Header title="Groups" hasNotif />
        <div className="group-content">
          <div className="groups-topbar">
            <div className="groups-tabs" id="group-tabs">
              {groups.map((g) => (
                <GroupCard key={g._id} group={g} isActive={activeGroup?._id === g._id} onSelect={selectGroup} />
              ))}
            </div>
            <div className="groups-topbar__actions">
              <button className="btn-create-group btn-create-group--sm" onClick={() => setShowCreate(true)}>+ Creer</button>
              <button className="btn-join-group btn-join-group--sm"     onClick={() => setShowJoin(true)}><KeyIcon width={14} height={14} style={{ marginRight: 6 }} />Rejoindre</button>
            </div>
          </div>

          {activeGroup ? (
            <GroupDetail
              group={activeGroup}
              balance={balance}
              user={user}
              onLeave={handleLeave}
              onGroupUpdated={handleGroupUpdated}
              onDeleteGroup={handleDeleteGroup}
            />
          ) : (
            <div className="no-group">
              <div className="no-group__icon"><UserGroupIcon width={24} height={24} /></div>
              <div className="no-group__title">Vous n'avez pas encore de groupe</div>
              <p className="no-group__sub">Creez un groupe ou rejoignez-en un avec un code.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
                <button className="btn-create-group" onClick={() => setShowCreate(true)}>+ Creer un groupe</button>
                <button className="btn-create-group" onClick={() => setShowJoin(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}><KeyIcon width={14} height={14} style={{ marginRight: 6 }} />Rejoindre</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showJoin   && <JoinGroupModal   onClose={() => setShowJoin(false)}   onJoin={handleJoin}   />}
    </div>
  );
};

export default Group;