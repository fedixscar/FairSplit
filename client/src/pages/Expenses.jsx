import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePayments } from "../context/PaymentContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import * as expensesApi from "../api/expenses";
import * as familiesApi from "../api/families";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ShoppingBagIcon,
  DocumentTextIcon,
  HomeIcon,
  LightBulbIcon,
  FilmIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import "./Expenses.css";

/* 
   CONSTANTS
*/
const CATEGORIES = [
  { value: "food",          label: "Courses",       icon: ShoppingBagIcon },
  { value: "bills",         label: "Factures",      icon: DocumentTextIcon },
  { value: "rent",          label: "Loyer",         icon: HomeIcon },
  { value: "utilities",     label: "Charges",       icon: LightBulbIcon },
  { value: "entertainment", label: "Loisirs",       icon: FilmIcon },
  { value: "other",         label: "Autre",         icon: ArchiveBoxIcon },
];

const FILTERS = ["Tout", "En attente", "Deja paye"];

const EMPTY_FORM = {
  description: "",
  category:    "food",
  amount:      "",
  splitWith:   [],
  date:        new Date().toISOString().split("T")[0],
  receipt:     "",
};

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
};
const getCategoryMeta = (val) =>
  CATEGORIES.find((c) => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

const generateOfficialReceipt = (expense) => {
  // Format 80mm (largeur ticket standard) x variable height
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 180] // Hauteur augmentee pour plus d'infos
  });

  const W = 80;
  let y = 10;
  const cat = getCategoryMeta(expense.category);

  // Font setup
  doc.setFont("courier", "bold");
  
  // Header - Logo "FAIR SPLIT"
  doc.setFontSize(14);
  doc.text("FAIR SPLIT", W/2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("GESTION DE DEPENSES", W/2, y, { align: "center" });
  y += 4;
  doc.text("-----------------------------", W/2, y, { align: "center" });
  y += 6;

  // Expense Title (Like shop name)
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text((expense.title || "DEPENSE").toUpperCase(), W/2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text(`CATEGORIE: ${cat.label.toUpperCase()}`, W/2, y, { align: "center" });
  y += 4;
  doc.text(`PAYE PAR: ${(expense.paid_by?.name || "MEMBRE").toUpperCase()}`, W/2, y, { align: "center" });
  y += 8;

  // Date
  const d = new Date(expense.date);
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
  const dateStr = `${days[d.getDay()]}  ${d.getDate()}  ${months[d.getMonth()]}  ${d.getFullYear()}`;
  doc.text(dateStr, W/2, y, { align: "center" });
  y += 10;

  // Ticket Number
  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.text(`Ticket      ${expense.ticket_id || expense._id.slice(-6).toUpperCase()}`, W/2, y, { align: "center" });
  y += 8;

  // Separator
  doc.setFontSize(8);
  doc.text("-".repeat(45), W/2, y, { align: "center" });
  y += 4;

  // Columns Header
  doc.setFont("courier", "bold");
  doc.text("Qte", 5, y);
  doc.text("Articles", 15, y);
  doc.text("Pu", 55, y, { align: "right" });
  doc.text("Mnt", 75, y, { align: "right" });
  y += 4;
  doc.text("-".repeat(45), W/2, y, { align: "center" });
  y += 6;

  // Main Item (The expense itself)
  doc.setFont("courier", "normal");
  doc.text("1", 5, y);
  doc.text((expense.title || "DEPENSE").toUpperCase().slice(0, 15), 15, y);
  doc.text(Number(expense.amount).toFixed(2), 55, y, { align: "right" });
  doc.text(Number(expense.amount).toFixed(2), 75, y, { align: "right" });
  y += 8;

  // Split details header
  doc.setFont("courier", "bold");
  doc.text("REPARTITION DU PARTAGE", 5, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.text("-".repeat(25), 5, y);
  y += 4;

  // Participants (Details of the split)
  (expense.participants || []).forEach(p => {
    const name = (p.user_id?.name || "Membre").toUpperCase();
    const amount = p.shared_amount || 0;
    const status = p.paid ? "PAYE" : "NON PAYE";
    
    doc.text(`> ${name.slice(0, 15)}`, 5, y);
    doc.text(status, 50, y, { align: "right" });
    doc.text(amount.toFixed(2), 75, y, { align: "right" });
    y += 5;
  });

  y += 2;
  doc.text("=".repeat(22), 75, y, { align: "right" });
  y += 6;

  // Payment method (Mode de paiement)
  doc.setFontSize(11);
  doc.setFont("courier", "bold");
  doc.text("FAIRSPLIT", 5, y);
  doc.text(`${Number(expense.amount).toFixed(2)}`, 75, y, { align: "right" });
  y += 8;

  // Total
  doc.setFontSize(10);
  doc.text("-".repeat(45), W/2, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.text("Montant Total :", 5, y);
  doc.setFontSize(13);
  doc.text(`${Number(expense.amount).toFixed(2)}`, 75, y, { align: "right" });
  y += 10;

  // Tax Table (Simulated for thermal style)
  /*
  doc.setFontSize(7);
  doc.setFont("courier", "bold");
  doc.text("ht", 45, y, { align: "right" });
  doc.text("taxe", 60, y, { align: "right" });
  doc.text("ttc", 75, y, { align: "right" });
  y += 4;
  
  doc.setFont("courier", "normal");
  doc.text("Partage 0%", 20, y);
  doc.text(`${Number(expense.amount).toFixed(2)}`, 45, y, { align: "right" });
  doc.text("0.00", 60, y, { align: "right" });
  doc.text(`${Number(expense.amount).toFixed(2)}`, 75, y, { align: "right" });
  y += 4;
  
  doc.setFont("courier", "bold");
  doc.text("total", 20, y);
  doc.text(`${Number(expense.amount).toFixed(2)}`, 45, y, { align: "right" });
  doc.text("0.00", 60, y, { align: "right" });
  doc.text(`${Number(expense.amount).toFixed(2)}`, 75, y, { align: "right" });
  y += 10;
  */

  // Footer
  doc.setFontSize(7);
  doc.text("Prix Nets-Service compris MERCI DE VOTRE VISITE", W/2, y, { align: "center" });
  y += 4;
  doc.text("FAIRSPLIT - VOTRE ALLIE DEPENSES", W/2, y, { align: "center" });
  y += 4;
  doc.text(`GENERE LE ${new Date().toLocaleString('fr-FR').toUpperCase()}`, W/2, y, { align: "center" });

  doc.save(`Ticket_FairSplit_${expense.title.replace(/\s+/g, '_')}.pdf`);
};

const compressImage = (file, maxSize = 1200) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio  = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.80));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ============================================================
   ICONS
   ============================================================ */
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const ChevronIcon = ({ up }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round">
    <polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#07111c" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ReceiptIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>
);

/* ============================================================
   EXPENSE DETAIL MODAL
   ============================================================ */
const ExpenseDetailModal = ({ expense, currentUserId, myRole, onClose, onMarkPaid, onCancelPayment, onDelete, onValidatePayment, onUpdateReceipt }) => {
  const { toast } = useToast();
  const cat = getCategoryMeta(expense.category);
  const [uploading, setUploading] = useState(false);
  const receiptRef = useRef(null);

  const myParticipant = (expense.participants || []).find((p) => {
    const pid = p.user_id?._id || p.user_id;
    return String(pid) === String(currentUserId);
  });

  const isAdmin = myRole === "chef" || myRole === "mod";
  const myShare  = myParticipant?.shared_amount ?? null;
  const myPaid   = myParticipant?.paid ?? false;
  const myRequestPending = myParticipant?.payment_request_status === "pending";
  const myPaymentAt = myParticipant?.payment_reviewed_at || myParticipant?.payment_requested_at || expense.updatedAt;

  const isMyTurn = !!myParticipant && !myPaid && !myRequestPending && expense.status !== "settled" && String(expense.paid_by?._id || expense.paid_by) !== String(currentUserId);
  
  // Restriction 3h
  const payDate = new Date(myPaymentAt);
  const diffHrs = (new Date() - payDate) / (1000 * 60 * 60);
  const canCancelPayment = !!myParticipant && (myPaid || myRequestPending) && diffHrs <= 3;

  const allPaid  = (expense.participants || []).length > 0 && (expense.participants || []).every((p) => p.paid);

  const statusLabel = (allPaid || expense.status === "settled")
    ? { text: "Deja paye",      color: "#34d399", bg: "rgba(52,211,153,0.1)"  }
    : myRequestPending
    ? { text: "En attente", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" }
    : isMyTurn
    ? { text: "A payer",   color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  }
    : { text: "En attente", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    
    if (!isImage && !isPdf) {
      toast("Seulement des images ou PDF", "error");
      return;
    }
    
    setUploading(true);
    try {
      let result;
      if (isImage) {
        result = await compressImage(file, 1200);
      } else {
        // Pour PDF, on convertit juste en base64 sans compression
        result = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      await onUpdateReceipt(expense._id, { receipt: result });
      toast("Justificatif enregistre !", "success");
    } catch (err) {
      toast("Erreur d'enregistrement", "error");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1f2d",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          animation: "modalIn 0.25s ease both",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky", top: 0, background: "#0d1f2d", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem",
            }}>
              <cat.icon width={20} height={20} />
            </div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "rgba(255,255,255,0.95)" }}>
                {expense.title || "—"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {cat.label} · {formatDate(expense.date)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, width: 32, height: 32, color: "rgba(255,255,255,0.5)",
            cursor: "pointer", fontSize: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Montant + statut */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Montant total</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "2rem", color: "#2dd4bf" }}>
                {Number(expense.amount).toFixed(2)} TND
              </div>
              {myShare !== null && (
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  Ma part : <strong style={{ color: "rgba(255,255,255,0.7)" }}>{myShare.toFixed(2)} TND</strong>
                </div>
              )}
            </div>
            <div style={{
              padding: "7px 16px", borderRadius: 20,
              background: statusLabel.bg, color: statusLabel.color,
              fontWeight: 700, fontSize: "0.82rem",
              border: `1px solid ${statusLabel.color}44`,
            }}>
              {statusLabel.text}
            </div>
          </div>

          {/* Payé par */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Paye par</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "rgba(255,255,255,0.9)" }}>
              {expense.paid_by?.name || "—"}
            </div>
          </div>

          {/* Participants */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Participants ({expense.participants?.length || 0})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(expense.participants || []).map((p) => {
                const pid   = p.user_id?._id || p.user_id;
                const pname = p.user_id?.name || "?";
                const isMe  = pid === currentUserId;
                return (
                  <div key={pid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: isMe ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.05)",
                      border: isMe ? "1.5px solid rgba(45,212,191,0.4)" : "1.5px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 700,
                      color: isMe ? "#2dd4bf" : "rgba(255,255,255,0.6)",
                      flexShrink: 0,
                    }}>
                      {pname.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>
                        {isMe ? "Toi" : pname}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.3)" }}>
                        {p.shared_amount?.toFixed(2)} TND
                      </div>
                    </div>
                    <div style={{
                      padding: "3px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
                      background: p.paid ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                      color: p.paid ? "#34d399" : "#fbbf24",
                      border: `1px solid ${p.paid ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                    }}>
                      {p.paid ? "Deja paye" : p.payment_request_status === "pending" ? "En attente" : "A payer"}
                    </div>
                    {isAdmin && p.payment_request_status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn--pay-row"
                          style={{ 
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.75rem"
                          }}
                          onClick={() => onValidatePayment(expense._id, pid, "approve")}
                        >
                          <CheckBadgeIcon width={14} height={14} />
                          Valider
                        </button>
                        <button
                          className="btn-delete-row"
                          style={{ 
                            width: "auto", 
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.75rem"
                          }}
                          onClick={() => onValidatePayment(expense._id, pid, "reject")}
                        >
                          <XCircleIcon width={14} height={14} />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recu */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
                Justificatif (Image ou PDF)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {expense.status === "settled" ? (
                  <button 
                    onClick={() => generateOfficialReceipt(expense)}
                    style={{
                      background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)",
                      borderRadius: 8, padding: "4px 10px", color: "#2dd4bf", fontSize: "0.75rem",
                      fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    <DocumentArrowDownIcon width={14} height={14} />
                    Generer Ticket PDF
                  </button>
                ) : (
                  <div style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "4px 10px", color: "rgba(255,255,255,0.25)", fontSize: "0.72rem",
                    fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "not-allowed"
                  }} title="Le ticket PDF n'est disponible que lorsque la depense est totalement payee">
                    <ClockIcon width={14} height={14} />
                    PDF Verrouille
                  </div>
                )}
                {!expense.receipt && (
                  <>
                    <input ref={receiptRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleReceiptChange} />
                    <button 
                      onClick={() => receiptRef.current?.click()}
                      disabled={uploading}
                      style={{
                        background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)",
                        borderRadius: 8, padding: "4px 10px", color: "#2dd4bf", fontSize: "0.75rem",
                        fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      {uploading ? "Envoi..." : "+ Ajouter un fichier"}
                    </button>
                  </>
                )}
              </div>
            </div>
            {expense.receipt ? (
              <div>
                {expense.receipt.startsWith("data:application/pdf") ? (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    padding: "24px 0", background: "rgba(255,255,255,0.02)", borderRadius: 10,
                    border: "1px dashed rgba(255,255,255,0.1)"
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
                      <DocumentTextIcon width={32} height={32} />
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Document PDF joint</div>
                    <button 
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<iframe src="${expense.receipt}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      }}
                      style={{
                        background: "#2dd4bf", color: "#07111c", border: "none",
                        borderRadius: 8, padding: "8px 16px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer"
                      }}
                    >
                      Ouvrir le PDF
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={expense.receipt}
                      alt="Recu"
                      style={{
                        width: "100%", maxHeight: 300, objectFit: "contain",
                        borderRadius: 10, border: "1px solid rgba(45,212,191,0.2)",
                        cursor: "zoom-in",
                      }}
                      onClick={() => window.open(expense.receipt, "_blank")}
                      title="Clique pour agrandir"
                    />
                    <div style={{ marginTop: 8, fontSize: "0.74rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                      Clique sur l'image pour agrandir
                    </div>
                  </>
                )}
                
                {/* Bouton pour changer le reçu si besoin */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  <input ref={receiptRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleReceiptChange} />
                  <button 
                    onClick={() => receiptRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, padding: "3px 8px", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem",
                      cursor: "pointer"
                    }}
                  >
                    Modifier le justificatif
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "16px 0",
                color: "rgba(255,255,255,0.2)",
                fontSize: "0.85rem",
              }}>
                <DocumentTextIcon width={22} height={22} />
                Pas de justificatif pour cette depense.
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {isMyTurn && (
              <button
                onClick={async () => {
                  const result = await onMarkPaid(expense._id);
                  if (result?.message) toast(result.message, result.success ? "success" : "error");
                  onClose();
                }}
                style={{
                  flex: 1, padding: "13px 0",
                  background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
                  border: "none", borderRadius: 12,
                  color: "#07111c", fontWeight: 800, fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                <CurrencyDollarIcon width={16} height={16} style={{ marginRight: 6 }} />
                Payer {myShare?.toFixed(2)} TND
              </button>
            )}
            {canCancelPayment && (
              <button
                onClick={async () => {
                  const result = await onCancelPayment(expense._id);
                  if (result?.message) toast(result.message, result.success ? "success" : "error");
                  onClose();
                }}
                style={{
                  flex: 1, padding: "13px 0",
                  background: "rgba(251,146,60,0.1)",
                  border: "1px solid rgba(251,146,60,0.25)",
                  borderRadius: 12,
                  color: "#fb923c", fontWeight: 800, fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                <XCircleIcon width={16} height={16} style={{ marginRight: 6 }} />
                Annuler paiement
              </button>
            )}
            <button
              onClick={() => { onDelete(expense._id); onClose(); }}
              style={{
                padding: "13px 18px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 12, color: "#f87171",
                cursor: "pointer", fontSize: "0.88rem", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <TrashIcon /> Supprimer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PAYMENT NOTIFICATION BANNER
   ============================================================ */
const PaymentNotificationBanner = ({ myParticipations, onPay }) => {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || myParticipations.length === 0) return null;
  const totalOwed = myParticipations.reduce((s, p) => s + p.sharedAmount, 0);
  return (
    <div className="payment-notif-banner">
      <div className="payment-notif-banner__left">
        <div className="payment-notif-banner__icon"><BanknotesIcon width={18} height={18} /></div>
        <div>
          <div className="payment-notif-banner__title">
            Tu as {myParticipations.length} depense{myParticipations.length > 1 ? "s" : ""} a payer
          </div>
          <div className="payment-notif-banner__sub">
            Total a payer&nbsp;: <strong>{totalOwed.toFixed(2)} TND</strong>
            {myParticipations.length === 1 ? ` — ${myParticipations[0].title}` : ""}
          </div>
        </div>
      </div>
      <div className="payment-notif-banner__actions">
        {myParticipations.map((p) => (
          <button
            key={p.expenseId}
            className="btn--pay-now"
            onClick={async () => {
              const result = await onPay(p.expenseId);
              if (result?.message) toast(result.message, result.success ? "success" : "error");
            }}
          >
            {p.title.length > 14 ? p.title.slice(0, 14) + "…" : p.title}
            &nbsp;· {p.sharedAmount.toFixed(2)} TND
          </button>
        ))}
        <button className="payment-notif-banner__dismiss" onClick={() => setDismissed(true)}>✕</button>
      </div>
    </div>
  );
};

/* ============================================================
   ADD EXPENSE MODAL
   ============================================================ */
const AddExpenseModal = ({ onClose, onAdd, familyMembers, allFamilies, initialFamilyId, currentUser }) => {
  const { toast } = useToast();
  const myId = useMemo(() => String(currentUser?._id || ""), [currentUser?._id]);

  const [form, setForm]                       = useState({
    ...EMPTY_FORM,
    family_id: initialFamilyId || (allFamilies.length > 0 ? allFamilies[0]._id : ""),
    splitWith: myId ? [myId] : [],
  });

  useEffect(() => {
    if (myId) {
      setForm(prev => {
        const hasMe = prev.splitWith.includes(myId);
        if (hasMe) return prev;
        return { ...prev, splitWith: [...prev.splitWith, myId] };
      });
    }
  }, [myId]);
  const [currentMembers, setCurrentMembers]   = useState(
    (familyMembers || []).filter(m => String(m._id) !== myId)
  );
  const [openDropdown, setOpenDropdown]       = useState(null);
  const [panelStyle, setPanelStyle]           = useState({});
  const [loading, setLoading]                 = useState(false);
  const [membersLoading, setMembersLoading]   = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const triggerRef = useRef(null);
  const receiptRef = useRef(null);

  const loadMembers = useCallback(async (fId) => {
    setMembersLoading(true);
    try {
      const data = await familiesApi.fetchFamilyById(fId);
      if (data && data.members) {
        const mapped = data.members
          .filter(m => String(m.user_id?._id || m.user_id) !== myId)
          .map((m) => ({
            _id:  String(m.user_id?._id  || m.user_id),
            name: m.user_id?.name || "?",
          }));
        setCurrentMembers(mapped);
        // S'assurer que l'utilisateur actuel est toujours dans la liste
        setForm(prev => {
          const hasMe = prev.splitWith.includes(myId);
          if (hasMe) return prev;
          return { ...prev, splitWith: [...prev.splitWith, myId] };
        });
      }
    } catch {}
    setMembersLoading(false);
  }, [myId]);

  useEffect(() => {
    if (form.family_id && form.family_id !== initialFamilyId) {
      loadMembers(form.family_id);
    } else if (form.family_id === initialFamilyId && familyMembers?.length > 0) {
      const filtered = familyMembers.filter(m => String(m._id) !== myId);
      setCurrentMembers(filtered);
      // S'assurer que l'utilisateur actuel est toujours dans la liste
      setForm(prev => {
        const hasMe = prev.splitWith.includes(myId);
        if (hasMe) return prev;
        return { ...prev, splitWith: [...prev.splitWith, myId] };
      });
    }
  }, [form.family_id, initialFamilyId, familyMembers, myId, loadMembers]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const togglePerson = (id) => {
    // Ne pas permettre de retirer l'utilisateur actuel
    if (id === myId) return;
    
    setForm((prev) => ({
      ...prev,
      splitWith: prev.splitWith.includes(id)
        ? prev.splitWith.filter((p) => p !== id)
        : [...prev.splitWith, id],
    }));
  };

  const togglePeopleDropdown = () => {
    if (openDropdown !== "people") {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelStyle({ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width, zIndex: 9999 });
    }
    setOpenDropdown((prev) => (prev === "people" ? null : "people"));
  };

  useEffect(() => {
    if (openDropdown !== "people") return;
    const close = (e) => { if (!triggerRef.current?.contains(e.target)) setOpenDropdown(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openDropdown]);

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    
    if (!isImage && !isPdf) {
      toast("Seulement des images ou PDF", "error");
      return;
    }
    
    setReceiptUploading(true);
    try {
      let result;
      if (isImage) {
        result = await compressImage(file, 1200);
      } else {
        result = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      setForm((prev) => ({ ...prev, receipt: result }));
    } catch { 
      toast("Erreur de chargement", "error"); 
    } finally { 
      setReceiptUploading(false); 
      e.target.value = ""; 
    }
  };

  const removeReceipt = () => setForm((prev) => ({ ...prev, receipt: "" }));

  const perPerson = useMemo(() => {
    if (!form.amount || form.splitWith.length === 0) return null;
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return null;
    return (amt / form.splitWith.length).toFixed(2);
  }, [form.amount, form.splitWith.length]);

  const isValid = useMemo(() => {
    const amt = parseFloat(form.amount);
    return form.description.trim() && !isNaN(amt) && amt > 0 && form.splitWith.length > 0 && form.family_id;
  }, [form.description, form.amount, form.splitWith.length, form.family_id]);

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    await onAdd({
      title:     form.description.trim(),
      amount:    parseFloat(form.amount),
      category:  form.category,
      date:      form.date,
      splitWith: form.splitWith,
      receipt:   form.receipt,
      family_id: form.family_id,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Ajouter une depense</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="modal-grid">
            <div className="form-field modal-grid--half-mobile">
              <label className="form-field__label">Groupe</label>
              <select className="form-field__select" value={form.family_id} onChange={set("family_id")}>
                {allFamilies.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-field modal-grid--half-mobile">
              <label className="form-field__label">Categorie</label>
              <select className="form-field__select" value={form.category} onChange={set("category")} onFocus={() => setOpenDropdown(null)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-field modal-grid--full">
              <label className="form-field__label">Description</label>
              <input className="form-field__input" type="text" placeholder="ex: Loyer..." value={form.description} onChange={set("description")} autoFocus />
            </div>
            <div className="form-field">
              <label className="form-field__label">Montant (TND)</label>
              <input className="form-field__input" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={set("amount")} />
            </div>
            <div className="form-field">
              <label className="form-field__label">Date</label>
              <input className="form-field__input" type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="form-field modal-grid--full">
              <label className="form-field__label">
                Qui doit payer ?
                {perPerson && <span className="form-field__label-hint">→ {perPerson} TND / personne</span>}
              </label>
              <div ref={triggerRef}
                className={`split-trigger${form.splitWith.length ? " has-value" : ""}${openDropdown === "people" ? " is-open" : ""}`}
                onClick={togglePeopleDropdown}>
                <span>
                  {membersLoading ? "Chargement..." :
                    form.splitWith.length
                      ? [
                          ...(form.splitWith.includes(myId) ? ["Moi"] : []),
                          ...currentMembers
                            .filter((m) => form.splitWith.includes(m._id))
                            .map((m) => (m.name || "?").split(" ")[0])
                        ].join(", ")
                      : "Choisis les gens…"}
                </span>
                <ChevronIcon up={openDropdown === "people"} />
              </div>
              {openDropdown === "people" && createPortal(
                <div className="split-panel" style={panelStyle}>
                  {membersLoading ? <div style={{ padding: "12px 16px", color: "rgba(255,255,255,0.3)", fontSize: "0.84rem" }}>Chargement...</div> :
                    (currentMembers.length === 0 && !myId)
                      ? <div style={{ padding: "12px 16px", color: "rgba(255,255,255,0.3)", fontSize: "0.84rem" }}>Pas de membres</div>
                      : (
                        <>
                          {myId && (
                            <div className={`split-person selected locked`}
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              title="Vous êtes obligatoirement inclus dans cette dépense">
                              <div className="split-person__check"><CheckIcon /></div>
                              <span className="split-person__name">Moi (Obligatoire)</span>
                              {perPerson && <span className="split-person__amount">{perPerson} TND</span>}
                            </div>
                          )}
                          {currentMembers.map((person) => {
                            const selected = form.splitWith.includes(person._id);
                            return (
                              <div key={person._id} className={`split-person${selected ? " selected" : ""}`}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); togglePerson(person._id); }}>
                                <div className="split-person__check">{selected && <CheckIcon />}</div>
                                <span className="split-person__name">{person.name || "?"}</span>
                                {selected && perPerson && <span className="split-person__amount">{perPerson} TND</span>}
                              </div>
                            );
                          })}
                        </>
                      )
                  }
                </div>,
                document.body
              )}
            </div>

            {/* Upload reçu */}
            <div className="form-field modal-grid--full">
              <label className="form-field__label">Justificatif (Image ou PDF)</label>
              <input ref={receiptRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleReceiptChange} />
              {!form.receipt ? (
                <button
                  type="button"
                  onClick={() => receiptRef.current?.click()}
                  disabled={receiptUploading}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 16px",
                    background: "rgba(45,212,191,0.06)",
                    border: "1.5px dashed rgba(45,212,191,0.3)",
                    borderRadius: 10, color: "rgba(255,255,255,0.55)",
                    fontSize: "0.84rem", cursor: "pointer", width: "100%",
                  }}
                >
                  <ReceiptIcon />
                  {receiptUploading ? "Chargement…" : "Ajouter un fichier"}
                </button>
              ) : (
                <div style={{ position: "relative", marginTop: 4 }}>
                  {form.receipt.startsWith("data:application/pdf") ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      <DocumentTextIcon width={24} height={24} style={{ color: "#f87171" }} />
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>Document PDF prêt</span>
                    </div>
                  ) : (
                    <img src={form.receipt} alt="Recu" style={{ width: "100%", maxHeight: 80, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(45,212,191,0.25)", background: "rgba(0,0,0,0.2)" }} />
                  )}
                  <button onClick={removeReceipt} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(248,113,113,0.9)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>✕</button>
                  <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: "0.65rem", color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4, backdropFilter: "blur(4px)" }}>Fichier prêt</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn--modal-cancel" onClick={onClose}>Annuler</button>
          <button className="btn--modal-save" onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? "Ajout..." : "+ Ajouter la depense"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   EXPENSE ROW — cliquable pour ouvrir le détail
   ============================================================ */
const ExpenseRow = ({ expense, currentUserId, myRole, onDelete, onMarkPaid, onCancelPayment, onSelect }) => {
  const cat = getCategoryMeta(expense.category);

  const myParticipant = (expense.participants || []).find((p) => {
    const pid = p.user_id?._id || p.user_id;
    return String(pid) === String(currentUserId);
  });

  const myShare  = myParticipant?.shared_amount ?? null;
  const myPaid   = myParticipant?.paid ?? false;
  const isAdmin = myRole === "chef" || myRole === "mod";
  const hasPendingValidation = (expense.participants || []).some(
    (p) => p.payment_request_status === "pending"
  );
  const myRequestPending = myParticipant?.payment_request_status === "pending";
  const myPaymentAt = myParticipant?.payment_reviewed_at || myParticipant?.payment_requested_at || expense.updatedAt;

  const isMyTurn = !!myParticipant && !myPaid && !myRequestPending && expense.status !== "settled" && String(expense.paid_by?._id || expense.paid_by) !== String(currentUserId);

  // Restriction 3h
  const payDate = new Date(myPaymentAt);
  const diffHrs = (new Date() - payDate) / (1000 * 60 * 60);
  const canCancelPayment = !!myParticipant && (myPaid || myRequestPending) && diffHrs <= 3;

  const allPaid  = (expense.participants || []).length > 0 && (expense.participants || []).every((p) => p.paid);

  return (
    <tr
      className={`expense-row-clickable ${isMyTurn ? "expense-row--mine" : ""}`}
      onClick={() => onSelect(expense)}
      style={{ cursor: "pointer" }}
    >
      <td className="td-date">{formatDate(expense.date)}</td>
      <td className="td-desc">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {expense.title || "—"}
          {expense.receipt && (
            <span title={expense.receipt.startsWith("data:application/pdf") ? "Document PDF joint" : "Image jointe"} style={{
              background: expense.receipt.startsWith("data:application/pdf") ? "rgba(248,113,113,0.1)" : "rgba(45,212,191,0.1)", 
              border: expense.receipt.startsWith("data:application/pdf") ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(45,212,191,0.25)",
              borderRadius: 6, padding: "1px 6px",
              color: expense.receipt.startsWith("data:application/pdf") ? "#f87171" : "#2dd4bf", 
              fontSize: "0.68rem", fontWeight: 700,
            }}>
              {expense.receipt.startsWith("data:application/pdf") ? "PDF" : <DocumentTextIcon width={16} height={16} />}
            </span>
          )}
        </div>
      </td>
      <td className="td-cat-cell">
        <span className={`category-badge cat-${expense.category || "other"}`}>
          <cat.icon width={14} height={14} style={{ marginRight: 6 }} />{cat.label}
        </span>
      </td>
      <td className="td-participants-cell">
        <div className="participants-wrap">
          {(expense.participants || []).map((p) => {
            const pid   = p.user_id?._id || p.user_id;
            const pname = p.user_id?.name?.split(" ")[0] || "?";
            const isMe  = String(pid) === String(currentUserId);
            const statusClass = p.paid ? "person-tag--paid" : p.payment_request_status === "pending" ? "person-tag--pending" : "person-tag--due";
            return (
              <span key={pid}
                className={`person-tag ${statusClass} ${isMe ? "person-tag--me" : ""}`}
                title={`${pname} · ${p.shared_amount?.toFixed(2)} TND`}>
                {p.paid ? "Deja paye" : p.payment_request_status === "pending" ? "En attente" : "A payer"} {isMe ? "Vous" : pname}
              </span>
            );
          })}
        </div>
      </td>
      <td className="td-amount-cell">
        <span className="td-amount positive">{Number(expense.amount).toFixed(2)} TND</span>
        {myShare !== null && <div className="td-myshare">Ma part : {myShare.toFixed(2)} TND</div>}
      </td>
      <td className="td-status-cell">
        <div className="status-wrap">
          {allPaid || expense.status === "settled"
            ? <span className="status-badge status-settled"><CheckCircleIcon width={14} height={14} style={{ marginRight: 4 }} />Deja paye</span>
            : myRequestPending
              ? <span className="status-badge status-pending"><ClockIcon width={14} height={14} style={{ marginRight: 4 }} />En attente</span>
            : isMyTurn
              ? <span className="status-badge status-due"><CurrencyDollarIcon width={14} height={14} style={{ marginRight: 4 }} />A payer</span>
              : <span className="status-badge status-pending"><ClockIcon width={14} height={14} style={{ marginRight: 4 }} />En attente</span>
          }
        </div>
      </td>
      <td className="td-action-cell" onClick={(e) => e.stopPropagation()}>
        <div className="action-stack">
          {isMyTurn && (
            <button
              className="btn--pay-row"
              onClick={async (e) => {
                e.stopPropagation();
                const result = await onMarkPaid(expense._id);
                if (result?.message) toast(result.message, result.success ? "success" : "error");
              }}
            >
              Payer {myShare?.toFixed(2)} TND
            </button>
          )}
          
          {canCancelPayment && (
            <button
              className="btn-delete-row"
              style={{ width: "auto", padding: "6px 12px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#fb923c", opacity: 1 }}
              onClick={async (e) => {
                e.stopPropagation();
                const result = await onCancelPayment(expense._id);
                if (result?.message) toast(result.message, result.success ? "success" : "error");
              }}
            >
              Annuler
            </button>
          )}

          {isAdmin && hasPendingValidation && (
            <button
              className="btn--pay-row"
              style={{ background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.45)", color: "#bfdbfe", fontWeight: 800 }}
              onClick={(e) => { e.stopPropagation(); onSelect(expense); }}
            >
              Validation paiement
            </button>
          )}
        </div>
      </td>
      <td className="td-delete-cell" onClick={(e) => e.stopPropagation()}>
        <button className="btn-delete-row" onClick={(e) => { e.stopPropagation(); onDelete(expense._id); }}>
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
};

/* ============================================================
   NO GROUP STATE
   ============================================================ */
const NoGroupState = ({ onNavigate }) => (
  <div className="expenses-empty" style={{ 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center", 
    minHeight: "calc(100vh - 150px)", 
    padding: "40px 24px" 
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
      }}>Vous n'êtes dans aucun groupe</h2>
      <p style={{ 
        fontSize: "0.95rem", 
        color: "var(--text-soft)", 
        marginBottom: 36, 
        lineHeight: 1.6,
        maxWidth: "300px"
      }}>Rejoignez ou créez un groupe pour commencer à ajouter des dépenses partagées.</p>
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
        onClick={onNavigate}
      >
        Rejoindre un groupe <ArrowRightIcon width={16} height={16} style={{ marginLeft: 8 }} />
      </button>
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Expenses = () => {
  const [filter,          setFilter]          = useState("Tout");
  const [showModal,       setShowModal]       = useState(false);
  const [familyMembers,   setFamilyMembers]   = useState([]);
  const [allFamilies,     setAllFamilies]     = useState([]);
  const [myRole,          setMyRole]          = useState("member");
  const [selectedExpense, setSelectedExpense] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, familyId }                                                            = useAuth();
  const { expenses, loading, myPendingPayments, markPaid, cancelPayment, addExpense, editExpense, removeExpense, loadExpenses } = usePayments();
  const { toast, confirm } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "add" && familyId) {
      setShowModal(true);
    }
    if (params.get("filter")) {
      const f = params.get("filter");
      if (["Tout", "En attente", "Déjà payé"].includes(f)) {
        setFilter(f);
      }
    }
  }, [location.search, familyId]);

  useEffect(() => {
    fetchAllFamilies();
  }, [user?._id]);

  useEffect(() => {
    if (!familyId) return;
    loadFamilyMembers(familyId);
  }, [familyId, user?._id]);

  const fetchAllFamilies = async () => {
    try {
      const data = await familiesApi.fetchFamilies();
      setAllFamilies(data);
    } catch {}
  };

  const loadFamilyMembers = async (id) => {
    try {
      const data = await familiesApi.fetchFamilyById(id);
      if (data && data.members) {
        const mapped = data.members.map((m) => ({
          _id:  String(m.user_id?._id  || m.user_id),
          name: m.user_id?.name || "?",
          role: m.role || "member",
        }));
        setFamilyMembers(mapped);
        const me = mapped.find((m) => String(m._id) === String(user?._id));
        setMyRole(me?.role || "member");
      }
    } catch {}
  };

  const pendingPaymentRequests = useMemo(() => {
    if (!(myRole === "chef" || myRole === "mod")) return [];
    const list = [];
    for (const exp of expenses) {
      for (const p of exp.participants || []) {
        if (p.payment_request_status === "pending") {
          const pid = p.user_id?._id || p.user_id;
          list.push({
            expenseId: exp._id,
            expenseTitle: exp.title || "Dépense",
            participantId: pid,
            participantName: p.user_id?.name || "Utilisateur",
            amount: Number(p.shared_amount || 0),
          });
        }
      }
    }
    return list;
  }, [expenses, myRole]);

  const handleRequestDecision = async (request, decision) => {
    try {
      const data = await expensesApi.handlePaymentDecision(request.expenseId, request.participantId, decision);
      await loadExpenses();
      toast(data.message || "Mise à jour effectuée.", "success");
    } catch (err) {
      toast(err.message || "Erreur réseau.", "error");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "En attente") return expenses.filter((e) => e.status === "pending");
    if (filter === "Déjà payé") return expenses.filter((e) => e.status === "settled");
    return expenses;
  }, [expenses, filter]);

  const totalAmount  = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalSettled = expenses.filter((e) => e.status === "settled").reduce((s, e) => s + e.amount, 0);
  const myTotal      = myPendingPayments.reduce((s, p) => s + p.sharedAmount, 0);

  const handleAdd = async (formData) => {
    const targetFamilyId = formData.family_id || familyId;
    if (!targetFamilyId) return;
    
    await addExpense({
      title:        formData.title,
      amount:       formData.amount,
      category:     formData.category,
      date:         formData.date,
      family_id:    targetFamilyId,
      receipt:      formData.receipt || "",
      splitWith:    formData.splitWith, // ✅ Envoyer uniquement splitWith, le backend gère le reste
    });
  };

  return (
    <div className="expenses-page">
      <Sidebar />
      <div className="expenses-page__main">
        <Header title="Dépenses" hasNotif />
        <div className="expenses-content">

          <PaymentNotificationBanner myParticipations={myPendingPayments} onPay={markPaid} />

          {(myRole === "chef" || myRole === "mod") && pendingPaymentRequests.length > 0 && (
            <div className="card" style={{ padding: 14, marginBottom: 4 }}>
              <div style={{ fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <ClockIcon width={16} height={16} />
                Demandes de paiement a valider
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingPaymentRequests.map((r) => (
                  <div
                    key={`${r.expenseId}-${r.participantId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: "var(--surface-soft)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text-1)" }}>
                        {r.participantName} · {r.amount.toFixed(2)} TND
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-3)" }}>
                        {r.expenseTitle}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn--pay-row"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => handleRequestDecision(r, "approve")}
                      >
                        <CheckBadgeIcon width={14} height={14} />
                        Valider
                      </button>
                      <button
                        className="btn-delete-row"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "auto", padding: "0 10px" }}
                        onClick={() => handleRequestDecision(r, "reject")}
                      >
                        <XCircleIcon width={14} height={14} />
                        Non valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="expenses-toprow">
            <div className="expenses-toprow__left">
              <span className="expenses-toprow__title">Apercu des depenses</span>
              <span className="expenses-toprow__subtitle">{expenses.length} depense{expenses.length !== 1 ? "s" : ""} au total</span>
              
              {/* Selecteur de groupe principal */}
              {allFamilies.length > 1 && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>Groupe :</span>
                  <select 
                    className="form-field__select" 
                    style={{ width: "auto", padding: "4px 12px", height: "auto", fontSize: "0.85rem", background: "var(--surface-soft)", color: "var(--text-1)", border: "1px solid var(--border)" }}
                    value={familyId || ""}
                    onChange={(e) => {
                      const newId = e.target.value;
                      localStorage.setItem("familyId", newId);
                      window.location.reload(); // Recharger pour mettre a jour le contexte et les donnees
                    }}
                  >
                    {allFamilies.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="expenses-toprow__right">
              <div className="expenses-filters">
                {FILTERS.map((f) => (
                  <button key={f} className={`expenses-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
              <button className="btn--add-expense" onClick={() => { if (!familyId) { navigate("/group"); return; } setShowModal(true); }}>
                <PlusIcon /> Ajouter une depense
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="expenses-stats">
            <div className="kpi-card" id="exp-kpi-total">
              <div className="kpi-top">
                <div className="kpi-icon icon-bg-blue"><CreditCardIcon width={18} height={18} /></div>
              </div>
              <div className="kpi-label">Total</div>
              <div className="kpi-value">{totalAmount.toFixed(2)} TND</div>
            </div>

            <div className="kpi-card" id="exp-kpi-pending">
              <div className="kpi-top">
                <div className="kpi-icon icon-bg-red"><ClockIcon width={18} height={18} /></div>
              </div>
              <div className="kpi-label">En attente</div>
              <div className="kpi-value red">{totalPending.toFixed(2)} TND</div>
            </div>

            <div className="kpi-card" id="exp-kpi-settled">
              <div className="kpi-top">
                <div className="kpi-icon icon-bg-green"><CheckCircleIcon width={18} height={18} /></div>
              </div>
              <div className="kpi-label">Deja paye</div>
              <div className="kpi-value green">{totalSettled.toFixed(2)} TND</div>
            </div>

            {myTotal > 0 && (
              <div className="kpi-card kpi-card--alert">
                <div className="kpi-top">
                  <div className="kpi-icon icon-bg-orange"><BanknotesIcon width={18} height={18} /></div>
                </div>
                <div className="kpi-label">Je dois payer</div>
                <div className="kpi-value orange">{myTotal.toFixed(2)} TND</div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="expenses-card">
            {!familyId ? (
              <NoGroupState onNavigate={() => navigate("/group")} />
            ) : loading ? (
              <div className="expenses-empty"><div className="expenses-empty__icon"><ClockIcon width={22} height={22} /></div><div className="expenses-empty__title">Chargement…</div></div>
            ) : filtered.length === 0 ? (
              <div className="expenses-empty">
                <div className="expenses-empty__icon"><DocumentTextIcon width={22} height={22} /></div>
                <div className="expenses-empty__title">{filter === "All" ? "Aucune depense pour l'instant" : `Aucune depense "${filter}"`}</div>
                <p className="expenses-empty__sub">{filter === "All" ? "Commencez par ajouter votre premiere depense partagee." : "Changez le filtre ou ajoutez une nouvelle depense."}</p>
                {filter === "All" && <button className="btn--empty-add" onClick={() => setShowModal(true)}><PlusIcon /> Ajouter une depense</button>}
              </div>
            ) : (
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th className="td-date">Date</th>
                    <th className="td-desc">Description</th>
                    <th className="td-cat-cell">Category</th>
                    <th className="td-participants-cell">Qui paie</th>
                    <th className="td-amount-cell">Montant</th>
                    <th className="td-status-cell">Statut</th>
                    <th className="td-action-cell">Action</th>
                    <th className="td-delete-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => (
                    <ExpenseRow
                      key={expense._id}
                      expense={expense}
                      currentUserId={String(user?._id || "")}
                      myRole={myRole}
                      onDelete={removeExpense}
                    onMarkPaid={markPaid}
                    onCancelPayment={cancelPayment}
                    onSelect={setSelectedExpense}
                  />
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* Modal detail depense */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          currentUserId={String(user?._id || "")}
          myRole={myRole}
          onClose={() => setSelectedExpense(null)}
          onMarkPaid={markPaid}
          onCancelPayment={cancelPayment}
          onDelete={removeExpense}
          onUpdateReceipt={async (id, data) => {
            try {
              const updated = await editExpense(id, data);
              if (updated) {
                setSelectedExpense(updated);
              }
            } catch (err) {
              console.error("Update receipt error:", err);
            }
          }}
          onValidatePayment={async (expenseId, participantId, decision) => {
            const request = {
              expenseId,
              participantId,
              expenseTitle: selectedExpense?.title || "Depense",
              participantName: "Utilisateur",
              amount: 0,
            };
            await handleRequestDecision(request, decision);
            setSelectedExpense(null);
          }}
        />
      )}

      {showModal && (
        <AddExpenseModal 
          onClose={() => setShowModal(false)} 
          onAdd={handleAdd} 
          familyMembers={familyMembers}
          allFamilies={allFamilies}
          initialFamilyId={familyId}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default Expenses;