import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import logo from "../assets/logo.png";
/* ============================================================
   DATA — easy to edit without touching JSX
   ============================================================ */

const FEATURES = [
  {
    icon: "📊",
    colorClass: "lp-feature-icon--teal",
    title: "Tableau de bord en temps réel",
    desc: "Visualisez toutes vos dépenses, votre solde et ceux de votre groupe en un coup d'œil. Graphiques et statistiques inclus.",
  },
  {
    icon: "👥",
    colorClass: "lp-feature-icon--blue",
    title: "Gestion de groupes",
    desc: "Créez des groupes pour votre colocation, vos vacances ou votre famille. Invitez vos membres facilement par lien.",
  },
  {
    icon: "⚖️",
    colorClass: "lp-feature-icon--green",
    title: "Répartition équitable",
    desc: "FairSplit calcule automatiquement qui doit quoi à qui, de manière juste et transparente, sans calculs manuels.",
  },
  {
    icon: "📋",
    colorClass: "lp-feature-icon--purple",
    title: "Historique complet",
    desc: "Retrouvez toutes vos transactions passées, filtrez par date ou catégorie, et exportez vos données à tout moment.",
  },
  {
    icon: "🔔",
    colorClass: "lp-feature-icon--orange",
    title: "Notifications instantanées",
    desc: "Soyez alerté dès qu'une dépense est ajoutée ou qu'un paiement est effectué dans votre groupe.",
  },
  {
    icon: "🔒",
    colorClass: "lp-feature-icon--pink",
    title: "Sécurisé et privé",
    desc: "Vos données financières sont protégées. Seuls les membres de votre groupe peuvent voir vos dépenses partagées.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Créez votre compte",
    desc: "Inscrivez-vous gratuitement en quelques secondes avec votre email.",
  },
  {
    number: "2",
    title: "Créez un groupe",
    desc: "Nommez votre groupe et invitez vos colocataires ou famille.",
  },
  {
    number: "3",
    title: "Ajoutez des dépenses",
    desc: "Enregistrez chaque dépense avec le payeur, le montant et la catégorie.",
  },
  {
    number: "4",
    title: "Soldez en un clic",
    desc: "FairSplit calcule tout. Il ne reste plus qu'à rembourser le bon montant.",
  },
];

const TESTIMONIALS = [
  {
    text: "\"FairSplit a totalement transformé notre vie en colocation. Finis les conflits d'argent, tout est transparent et chacun sait ce qu'il doit.\"",
    name: "Ayoub M.",
    role: "Colocataire à Tunis",
    avatarStyle: { background: "linear-gradient(135deg, #0f2027, #203a43)" },
    initial: "A",
  },
  {
    text: '"Incroyablement simple à utiliser. On gère les courses, le loyer et les sorties en famille sans jamais se prendre la tête avec les chiffres."',
    name: "Sana B.",
    role: "Mère de famille à Sfax",
    avatarStyle: { background: "linear-gradient(135deg, #1a3040, #2c5364)" },
    initial: "S",
  },
  {
    text: "\"L'interface est magnifique et le tableau de bord donne une vue parfaite de nos finances. C'est exactement ce dont on avait besoin pour notre coloc.\"",
    name: "Mohamed K.",
    role: "Étudiant à Sousse",
    avatarStyle: { background: "linear-gradient(135deg, #0f3040, #1e4d5f)" },
    initial: "M",
  },
];

