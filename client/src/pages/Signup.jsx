import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import "./Auth.css";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  // --- Etats du formulaire ---
  const [focused, setFocused] = useState(null);       // Gere l'effet de focus sur les inputs
  const [showPassword, setShowPassword] = useState(false); // Bascule la visibilite du mot de passe
  const [agreed, setAgreed] = useState(false);       // Acceptation des conditions
  const [formData, setFormData] = useState({ name: "", email: "", password: "" }); // Donnees saisies
  const [error, setError] = useState("");            // Message d'erreur eventuel
  const [loading, setLoading] = useState(false);      // Etat de chargement de la requete

  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * Gere la soumission du formulaire d'inscription
   * @param {Event} e - L'evenement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Appel a la fonction register du contexte d'authentification
      await register(formData.name, formData.email, formData.password);
      // Redirection vers le tableau de bord apres succes
      navigate("/expenses");
    } catch (err) {
      // Affichage de l'erreur retournee par l'API
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* Orbes décoratives d'arrière-plan */}
      <div className="auth-orb auth-orb--teal" />
      <div className="auth-orb auth-orb--blue" />

      {/* Grille de points décorative */}
      <div className="auth-grid" />

      <div className="auth-card">

        {/* ── Section Visuelle (Gauche) ── */}
        <div className="auth-visual auth-visual--signup">

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
              Inscription gratuite
            </div>

            <h1 className="auth-visual__title">
              Commence l'aventure <em>des maintenant.</em>
            </h1>

            <p className="auth-visual__subtitle">
              Cree un compte gratuitement et gere tes comptes entre amis
              en quelques clics. Aucune carte requise.
            </p>

            {/* Liste des avantages cles */}
            <div className="auth-visual__pills">
              <div className="auth-pill">100% Gratuit</div>
              <div className="auth-pill">Groupes illimites</div>
              <div className="auth-pill">Calcul automatique</div>
            </div>
          </div>

          {/* Apercu des etapes d'utilisation */}
          <div className="auth-steps">
            {[
              { n: "1", label: "Cree ton compte" },
              { n: "2", label: "Cree un groupe" },
              { n: "3", label: "Ajoute des depenses" },
              { n: "4", label: "Solde en un clic" },
            ].map((step, i) => (
              <div key={step.n} className="auth-step">
                <div className="auth-step__number">{step.n}</div>
                {i < 3 && <div className="auth-step__line" />}
                <span className="auth-step__label">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-visual__footer">
            © 2026 FairSplit Inc. Tous droits reserves.
          </div>
        </div>

        {/* ── Section Formulaire (Droite) ── */}
        <div className="auth-form-section">
          <div className="auth-form-section__inner">

            <div className="auth-form__header">
              <h2 className="auth-form__title">Cree un compte</h2>
              <p className="auth-form__subtitle">
                Rejoins-nous pour simplifier tes depenses.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>

              {/* Champ : Nom complet */}
              <div className={`auth-input-group ${focused === "name" ? "auth-input-group--focused" : ""}`}>
                <label htmlFor="name">Nom complet</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Champ : Email */}
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

              {/* Champ : Mot de passe */}
              <div className={`auth-input-group ${focused === "password" ? "auth-input-group--focused" : ""}`}>
                <label htmlFor="password">Mot de passe</label>
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
                  {/* Bouton pour afficher/masquer le mot de passe */}
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

              {/* Case à cocher : Acceptation des conditions */}
              <div className="auth-remember">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span className="auth-checkbox-custom" />
                  J'accepte la{" "}
                  <a href="/privacy" className="auth-terms-link">
                    politique de confidentialite
                  </a>{" "}
                  et les{" "}
                  <a href="/conditions" className="auth-terms-link">
                    conditions d'utilisation
                  </a>
                </label>
              </div>

              {/* Message d'erreur dynamique */}
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

              {/* Bouton de soumission */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={!agreed || loading}
                style={{ opacity: agreed && !loading ? 1 : 0.5, pointerEvents: agreed && !loading ? "auto" : "none" }}
              >
                <span>{loading ? "Creation en cours..." : "Creer mon compte"}</span>
                {loading ? (
                  <svg viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M10 3a7 7 0 017 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </button>

            </form>

            {/* Separateur alternatif */}
            <div className="auth-divider"><span>ou</span></div>

            <div className="auth-form__footer">
              <p>
                Deja un compte ?{" "}
                <a href="/login">Se connecter</a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
