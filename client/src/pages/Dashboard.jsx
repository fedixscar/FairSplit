import React, { useState, useEffect, useRef, useContext } from "react";
import Sidebar from "../components/Sidebar";
import Header  from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchDashboardData } from "../api/dashboard";
import { fetchFamilyById } from "../api/families";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ExclamationTriangleIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  HomeIcon,
  TruckIcon,
  LightBulbIcon,
  FilmIcon,
  PlusIcon,
  HandRaisedIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import "./Dashboard.css";

/* ============================================================
   CONSTANTS
   ============================================================ */
const CATEGORY_COLORS = [
  "#2dd4bf", "#3b82f6", "#f97316",
  "#7c3aed", "#ec4899", "#34d399", "#94a3b8",
];

const CATEGORY_ICONS = {
  food         : ShoppingBagIcon,
  rent         : HomeIcon,
  transport    : TruckIcon,
  utilities    : LightBulbIcon,
  entertainment: FilmIcon,
  other        : CreditCardIcon,
};

/* ============================================================
   PDF GENERATION
   ============================================================ */
const generateDashboardPDF = (dash, userName) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // Colors
  const primary = [45, 212, 191]; // #2dd4bf
  const textDark = [15, 23, 42];
  const textGray = [100, 116, 139];

  // Header Background
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 45, 'F');

  // Logo "FAIR SPLIT"
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("FAIR SPLIT", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("RAPPORT FINANCIER MENSUEL", 20, 35);

  // User & Date Info
  doc.setFontSize(9);
  doc.text(`Genere pour : ${userName.toUpperCase()}`, 190, 25, { align: "right" });
  doc.text(`Date : ${dateStr}`, 190, 32, { align: "right" });

  let y = 60;

  // KPI Summary Section
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Resume de la periode", 20, y);
  y += 10;

  const kpis = [
    ["Total Depenses", `${(dash.totalExpenses || 0).toLocaleString("fr-FR")} TND`],
    ["On vous doit", `${(dash.totalOwedToMe || 0).toLocaleString("fr-FR")} TND`],
    ["Vous devez", `${(dash.totalIOwe || 0).toLocaleString("fr-FR")} TND`],
    ["Solde Net", `${dash.netBalance >= 0 ? "+" : ""}${(dash.netBalance || 0).toLocaleString("fr-FR")} TND`]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillStyle: primary, textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 20, right: 20 }
  });

  y = (doc.lastAutoTable?.finalY || y + 40) + 20;

  // Balances Table
  doc.setFontSize(14);
  doc.text("Balances par membre", 20, y);
  y += 8;

  const balancesData = (dash.balances || []).map(b => [
    b.name || "Inconnu",
    `${b.amount >= 0 ? "+" : ""}${(b.amount || 0).toLocaleString("fr-FR")} TND`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Membre', 'Solde Net']],
    body: balancesData,
    theme: 'striped',
    headStyles: { fillStyle: [51, 65, 85], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 20, right: 20 }
  });

  y = (doc.lastAutoTable?.finalY || y + 20) + 20;

  // Recent Transactions
  doc.setFontSize(14);
  doc.text("Dernieres transactions", 20, y);
  y += 8;

  const txData = (dash.recentExpenses || []).map(t => [
    t.date ? new Date(t.date).toLocaleDateString("fr-FR") : "—",
    t.title || "Sans titre",
    t.paidByName || "—",
    `${(t.amount || 0).toLocaleString("fr-FR")} TND`,
    `${(t.myAmount || 0).toLocaleString("fr-FR")} TND`,
    t.status === "settled" ? "REGLE" : "EN ATTENTE"
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Paye par', 'Total', 'Ma Part', 'Statut']],
    body: txData,
    theme: 'grid',
    headStyles: { fillStyle: [100, 116, 139], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    columnStyles: { 
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' }
    },
    margin: { left: 20, right: 20 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("-".repeat(100), 105, 285, { align: "center" });
    doc.text(`FairSplit - Page ${i} sur ${pageCount} - Document genere automatiquement`, 105, 290, { align: "center" });
  }

  doc.save(`FairSplit_Rapport_${new Date().toISOString().slice(0,10)}.pdf`);
};

/* ============================================================
   HELPERS
   ============================================================ */
const initials = (n = "") =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short",
  });
};

