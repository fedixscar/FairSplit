import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import logo from "../assets/logo.png";

import {
  ChartBarIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

import { CheckBadgeIcon, SparklesIcon, ArrowRightIcon, UserPlusIcon, UserGroupIcon, PlusCircleIcon, BanknotesIcon } from "@heroicons/react/24/solid";

/* ============================================================
   SCROLL REVEAL HOOK
   ============================================================ */
function useScrollReveal() {
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
        }
      });
    }, options);

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);
}

/* ============================================================
   DATA
   ============================================================ */
const FEATURES = [
  {
    icon: <ChartBarIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--teal",
    title: "Tableau de bord en temps reel",
    desc: "Visualise toutes tes depenses, ton solde et ceux de ton groupe en un coup d'oeil. Graphiques et stats inclus.",
  },
  {
    icon: <UserGroupIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--blue",
    title: "Gestion de groupes",
    desc: "Cree des groupes pour ta coloc, tes vacances ou ta famille. Invite tes membres facilement par lien.",
  },
  {
    icon: <ScaleIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--green",
    title: "Repartition equitable",
    desc: "FairSplit calcule tout seul qui doit quoi a qui, de maniere juste et transparente, sans calcul manuel.",
  },
  {
    icon: <ClipboardDocumentListIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--purple",
    title: "Historique complet",
    desc: "Retrouve toutes tes transactions passees, filtre par date ou categorie, et exporte tes donnees quand tu veux.",
  },
  {
    icon: <BellIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--orange",
    title: "Notifications instantanees",
    desc: "Sois alerte des qu'une depense est ajoutee ou qu'un paiement est fait dans ton groupe.",
  },
  {
    icon: <LockClosedIcon width={24} height={24} />,
    colorClass: "lp-feature-icon--pink",
    title: "Securise et prive",
    desc: "Tes donnees sont protegees. Seuls les membres de ton groupe peuvent voir les depenses partagees.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Cree ton compte",
    desc: "Inscris-toi gratuitement en quelques secondes avec ton email.",
  },
  {
    number: "2",
    title: "Cree un groupe",
    desc: "Nomme ton groupe et invite tes colocataires ou ta famille.",
  },
  {
    number: "3",
    title: "Ajoute des depenses",
    desc: "Enregistre chaque depense avec le payeur, le montant et la categorie.",
  },
  {
    number: "4",
    title: "Solde en un clic",
    desc: "FairSplit calcule tout. Il ne reste plus qu'a rembourser le bon montant.",
  },
];

const TESTIMONIALS = [
  {
    text: "\"FairSplit a totalement transforme notre vie en coloc. Finis les conflits d'argent, tout est transparent et chacun sait ce qu'il doit.\"",
    name: "Fedi Y.",
    role: "Colocataire a Tunis",
    avatarStyle: { background: "linear-gradient(135deg, #0f2027, #203a43)" },
    initial: "A",
  },
  {
    text: '"Incroyablement simple a utiliser. On gere les courses, le loyer et les sorties en famille sans jamais se prendre la tete avec les chiffres."',
    name: "Adem B.",
    role: "Pere de famille a Sfax",
    avatarStyle: { background: "linear-gradient(135deg, #1a3040, #2c5364)" },
    initial: "S",
  },
  {
    text: "\"L'interface est magnifique et le tableau de bord donne une vue parfaite de nos finances. C'est exactement ce dont on avait besoin pour notre coloc.\"",
    name: "R B.",
    role: "Etudiant a Manar",
    avatarStyle: { background: "linear-gradient(135deg, #0f3040, #1e4d5f)" },
    initial: "M",
  },
];

