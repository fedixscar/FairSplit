import React, { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./History.css";

/* ============================================================
   CONSTANTS
   ============================================================ */
const ROWS_PER_PAGE = 9;

const FILTERS = [
  { key: "month", label: "This Month" },
  { key: "all", label: "All Transactions" },
  { key: "period", label: "Select Period" },
  { key: "people", label: "People" },
];

const CAT_META = {
  food: { icon: "🍔", label: "Food", cls: "cat-food" },
  rent: { icon: "🏠", label: "Rent", cls: "cat-rent" },
  entertainment: {
    icon: "🎬",
    label: "Entertainment",
    cls: "cat-entertainment",
  },
  transport: { icon: "🚗", label: "Transport", cls: "cat-transport" },
  utilities: { icon: "💡", label: "Utilities", cls: "cat-utilities" },
  bills: { icon: "🧾", label: "Bills", cls: "cat-bills" },
  other: { icon: "📦", label: "Other", cls: "cat-other" },
};

/* Sample seed data — will be replaced by real data from your backend */
const SEED_TRANSACTIONS = [
  {
    id: 1,
    date: "2026-02-23",
    time: "18:45",
    title: "Groceries",
    category: "food",
    paidBy: "Sara",
    amount: +150,
    status: "settled",
  },
  {
    id: 2,
    date: "2024-02-20",
    time: "12:00",
    title: "Rent",
    category: "rent",
    paidBy: "Ali",
    amount: -1200,
    status: "pending",
  },
  {
    id: 3,
    date: "2024-02-18",
    time: "20:30",
    title: "Dinner",
    category: "entertainment",
    paidBy: "You",
    amount: +75,
    status: "settled",
  },
  {
    id: 4,
    date: "2024-02-17",
    time: "18:45",
    title: "Rent and damage",
    category: "food",
    paidBy: "You",
    amount: +150,
    status: "pending",
  },
  {
    id: 5,
    date: "2024-02-17",
    time: "18:45",
    title: "Utilities",
    category: "utilities",
    paidBy: "Sara",
    amount: +150,
    status: "settled",
  },
  {
    id: 6,
    date: "2024-02-16",
    time: "12:00",
    title: "Rent",
    category: "rent",
    paidBy: "Ali",
    amount: +75,
    status: "settled",
  },
  {
    id: 7,
    date: "2024-02-16",
    time: "20:30",
    title: "Dinner",
    category: "entertainment",
    paidBy: "You",
    amount: -1200,
    status: "pending",
  },
  {
    id: 8,
    date: "2024-02-16",
    time: "18:45",
    title: "Rent and damage",
    category: "food",
    paidBy: "You",
    amount: +150,
    status: "settled",
  },
  {
    id: 9,
    date: "2024-02-16",
    time: "12:00",
    title: "Utilities",
    category: "rent",
    paidBy: "Ali",
    amount: -300,
    status: "pending",
  },
  {
    id: 10,
    date: "2024-02-14",
    time: "09:00",
    title: "Transport",
    category: "transport",
    paidBy: "You",
    amount: -45,
    status: "settled",
  },
  {
    id: 11,
    date: "2024-02-13",
    time: "14:30",
    title: "Electricity",
    category: "utilities",
    paidBy: "Sara",
    amount: -200,
    status: "pending",
  },
  {
    id: 12,
    date: "2024-02-12",
    time: "19:00",
    title: "Restaurant",
    category: "entertainment",
    paidBy: "Ali",
    amount: +90,
    status: "settled",
  },
  {
    id: 13,
    date: "2024-02-10",
    time: "08:00",
    title: "Metro pass",
    category: "transport",
    paidBy: "You",
    amount: -60,
    status: "settled",
  },
  {
    id: 14,
    date: "2024-02-08",
    time: "17:00",
    title: "Water bill",
    category: "bills",
    paidBy: "Sara",
    amount: -80,
    status: "pending",
  },
  {
    id: 15,
    date: "2024-02-05",
    time: "11:00",
    title: "Supermarket",
    category: "food",
    paidBy: "You",
    amount: +120,
    status: "settled",
  },
  {
    id: 16,
    date: "2024-02-03",
    time: "15:30",
    title: "Cinema tickets",
    category: "entertainment",
    paidBy: "Ali",
    amount: +55,
    status: "settled",
  },
  {
    id: 17,
    date: "2024-02-01",
    time: "10:00",
    title: "Internet bill",
    category: "bills",
    paidBy: "You",
    amount: -75,
    status: "pending",
  },
  {
    id: 18,
    date: "2024-01-28",
    time: "20:00",
    title: "Pizza night",
    category: "food",
    paidBy: "Sara",
    amount: +95,
    status: "settled",
  },
];

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (iso) => {
  const [, m, d] = iso.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
};

const isThisMonth = (iso) => {
  const now = new Date();
  const [y, m] = iso.split("-");
  return (
    parseInt(y, 10) === now.getFullYear() &&
    parseInt(m, 10) === now.getMonth() + 1
  );
};

/* ============================================================
   SVG ICONS
   ============================================================ */
const ChevronLeftIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/* ============================================================
   TRANSACTION ROW
   ============================================================ */
const TransactionRow = ({ tx }) => {
  const cat = CAT_META[tx.category] || CAT_META.other;
  const isPos = tx.amount >= 0;

  return (
    <tr>
      {/* Date & time */}
      <td>
        <div className="td-datetime__date">{formatDate(tx.date)}</div>
        <div className="td-datetime__time">{tx.time}</div>
      </td>

      {/* Icon */}
      <td className="td-icon-cell">
        <div
          className="tx-icon"
          style={{
            background:
              tx.status === "settled"
                ? "rgba(34,197,94,0.1)"
                : "rgba(251,146,60,0.1)",
          }}
        >
          {cat.icon}
        </div>
      </td>

      {/* Title */}
      <td className="td-title">{tx.title}</td>

      {/* Category */}
      <td>
        <span className={`cat-badge ${cat.cls}`}>{cat.label}</span>
      </td>

      {/* Paid by */}
      <td style={{ color: "var(--gray-600)", fontSize: "0.85rem" }}>
        {tx.paidBy}
      </td>

      {/* Amount */}
      <td>
        <span className={`td-amount ${isPos ? "pos" : "neg"}`}>
          {isPos ? "+" : ""}
          {tx.amount.toLocaleString()} TND
        </span>
      </td>

      {/* Status */}
      <td>
        <span className={`status-badge status-${tx.status}`}>
          {tx.status === "settled" ? "✓ Settled" : "⏳ Pending"}
        </span>
      </td>
    </tr>
  );
};

/* ============================================================
   PAGINATION
   ============================================================ */
const Pagination = ({ page, totalPages, onPrev, onNext, onPage }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="history-pagination">
      <button
        className="page-btn"
        onClick={onPrev}
        disabled={page === 1}
        aria-label="Page précédente"
      >
        <ChevronLeftIcon />
      </button>

      {visible.reduce((acc, p, i) => {
        if (i > 0 && p - visible[i - 1] > 1) {
          acc.push(
            <span key={`dots-${p}`} className="page-info">
              …
            </span>,
          );
        }
        acc.push(
          <button
            key={p}
            className={`page-btn ${page === p ? "active" : ""}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>,
        );
        return acc;
      }, [])}

      <button
        className="page-btn"
        onClick={onNext}
        disabled={page === totalPages}
        aria-label="Page suivante"
      >
        <ChevronRightIcon />
      </button>

      <span className="page-info">
        Page {page} of {totalPages}
      </span>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const History = () => {
  const [activeFilter, setActiveFilter] = useState("month");
  const [page, setPage] = useState(1);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");

  /* ── Filtering logic ── */
  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "month":
        return SEED_TRANSACTIONS.filter((t) => isThisMonth(t.date));

      case "period":
        return SEED_TRANSACTIONS.filter((t) => {
          if (periodFrom && t.date < periodFrom) return false;
          if (periodTo && t.date > periodTo) return false;
          return true;
        });

      case "people":
        return peopleSearch
          ? SEED_TRANSACTIONS.filter((t) =>
              t.paidBy.toLowerCase().includes(peopleSearch.toLowerCase()),
            )
          : SEED_TRANSACTIONS;

      default:
        return SEED_TRANSACTIONS;
    }
  }, [activeFilter, periodFrom, periodTo, peopleSearch]);

  /* ── Stats ── */
  const totalIn = filtered
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + t.amount, 0);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const handleFilter = (key) => {
    setActiveFilter(key);
    setPage(1);
  };

  /* ── Render ── */
  return (
    <div className="history-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="history-page__main">
        {/* Header */}
        <Header title="History" userName="Ahan Sara Tirm" hasNotif />

        {/* Content */}
        <div className="history-content">
          {/* ── Filter tabs ── */}
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

          {/* ── Period picker ── */}
          {activeFilter === "period" && (
            <div className="history-period-picker show">
              <input
                className="period-input"
                type="date"
                value={periodFrom}
                onChange={(e) => {
                  setPeriodFrom(e.target.value);
                  setPage(1);
                }}
              />
              <span className="period-sep">→</span>
              <input
                className="period-input"
                type="date"
                value={periodTo}
                onChange={(e) => {
                  setPeriodTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}

          {/* ── Group / People search ── */}
          {activeFilter === "people" && (
            <div className="history-period-picker show">
              <input
                className="period-input"
                type="text"
                placeholder="👤 Rechercher une personne…"
                value={peopleSearch}
                onChange={(e) => {
                  setPeopleSearch(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: 220 }}
              />
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="history-stats">
            <div className="history-stat">
              <div className="history-stat__icon ic-blue">📋</div>
              <div>
                <div className="history-stat__label">Transactions</div>
                <div className="history-stat__value">{filtered.length}</div>
              </div>
            </div>
            <div className="history-stat">
              <div className="history-stat__icon ic-teal">💳</div>
              <div>
                <div className="history-stat__label">Volume</div>
                <div className="history-stat__value">
                  {Math.abs(totalIn + totalOut).toLocaleString()} TND
                </div>
              </div>
            </div>
            <div className="history-stat">
              <div className="history-stat__icon ic-green">📈</div>
              <div>
                <div className="history-stat__label">Crédits</div>
                <div className="history-stat__value green">
                  +{totalIn.toLocaleString()} TND
                </div>
              </div>
            </div>
            <div className="history-stat">
              <div className="history-stat__icon ic-red">📉</div>
              <div>
                <div className="history-stat__label">Débits</div>
                <div className="history-stat__value red">
                  {totalOut.toLocaleString()} TND
                </div>
              </div>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="history-card">
            {filtered.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty__icon">🔍</div>
                <div className="history-empty__title">
                  Aucun résultat trouvé
                </div>
                <p className="history-empty__sub">
                  Essayez un autre filtre ou une autre période.
                </p>
              </div>
            ) : (
              <>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th></th>
                      <th>Title</th>
                      <th>Type / Category</th>
                      <th>Paid by</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                    onPage={(p) => setPage(p)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="fab-history">
        <PlusIcon /> Add Expense
      </button>
    </div>
  );
};

export default History;
