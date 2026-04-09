import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { API_BASE } from "../config";
import { fetchExpenses, markExpenseAsPaid, cancelExpensePayment, createExpense, deleteExpense, updateExpense } from "../api/expenses";

const API = API_BASE;
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
  "ngrok-skip-browser-warning": "true",
});

const PaymentContext = createContext({
  expenses:          [],
  loading:           false,
  myPendingPayments: [],
  loadExpenses:      async () => {},
  markPaid:          async () => ({ success: false, message: "" }),
  cancelPayment:     async () => ({ success: false, message: "" }),
  addExpense:        async () => null,
  editExpense:       async () => null,
  removeExpense:     async () => {},
});

export const PaymentProvider = ({ children }) => {
  const { user, familyId } = useAuth();

  /* ── Liste complete des depenses du groupe ── */
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* ── Charger toutes les depenses ── */
  const loadExpenses = useCallback(async () => {
    if (!familyId || !user?._id) return;
    setLoading(true);
    try {
      const data = await fetchExpenses(familyId);
      setExpenses(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [familyId, user?._id]);

  /* Charger au montage + quand familyId/user change */
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  /* ── Mes participations non payees (utilisees par Header et Expenses) ── */
  const myPendingPayments = expenses
    .filter((e) => e.status !== "settled")
    .reduce((acc, e) => {
      const myP = (e.participants || []).find((p) => {
        const pid = p.user_id?._id || p.user_id;
        return (
          pid === user?._id &&
          !p.paid &&
          p.payment_request_status !== "pending"
        );
      });
      if (myP) {
        acc.push({ 
          expenseId:    e._id,
          title:        e.title || "Depense",
          sharedAmount: myP.shared_amount || 0,
          date:         e.date,
        });
      }
      return acc;
    }, []);

  /* ── Marquer ma part comme payee ── */
  const markPaid = useCallback(async (expenseId) => {
    if (!user?._id) return { success: false, message: "Utilisateur non connecte." };
    try {
      const data = await markExpenseAsPaid(expenseId, user._id);

      if (data) {
        const updatedExpense = data.expense || data;
        if (updatedExpense?._id) {
          setExpenses((prev) =>
            prev.map((e) => (e._id === expenseId ? updatedExpense : e))
          );
        } else {
          await loadExpenses();
        }
        return {
          success: true,
          awaitingApproval: Boolean(data.awaitingApproval),
          message:
            data.message ||
            (data.awaitingApproval
              ? "Demande envoyee a un admin."
              : "Paiement valide."),
        };
      }
      return {
        success: false,
        message: "Impossible d'envoyer la demande de paiement.",
      };
    } catch (err) {
      return { success: false, message: err.message || "Erreur reseau." };
    }
  }, [user?._id, loadExpenses]);

  /* ── Annuler une demande ou un paiement ── */
  const cancelPayment = useCallback(async (expenseId) => {
    if (!user?._id) return { success: false, message: "Utilisateur non connecte." };
    try {
      const data = await cancelExpensePayment(expenseId, user._id);
      if (data) {
        const updatedExpense = data.expense || data;
        if (updatedExpense?._id) {
          setExpenses((prev) =>
            prev.map((e) => (e._id === expenseId ? updatedExpense : e))
          );
        } else {
          await loadExpenses();
        }
        return { success: true, message: data.message || "Paiement annule." };
      }
      return { success: false, message: "Impossible d'annuler le paiement." };
    } catch (err) { 
      return { success: false, message: err.message || "Erreur reseau." };
    }
  }, [user?._id, loadExpenses]);

  /* ── Ajouter une depense ── */
  const addExpense = useCallback(async (expenseData) => {
    try {
      const data = await createExpense(expenseData);
      setExpenses((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  /* ── Modifier une depense ── */
  const editExpense = useCallback(async (id, updateData) => {
    try {
      const data = await updateExpense(id, updateData);
      setExpenses((prev) => prev.map((e) => (e._id === id ? data : e)));
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  /* ── Supprimer une depense ── */
  const removeExpense = useCallback(async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
    } catch (err) {
      throw err;
    }
  }, []);

  return (
    <PaymentContext.Provider value={{
      expenses,
      loading,
      myPendingPayments,
      loadExpenses,
      markPaid,
      cancelPayment,
      addExpense,
      editExpense,
      removeExpense,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => useContext(PaymentContext);