const MOCK_PEOPLE = [
  {
    initial: "F",
    avatarStyle: { background: "rgba(45,212,191,0.15)", color: "#2dd4bf" },
    label: "Fedi te doit",
    amount: "110 TND",
    amountStyle: { color: "#4ade80" },
  },
  {
    initial: "A",
    avatarStyle: { background: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    label: "Aziz te doit",
    amount: "50 TND",
    amountStyle: { color: "#4ade80" },
  },
  {
    initial: "Y",
    avatarStyle: { background: "rgba(251,146,60,0.15)", color: "#fb923c" },
    label: "Tu dois a Yassine",
    amount: "30 TND",
    amountStyle: { color: "#f87171" },
  },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
const LogoIcon = ({ size = 34 }) => (
  <svg
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
  >
    <circle cx="17" cy="17" r="17" fill="rgba(255,255,255,0.08)" />
    <path
      d="M17 8L25 14V26H9V14L17 8Z"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M13 26V20H21V26"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="21" cy="13" r="4" fill="rgba(45,212,191,0.7)" />
    <path
      d="M19.5 13H22.5M21 11.5V14.5"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const Navbar = () => (
  <nav className="lp-nav">
    <Link to="/" className="lp-nav__logo">
      <div className="logo-icon">
        <img src={logo} alt="logo" />
      </div>
      FairSplit
    </Link>

    <ul className="lp-nav__links">
      <li><a href="#features">Fonctionnalites</a></li>
      <li><a href="#how">Comment ca marche</a></li>
      <li><a href="#testimonials">Avis</a></li>
    </ul>

    <div className="lp-nav__actions">
      <Link to="/login"  className="btn--outline">Se connecter</Link>
      <Link to="/signup" className="btn--primary">Creer un compte</Link>
    </div>
  </nav>
);

const MockDashboardCard = () => (
  <div className="lp-mock-card">
    <div className="lp-mock-card__header">
      <div>
        <div className="lp-mock-card__title">Appartement Tunis</div>
        <div className="lp-mock-card__sub">Janvier 2026 · 4 membres</div>
      </div>
      <div className="lp-mock-card__badge">
        <CheckBadgeIcon width={14} height={14} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
        A jour
      </div>
    </div>

    <div className="lp-mock-card__stats">
      <div className="lp-mock-stat">
        <div className="lp-mock-stat__value">1 250</div>
        <div className="lp-mock-stat__label">Total TND</div>
      </div>
      <div className="lp-mock-stat">
        <div className="lp-mock-stat__value lp-mock-stat__value--green">+350</div>
        <div className="lp-mock-stat__label">Mon solde</div>
      </div>
    </div>

    <div className="lp-mock-card__divider" />

    <div className="lp-mock-card__people">
      {MOCK_PEOPLE.map((person) => (
        <div key={person.initial + person.label} className="lp-mock-person">
          <div className="lp-mock-person__info">
            <div className="lp-mock-avatar" style={person.avatarStyle}>
              {person.initial}
            </div>
            <div className="lp-mock-person__name">{person.label}</div>
          </div>
          <div className="lp-mock-person__amount" style={person.amountStyle}>
            {person.amount}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HeroSection = () => (
  <header className="lp-hero">
    <div className="lp-hero__grid">
      <div className="lp-hero__content">
        <div className="lp-hero__badge">
          <span className="lp-hero__badge-dot" />
          Nouveau · Partage simplifie
        </div>

        <h1 className="lp-hero__title">
          Partagez vos depenses <em>sans stress</em>, sans conflits.
        </h1>

        <p className="lp-hero__desc">
          FairSplit permet aux colocataires et familles de suivre, repartir et
          solder leurs depenses communes en quelques clics. Transparent,
          equitable, gratuit.
        </p>

        <div className="lp-hero__cta">
          <Link to="/signup" className="btn--cta-main">
            <SparklesIcon width={16} height={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Commencer gratuitement
          </Link>
          <Link to="/login" className="btn--cta-secondary">
            <ArrowRightIcon width={15} height={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Se connecter
          </Link>
        </div>

        <div className="lp-hero__stats">
          {[
            { value: "100%", label: "Gratuit" },
            { value: "0",    label: "Calcul manuel" },
            { value: "∞",    label: "Groupes" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="lp-stat__value">{stat.value}</div>
              <div className="lp-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-hero__visual">
        <MockDashboardCard />

        <div className="lp-floating-card lp-floating-card--top">
          <div className="lp-float-icon lp-float-icon--green">
            <CheckCircleIcon width={18} height={18} />
          </div>
          <div>
            <div className="lp-float-text__main">Loyer paye</div>
            <div className="lp-float-text__sub">Il y a 5 heures · Rayen</div>
          </div>
        </div>

        <div className="lp-floating-card lp-floating-card--bot">
          <div className="lp-float-icon lp-float-icon--blue">
            <ShoppingCartIcon width={18} height={18} />
          </div>
          <div>
            <div className="lp-float-text__main">Courses ajoutees</div>
            <div className="lp-float-text__sub">Il y a 2 heures · Adem</div>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const FeaturesSection = () => {
  return (
    <section id="features">
      <div className="lp-section">
        <div className="lp-section-tag">Fonctionnalites</div>
        <h2 className="lp-section-title">
          Tout ce dont vous avez besoin pour gerer vos depenses partagees
        </h2>
        <p className="lp-section-subtitle">
          Des outils penses pour rendre le partage d'appartement ou la vie en
          famille financierement serein.
        </p>

        <div className="lp-features-grid">
          {FEATURES.map((feature, idx) => (
            <div key={feature.title} className="lp-feature-card">
              <div className={`lp-feature-icon ${feature.colorClass}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <span className="lp-card-bar">En savoir plus</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  return (
    <section id="how" className="lp-how">
      <div className="lp-how__inner">
        <div className="lp-section-tag">Comment ca marche</div>
        <h2 className="lp-section-title">Simple comme bonjour</h2>
        <p className="lp-section-subtitle">
          Commencez a gerer vos depenses en 4 etapes rapides.
        </p>
        <div className="lp-steps-grid">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="lp-step" style={{ '--idx': idx }} data-idx={idx}>
              <div className="lp-step__number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => (
  <section id="testimonials" className="lp-testimonials">
    <div className="lp-testimonials__inner">
      <div className="lp-section-tag">Temoignages</div>
      <h2 className="lp-section-title">Ce qu'en disent nos utilisateurs</h2>
      <p className="lp-section-subtitle">
        Des centaines d'equipes utilisent deja FairSplit pour vivre ensemble sereinement.
      </p>

      <div className="lp-testimonials-grid">
        {TESTIMONIALS.map((t, idx) => (
          <div key={t.name} className="lp-testimonial-card">
            {/* ★★★★★ → 5× StarIcon solid */}
            <div className="lp-testimonial-card__stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  width={14}
                  height={14}
                  style={{ display: "inline", fill: "#facc15", stroke: "none", marginRight: 1 }}
                />
              ))}
            </div>
            <p className="lp-testimonial-card__text">{t.text}</p>
            <div className="lp-testimonial-card__author">
              <div className="lp-author-avatar" style={t.avatarStyle}>{t.initial}</div>
              <div>
                <div className="lp-author__name">{t.name}</div>
                <div className="lp-author__role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <div className="lp-cta">
    <div className="lp-cta__inner">
      <h2 className="lp-cta__title">
        Pret a simplifier vos finances partagees ?
      </h2>
      <p className="lp-cta__sub">
        Rejoignez FairSplit gratuitement et dites adieu aux calculs fastidieux et aux malentendus financiers.
      </p>
      <div className="lp-cta__buttons">
        <Link to="/signup" className="btn--cta-white">
          <SparklesIcon width={15} height={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Creer un compte gratuit
        </Link>
        <Link to="/login" className="btn--cta-ghost">
          <ArrowRightIcon width={15} height={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          J'ai deja un compte
        </Link>
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="lp-footer">
    <div className="lp-footer__inner">
      <Link to="/" className="lp-footer__logo">
        <LogoIcon size={26} />
        FairSplit
      </Link>
      <span className="lp-footer__copy">© 2026 FairSplit Inc. Tout droits reserves.</span>
      <div className="lp-footer__links">
        <Link to="/privacy">Confidentialite</Link>
        <Link to="/conditions">Conditions</Link>
        <a href="mailto:fairsplittn@gmail.com">Contact</a>
      </div>
    </div>
  </footer>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const LandingPage = () => {
  useScrollReveal();
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;