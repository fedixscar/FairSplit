import React, { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Expenses.css";

/* ============================================================
   CONSTANTS
   ============================================================ */
const CATEGORIES = [
  { value: "food", label: "Food", icon: "🍔" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "bills", label: "Bills", icon: "🧾" },
  { value: "rent", label: "Rent", icon: "🏠" },
  { value: "utilities", label: "Utilities", icon: "💡" },
  { value: "other", label: "Other", icon: "📦" },
];

const FILTERS = ["All", "Pending", "Settled"];

const EMPTY_FORM = {
  description: "",
  category: "food",
  amount: "",
  paidBy: "",
  status: "pending",
  date: new Date().toISOString().split("T")[0],
};

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

const getCategoryMeta = (val) =>
  CATEGORIES.find((c) => c.value === val) || CATEGORIES[5];

/* ============================================================
   SVG ICONS
   ============================================================ */
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

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

/* ============================================================
   ADD EXPENSE MODAL
   ============================================================ */
const AddExpenseModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isValid =
    form.description.trim() &&
    form.amount &&
    parseFloat(form.amount) > 0 &&
    form.paidBy.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      id: Date.now(),
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      paidBy: form.paidBy.trim(),
      amount: parseFloat(form.amount),
      status: form.status,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Ajouter une dépense</h3>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-grid">
          {/* Description */}
          <div className="form-field modal-grid--full">
            <label className="form-field__label">Description</label>
            <input
              className="form-field__input"
              type="text"
              placeholder="ex: Loyer janvier, Courses Carrefour…"
              value={form.description}
              onChange={set("description")}
              autoFocus
            />
          </div>

          {/* Amount */}
          <div className="form-field">
            <label className="form-field__label">Montant (TND)</label>
            <input
              className="form-field__input"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={set("amount")}
            />
          </div>

          {/* Date */}
          <div className="form-field">
            <label className="form-field__label">Date</label>
            <input
              className="form-field__input"
              type="date"
              value={form.date}
              onChange={set("date")}
            />
          </div>

          {/* Category */}
          <div className="form-field">
            <label className="form-field__label">Catégorie</label>
            <select
              className="form-field__select"
              value={form.category}
              onChange={set("category")}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Paid by */}
          <div className="form-field">
            <label className="form-field__label">Payé par</label>
            <input
              className="form-field__input"
              type="text"
              placeholder="ex: Ali, Sara, Moi…"
              value={form.paidBy}
              onChange={set("paidBy")}
            />
          </div>

          {/* Status */}
          <div className="form-field modal-grid--full">
            <label className="form-field__label">Statut</label>
            <select
              className="form-field__select"
              value={form.status}
              onChange={set("status")}
            >
              <option value="pending">⏳ En attente</option>
              <option value="settled">✅ Soldé</option>
            </select>
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn--modal-save"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            + Ajouter la dépense
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   EXPENSE ROW
   ============================================================ */
const ExpenseRow = ({ expense, onDelete }) => {
  const cat = getCategoryMeta(expense.category);
  const isPositive = expense.amount > 0;

  return (
    <tr>
      <td className="td-date">{formatDate(expense.date)}</td>
      <td className="td-desc">{expense.description}</td>
      <td>
        <span className={`category-badge cat-${expense.category}`}>
          {cat.icon} {cat.label}
        </span>
      </td>
      <td style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
        {expense.paidBy}
      </td>
      <td>
        <span className={`td-amount ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "+" : ""}
          {expense.amount.toFixed(2)} TND
        </span>
      </td>
      <td>
        <span className={`status-badge status-${expense.status}`}>
          {expense.status === "settled" ? "✓ Soldé" : "⏳ En attente"}
        </span>
      </td>
      <td>
        <button
          className="btn-delete-row"
          onClick={() => onDelete(expense.id)}
          title="Supprimer"
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    if (filter === "All") return expenses;
    if (filter === "Pending")
      return expenses.filter((e) => e.status === "pending");
    if (filter === "Settled")
      return expenses.filter((e) => e.status === "settled");
    return expenses;
  }, [expenses, filter]);

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + e.amount, 0);
  const totalSettled = expenses
    .filter((e) => e.status === "settled")
    .reduce((s, e) => s + e.amount, 0);

  /* ── Handlers ── */
  const handleAdd = (expense) => setExpenses((prev) => [expense, ...prev]);
  const handleDelete = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  /* ── Render ── */
  return (
    <div className="expenses-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="expenses-page__main">
        {/* Header */}
        <Header title="Expenses" userName="Ahan Sara Tirm" hasNotif />

        {/* Content */}
        <div className="expenses-content">
          {/* Top row */}
          <div className="expenses-toprow">
            <div className="expenses-toprow__left">
              <span className="expenses-toprow__title">Expenses Overview</span>
              <span className="expenses-toprow__subtitle">
                {expenses.length} dépense{expenses.length !== 1 ? "s" : ""} au
                total
              </span>
            </div>

            <div className="expenses-toprow__right">
              {/* Filters */}
              <div className="expenses-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`expenses-filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Add button */}
              <button
                className="btn--add-expense"
                onClick={() => setShowModal(true)}
              >
                <PlusIcon /> Add Expense
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="expenses-stats">
            <div className="expenses-stat-card">
              <div className="expenses-stat-card__icon icon-bg-blue">💳</div>
              <div>
                <div className="expenses-stat-card__label">Total</div>
                <div className="expenses-stat-card__value">
                  {totalAmount.toFixed(2)} TND
                </div>
              </div>
            </div>
            <div className="expenses-stat-card">
              <div className="expenses-stat-card__icon icon-bg-red">⏳</div>
              <div>
                <div className="expenses-stat-card__label">En attente</div>
                <div className="expenses-stat-card__value red">
                  {totalPending.toFixed(2)} TND
                </div>
              </div>
            </div>
            <div className="expenses-stat-card">
              <div className="expenses-stat-card__icon icon-bg-green">✅</div>
              <div>
                <div className="expenses-stat-card__label">Soldé</div>
                <div className="expenses-stat-card__value green">
                  {totalSettled.toFixed(2)} TND
                </div>
              </div>
            </div>
          </div>

          {/* Table card */}
          <div className="expenses-card">
            {filtered.length === 0 ? (
              /* Empty state */
              <div className="expenses-empty">
                <div className="expenses-empty__icon">🧾</div>
                <div className="expenses-empty__title">
                  {filter === "All"
                    ? "Aucune dépense pour l'instant"
                    : `Aucune dépense "${filter}"`}
                </div>
                <p className="expenses-empty__sub">
                  {filter === "All"
                    ? "Commencez par ajouter votre première dépense partagée."
                    : "Changez le filtre ou ajoutez une nouvelle dépense."}
                </p>
                {filter === "All" && (
                  <button
                    className="btn--empty-add"
                    onClick={() => setShowModal(true)}
                  >
                    <PlusIcon /> Ajouter une dépense
                  </button>
                )}
              </div>
            ) : (
              /* Table */
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Paid By</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
};

export default Expenses;
