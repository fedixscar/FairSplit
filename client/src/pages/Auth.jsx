import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import "./Auth.css";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/expenses");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* Ambient background orbs */}
      <div className="auth-orb auth-orb--teal" />
      <div className="auth-orb auth-orb--blue" />

      {/* Dot grid */}
      <div className="auth-grid" />

      <div className="auth-card">

        {/* ── Left visual panel ── */}
        <div className="auth-visual">

          <div className="auth-visual__glow" />

          <div className="auth-visual__top">
            <a href="/" className="auth-brand">
              <div className="auth-logo-icon">
                <img src={logo} alt="logo" />
              </div>
              <span className="auth-brand__name">FairSplit</span>
            </a>

            <div className="auth-visual__badge">
              <span className="auth-visual__badge-dot" />
              Acces securise
            </div>

            <h1 className="auth-visual__title">
              Gerez vos depenses <em>sans stress.</em>
            </h1>

            <p className="auth-visual__subtitle">
              Rejoins des milliers de gens qui simplifient leurs
              comptes entre amis et en famille.
            </p>

            {/* Stats row */}
            <div className="auth-stats">
              <div className="auth-stat">
                <span className="auth-stat__value">10k+</span>
                <span className="auth-stat__label">Gens</span>
              </div>
              <div className="auth-stat__divider" />
              <div className="auth-stat">
                <span className="auth-stat__value">100%</span>
                <span className="auth-stat__label">Gratuit</span>
              </div>
              <div className="auth-stat__divider" />
              <div className="auth-stat">
                <span className="auth-stat__value">∞</span>
                <span className="auth-stat__label">Groupes</span>
              </div>
            </div>
          </div>

          {/* Floating mock cards */}
          <div className="auth-mock-card">
            <div className="auth-mock-card__header">
              <div className="auth-mock-card__title">Appartement Tunis</div>
              <div className="auth-mock-card__badge">A jour</div>
            </div>
            <div className="auth-mock-card__row">
              <div className="auth-mock-avatar" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>F</div>
              <span className="auth-mock-card__name">Fedi te doit</span>
              <span className="auth-mock-card__amount auth-mock-card__amount--green">+110 TND</span>
            </div>
            <div className="auth-mock-card__row">
              <div className="auth-mock-avatar" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>A</div>
              <span className="auth-mock-card__name">Aziz te doit</span>
              <span className="auth-mock-card__amount auth-mock-card__amount--green">+50 TND</span>
            </div>
            <div className="auth-mock-card__row">
              <div className="auth-mock-avatar" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>Y</div>
              <span className="auth-mock-card__name">Tu dois a Yassine</span>
              <span className="auth-mock-card__amount auth-mock-card__amount--red">-30 TND</span>
            </div>
          </div>

          <div className="auth-visual__footer">
            © 2026 FairSplit Inc. Tout droits reserves.
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-form-section">

          <div className="auth-form-section__inner">
            <div className="auth-form__header">
              <h2 className="auth-form__title">Bon retour !</h2>
              <p className="auth-form__subtitle">Connecte-toi a ton espace.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>

              {/* Email */}
              <div className={`auth-input-group ${focused === "email" ? "auth-input-group--focused" : ""}`}>
                <label htmlFor="email">Adresse Email</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                    <path d="M2.5 6.5l7.5 5 7.5-5M2.5 5h15a1 1 0 011 1v8a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`auth-input-group ${focused === "password" ? "auth-input-group--focused" : ""}`}>
                <div className="auth-label-row">
                  <label htmlFor="password">Mot de passe</label>
                  <a href="/forgot" className="auth-forgot-link">Oublie ?</a>
                </div>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M3 3l14 14M8.5 8.6A2 2 0 0011.4 11.5M6.1 6.2C4.8 7.1 3.7 8.4 3 10c1.5 3.4 5 5.5 7 5.5 1.3 0 2.6-.4 3.7-1.1M10 4.5c2 0 5.5 2.1 7 5.5-.4.9-1 1.7-1.6 2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M10 4.5C5 4.5 1.7 9.2 1.7 10S5 15.5 10 15.5s8.3-4.7 8.3-5.5S15 4.5 10 4.5z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="auth-remember">
                <label className="auth-checkbox-label">
                  <input type="checkbox" id="remember" />
                  <span className="auth-checkbox-custom" />
                  Se souvenir de moi
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  color: "#f87171",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(248,113,113,0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(248,113,113,0.2)"
                }}>
                  <ExclamationTriangleIcon width={14} height={14} style={{ marginRight: 6 }} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                <span>{loading ? "Connexion..." : "Se connecter"}</span>
                {loading ? (
                  <svg viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M10 3a7 7 0 017 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>ou</span>
            </div>

            <div className="auth-form__footer">
              <p>
                Pas de compte ?{" "}
                <a href="/signup">S'inscrire gratuitement</a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