const toArray = (value) => (Array.isArray(value) ? value : []);
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const readFirstNumber = (obj, keys = []) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) {
      const parsed = Number(obj[key]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const normalizeDashboardData = (data = {}) => {
  const balances = toArray(data.balances).map((b) => ({
    name: b?.name || b?.userName || b?.label || "Utilisateur",
    // Support legacy payloads that use `net` or `value` instead of `amount`.
    amount: toNumber(
      Object.prototype.hasOwnProperty.call(b || {}, "amount")
        ? b.amount
        : (Object.prototype.hasOwnProperty.call(b || {}, "net") ? b.net : b?.value)
    ),
  }));

  const owedFromBalances = balances
    .filter((b) => b.amount > 0)
    .reduce((sum, b) => sum + b.amount, 0);
  const iOweFromBalances = balances
    .filter((b) => b.amount < 0)
    .reduce((sum, b) => sum + Math.abs(b.amount), 0);

  const totalOwedToMeRaw = readFirstNumber(data, ["totalOwedToMe", "owedToMe", "totalOwed"]);
  const totalIOweRaw = readFirstNumber(data, ["totalIOwe", "totalIOweMe", "iOwe", "totalOwe"]);
  const netBalanceRaw = readFirstNumber(data, ["netBalance", "net", "balance"]);

  const totalOwedToMe = totalOwedToMeRaw !== null ? totalOwedToMeRaw : owedFromBalances;
  const totalIOwe = totalIOweRaw !== null ? totalIOweRaw : iOweFromBalances;
  const netBalance = netBalanceRaw !== null ? netBalanceRaw : (totalOwedToMe - totalIOwe);

  const dailyExpenses = toArray(data.dailyExpenses).map((d, i) => ({
    day: toNumber(d?.day) || i + 1,
    amount: toNumber(d?.amount),
  }));

  const dailyTotal = dailyExpenses.reduce((sum, d) => sum + d.amount, 0);
  const totalExpensesRaw = readFirstNumber(data, ["totalExpenses", "totalFamily", "sumExpenses"]);

  return {
    totalExpenses: totalExpensesRaw !== null ? totalExpensesRaw : dailyTotal,
    totalOwedToMe,
    totalIOwe,
    netBalance,
    statusSummary: {
      pending: Number(data.statusSummary?.pending) || 0,
      settled: Number(data.statusSummary?.settled) || 0,
      settlementRate: Number(data.statusSummary?.settlementRate) || 0,
    },
    topCategory: data.topCategory
      ? { name: data.topCategory.name || "Autres", pct: Number(data.topCategory.pct) || 0 }
      : null,
    dailyExpenses,
    balances,
    categories: toArray(data.categories),
    recentExpenses: toArray(data.recentExpenses),
    members: toArray(data.members),
  };
};

const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame;
    let current = 0;
    const step = () => {
      current += target / (duration / 16);
      if (current >= target) { setVal(target); return; }
      setVal(Math.round(current));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/* ── Line Chart ── */
const DailyExpensesChart = ({ data = [] }) => {
  const [ready, setReady] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(null);
  
  useEffect(() => { setTimeout(() => setReady(true), 300); }, []);

  if (!data.length || data.every((d) => d.amount === 0)) {
    return (
      <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-soft)", fontSize: "0.85rem" }}>
        <div style={{ opacity: 0.2, marginBottom: 12 }}><ChartBarIcon width={32} height={32} style={{ margin: "0 auto" }} /></div>
        Aucune depense ce mois
      </div>
    );
  }

  const W = 300, H = 110;
  
  // Daily amounts
  const maxDaily = Math.max(...data.map(d => d.amount)) || 1;
  
  // Cumulative totals
  let cumul = 0;
  const totals = data.map((d) => { cumul += d.amount; return cumul; });
  const maxCumul = Math.max(...totals) || 1;

  const pts = data.map((d, i) => {
    const dailyAmt = d.amount || 0;
    const cumulAmt = totals[i];
    return {
      x: (i / (data.length - 1)) * W,
      yDaily: H - (dailyAmt / maxDaily) * H * 0.7, // Bars height
      yCumul: H - (cumulAmt / maxCumul) * H * 0.85, // Line height
      dailyAmt,
      cumulAmt,
      day: d.day || i + 1,
      dateLabel: d.dateLabel || "",
      isFuture: d.isFuture || false
    };
  });

  const visiblePts = pts.filter(p => !p.isFuture);

  // Path for cumulative line (Subtle)
  const linePath = visiblePts.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M${p.x},${p.yCumul}` : ` L${p.x},${p.yCumul}`);
  }, "");

  return (
    <div className="chart-container" style={{ padding: "90px 24px 24px" }}>
      <div style={{ position: "relative", minHeight: H + 20 }}>
        
        {/* Tooltip Premium (Centered on hovered day) */}
        {hoverIdx !== null && pts[hoverIdx] && (
          <div style={{
            position: "absolute",
            top: -120,
            left: `${(pts[hoverIdx].x / W) * 100}%`,
            transform: `translateX(${hoverIdx < 5 ? "0%" : hoverIdx > pts.length - 6 ? "-100%" : "-50%"})`,
            background: "rgba(10, 20, 35, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(45, 212, 191, 0.4)",
            borderRadius: "16px",
            padding: "12px 16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            zIndex: 1000,
            pointerEvents: "none",
            minWidth: "160px",
            animation: "fadeIn 0.15s ease-out"
          }}>
            <div style={{ fontSize: "0.6rem", color: "var(--accent)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              {pts[hoverIdx].dateLabel || `Jour ${pts[hoverIdx].day}`}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", marginBottom: 2 }}>
              {pts[hoverIdx].dailyAmt.toLocaleString('fr-FR')} <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>TND</span>
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              Cumulé: {pts[hoverIdx].cumulAmt.toLocaleString('fr-FR')} TND
            </div>
          </div>
        )}

        <svg 
          viewBox={`0 -20 ${W} ${H + 40}`} 
          style={{ width: "100%", height: 180, overflow: "visible" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
            </linearGradient>
            <filter id="barGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines */}
          {[0, 0.5, 1].map(f => (
            <line key={f} x1="0" y1={H*f} x2={W} y2={H*f} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          ))}

          {/* Cumulative Line (Subtle background trend) */}
          <path
            d={linePath} 
            fill="none" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ opacity: ready ? 1 : 0, transition: "opacity 1s" }}
          />

          {/* DAILY BARS (The main focus) */}
          {pts.map((p, i) => {
            if (p.isFuture) return null;
            const isHovered = hoverIdx === i;
            const barH = H - p.yDaily;
            
            return (
              <g key={i}>
                {/* Invisible hover area for PERFECT detection */}
                <rect
                  x={p.x - (W / (data.length - 1)) / 2}
                  y="-20"
                  width={W / (data.length - 1)}
                  height={H + 40}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  style={{ cursor: "crosshair" }}
                />

                {/* The Actual Bar */}
                <rect
                  x={p.x - 2.5}
                  y={p.yDaily}
                  width="5"
                  height={barH > 2 ? barH : 2} // Min height 2px for visibility
                  rx="2.5"
                  fill={isHovered ? "var(--accent)" : "url(#barGrad)"}
                  filter={isHovered ? "url(#barGlow)" : "none"}
                  style={{ 
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: ready ? (p.dailyAmt > 0 ? 1 : 0.1) : 0,
                    transformOrigin: `${p.x}px ${H}px`,
                    transform: isHovered ? "scaleX(1.4)" : "scaleX(1)"
                  }}
                  pointerEvents="none"
                />

                {/* Highlight dot on the trend line if hovered */}
                {isHovered && (
                  <circle 
                    cx={p.x} cy={p.yCumul} r="4" 
                    fill="#fff" stroke="var(--accent)" strokeWidth="2"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {/* Today Indicator */}
          {visiblePts.length > 0 && (
            <line 
              x1={visiblePts[visiblePts.length-1].x} y1="-10" x2={visiblePts[visiblePts.length-1].x} y2={H} 
              stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5"
            />
          )}
        </svg>
      </div>

      {/* X-Axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[0, 7, 14, 21, 29].map((idx) => (
          <div key={idx} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>
            {pts[idx]?.dateLabel?.toUpperCase() || (idx + 1)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 12, background: "var(--accent)", borderRadius: 2 }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-soft)", fontWeight: 600 }}>Depense du jour (0 si aucun achat)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 1.5, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-soft)", fontWeight: 600 }}>Tendance cumulee</span>
        </div>
      </div>
    </div>
  );
};

/* ── Balance Chart ── */
const BalanceChart = ({ data = [] }) => {
  const [ready, setReady] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(null);
  
  useEffect(() => { setTimeout(() => setReady(true), 200); }, []);

  if (!data.length) {
    return (
      <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-soft)", fontSize: "0.85rem" }}>
        <div style={{ opacity: 0.2, marginBottom: 12 }}><UserGroupIcon width={32} height={32} style={{ margin: "0 auto" }} /></div>
        Aucune balance a afficher
      </div>
    );
  }

  const maxAbs   = Math.max(...data.map((d) => Math.abs(d.amount))) || 1;
  const BAR_MAX  = 100;

  return (
    <div className="chart-container" style={{ padding: "0 22px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.map((d, i) => {
          const isPos  = d.amount >= 0;
          const barW   = (Math.abs(d.amount) / maxAbs) * BAR_MAX;
          const color  = isPos ? "#34d399" : "#f87171";
          const bgColor= isPos ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";
          
          return (
            <div 
              key={d.name} 
              style={{ display: "flex", alignItems: "center", gap: 12 }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: 10, 
                background: "var(--surface-light)", 
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800, color: "var(--text)",
                flexShrink: 0
              }}>
                {initials(d.name)}
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative", height: 32 }}>
                {/* Zero line */}
                <div style={{ 
                  position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, 
                  background: "var(--border)", zIndex: 1, opacity: 0.5 
                }} />
                
                {/* Bar */}
                <div style={{
                  position  : "absolute", height: 24, borderRadius: "6px",
                  background: bgColor, 
                  border    : `1px solid ${color}44`,
                  width     : ready ? `${barW / 2}%` : 0,
                  transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  left      : isPos ? "50%" : "auto",
                  right     : isPos ? "auto" : "50%",
                  boxShadow : hoverIdx === i ? `0 0 15px ${color}22` : "none",
                  transform : hoverIdx === i ? "scaleY(1.1)" : "scaleY(1)"
                }}>
                  {/* Glow edge */}
                  <div style={{
                    position: "absolute",
                    top: 0, bottom: 0,
                    width: 4,
                    background: color,
                    borderRadius: "4px",
                    left: isPos ? 0 : "auto",
                    right: isPos ? "auto" : 0,
                    boxShadow: `0 0 10px ${color}`
                  }} />
                </div>
              </div>

              <div style={{ width: 85, textAlign: "right", flexShrink: 0 }}>
                <div style={{ 
                  fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "0.85rem", 
                  color: color, transition: "transform 0.2s ease",
                  transform: hoverIdx === i ? "translateX(-4px)" : "none"
                }}>
                  {isPos ? "+" : ""}{d.amount.toFixed(0)} <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>TND</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {d.name.split(" ")[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        {[["#34d399", "On te doit"], ["#f87171", "Tu dois"]].map(([bg, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, boxShadow: `0 0 8px ${bg}44` }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-soft)", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Donut Chart ── */
const DonutChart = ({ data = [] }) => {
  const [ready, setReady] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(null);

  useEffect(() => { setTimeout(() => setReady(true), 300); }, []);

  if (!data.length) {
    return (
      <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-soft)", fontSize: "0.85rem" }}>
        <div style={{ opacity: 0.2, marginBottom: 12 }}><ShoppingBagIcon width={32} height={32} style={{ margin: "0 auto" }} /></div>
        Aucune categorie
      </div>
    );
  }

  const R      = 50;
  const circum = 2 * Math.PI * R;
  let offset   = 0;

  const arcs = data.map((c, i) => {
    const dash = (c.pct / 100) * circum;
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    const currentOffset = offset;
    offset += dash;
    
    return { 
      pct: c.pct, 
      name: c.name,
      amount: c.amount || 0,
      color, 
      dash, 
      offset: currentOffset 
    };
  });

  return (
    <div className="chart-container" style={{ padding: "0 22px 20px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
      <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
        <svg viewBox="0 0 140 140" style={{ width: 160, height: 160, transform: "rotate(-90deg)", overflow: "visible" }}>
          <defs>
            <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="14" opacity="0.3" />
          
          {arcs.map((a, i) => (
            <circle
              key={a.name} cx="70" cy="70" r={R}
              fill="none" 
              stroke={a.color} 
              strokeWidth={hoverIdx === i ? 18 : 14}
              strokeDasharray={`${ready ? a.dash : 0} ${circum}`}
              strokeDashoffset={-a.offset}
              strokeLinecap={a.pct >= 100 ? "butt" : a.pct > 5 ? "round" : "butt"}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ 
                transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-width 0.3s ease",
                cursor: "pointer",
                filter: hoverIdx === i ? "url(#donutGlow)" : "none"
              }}
            />
          ))}
        </svg>
        
        <div style={{ 
          position: "absolute", inset: 0, 
          display: "flex", flexDirection: "column", 
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none"
        }}>
          {hoverIdx !== null ? (
            <>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: "1.4rem", fontWeight: 800, color: arcs[hoverIdx].color }}>
                {arcs[hoverIdx].pct}%
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>
                {arcs[hoverIdx].name}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>100%</span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-soft)", fontWeight: 700, textTransform: "uppercase" }}>Total</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", width: "100%" }}>
        {arcs.map((a, i) => (
          <div 
            key={a.name} 
            style={{ 
              display: "flex", alignItems: "center", gap: 8, 
              opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.4,
              transition: "opacity 0.2s ease"
            }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0, boxShadow: `0 0 8px ${a.color}44` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 4 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.name}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-soft)", fontWeight: 700 }}>{a.amount > 0 ? `${a.amount.toFixed(0)} TND` : ""}</div>
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-soft)", fontWeight: 700 }}>{a.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Skeleton loader ── */
const Skeleton = ({ w = "100%", h = 16, r = 6, mb = 0 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    marginBottom: mb,
  }} />
);

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, familyId } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [familyCode, setFamilyCode]   = useState("");
  const [copyToast, setCopyToast]     = useState(false);
  const [dash, setDash]               = useState({
    totalExpenses : 0,
    totalOwedToMe : 0,
    totalIOwe     : 0,
    netBalance    : 0,
    statusSummary : { pending: 0, settled: 0, settlementRate: 0 },
    topCategory   : null,
    dailyExpenses : [],
    balances      : [],
    categories    : [],
    recentExpenses: [],
    members       : [],
  });

  const kpi1 = useCountUp(dash.totalExpenses);
  const kpi2 = useCountUp(dash.totalOwedToMe);
  const kpi3 = useCountUp(dash.totalIOwe);

  const firstName = authUser?.name?.split(" ")[0] || "Vous";

  useEffect(() => {
    const fetchDashboard = async () => {
      // Si pas de groupe, on ne tente pas de charger les données de groupe
      if (!familyId) {
        setLoading(false);
        setDash({
          totalExpenses : 0,
          totalOwedToMe : 0,
          totalIOwe     : 0,
          netBalance    : 0,
          statusSummary : { pending: 0, settled: 0, settlementRate: 0 },
          topCategory   : null,
          dailyExpenses : [],
          balances      : [],
          categories    : [],
          recentExpenses: [],
          members       : [],
        });
        return;
      }

      setLoading(true);
      try {
        const data = await fetchDashboardData(familyId);
        setDash(normalizeDashboardData(data));
        setError(null);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Impossible de charger les donnees.");
      } finally {
        setLoading(false);
      }
    };

    const fetchFamilyCode = async () => {
      if (!familyId) return;
      try {
        const data = await fetchFamilyById(familyId);
        if (data && data.code) {
          setFamilyCode(data.code);
        }
      } catch (err) {
        console.error("Family code fetch error:", err);
      }
    };

    fetchDashboard();
    fetchFamilyCode();
  }, [familyId, authUser?._id]);

  const handleInvite = () => {
    if (familyCode) {
      navigator.clipboard.writeText(familyCode);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    } else {
      navigate("/group");
    }
  };

  const handlePrint = () => {
    try {
      generateDashboardPDF(dash, authUser?.name || "Utilisateur");
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Erreur lors de l'export PDF : " + err.message);
    }
  };

  /* ── Pending alert ── */
  const pendingExpenses = dash.recentExpenses.filter((e) => e.status === "pending");

  /* ── KPI cards config ── */
  const kpiCards = [
    {
      id      : "kpi-total-share",
      icon    : CreditCardIcon,
      bg      : "rgba(45,212,191,0.1)",
      badge   : "neutral",
      badgeTxt: "ce mois",
      label   : "Ma part totale des depenses",
      val     : `${toNumber(kpi1).toLocaleString("fr-FR")} TND`,
      color   : "var(--accent)",
      sub     : "toutes tes parts",
    },
    {
      id      : "kpi-owed-to-me",
      icon    : CheckCircleIcon,
      bg      : "rgba(34,197,94,0.1)",
      badge   : "up",
      badgeTxt: `${dash.balances.filter((b) => b.amount > 0).length} pers.`,
      label   : "On te doit",
      val     : `${toNumber(kpi2).toLocaleString("fr-FR")} TND`,
      color   : "var(--green)",
      sub     : "a recevoir",
    },
    {
      id      : "kpi-i-owe",
      icon    : ClockIcon,
      bg      : "rgba(249,115,22,0.1)",
      badge   : "down",
      badgeTxt: `${dash.balances.filter((b) => b.amount < 0).length} pers.`,
      label   : "Tu dois",
      val     : `${toNumber(kpi3).toLocaleString("fr-FR")} TND`,
      color   : "var(--orange)",
      sub     : "a regler",
    },
    {
      id      : "kpi-net-balance",
      icon    : UserGroupIcon,
      bg      : "rgba(59,130,246,0.1)",
      badge   : "neutral",
      badgeTxt: "net",
      label   : "Ton solde net",
      val     : `${dash.netBalance >= 0 ? "+" : ""}${toNumber(dash.netBalance)} TND`,
      color   : dash.netBalance >= 0 ? "var(--green)" : "var(--red)",
      sub     : dash.netBalance >= 0 ? "en ta faveur" : "tu es debiteur",
    },
  ];

  /* ── Error state ── */
  if (error) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-page__main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--red)" }}>
            <div style={{ width: 32, margin: "0 auto 8px" }}><ExclamationTriangleIcon /></div>
            <div>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* Prevent white flash from browser defaults while Dashboard mounts */
        .dashboard-page,
        .dashboard-page__main,
        .dashboard-content {
          background-color: var(--bg);
        }
      `}</style>

      <Sidebar />
      <div className="dashboard-page__main no-scrollbar">
        <Header title="Accueil" userName={authUser?.name || "Utilisateur"} hasNotif />

        {/* ── État "Aucun groupe actif" ── */}
        {!familyId ? (
          <div className="dashboard-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 120px)", padding: "20px" }}>
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
              {/* Icône décorative */}
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

              {/* Texte informatif */}
              <h2 style={{ 
                fontFamily: "var(--font-head)", 
                fontSize: "1.75rem", 
                fontWeight: 800, 
                marginBottom: 16,
                color: "var(--text)"
              }}> Aucun groupe actif </h2>
              <p style={{ 
                fontSize: "0.95rem", 
                color: "var(--text-soft)", 
                marginBottom: 36, 
                lineHeight: 1.6,
                maxWidth: "300px"
              }}>
                Vous n'appartenez a aucun groupe pour le moment. Rejoignez ou creez un groupe pour commencer a suivre vos depenses.
              </p>

              {/* Bouton d'action principale */}
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
                Gerer mes groupes
              </button>
            </div>
          </div>
        ) : (
          /* ── Contenu principal du Dashboard (si groupe actif) ── */
          <div className="dashboard-content">

            {/* ── Alert depenses en attente ── */}
            {!loading && pendingExpenses.length > 0 && (
              <div className="settle-alert">
                <div className="settle-alert__icon"><ExclamationTriangleIcon width={18} height={18} /></div>
                <div className="settle-alert__text">
                  <div className="settle-alert__title">
                    {pendingExpenses.length} depense{pendingExpenses.length > 1 ? "s" : ""} en attente de reglement
                  </div>
                  <div className="settle-alert__sub">
                    {pendingExpenses
                      .slice(0, 2)
                      .map((e) => `${e.paidByName} · ${e.myAmount} TND`)
                      .join(" · ")}
                  </div>
                </div>
                <button className="btn-settle" onClick={() => navigate("/expenses?filter=Pending")}>Regler maintenant</button>
              </div>
            )}

            {/* ── Toast invitation ── */}
            {copyToast && (
              <div style={{
                position: "fixed", bottom: 30, right: 30, zIndex: 10000,
                background: "var(--accent)", color: "var(--bg)",
                padding: "12px 24px", borderRadius: 12, fontWeight: 800,
                boxShadow: "0 10px 30px rgba(45,212,191,0.3)",
                animation: "slideIn 0.3s ease-out"
              }}>
                Code de groupe copie !
              </div>
            )}

          {/* ── Welcome banner ── */}
          <div className="welcome-banner">
            <div className="welcome__text">
              <div className="welcome__greeting">Bonjour</div>
              <div className="welcome__name">
                {firstName.split(" ")[0]}{" "}
                <span>{firstName.split(" ")[1] || ""}</span>
              </div>
              <div className="welcome__sub">
                Apercu complet de vos finances partagees.
              </div>
              <div className="welcome__actions">
                <button className="btn-primary" onClick={() => navigate("/expenses?action=add")}>
                  <PlusIcon width={16} height={16} />
                  Ajouter une depense
                </button>
                <button className="btn-ghost" onClick={handlePrint}>
                  <ArrowDownTrayIcon width={16} height={16} />
                  Exporter PDF
                </button>
              </div>
            </div>
            <div className="welcome__visual">
              {[
                { v: dash.recentExpenses.length,                                    l: "Recentes" },
                { v: dash.recentExpenses.filter((e) => e.status === "settled").length, l: "Deja payees"  },
                { v: dash.recentExpenses.filter((e) => e.status === "pending").length, l: "En attente"  },
              ].map((s) => (
                <div key={s.l} className="welcome-mini-stat">
                  <span className="wms-val">{s.v}</span>
                  <div className="wms-label">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── KPIs ── */}
          <div className="kpi-grid">
            {kpiCards.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} id={k.id} className="dash-kpi">
                  {loading ? (
                    <>
                      <Skeleton h={36} w={36} r={10} mb={12} />
                      <Skeleton h={12} w="60%" mb={8} />
                      <Skeleton h={24} w="80%" mb={6} />
                      <Skeleton h={10} w="50%" />
                    </>
                  ) : (
                    <>
                      <div className="kpi-top">
                        <div className="kpi-icon" style={{ background: k.bg }}>
                          <Icon width={18} height={18} />
                        </div>
                        <span className={`kpi-badge ${k.badge}`}>{k.badgeTxt}</span>
                      </div>
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-value" style={{ color: k.color }}>{k.val}</div>
                      <div className="kpi-sub">{k.sub}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Charts ── */}
          <div className="charts-row">
            <div className="card analytics-card">
              <div className="card-head">
                <div>
                  <div className="card-title">Evolution des depenses</div>
                  <div className="card-sub">Cumulees · jour par jour</div>
                </div>
              </div>
              {loading
                ? <div style={{ padding: "20px 22px" }}><Skeleton h={120} r={8} /></div>
                : <DailyExpensesChart data={dash.dailyExpenses} />}
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Balance des dettes</div>
                  <div className="card-sub">Qui te doit · qui tu dois</div>
                </div>
              </div>
              {loading
                ? <div style={{ padding: "20px 22px" }}><Skeleton h={100} r={8} /></div>
                : <BalanceChart data={dash.balances} />}
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Par categorie</div>
                  <div className="card-sub">Repartition des depenses</div>
                </div>
              </div>
              {loading
                ? <div style={{ padding: "20px 22px" }}><Skeleton h={140} r={8} /></div>
                : <DonutChart data={dash.categories} />}
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Sante du groupe</div>
                  <div className="card-sub">Paiements et categorie dominante</div>
                </div>
              </div>
              {loading ? (
                <div style={{ padding: "20px 22px" }}>
                  <Skeleton h={22} w="50%" mb={8} />
                  <Skeleton h={10} w="100%" r={999} mb={10} />
                  <Skeleton h={50} w="100%" r={8} />
                </div>
              ) : (
                <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>Reglement des depenses</span>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, color: "var(--accent)" }}>
                      {toNumber(dash.statusSummary.settlementRate)}%
                    </span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "rgba(148,163,184,0.2)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, toNumber(dash.statusSummary.settlementRate)))}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #2dd4bf, #3b82f6)",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--gray-500)" }}>
                    <span>En attente: {toNumber(dash.statusSummary.pending)}</span>
                    <span>Deja payees: {toNumber(dash.statusSummary.settled)}</span>
                  </div>

                  <div style={{ marginTop: 6, borderTop: "1px solid var(--gray-100)", paddingTop: 10 }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>Categorie dominante</div>
                    <div style={{ marginTop: 4, fontFamily: "var(--font-head)", fontWeight: 700, color: "var(--text)" }}>
                      {dash.topCategory ? `${dash.topCategory.name} (${toNumber(dash.topCategory.pct)}%)` : "Aucune donnee"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div className="quick-actions">
            {[
              { 
                icon: PlusIcon, 
                bg: "rgba(45,212,191,0.12)",  
                label: "Ajouter depense",
                onClick: () => navigate("/expenses?action=add")
              },
              { 
                icon: HandRaisedIcon, 
                bg: "rgba(59,130,246,0.12)",  
                label: "Regler un solde",
                onClick: () => navigate("/expenses?filter=Pending")
              },
              { 
                icon: UserPlusIcon, 
                bg: "rgba(139,92,246,0.12)",  
                label: "Inviter membre",
                onClick: handleInvite
              },
              { 
                icon: DocumentArrowDownIcon, 
                bg: "rgba(249,115,22,0.12)",  
                label: "Exporter rapport",
                onClick: handlePrint
              },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <div key={q.label} className="qa-btn" onClick={q.onClick} style={{ cursor: 'pointer' }}>
                  <div className="qa-icon" style={{ background: q.bg }}>
                    <Icon width={18} height={18} />
                  </div>
                  <span className="qa-label">{q.label}</span>
                </div>
              );
            })}
          </div>

          {/* ── Bottom row ── */}
          <div className="bottom-row">

            {/* Transactions récentes */}
            <div className="card recent-card">
              <div className="card-head">
                <div>
                  <div className="card-title">Transactions recentes</div>
                  <div className="card-sub">
                    {loading ? "…" : `${dash.recentExpenses.length} dernieres activites`}
                  </div>
                </div>
                <span 
                  className="card-badge" 
                  style={{ cursor: "pointer", color: "var(--accent)", background: "rgba(45,212,191,0.08)" }}
                  onClick={() => navigate("/history")}
                >
                  Voir tout →
                </span>
              </div>

              {loading && (
                <div style={{ padding: "12px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3].map((i) => <Skeleton key={i} h={44} r={8} />)}
                </div>
              )}

              {!loading && dash.recentExpenses.length === 0 && (
                <div style={{ padding: "20px 22px", color: "var(--gray-400)", fontSize: "0.82rem" }}>
                  Aucune transaction
                </div>
              )}

              {!loading && dash.recentExpenses.map((t, i) => {
                const pos = t.iPaid; // j'ai paye → positif pour moi
                return (
                  <div key={i} className="tx-row">
                    <div className="tx-icon" style={{ background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                      {(() => {
                        const Icon = CATEGORY_ICONS[t.category] || CreditCardIcon;
                        return <Icon width={16} height={16} />;
                      })()}
                    </div>
                    <div className="tx-info">
                      <div className="tx-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.title}
                        {t.title?.includes("(Auto)") && (
                          <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 800 }}>AUTO</span>
                        )}
                      </div>
                      <div className="tx-meta">{formatDate(t.date)} · {t.paidByName}</div>
                    </div>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "0.87rem", color: pos ? "#16a34a" : "#dc2626", marginRight: 10 }}>
                      {pos ? "+" : "-"}{toNumber(t.myAmount).toLocaleString("fr-FR")} TND
                    </span>
                    <div className={`tx-status ${t.status}`} />
                  </div>
                );
              })}
            </div>

            {/* Activité des membres */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Activite des membres</div>
                  <div className="card-sub">
                    {loading ? "…" : `Famille · ${dash.members.length} membres`}
                  </div>
                </div>
                <span className="card-badge">{loading ? "…" : `${dash.members.length} membres`}</span>
              </div>

              {loading && (
                <div style={{ padding: "12px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3].map((i) => <Skeleton key={i} h={44} r={8} />)}
                </div>
              )}

              {!loading && dash.members.length === 0 && (
                <div style={{ padding: "20px 22px", color: "var(--gray-400)", fontSize: "0.82rem" }}>
                  Aucun membre trouve
                </div>
              )}

              {!loading && dash.members.map((m, i) => {
                const daysAgo  = toNumber(m.daysAgo);
                const dot      = daysAgo === 0 ? "#22c55e" : daysAgo <= 7 ? "#f97316" : "#ef4444";
                const dotLabel = daysAgo === 0 ? "Auj." : daysAgo < 999 ? `${daysAgo}j` : "—";
                const subLabel = daysAgo === 0
                  ? "Actif aujourd'hui"
                  : daysAgo <= 7
                    ? `Actif il y a ${daysAgo} j`
                    : "Aucune activite recente";

                return (
                  <div key={i} className="tx-row">
                    <div className="bal-avatar" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
                      {initials(m.name)}
                    </div>
                    <div className="tx-info">
                      <div className="tx-name">{m.name || "Membre"}</div>
                      <div className="tx-meta">{subLabel}</div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 10 }}>
                      {m.lastExpense ? (
                        <>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{m.lastExpense.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 1 }}>{toNumber(m.lastExpense.amount).toFixed(2)} TND</div>
                        </>
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "var(--gray-400)" }}>—</div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0, minWidth: 36 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: dot }} />
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: dot, whiteSpace: "nowrap" }}>{dotLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;