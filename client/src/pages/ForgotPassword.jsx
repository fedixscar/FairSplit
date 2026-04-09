import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import "./ForgotPassword.css";

import {
  EnvelopeIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  CheckIcon,
  CheckCircleIcon,
  LinkIcon,
  LockClosedIcon,
  InboxIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const useCursor = () => {
  useEffect(() => {
    const dot  = document.getElementById("fp-cur-dot");
    const ring = document.getElementById("fp-cur-ring");
    if (!dot || !ring) return;

    let rx = 0, ry = 0, mx = 0, my = 0;
    let rafId;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    };
    const animateRing = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      rafId = requestAnimationFrame(animateRing);
    };
    rafId = requestAnimationFrame(animateRing);

    const onDown = () => { dot.classList.add("is-clicking"); ring.classList.add("is-clicking"); };
    const onUp   = () => { dot.classList.remove("is-clicking"); ring.classList.remove("is-clicking"); };

    const addHover = (el) => {
      el.addEventListener("mouseenter", () => { dot.classList.add("is-hovering"); ring.classList.add("is-hovering"); });
      el.addEventListener("mouseleave", () => { dot.classList.remove("is-hovering"); ring.classList.remove("is-hovering"); });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);
    document.querySelectorAll("button, a, input, .fp-back-link").forEach(addHover);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
      cancelAnimationFrame(rafId);
    };
  }, []);
};

/* ============================================================
   FLOATING PARTICLES
   ============================================================ */
const Particles = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 12,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="fp-particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="fp-particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};

/* ============================================================
   STEP 1 — Email input
   ============================================================ */
const StepEmail = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) onSubmit(email.trim());
  };

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <form className="fp-form" onSubmit={handleSubmit} noValidate>
      {/* Icon */}
      <div className="fp-icon-wrap">
        <div className="fp-icon-ring fp-icon-ring--1" />
        <div className="fp-icon-ring fp-icon-ring--2" />
        <div className="fp-icon-blob">
          <EnvelopeIcon width={28} height={28} />
        </div>
      </div>

      <div className="fp-form__header">
        <h1 className="fp-title">Mot de passe oublie ?</h1>
        <p className="fp-subtitle">
          Entre ton adresse email et on t'enverra un lien pour reinitialiser ton mot de passe.
        </p>
      </div>

      {/* Email field */}
      <div className={`fp-field ${focused ? "fp-field--focused" : ""} ${email && isValid ? "fp-field--valid" : ""} ${email && !isValid ? "fp-field--invalid" : ""}`}>
        <label className="fp-field__label" htmlFor="fp-email">Adresse email</label>
        <div className="fp-field__wrap">
          <span className="fp-field__icon">
            <EnvelopeIcon width={16} height={16} />
          </span>
          <input
            ref={inputRef}
            id="fp-email"
            type="email"
            className="fp-field__input"
            placeholder="toi@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="email"
            required
          />
          {email && isValid && (
            <span className="fp-field__check">
              <CheckIcon width={14} height={14} strokeWidth={2.5} />
            </span>
          )}
        </div>
        <div className="fp-field__bar" />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className={`fp-btn-submit ${loading ? "fp-btn-submit--loading" : ""}`}
        disabled={!isValid || loading}
      >
        {loading ? (
          <>
            <span className="fp-spinner" />
            Envoi en cours…
          </>
        ) : (
          <>
            <span>Envoyer le lien</span>
            <PaperAirplaneIcon width={16} height={16} />
          </>
        )}
      </button>

      <div className="fp-hint">
        <InformationCircleIcon width={13} height={13} />
        Le lien expirera dans 15 minutes.
      </div>
    </form>
  );
};

/* ============================================================
   STEP 2 — Success state
   ============================================================ */
