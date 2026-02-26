import React from "react";
import "./Auth.css";
import logo from "../assets/logo.png";
const Auth = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-visual">
          <div className="visual-content">
            <div className="brand-wrapper">
              <div className="logo-icon">
                <img src={logo} alt="logo" />
              </div>
              <span className="brand-name-white">FairSplit</span>
            </div>
            <h1 className="visual-title">Gérez vos dépenses sans stress.</h1>
            <p className="visual-subtitle">
              Rejoignez des milliers d'utilisateurs qui simplifient leurs
              comptes entre amis.
            </p>
          </div>
          <div className="visual-footer">
            &copy; 2026 FairSplit Inc. Tous droits réservés.
          </div>
        </div>
        <div className="auth-form-section">
          <div className="form-header">
            <h2 className="form-title"> Bon retour !</h2>
            {/* <p className="form-subtitle">Veuillez saisir vos identifiants.</p> */}
          </div>

          <form className="auth-form">
            <div className="input-group">
              <label>Adresse Email</label>
              <input type="email" placeholder="nom@exemple.com" required />
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>Mot de passe</label>
                <a href="/forgot" className="forgot-link">
                  Oublié ?
                </a>
              </div>
              <input type="password" placeholder="••••••••" required />
            </div>

            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Se souvenir de moi</label>
            </div>

            <button type="submit" className="login-button">
              Se connecter
            </button>
          </form>

          <div className="form-footer">
            <p>
              Pas encore de compte ?{" "}
              <a href="/signup">S'inscrire gratuitement</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