const MOCK_PEOPLE = [
  {
    initial: "A",
    avatarStyle: { background: "rgba(45,212,191,0.15)", color: "#2dd4bf" },
    label: "Ali vous doit",
    amount: "110 TND",
    amountStyle: { color: "#4ade80" },
  },
  {
    initial: "S",
    avatarStyle: { background: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    label: "Sara vous doit",
    amount: "50 TND",
    amountStyle: { color: "#4ade80" },
  },
  {
    initial: "M",
    avatarStyle: { background: "rgba(251,146,60,0.15)", color: "#fb923c" },
    label: "Vous devez à Med",
    amount: "30 TND",
    amountStyle: { color: "#f87171" },
  },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/** Logo SVG — reused in Navbar and Footer */
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

/** Navbar */
const Navbar = () => (
  <nav className="lp-nav">
    <Link to="/" className="lp-nav__logo">
      <div className="logo-icon">
        <img src={logo} alt="logo" />
      </div>
      FairSplit
    </Link>

    <ul className="lp-nav__links">
      <li>
        <a href="#features">Fonctionnalités</a>
      </li>
      <li>
        <a href="#how">Comment ça marche</a>
      </li>
      <li>
        <a href="#testimonials">Avis</a>
      </li>
    </ul>

    <div className="lp-nav__actions">
      <Link to="/login" className="btn--outline">
        Se connecter
      </Link>
      <Link to="/register" className="btn--primary">
        Créer un compte
      </Link>
    </div>
  </nav>
);

/** Hero mock-dashboard card */
const MockDashboardCard = () => (
  <div className="lp-mock-card">
    {/* Header */}
    <div className="lp-mock-card__header">
      <div>
        <div className="lp-mock-card__title">Appartement Tunis</div>
        <div className="lp-mock-card__sub">Janvier 2026 · 4 membres</div>
      </div>
      <div className="lp-mock-card__badge">✓ À jour</div>
    </div>

    {/* Stats */}
    <div className="lp-mock-card__stats">
      <div className="lp-mock-stat">
        <div className="lp-mock-stat__value">1 250</div>
        <div className="lp-mock-stat__label">Total TND</div>
      </div>
      <div className="lp-mock-stat">
        <div className="lp-mock-stat__value lp-mock-stat__value--green">
          +350
        </div>
        <div className="lp-mock-stat__label">Mon solde</div>
      </div>
    </div>

    <div className="lp-mock-card__divider" />

    {/* People */}
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

/** Hero Section */
const HeroSection = () => (
  <section className="lp-hero">
    <div className="lp-hero__grid">
      {/* Left — content */}
      <div className="lp-hero__content">
        <div className="lp-hero__badge">
          <span className="lp-hero__badge-dot" />
          Nouveau · Partage simplifié
        </div>

        <h1 className="lp-hero__title">
          Partagez vos dépenses <em>sans stress</em>, sans conflits.
        </h1>

        <p className="lp-hero__desc">
          FairSplit permet aux colocataires et familles de suivre, répartir et
          solder leurs dépenses communes en quelques clics. Transparent,
          équitable, gratuit.
        </p>

        <div className="lp-hero__cta">
          <Link to="/register" className="btn--cta-main">
            ✦ Commencer gratuitement
          </Link>
          <Link to="/login" className="btn--cta-secondary">
            → Se connecter
          </Link>
        </div>

        <div className="lp-hero__stats">
          {[
            { value: "100%", label: "Gratuit" },
            { value: "0", label: "Calcul manuel" },
            { value: "∞", label: "Groupes" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="lp-stat__value">{stat.value}</div>
              <div className="lp-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — visual */}
      <div className="lp-hero__visual">
        <MockDashboardCard />

        {/* Floating notification cards */}
        <div className="lp-floating-card lp-floating-card--top">
          <div className="lp-float-icon lp-float-icon--green">✓</div>
          <div>
            <div className="lp-float-text__main">Loyer payé</div>
            <div className="lp-float-text__sub">Il y a 5 heures · Ali</div>
          </div>
        </div>

        <div className="lp-floating-card lp-floating-card--bot">
          <div className="lp-float-icon lp-float-icon--blue">🛒</div>
          <div>
            <div className="lp-float-text__main">Courses ajoutées</div>
            <div className="lp-float-text__sub">Il y a 2 heures · Sara</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/** Features Section */
const FeaturesSection = () => (
  <section id="features">
    <div className="lp-section">
      <div className="lp-section-tag">Fonctionnalités</div>
      <h2 className="lp-section-title">
        Tout ce dont vous avez besoin pour gérer vos dépenses partagées
      </h2>
      <p className="lp-section-subtitle">
        Des outils pensés pour rendre le partage d'appartement ou la vie en
        famille financièrement serein.
      </p>

      <div className="lp-features-grid">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="lp-feature-card">
            <div className={`lp-feature-icon ${feature.colorClass}`}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** How It Works Section */
const HowItWorksSection = () => (
  <section id="how" className="lp-how">
    <div className="lp-how__inner">
      <div className="lp-section-tag">Comment ça marche</div>
      <h2 className="lp-section-title">Simple comme bonjour</h2>
      <p className="lp-section-subtitle">
        Commencez à gérer vos dépenses en 4 étapes rapides.
      </p>

      <div className="lp-steps-grid">
        {STEPS.map((step) => (
          <div key={step.number} className="lp-step">
            <div className="lp-step__number">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Testimonials Section */
const TestimonialsSection = () => (
  <section id="testimonials" className="lp-testimonials">
    <div className="lp-testimonials__inner">
      <div className="lp-section-tag">Témoignages</div>
      <h2 className="lp-section-title">Ce qu'en disent nos utilisateurs</h2>
      <p className="lp-section-subtitle">
        Des centaines d'équipes utilisent déjà FairSplit pour vivre ensemble
        sereinement.
      </p>

      <div className="lp-testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="lp-testimonial-card">
            <div className="lp-testimonial-card__stars">★★★★★</div>
            <p className="lp-testimonial-card__text">{t.text}</p>
            <div className="lp-testimonial-card__author">
              <div className="lp-author-avatar" style={t.avatarStyle}>
                {t.initial}
              </div>
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

/** CTA Section */
const CTASection = () => (
  <div className="lp-cta">
    <div className="lp-cta__inner">
      <h2 className="lp-cta__title">
        Prêt à simplifier vos finances partagées ?
      </h2>
      <p className="lp-cta__sub">
        Rejoignez FairSplit gratuitement et dites adieu aux calculs fastidieux
        et aux malentendus financiers.
      </p>
      <div className="lp-cta__buttons">
        <Link to="/register" className="btn--cta-white">
          ✦ Créer un compte gratuit
        </Link>
        <Link to="/login" className="btn--cta-ghost">
          → J'ai déjà un compte
        </Link>
      </div>
    </div>
  </div>
);

/** Footer */
const Footer = () => (
  <footer className="lp-footer">
    <div className="lp-footer__inner">
      <Link to="/" className="lp-footer__logo">
        <LogoIcon size={26} />
        FairSplit
      </Link>
      <span className="lp-footer__copy">
        © 2026 FairSplit Inc. Tous droits réservés.
      </span>
      <div className="lp-footer__links">
        <a href="#">Confidentialité</a>
        <a href="#">Conditions</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </footer>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const LandingPage = () => {
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