const StepSuccess = ({ email, onResend, resendLoading, resendCooldown }) => (
  <div className="fp-success">
    {/* Animated checkmark */}
    <div className="fp-success__icon-wrap">
      <div className="fp-success__ring fp-success__ring--1" />
      <div className="fp-success__ring fp-success__ring--2" />
      <div className="fp-success__check">
        <CheckIcon width={32} height={32} strokeWidth={2.5} className="fp-check-path" />
      </div>
    </div>

    <h2 className="fp-title fp-title--success">Email envoye !</h2>
    <p className="fp-subtitle">
      On a envoye un lien de recuperation a
    </p>
    <div className="fp-success__email">
      <EnvelopeIcon width={14} height={14} />
      {email}
    </div>

    <div className="fp-success__steps">
      {[
        { icon: <InboxIcon width={18} height={18} />,      text: "Verifie ta boite de reception" },
        { icon: <LinkIcon width={18} height={18} />,       text: "Clique sur le lien dans l'email" },
        { icon: <LockClosedIcon width={18} height={18} />, text: "Cree ton nouveau mot de passe" },
      ].map((s, i) => (
        <div key={i} className="fp-success__step" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
          <span className="fp-success__step-icon">{s.icon}</span>
          <span className="fp-success__step-text">{s.text}</span>
        </div>
      ))}
    </div>

    <div className="fp-success__resend">
      <span className="fp-success__resend-label">Tu n'as pas recu l'email ?</span>
      <button
        className="fp-btn-resend"
        onClick={onResend}
        disabled={resendLoading || resendCooldown > 0}
      >
        {resendLoading ? (
          <><span className="fp-spinner fp-spinner--sm" /> Envoi…</>
        ) : resendCooldown > 0 ? (
          `Renvoyer (${resendCooldown}s)`
        ) : (
          "Renvoyer l'email"
        )}
      </button>
    </div>

    <div className="fp-success__spam">
      <LightBulbIcon width={16} height={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
      Pense a verifier ton dossier spam.
    </div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const ForgotPassword = () => {
  const [step, setStep]               = useState("email");
  const [email, setEmail]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useCursor();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendReset = async (emailAddr, isResend = false) => {
    if (isResend) {
      setResendLoading(true);
    } else {
      setLoading(true);
      setError("");
    }

    try {
      await authApi.forgotPassword(emailAddr);

      if (!isResend) {
        setEmail(emailAddr);
        setStep("success");
      }
      setResendCooldown(60);
    } catch (err) {
      if (!isResend) setError(err.message);
    } finally {
      setLoading(false);
      setResendLoading(false);
    }
  };

  return (
    <div className="fp-page">
      {/* Cursors */}
      <div className="fp-cursor__dot"  id="fp-cur-dot" />
      <div className="fp-cursor__ring" id="fp-cur-ring" />

      {/* Background effects */}
      <div className="fp-bg">
        <div className="fp-bg__orb fp-bg__orb--teal" />
        <div className="fp-bg__orb fp-bg__orb--blue" />
        <div className="fp-bg__grid" />
      </div>

      <Particles />

      {/* Card */}
      <div className="fp-card-wrap">
        {/* Logo / back nav */}
        <div className="fp-nav">
          <button className="fp-back-link" onClick={() => navigate("/login")}>
            <ArrowLeftIcon width={16} height={16} strokeWidth={2.5} />
            Retour a la connexion
          </button>

          <div className="fp-logo">
            <span className="fp-logo__name">FairSplit</span>
          </div>
        </div>

        {/* Main card */}
        <div className={`fp-card ${step === "success" ? "fp-card--success" : ""}`}>
          <div className="fp-card__glow" />
          <div className="fp-card__top-line" />

          {/* Error message */}
          {error && (
            <div className="fp-error">
              <ExclamationCircleIcon width={14} height={14} />
              {error}
            </div>
          )}

          {step === "email" ? (
            <StepEmail onSubmit={(e) => sendReset(e)} loading={loading} />
          ) : (
            <StepSuccess
              email={email}
              onResend={() => sendReset(email, true)}
              resendLoading={resendLoading}
              resendCooldown={resendCooldown}
            />
          )}
        </div>

        {/* Footer */}
        <div className="fp-footer">
          Besoin d'aide ? <a href="mailto:fairsplittn@gmail.com">Contacte le support</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;