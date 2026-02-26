import React from "react";
import "./Auth.css"; // On réutilise le même CSS pour la cohérence
import logo from "../assets/logo.png";
const Signup = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Section Gauche : Visuel (Identique au Login) */}
        <div className="auth-visual signup-gradient">
          <div className="visual-content">
            <div className="brand-wrapper">
              <div className="logo-icon">
                <img src={logo} alt="logo" />
              </div>
              <span className="brand-name-white">FairSplit</span>
            </div>
            <h1 className="visual-title">
              Commencez l'aventure dès maintenant.
            </h1>
            <p className="visual-subtitle">
              Créez un compte gratuitement et gérez vos comptes entre amis en
              quelques clics.
            </p>
          </div>
          <div className="visual-footer">
            &copy; 2026 FairSplit Inc. Tous droits réservés.
          </div>
        </div>

        {/* Section Droite : Formulaire Sign Up */}
        <div className="auth-form-section">
          <div className="form-header">
            <h2 className="form-title">Créer un compte</h2>
            <p className="form-subtitle">
              Rejoignez-nous pour simplifier vos dépenses.
            </p>
          </div>

          <form className="auth-form">
            <div className="input-group">
              <label>Nom complet</label>
              <input type="text" placeholder="John Doe" required />
            </div>

            <div className="input-group">
              <label>Adresse Email</label>
              <input type="email" placeholder="nom@exemple.com" required />
            </div>

            <div className="input-group">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••" required />
            </div>

            <button type="submit" className="login-button signup-btn">
              S'inscrire
            </button>
          </form>

          <div className="form-footer">
            <p>
              Déjà un compte ? <a href="/login">Se connecter</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
