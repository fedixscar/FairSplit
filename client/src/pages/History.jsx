import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getHistory } from "../api/history";
import { useAuth } from "../context/AuthContext";
import { usePayments } from "../context/PaymentContext";
import { useToast } from "../context/ToastContext";
import {
  ShoppingBagIcon,
  HomeIcon,
  FilmIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import "./History.css";

/*
   CUSTOM CURSOR HOOK
 */
const useCursor = () => {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const mouse   = useRef({ x: 0, y: 0 });
  const ring    = useRef({ x: 0, y: 0 });
  const raf     = useRef(null);

  useEffect(() => {
    const dot    = dotRef.current;
    const ringEl = ringRef.current;
    if (!dot || !ringEl) return;

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      dot.style.left = `${e.clientX}px`;
      dot.style.top  = `${e.clientY}px`;
      const hovering = e.target.closest("button, a, input, select, [role='button'], label");
      dot.classList.toggle("is-hovering", !!hovering);
      ringEl.classList.toggle("is-hovering", !!hovering);
    };
    const onDown = () => { dot.classList.add("is-clicking");    ringEl.classList.add("is-clicking"); };
    const onUp   = () => { dot.classList.remove("is-clicking"); ringEl.classList.remove("is-clicking"); };
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      ringEl.style.left = `${ring.current.x}px`;
      ringEl.style.top  = `${ring.current.y}px`;
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return { dotRef, ringRef };
};

/* ============================================================
   CONSTANTS
   ============================================================ */
const ROWS_PER_PAGE = 9;

const FILTERS = [
  { key: "month",    label: "Ce mois" },
  { key: "all",      label: "Tout" },
  { key: "period",   label: "Choisir periode" },
  { key: "people",   label: "Personnes" },
  { key: "category", label: "Par categorie" },
];

const CAT_META = {
  food:          { icon: ShoppingBagIcon, label: "Courses",       cls: "cat-food" },
  rent:          { icon: HomeIcon, label: "Loyer",         cls: "cat-rent" },
  entertainment: { icon: FilmIcon, label: "Loisirs",       cls: "cat-entertainment" },
  utilities:     { icon: LightBulbIcon, label: "Charges",       cls: "cat-utilities" },
  bills:         { icon: DocumentTextIcon, label: "Factures",      cls: "cat-bills" },
  other:         { icon: ArchiveBoxIcon, label: "Autre",         cls: "cat-other" },
};

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (iso) => {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
};

const thisMonthRange = () => {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${last}` };
};

/**
 * Normalise un document Expense MongoDB.
 * On extrait la participation de l'utilisateur courant (myShare, myPaid).
 */
const normalise = (item, currentUserId) => {
  const participants = item.participants ?? [];

  // Ma participation dans cette depense
  const myParticipant = participants.find((p) => {
    const pid = p.user_id?._id || p.user_id;
    return pid?.toString() === currentUserId?.toString();
  });

  // Les autres participants (avec qui je partage)
  const others = participants
    .filter((p) => {
      const pid = p.user_id?._id || p.user_id;
      return pid?.toString() !== currentUserId?.toString();
    })
    .map((p) => p.user_id?.name ?? p.user_id ?? "?");

  return {
    id:           item._id,
    date:         item.date ? item.date.slice(0, 10) : "",
    time:         item.createdAt ? item.createdAt.slice(11, 16) : "00:00",
    title:        item.title ?? "—",
    category:     item.category ?? "other",
    paidBy:       item.paid_by?.name ?? item.paid_by ?? "—",
    totalAmount:  Number(item.amount ?? 0),
    // Montant que MOI je dois payer
    myShare:      myParticipant ? Number(myParticipant.shared_amount ?? 0) : 0,
    myPaid:       myParticipant?.paid ?? false,
    myRequestPending: myParticipant?.payment_request_status === "pending",
    myPaymentAt:  myParticipant?.payment_reviewed_at || myParticipant?.payment_requested_at || item.updatedAt,
    // Statut global
    status:       item.status ?? (participants.every((p) => p.paid) ? "settled" : "pending"),
    // Avec qui (les autres participants)
    splitWith:    others,
    // Tous les participants pour le detail
    allParticipants: participants.map((p) => ({
      name:   p.user_id?.name ?? "?",
      amount: Number(p.shared_amount ?? 0),
      paid:   p.paid ?? false,
    })),
    // Est-ce que l'utilisateur courant est implique ?
    isInvolved:   !!myParticipant,
  };
};

/* ============================================================
   CSV EXPORT
   Exporte uniquement les transactions ou l'utilisateur est implique
   ============================================================ */


const escapeCSV = (val) => {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const exportCSV = (transactions, userName) => {
  const headers = [
    "Date",
    "Heure",
    "Description",
    "Categorie",
    "Paye par",
    "Montant total TND",
    "Ma part TND",
    "Statut ma part",
    "Avec qui",
    "Statut global",
  ];

  const rows = transactions.map((tx) => [
    escapeCSV(tx.date),
    escapeCSV(tx.time),
    escapeCSV(tx.title),
    escapeCSV(CAT_META[tx.category]?.label ?? tx.category),
    escapeCSV(tx.paidBy),
    escapeCSV(tx.totalAmount.toFixed(2)),
    escapeCSV(tx.myShare.toFixed(2)),
    escapeCSV(tx.myPaid ? "Paye" : "En attente"),
    escapeCSV(tx.splitWith.join(" / ") || "-"),
    escapeCSV(tx.status === "settled" ? "Deja paye" : "En attente"),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = "historique_" + (userName ?? "moi").replace(/\s+/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ============================================================
   SVG ICONS
   ============================================================ */
const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ============================================================
   TABLE SKELETON
   ============================================================ */
const TableSkeleton = () => (
  <div className="history-table-body skeleton">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="history-row skeleton-row" style={{ opacity: 0.4 }}>
        <div className="td-date"><div className="skeleton-line" style={{ width: 70 }} /></div>
        <div className="td-icon"><div className="skeleton-line" style={{ width: 32, height: 32 }} /></div>
        <div className="td-title"><div className="skeleton-line" style={{ width: 120 }} /></div>
        <div className="td-cat"><div className="skeleton-line" style={{ width: 80 }} /></div>
        <div className="td-people"><div className="skeleton-line" style={{ width: 90 }} /></div>
        <div className="td-my-share"><div className="skeleton-line" style={{ width: 80, marginLeft: 'auto' }} /></div>
        <div className="td-status"><div className="skeleton-line" style={{ width: 80, margin: '0 auto' }} /></div>
        <div className="td-info"><div className="skeleton-line" style={{ width: 28, height: 28 }} /></div>
      </div>
    ))}
  </div>
);

/* ============================================================
   PAGINATION
   ============================================================ */
const Pagination = ({ page, totalPages, onPrev, onNext, onPage }) => {
  const pages   = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="history-pagination">
      <button className="page-btn" onClick={onPrev} disabled={page === 1}>
        <ChevronLeftIcon />
      </button>
      {visible.reduce((acc, p, i) => {
        if (i > 0 && p - visible[i - 1] > 1)
          acc.push(<span key={`d${p}`} className="page-info">…</span>);
        acc.push(
          <button key={p} className={`page-btn ${page === p ? "active" : ""}`}
            onClick={() => onPage(p)}>{p}</button>
        );
        return acc;
      }, [])}
      <button className="page-btn" onClick={onNext} disabled={page === totalPages}>
        <ChevronRightIcon />
      </button>
      <span className="page-info">Page {page} sur {totalPages}</span>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const History = () => {
  const { dotRef, ringRef } = useCursor();
  const { familyId: familyIdCtx, user } = useAuth();
  const { cancelPayment } = usePayments();
  const { toast } = useToast();
  const familyId    = familyIdCtx || localStorage.getItem("familyId");
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  const [activeFilter, setActiveFilter]     = useState("month");
  const [page, setPage]                     = useState(1);
  const [periodFrom, setPeriodFrom]         = useState("");
  const [periodTo, setPeriodTo]             = useState("");
  const [peopleSearch, setPeopleSearch]     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTx, setSelectedTx]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    if (!familyId) {
      setError("Pas de groupe trouve. Rejoins ou cree un groupe d'abord.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = { familyId, userId: currentUser._id };
      if (activeFilter === "month") {
        const range = thisMonthRange();
        params.startDate = range.startDate;
        params.endDate   = range.endDate;
      } else if (activeFilter === "period") {
        if (periodFrom) params.startDate = periodFrom;
        if (periodTo)   params.endDate   = periodTo;
      }

      const raw  = await getHistory(params);
      const list = Array.isArray(raw) ? raw : (raw.history ?? []);

      // ✅ Normaliser ET filtrer : garder uniquement les dépenses où l'user a déjà payé sa part
      const myTx = list
        .map((item) => normalise(item, currentUser._id))
        .filter((tx) => tx.isInvolved && tx.myPaid);

      setTransactions(myTx);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [familyId, currentUser._id, activeFilter, periodFrom, periodTo]);

  useEffect(() => {
    if (activeFilter === "period") return;
    fetchData();
  }, [activeFilter, fetchData]);

  /* ── Filtres côté client ── */
  const filtered = useMemo(() => {
    let result = transactions;
    if (activeFilter === "people" && peopleSearch.trim()) {
      result = result.filter((t) =>
        t.splitWith.some((name) =>
          name.toLowerCase().includes(peopleSearch.toLowerCase())
        ) || t.paidBy.toLowerCase().includes(peopleSearch.toLowerCase())
      );
    }
    if (activeFilter === "category" && selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }
    return result;
  }, [transactions, activeFilter, peopleSearch, selectedCategory]);

  /* ── Stats uniquement sur mes montants ── */
  const totalPaid    = filtered.filter((t) => t.myPaid).reduce((s, t) => s + t.myShare, 0);
  const totalPending = filtered.filter((t) => !t.myPaid).reduce((s, t) => s + t.myShare, 0);
  const totalMy      = filtered.reduce((s, t) => s + t.myShare, 0);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleFilter = (key) => {
    setActiveFilter(key);
    setPage(1);
    if (key !== "period")   { setPeriodFrom(""); setPeriodTo(""); }
    if (key !== "people")   setPeopleSearch("");
    if (key !== "category") setSelectedCategory("");
  };

  const handleCancelTx = async (txId) => {
    const tx = transactions.find(t => t.id === txId);
    if (tx && tx.myPaymentAt) {
      const payDate = new Date(tx.myPaymentAt);
      const now = new Date();
      const diffHrs = (now - payDate) / (1000 * 60 * 60);
      if (diffHrs > 3) {
        toast("Impossible d'annuler après 3 heures.", "error");
        return;
      }
    }

    const res = await cancelPayment(txId);
    if (res.success) {
      toast("Paiement annulé avec succès.", "success");
      fetchData(); // Rafraîchir la liste
      setSelectedTx(null); // Fermer la modale si ouverte
    } else {
      toast(res.message || "Erreur lors de l'annulation.", "error");
    }
  };

  /* ── No group state ── */
  if (!familyId) {
    return (
      <div className="history-page">
        <div ref={dotRef}  className="history-cursor__dot" />
        <div ref={ringRef} className="history-cursor__ring" />
        <Sidebar />
        <div className="history-page__main">
          <Header title="Historique" hasNotif />
          <div className="history-content" style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: "calc(100vh - 120px)" 
          }}>
            <div style={{ 
              textAlign: "center", 
              maxWidth: 400, 
              width: "100%",
              padding: "48px 32px", 
              background: "var(--surface)", 
              borderRadius: 32, 
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 24, 
                background: "var(--accent-soft)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                marginBottom: 28, 
                color: "var(--accent)",
                boxShadow: "0 10px 20px rgba(45,212,191,0.15)"
              }}>
                <UserGroupIcon width={40} height={40} />
              </div>
              <h2 style={{ 
                fontFamily: "var(--font-head)", 
                fontSize: "1.75rem", 
                fontWeight: 800, 
                marginBottom: 16,
                color: "var(--text)"
              }}>Tu n'es dans aucun groupe</h2>
              <p style={{ 
                fontSize: "0.95rem", 
                color: "var(--text-soft)", 
                marginBottom: 36, 
                lineHeight: 1.6,
                maxWidth: "300px"
              }}>Rejoins ou cree un groupe pour voir l'historique.</p>
              <button 
                className="btn-primary" 
                style={{ 
                  width: "100%", 
                  padding: "16px", 
                  borderRadius: 16, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 20px rgba(45,212,191,0.25)"
                }}
                onClick={() => navigate("/group")}
              >
                Gérer mes groupes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div ref={dotRef}  className="history-cursor__dot" />
      <div ref={ringRef} className="history-cursor__ring" />
      <Sidebar />

      <div className="history-page__main">
        <Header title="Historique" hasNotif />

        <div className="history-content">

          {/* ── Top row : titre + bouton export ── */}
          <div className="history-toprow">
            <div>
              <div className="history-toprow__title">Mes transactions</div>
              <div className="history-toprow__sub">
                Seulement les depenses ou tu es dedans · {currentUser.name}
              </div>
            </div>
            <button
              className="btn--export-csv"
              onClick={() => exportCSV(filtered, currentUser.name)}
              disabled={filtered.length === 0}
              title="Exporter en CSV"
            >
              <DownloadIcon /> Exporter CSV
            </button>
          </div>

          {/* Filter tabs */}
          <div className="history-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`history-filter-btn ${activeFilter === f.key ? "active" : ""}`}
                onClick={() => handleFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Period picker */}
          {activeFilter === "period" && (
            <div className="history-period-picker show">
              <input className="period-input" type="date" value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)} />
              <span className="period-sep">→</span>
              <input className="period-input" type="date" value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)} />
              <button
                className="history-filter-btn active"
                style={{ marginLeft: 8 }}
                onClick={fetchData}
                disabled={!periodFrom && !periodTo}
              >
                Rechercher
              </button>
            </div>
          )}

          {/* People search */}
          {activeFilter === "people" && (
            <div className="history-period-picker show">
              <input
                className="period-input"
                type="text"
                placeholder="Rechercher une personne…"
                value={peopleSearch}
                onChange={(e) => { setPeopleSearch(e.target.value); setPage(1); }}
                style={{ minWidth: 220 }}
              />
            </div>
          )}

          {/* Category picker */}
          {activeFilter === "category" && (
            <div className="history-category-picker show">
              {Object.entries(CAT_META).map(([key, meta]) => {
                const count = transactions.filter((t) => t.category === key).length;
                const isActive = selectedCategory === key;
                return (
                  <button
                    key={key}
                    className={`cat-filter-btn ${isActive ? "active" : ""}`}
                    onClick={() => { setSelectedCategory(isActive ? "" : key); setPage(1); }}
                  >
                    <span className="cat-filter-btn__icon"><meta.icon width={14} height={14} /></span>
                    <span className="cat-filter-btn__label">{meta.label}</span>
                    <span className="cat-filter-btn__count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{
              padding: "10px 16px", marginBottom: 12, borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#dc2626", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8,
            }}>
              <ExclamationTriangleIcon width={16} height={16} />
              {error}
              <button onClick={fetchData} style={{
                marginLeft: "auto", fontSize: "0.8rem", padding: "2px 10px",
                borderRadius: 6, border: "1px solid #dc2626",
                background: "transparent", color: "#dc2626", cursor: "pointer",
              }}>
                Réessayer
              </button>
            </div>
          )}

          {/* ── Stats (mes montants uniquement) ── */}
          <div className="history-stats">
            {[
              { icon: ClipboardDocumentListIcon, cls: "ic-blue",  label: "Mes transactions", val: loading ? "…" : filtered.length },
              { icon: CheckCircleIcon, cls: "ic-green", label: "Total payé",        val: loading ? "…" : `${totalPaid.toFixed(2)} TND`,    extra: "green" },
            ].map(({ icon: IconComp, cls, label, val, extra }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-top">
                  <div className={`kpi-icon ${cls}`}><IconComp width={18} height={18} /></div>
                </div>
                <div className="kpi-label">{label}</div>
                <div className={`kpi-value ${extra ?? ""}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Table Container */}
          <div className="history-table-container">
            <div className="history-table-inner">
              {/* Header */}
              <div className="history-table-header">
                <div className="th-date">DATE</div>
                <div className="th-icon">CAT.</div>
                <div className="th-title">DESCRIPTION</div>
                <div className="th-cat">CATEGORIE</div>
                <div className="th-people">AVEC QUI</div>
                <div className="th-my-share">MA PART</div>
                <div className="th-status">STATUT</div>
                <div className="th-info"></div>
              </div>

              {/* Body */}
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <div className="history-table-body">
                  <div className="history-empty">
                    <div className="history-empty__icon"><MagnifyingGlassIcon width={24} height={24} /></div>
                    <div className="history-empty__title">Aucune transaction trouvee</div>
                  </div>
                </div>
              ) : (
                <div className="history-table-body">
                  {pageData.map((tx) => (
                  <div key={tx.id} className={`history-row ${tx.myPaid ? "is-paid" : "is-pending"}`} onClick={() => setSelectedTx(tx)}>
                    {/* 1. Date */}
                    <div className="td-date">
                      <div className="date-main">{formatDate(tx.date)}</div>
                      <div className="date-sub">{tx.time}</div>
                    </div>

                    {/* 2. Icon */}
                    <div className="td-icon">
                      <div className="icon-box" style={{ background: tx.myPaid ? "rgba(34,197,94,0.1)" : "rgba(251,146,60,0.1)" }}>
                        {(() => {
                          const Icon = (CAT_META[tx.category] || CAT_META.other).icon;
                          return <Icon width={14} height={14} />;
                        })()}
                      </div>
                    </div>

                    {/* 3. Title */}
                    <div className="td-title">
                      <div className="title-text">{tx.title}</div>
                      {tx.title?.includes("(Auto)") && <span className="auto-badge">AUTO</span>}
                    </div>

                    {/* 4. Category */}
                    <div className="td-cat">
                      <span className={`cat-badge ${(CAT_META[tx.category] || CAT_META.other).cls}`}>
                        {(CAT_META[tx.category] || CAT_META.other).label}
                      </span>
                    </div>

                    {/* 5. People */}
                    <div className="td-people">
                      {tx.splitWith.length > 0 ? (
                        <div className="people-chips">
                          {tx.splitWith.slice(0, 2).map(n => <span key={n} className="p-chip">{n.split(" ")[0]}</span>)}
                          {tx.splitWith.length > 2 && <span className="p-chip more">+{tx.splitWith.length - 2}</span>}
                        </div>
                      ) : <span className="no-p">—</span>}
                    </div>

                    {/* 6. Amount */}
                    <div className="td-my-share">
                      <div className="amount-val">{tx.myShare.toFixed(2)} TND</div>
                      <div className="amount-total">Total: {tx.totalAmount.toFixed(2)}</div>
                    </div>

                    {/* 7. Status */}
                    <div className="td-status">
                      <span className={`status-badge ${tx.myPaid ? "status-settled" : "status-pending"}`}>
                        {tx.myPaid ? "Paye" : "A payer"}
                      </span>
                    </div>

                    {/* 8. Action */}
                    <div className="td-info">
                      {(tx.myPaid || tx.myRequestPending) && (
                        (() => {
                          const payDate = new Date(tx.myPaymentAt || tx.date);
                          const diffHrs = (new Date() - payDate) / (1000 * 60 * 60);
                          if (diffHrs <= 3) {
                            return (
                              <button 
                                className="btn-cancel-tx"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelTx(tx.id);
                                }}
                              >
                                Annuler
                              </button>
                            );
                          }
                          return null;
                        })()
                      )}
                      <button className="info-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {!loading && totalPages > 1 && (
              <Pagination
                page={safePage} totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                onPage={setPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedTx && (
        <div className="tx-modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tx-modal__header">
              <div className="tx-modal__icon" style={{
                background: selectedTx.myPaid ? "rgba(34,197,94,0.1)" : "rgba(251,146,60,0.1)",
              }}>
                {(() => {
                  const ModalIcon = (CAT_META[selectedTx.category] || CAT_META.other).icon;
                  return <ModalIcon width={20} height={20} />;
                })()}
              </div>
              <div>
                <h3 className="tx-modal__title">{selectedTx.title}</h3>
                <span className="tx-modal__date">{formatDate(selectedTx.date)} · {selectedTx.time}</span>
              </div>
              <button className="tx-modal__close" onClick={() => setSelectedTx(null)}>✕</button>
            </div>

            <div className="tx-modal__body">
              <div className="tx-modal__row">
                <span className="tx-modal__label">Categorie</span>
                <span className={`cat-badge ${(CAT_META[selectedTx.category] || CAT_META.other).cls}`}>
                  {(CAT_META[selectedTx.category] || CAT_META.other).label}
                </span>
              </div>
              <div className="tx-modal__row">
                <span className="tx-modal__label">Paye par</span>
                <span className="tx-modal__val">{selectedTx.paidBy}</span>
              </div>
              <div className="tx-modal__row">
                <span className="tx-modal__label">Montant total</span>
                <span className="tx-modal__val" style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>
                  {selectedTx.totalAmount.toFixed(2)} TND
                </span>
              </div>
              <div className="tx-modal__row" style={{ background: "rgba(45,212,191,0.05)", borderRadius: 8, padding: "10px 0" }}>
                <span className="tx-modal__label" style={{ color: "#2dd4bf" }}>Ma part</span>
                <span className="tx-modal__val" style={{
                  color: "#2dd4bf", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: "1.1rem",
                }}>
                  {selectedTx.myShare.toFixed(2)} TND
                </span>
              </div>
              <div className="tx-modal__row">
                <span className="tx-modal__label">Statut de ma part</span>
                <span className={`status-badge ${selectedTx.myPaid ? "status-settled" : "status-pending"}`}>
                  {selectedTx.myPaid ? "Paye" : "A payer"}
                </span>
              </div>

              {/* Detail de tous les participants */}
              <div className="tx-modal__row" style={{ alignItems: "flex-start" }}>
                <span className="tx-modal__label">Tous les participants</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  {selectedTx.allParticipants.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{p.name}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
                        {p.amount.toFixed(2)} TND
                      </span>
                      <span style={{
                        fontSize: "0.68rem", padding: "1px 6px", borderRadius: 20, fontWeight: 700,
                        background: p.paid ? "rgba(52,211,153,0.1)" : "rgba(251,146,60,0.1)",
                        color: p.paid ? "#34d399" : "#fb923c",
                        border: `1px solid ${p.paid ? "rgba(52,211,153,0.2)" : "rgba(251,146,60,0.2)"}`,
                      }}>
                        {p.paid ? "Paye" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton Annuler (si applicable) */}
              {(selectedTx.myPaid || selectedTx.myRequestPending) && (
                (() => {
                  const payDate = new Date(selectedTx.myPaymentAt || selectedTx.date);
                  const diffHrs = (new Date() - payDate) / (1000 * 60 * 60);
                  if (diffHrs <= 3) {
                    return (
                      <button 
                        className="btn-cancel-tx-large"
                        onClick={() => handleCancelTx(selectedTx.id)}
                      >
                        <ExclamationTriangleIcon width={18} height={18} />
                        Annuler mon paiement
                      </button>
                    );
                  }
                  return (
                    <div style={{ marginTop: 20, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                      L'annulation n'est plus possible (delai de 3h depasse).
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
