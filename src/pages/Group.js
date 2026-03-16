import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Group.css";

/* ============================================================
   SEED DATA
   ============================================================ */
const CURRENT_USER_ID = 1;

const GROUP = {
  id: 1,
  name: "Appartement Lac 2",
  icon: "🏠",
  since: "Jan 2024",
  totalExpenses: 3450,
  members: [
    {
      id: 1,
      name: "Ahan Sara",
      email: "ahan@email.com",
      role: "admin",
      balance: +120,
      color: "#0f2027",
    },
    {
      id: 2,
      name: "Ali Trabelsi",
      email: "ali@email.com",
      role: "member",
      balance: -85,
      color: "#1e4d5f",
    },
    {
      id: 3,
      name: "Sara Ben Ali",
      email: "sara@email.com",
      role: "member",
      balance: -35,
      color: "#0d9488",
    },
    {
      id: 4,
      name: "Karim Nasri",
      email: "karim@email.com",
      role: "member",
      balance: +0,
      color: "#7c3aed",
    },
  ],
};

/* ============================================================
   HELPERS
   ============================================================ */
const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmtAmount = (val) => {
  if (val === 0) return "0.00 TND";
  return `${val > 0 ? "+" : ""}${val.toFixed(2)} TND`;
};

/* ============================================================
   CREATE GROUP MODAL
   ============================================================ */
