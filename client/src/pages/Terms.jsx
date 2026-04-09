import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import "./Legal.css";

const Terms = () => {
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
            <DocumentTextIcon width={32} height={32} />
          </div>
          <h1>Conditions d'Utilisation</h1>
          <p>Derniere mise a jour : 28 Mars 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Acceptation des Conditions</h2>
            <p>
              En creant un compte sur FairSplit, vous acceptez d'etre lie par ces conditions d'utilisation. Si vous n'etes pas d'accord, vous ne devez pas utiliser l'application.
            </p>
          </section>

          <section>
            <h2>2. Description du Service</h2>
            <p>
              FairSplit est un outil gratuit de suivi et de partage de depenses entre membres d'un groupe. Le service est fourni "en l'etat" sans garantie de disponibilite continue.
            </p>
          </section>

          <section>
            <h2>3. Responsabilite de l'Utilisateur</h2>
            <p>
              Vous etes seul responsable de la confidentialite de vos identifiants de connexion et de toutes les activites liees a votre compte.
            </p>
            <ul>
              <li>Vous vous engagez a fournir des informations exactes.</li>
              <li>Vous n'utiliserez pas le service a des fins illegales.</li>
              <li>Vous respecterez les autres membres de vos groupes.</li>
            </ul>
          </section>

          <section>
            <h2>4. Paiements et Remboursements</h2>
            <p>
              FairSplit facilite le calcul des dettes mais n'est pas un processeur de paiement. Les transferts d'argent reel se font en dehors de l'application. FairSplit n'est pas responsable des litiges financiers entre utilisateurs.
            </p>
          </section>

          <section>
            <h2>5. Propriete Intellectuelle</h2>
            <p>
              Tout le contenu de l'application (logos, design, code) est la propriete de FairSplit. Toute reproduction non autorisee est interdite.
            </p>
          </section>

          <section>
            <h2>6. Modification des Conditions</h2>
            <p>
              Nous nous reservons le droit de modifier ces conditions a tout moment. Vous serez informe de tout changement majeur par email ou via une notification dans l'application.
            </p>
          </section>

          <section>
            <h2>7. Contact Support</h2>
            <p>
              Pour toute assistance technique, veuillez contacter notre equipe : fairsplittn@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
