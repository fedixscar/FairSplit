import React, { useState, useEffect } from "react";
import { DevicePhoneMobileIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import "./MobileBlocker.css";

const MobileBlocker = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // On bloque si l'ecran est inferieur a 1024px (Tablettes et Mobiles)
      // Ou si l'UserAgent indique un appareil mobile
      const widthBlock = window.innerWidth < 1024;
      const uaBlock = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(widthBlock || uaBlock);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-blocker">
        <div className="mobile-blocker__content">
          <div className="mobile-blocker__icons">
            <DevicePhoneMobileIcon className="icon-phone" />
            <div className="icon-divider">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <ComputerDesktopIcon className="icon-desktop" />
          </div>
          
          <h1 className="mobile-blocker__title">Version mobile en cours de developpement</h1>
          <p className="mobile-blocker__text">
            FairSplit est actuellement optimise uniquement pour les <strong>ordinateurs</strong>. 
            L'experience sur mobile n'est pas encore prete.
          </p>
          
          <div className="mobile-blocker__badge">
            Attendez la version mobile
          </div>

          <div className="mobile-blocker__footer">
            © 2026 FairSplit · Utilisez un PC pour acceder au site
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default MobileBlocker;
