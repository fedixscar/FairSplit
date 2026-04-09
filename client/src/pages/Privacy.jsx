import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import "./Legal.css";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="legal-back" onClick={() => navigate(-1)}>
          <ArrowLeftIcon width={16} height={16} />
          Retour
        </button>

        <div className="legal-header">
          <div className="legal-icon">
            <ShieldCheckIcon width={32} height={32} />
          </div>
          <h1>Politique de Confidentialite</h1>
          <p>Derniere mise a jour : 28 Mars 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Chez FairSplit, nous prenons votre vie privee au serieux. Cette politique explique comment nous collectons, utilisons et protegeons vos informations personnelles lorsque vous utilisez notre application de gestion de depenses.
            </p>
          </section>

          <section>
            <h2>2. Collecte des Donnees</h2>
            <p>
              Nous collectons les informations suivantes pour assurer le bon fonctionnement du service :
            </p>
            <ul>
              <li>Informations de compte : Nom, adresse email et mot de passe (hache).</li>
              <li>Donnees financieres : Montants des depenses, descriptions et repartitions entre membres.</li>
              <li>Contenu utilisateur : Photos de recus (si telecharges).</li>
            </ul>
          </section>

          <section>
            <h2>3. Utilisation des Donnees</h2>
            <p>
              Vos donnees sont utilisees exclusivement pour :
            </p>
            <ul>
              <li>Calculer les balances entre les membres de vos groupes.</li>
              <li>Vous envoyer des notifications liees a vos depenses et paiements.</li>
              <li>Securiser votre compte et prevenir la fraude.</li>
            </ul>
          </section>

          <section>
            <h2>4. Partage des Informations</h2>
            <p>
              FairSplit ne vend jamais vos donnees a des tiers. Vos depenses et votre nom ne sont visibles que par les membres des groupes auxquels vous appartenez.
            </p>
          </section>

          <section>
            <h2>5. Vos Droits</h2>
            <p>
              Vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees. Vous pouvez supprimer votre compte a tout moment depuis les reglages de l'application, ce qui entrainera l'anonymisation de vos transactions passees.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              Pour toute question concernant vos donnees, contactez-nous a : fairsplittn@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