const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const ICONS = ["🏠", "✈️", "🎓", "💼", "🎉", "🏕️", "🍕", "🏋️"];
  const [icon, setIcon] = useState("🏠");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Créer un groupe</h3>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-field">
          <label>Nom du groupe</label>
          <input
            type="text"
            placeholder="ex: Appart Lac 2, Voyage Paris…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label>Icône</label>
          <div className="icon-picker">
            {ICONS.map((ic) => (
              <button
                key={ic}
                className={`icon-opt ${icon === ic ? "selected" : ""}`}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn-modal-cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-modal-save"
            onClick={() => {
              if (name.trim()) {
                onCreate({ name: name.trim(), icon });
                onClose();
              }
            }}
            disabled={!name.trim()}
          >
            Créer le groupe
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Group = () => {
  const [group, setGroup] = useState(GROUP);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const me = group?.members.find((m) => m.id === CURRENT_USER_ID);

  const owes = group?.members
    .filter((m) => m.id !== CURRENT_USER_ID && m.balance !== 0)
    .map((m) => ({
      name: m.name.split(" ")[0],
      amount: -m.balance, // if they owe us, our balance is positive
      owesUs: m.balance < 0,
    }));

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteEmail("");
      setInviteSent(false);
    }, 2500);
  };

  const handleCreate = ({ name, icon }) => {
    setGroup({ ...GROUP, name, icon });
  };

  /* ── No group state ── */
  if (!group) {
    return (
      <div className="group-page">
        <Sidebar />
        <div className="group-page__main">
          <Header title="Groups" userName="Ahan Sara Tirm" hasNotif />
          <div className="group-content">
            <div className="no-group">
              <div className="no-group__icon">👥</div>
              <div className="no-group__title">
                Vous n'avez pas encore de groupe
              </div>
              <p className="no-group__sub">
                Créez un groupe pour partager vos dépenses avec vos
                colocataires, amis ou famille.
              </p>
              <button
                className="btn-create-group"
                onClick={() => setShowCreate(true)}
              >
                + Créer un groupe
              </button>
            </div>
          </div>
        </div>
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </div>
    );
  }

  /* ── Has group ── */
  return (
    <div className="group-page">
      <Sidebar />
      <div className="group-page__main">
        <Header title="Groups" userName="Ahan Sara Tirm" hasNotif />
        <div className="group-content">
          {/* ── Hero card ── */}
          <div className="group-hero">
            <div className="group-hero__left">
              <div className="group-hero__icon">{group.icon}</div>
              <div>
                <div className="group-hero__name">{group.name}</div>
                <div className="group-hero__meta">
                  <span className="group-hero__badge">✓ Actif</span>
                  <span className="group-hero__since">
                    Depuis {group.since}
                  </span>
                </div>
              </div>
            </div>
            <div className="group-hero__right">
              <div className="group-stat">
                <span className="group-stat__val">{group.members.length}</span>
                <span className="group-stat__label">Membres</span>
              </div>
              <div className="group-stat-divider" />
              <div className="group-stat">
                <span className="group-stat__val">
                  {group.totalExpenses.toLocaleString()}
                </span>
                <span className="group-stat__label">TND total</span>
              </div>
              <div className="group-stat-divider" />
              <div className="group-stat">
                <span className="group-stat__val">
                  {group.members.filter((m) => m.balance !== 0).length}
                </span>
                <span className="group-stat__label">En attente</span>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="group-body">
            {/* ── Members list ── */}
            <div className="group-card">
              <div className="group-card__header">
                <span className="group-card__title">Membres</span>
                <span className="group-card__count">
                  {group.members.length} personnes
                </span>
              </div>
              <div className="member-list">
                {group.members.map((m) => {
                  const isYou = m.id === CURRENT_USER_ID;
                  const balClass =
                    m.balance > 0 ? "pos" : m.balance < 0 ? "neg" : "zero";
                  return (
                    <div
                      key={m.id}
                      className={`member-row ${isYou ? "member-row--you" : ""}`}
                    >
                      <div
                        className="member-avatar"
                        style={{ background: m.color }}
                      >
                        {initials(m.name)}
                      </div>
                      <div className="member-info">
                        <div className="member-name">
                          {m.name}
                          {isYou && (
                            <span className="member-you-tag">Vous</span>
                          )}
                        </div>
                        <div className="member-email">{m.email}</div>
                      </div>
                      <span className={`member-role role-${m.role}`}>
                        {m.role === "admin" ? "Admin" : "Membre"}
                      </span>
                      <div className={`member-balance ${balClass}`}>
                        {fmtAmount(m.balance)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div className="group-card">
                {/* Balance summary */}
                <div className="balance-card">
                  <div className="balance-card__title">Votre solde</div>
                  <div className="balance-you">
                    <div className="balance-you__label">Solde net</div>
                    <div
                      className={`balance-you__amount ${me?.balance > 0 ? "pos" : me?.balance < 0 ? "neg" : "zero"}`}
                    >
                      {fmtAmount(me?.balance ?? 0)}
                    </div>
                    <div className="balance-you__sub">
                      {me?.balance > 0
                        ? "Les autres vous doivent"
                        : me?.balance < 0
                          ? "Vous devez aux autres"
                          : "Vous êtes à jour 🎉"}
                    </div>
                  </div>

                  {owes && owes.length > 0 && (
                    <div className="owes-list">
                      {owes.map((o, i) => (
                        <div key={i} className="owes-row">
                          <div
                            className={`owes-row__dot ${o.owesUs ? "green" : "red"}`}
                          />
                          <div className="owes-row__text">
                            {o.owesUs ? (
                              <>
                                <strong>{o.name}</strong> vous doit
                              </>
                            ) : (
                              <>
                                Vous devez à <strong>{o.name}</strong>
                              </>
                            )}
                          </div>
                          <div
                            className={`owes-row__amount ${o.owesUs ? "pos" : "neg"}`}
                          >
                            {Math.abs(o.amount).toFixed(2)} TND
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invite */}
                <div className="invite-card">
                  <div className="invite-card__title">Inviter un membre</div>
                  <div className="invite-input-row">
                    <input
                      className="invite-input"
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    />
                    <button className="btn-invite" onClick={handleInvite}>
                      {inviteSent ? "✓ Envoyé" : "Inviter"}
                    </button>
                  </div>
                  <div className="invite-hint">
                    Un lien d'invitation sera envoyé par email.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default Group;
