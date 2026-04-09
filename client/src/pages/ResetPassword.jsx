import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as authApi from "../api/auth";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(token) && password.length >= 6 && confirmPassword.length >= 6;
  }, [token, password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Lien invalide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-card">
        <div className="rp-brand">FairSplit</div>

        {!success ? (
          <>
            <h1 className="rp-title">Nouveau mot de passe</h1>
            <p className="rp-subtitle">
              Entre ton nouveau mot de passe pour finaliser la reinitialisation.
            </p>

            <form className="rp-form" onSubmit={handleSubmit} noValidate>
              <label className="rp-label" htmlFor="new-password">
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                className="rp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caracteres"
                autoComplete="new-password"
              />

              <label className="rp-label" htmlFor="confirm-password">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                type="password"
                className="rp-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retape le mot de passe"
                autoComplete="new-password"
              />

              {error && <div className="rp-error">{error}</div>}

              <button type="submit" className="rp-btn" disabled={!canSubmit || loading}>
                {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
              </button>
            </form>

            <Link to="/login" className="rp-link">
              Retour a la connexion
            </Link>
          </>
        ) : (
          <div className="rp-success">
            <h2>Mot de passe mis a jour</h2>
            <p>Redirection vers la page de connexion...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
