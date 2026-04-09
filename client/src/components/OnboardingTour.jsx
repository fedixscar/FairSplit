import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as reactJoyrideModule from 'react-joyride';
const Joyride = reactJoyrideModule.default || reactJoyrideModule.Joyride || reactJoyrideModule;
const { ACTIONS, EVENTS, STATUS } = reactJoyrideModule;
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  ExclamationTriangleIcon, 
  HandRaisedIcon, 
  BanknotesIcon, 
  UserGroupIcon, 
  Cog6ToothIcon, 
  ClockIcon,
  HomeIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// --- Styles constants ---
const COLORS = {
  primary: '#2dd4bf', // Teal-400
  secondary: '#1e293b', // Slate-800
  text: '#f8fafc', // Slate-50
  textMuted: '#94a3b8', // Slate-400
  background: '#0f172a', // Slate-900
};

/**
 * Custom Tooltip Component
 * Uses Joyride's provided props to ensure internal logic works (Next, Back, Skip)
 */
const Tooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  isLastStep,
  size,
  tooltipProps,
  // Custom props passed via tooltipComponent
  dontShowAgain,
  onToggleDontShow,
  navigate // Pass navigate to handle redirection
}) => {
  // Joyride passes some style-related props that should not be on DOM elements
  // We only extract the essential ARIA and functional props
  const cleanTooltipProps = {
    'aria-modal': tooltipProps['aria-modal'],
    'role': tooltipProps.role,
    'id': tooltipProps.id,
  };

  // Buttons cleaning: only keep onClick and other safe button attributes
  const cleanButtonProps = (props) => {
    if (!props) return {};
    const { 
      borderRadius, primaryColor, mainColor, textColor, backgroundColor,
      secondaryColor, skipButtonColor, closeButtonColor, nextButtonColor, backButtonColor,
      ...safe
    } = props;
    return safe;
  };

  const cleanPrimaryProps = cleanButtonProps(primaryProps);
  const cleanBackProps = cleanButtonProps(backProps);
  const cleanSkipProps = cleanButtonProps(skipProps);
  
  // Extra styles from Joyride
  const joyrideStyle = tooltipProps?.style || {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      {...cleanTooltipProps}
      style={{
        backgroundColor: COLORS.secondary,
        color: COLORS.text,
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '380px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'inherit',
        ...joyrideStyle
      }}
    >
      {step.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          {step.icon && <step.icon width={22} height={22} style={{ color: COLORS.primary }} />}
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: COLORS.primary }}>
            {step.title}
          </h4>
        </div>
      )}
      
      <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: COLORS.textMuted, marginBottom: '20px' }}>
        {step.content}
      </div>

      {/* Bouton de redirection si pas de groupe */}
      {step.isNoGroup && (
        <button
          onClick={(e) => {
            if (closeProps && typeof closeProps.onClick === 'function') {
              closeProps.onClick(e); // Passer l'événement pour éviter l'erreur preventDefault
            }
            navigate('/group');   // Aller vers les groupes
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: COLORS.primary,
            color: COLORS.background,
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 12px ${COLORS.primary}40`
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <polyline points="23 7 16 14 12 10"></polyline>
          </svg>
          Rejoindre un groupe
        </button>
      )}

      {/* "Don't show again" option on the first step - Only show on auto-run, not manual help */}
      {index === 0 && step.showCheckbox && (
        <div 
          onClick={(e) => onToggleDontShow(e)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px', 
            cursor: 'pointer',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s',
            userSelect: 'none',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div
            style={{ 
              width: '20px', 
              height: '20px', 
              borderRadius: '6px',
              border: `2px solid ${dontShowAgain ? COLORS.primary : 'rgba(255,255,255,0.3)'}`,
              backgroundColor: dontShowAgain ? COLORS.primary : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              pointerEvents: 'none'
            }}
          >
            {dontShowAgain && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <span style={{ fontSize: '0.9rem', color: COLORS.text, fontWeight: 600, pointerEvents: 'none' }}>
            Ne plus afficher ce guide
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Progress indicator */}
        <span style={{ fontSize: '0.8rem', color: COLORS.textMuted, fontWeight: 600 }}>
          {index + 1} / {size}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isLastStep && (
            <button {...cleanSkipProps} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Passer
            </button>
          )}
          
          {index > 0 && (
            <button {...cleanBackProps} style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: COLORS.text, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              Retour
            </button>
          )}

          <button {...cleanPrimaryProps} style={{ padding: '8px 20px', borderRadius: '10px', background: COLORS.primary, border: 'none', color: COLORS.background, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${COLORS.primary}40` }}>
            {isLastStep ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const OnboardingTour = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { familyId } = useAuth();
  const [run, setRun] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Configuration des étapes par page
  const pageSteps = useMemo(() => {
    const common = { disableBeacon: true };

    // Si l'utilisateur n'est pas sur /group ou /settings et n'a pas de groupe
    const noGroupActive = !familyId && !['/group', '/settings'].includes(location.pathname);

    if (noGroupActive) {
      return [
        {
          target: 'body',
          placement: 'center',
          icon: ExclamationTriangleIcon,
          title: 'Action requise',
          content: 'Vous devez d\'abord rejoindre ou créer un groupe pour voir les éléments de cette page.',
          isNoGroup: true,
          ...common
        }
      ];
    }
    
    const stepsConfig = {
      '/dashboard': [
        {
          target: 'body',
          placement: 'center',
          icon: HomeIcon,
          title: 'Bienvenue sur votre Tableau de Bord !',
          content: 'C\'est ici que vous pouvez suivre l\'état de vos finances partagées en un coup d\'œil.',
          showCheckbox: true,
          ...common
        },
        {
          target: '#kpi-total-share',
          icon: CreditCardIcon,
          title: 'Ma part totale des dépenses',
          content: 'Ce montant représente la somme de toutes vos parts individuelles dans les dépenses effectuées ce mois-ci.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#kpi-owed-to-me',
          icon: UserGroupIcon,
          title: 'On te doit',
          content: 'C\'est l\'argent total que les autres membres du groupe doivent vous rembourser pour les dépenses que vous avez avancées.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#kpi-i-owe',
          icon: CreditCardIcon,
          title: 'Tu dois',
          content: 'C\'est le montant que vous devez rembourser aux autres membres pour les dépenses qu\'ils ont payées pour vous.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#kpi-net-balance',
          icon: BanknotesIcon,
          title: 'Ton solde net',
          content: 'C\'est votre balance globale. Si elle est positive (+), on vous doit plus que ce que vous devez. Si elle est négative (-), vous avez des dettes à régler.',
          placement: 'bottom',
          ...common
        },
        {
          target: '.charts-row',
          icon: ClockIcon,
          title: 'Analyses Visuelles',
          content: 'Consultez l\'évolution de vos dépenses quotidiennes et la répartition par catégorie pour mieux gérer votre budget.',
          placement: 'top',
          ...common
        },
        {
            target: '.nav-dashboard',
            title: 'Navigation Rapide',
            content: 'Utilisez la barre latérale pour naviguer entre vos dépenses, vos groupes et vos amis.',
            placement: 'right',
            ...common
          },
          {
            target: '.quick-actions',
            title: 'Actions Rapides',
            content: 'Accédez rapidement aux fonctions essentielles : ajouter une dépense, régler un solde ou inviter un membre.',
            placement: 'top',
            ...common
          },
          {
            target: '.recent-card',
            title: 'Dernières Activités',
            content: 'Retrouvez ici vos dernières transactions et suivez l\'activité récente de votre groupe.',
            placement: 'top',
            ...common
          }
        ],
      '/expenses': [
        {
          target: 'body',
          placement: 'center',
          icon: BanknotesIcon,
          title: 'Gestion des Dépenses',
          content: 'Ici, vous pouvez voir, ajouter et gérer toutes les dépenses de votre groupe.',
          showCheckbox: true,
          ...common
        },
        {
          target: '.btn--add-expense',
          title: 'Ajouter une dépense',
          content: 'Cliquez ici pour enregistrer un nouvel achat. Vous pourrez choisir qui a payé et comment répartir les frais.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#exp-kpi-total',
          title: 'Total du groupe',
          content: 'Le montant total de toutes les dépenses effectuées par les membres de ce groupe.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#exp-kpi-pending',
          title: 'En attente',
          content: 'Les dépenses qui n\'ont pas encore été totalement remboursées par les participants.',
          placement: 'bottom',
          ...common
        },
        {
          target: '.expenses-card',
          title: 'Liste des transactions',
          content: 'Le détail de chaque dépense. Cliquez sur une ligne pour voir le reçu ou valider un paiement.',
          placement: 'top',
          ...common
        }
      ],
      '/group': [
        {
          target: 'body',
          placement: 'center',
          icon: UserGroupIcon,
          title: 'Gestion des Groupes',
          content: 'C\'est ici que vous gérez vos colocations, voyages ou groupes d\'amis.',
          showCheckbox: true,
          ...common
        },
        {
          target: '#group-tabs',
          title: 'Vos Groupes',
          content: 'Passez d\'un groupe à l\'autre en cliquant sur ces onglets.',
          placement: 'bottom',
          ...common
        },
        {
          target: '#group-members',
          title: 'Membres du groupe',
          content: 'Consultez la liste des membres et leur solde individuel. Les administrateurs peuvent aussi gérer les rôles ici.',
          placement: 'right',
          ...common
        },
        {
          target: '#group-balance-invite',
          title: 'Solde et Invitation',
          content: 'Voyez rapidement qui vous devez rembourser et utilisez le code pour inviter de nouveaux membres.',
          placement: 'left',
          ...common
        },
        {
          target: '#group-recurring',
          title: 'Dépenses Récurrentes',
          content: 'Automatisez vos dépenses fixes comme le loyer ou les abonnements pour ne plus jamais les oublier.',
          placement: 'top',
          ...common
        }
      ],
      '/settings': [
        {
          target: 'body',
          placement: 'center',
          icon: Cog6ToothIcon,
          title: 'Vos Réglages',
          content: 'Modifiez votre profil et vos préférences personnelles ici.',
          showCheckbox: true,
          ...common
        },
        {
          target: '.settings-form',
          title: 'Informations Personnelles',
          content: 'Mettez à jour votre nom, email ou mot de passe ici.',
          placement: 'bottom',
          ...common
        },
        {
          target: '.header__user',
          title: 'Votre Profil',
          content: 'Accédez rapidement à vos paramètres depuis votre avatar.',
          placement: 'bottom',
          ...common
        }
      ],
      '/history': [
        {
          target: 'body',
          placement: 'center',
          icon: ClockIcon,
          title: 'Historique Complet',
          content: 'Retrouvez ici toutes les transactions passées de vos différents groupes.',
          showCheckbox: true,
          ...common
        },
        {
          target: '.history-table',
          title: 'Archives',
          content: 'Toutes les dépenses réglées sont conservées ici pour votre consultation.',
          placement: 'top',
          ...common
        }
      ]
    };

    // Retourne les étapes de la page actuelle, ou une étape de bienvenue par défaut
    return stepsConfig[location.pathname] || [
      {
        target: 'body',
        placement: 'center',
        icon: HandRaisedIcon,
        title: 'Besoin d\'aide ?',
        content: 'Cette page vous permet de naviguer dans FairSplit. Utilisez le menu à gauche pour accéder aux différentes sections.',
        ...common
      }
    ];
  }, [location.pathname]);

  const [steps, setSteps] = useState([]);

  // Mettre à jour les étapes quand la page change
  useEffect(() => {
    setSteps(pageSteps);
  }, [pageSteps]);

  // Listen for custom event to trigger tour
  useEffect(() => {
    const handleTriggerTour = () => {
      setRun(false); // Reset first
      setTimeout(() => setRun(true), 100);
    };
    window.addEventListener('trigger-onboarding', handleTriggerTour);
    return () => window.removeEventListener('trigger-onboarding', handleTriggerTour);
  }, []);

  // Use a ref to store the state immediately to bypass React rendering cycle for Joyride
  const dontShowAgainRef = React.useRef(false);

  const toggleDontShowAgain = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setDontShowAgain(prev => {
      const newValue = !prev;
      dontShowAgainRef.current = newValue;
      
      // Si l'utilisateur coche la case, on enregistre IMMEDIATEMENT dans le localStorage
      // au cas où il rafraîchirait la page sans terminer le tour.
      if (newValue) {
        localStorage.setItem('fair_split_tour_disabled', 'true');
      } else {
        localStorage.removeItem('fair_split_tour_disabled');
      }

      // CRITICAL: Update the steps array to force Joyride to re-render the tooltip
      setSteps(currentSteps => {
        const newSteps = [...currentSteps];
        newSteps[0] = { ...newSteps[0], dontShowAgain: newValue };
        return newSteps;
      });
      
      return newValue;
    });
  };

  // Initialize tour
  useEffect(() => {
    const isTourDisabled = localStorage.getItem('fair_split_tour_disabled') === 'true';
    if (user && !isTourDisabled) {
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleJoyrideCallback = useCallback((data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      // Use ref to get latest value of dontShowAgain
      if (dontShowAgainRef.current) {
        localStorage.setItem('fair_split_tour_disabled', 'true');
      }
    }
  }, []); 

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={false}
      showSkipButton={true}
      disableOverlayClose={true}
      spotlightPadding={8}
      callback={handleJoyrideCallback}
      // Pass our toggle logic down to the tooltip
      tooltipComponent={(props) => (
        <Tooltip 
          {...props} 
          dontShowAgain={props.step.dontShowAgain} // Use state from the step itself
          onToggleDontShow={toggleDontShowAgain} 
          navigate={navigate}
        />
      )}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.75)',
        }
      }}
    />
  );
};

export default OnboardingTour;
