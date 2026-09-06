/**
 * @license
 * Mobile Bottom Navigation Bar (Android & PWA Native Experience)
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  Home, 
  GraduationCap, 
  HeartHandshake, 
  CreditCard, 
  User, 
  Menu,
  ShieldCheck
} from 'lucide-react';
import { triggerHapticFeedback } from '../../lib/appBridge';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useConfig } from '../../contexts/ConfigContext';

interface MobileBottomNavProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenAuth: () => void;
  onOpenUserDashboard: (tab?: any) => void;
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  setActiveSection,
  onOpenAuth,
  onOpenUserDashboard,
  onOpenMoreMenu
}) => {
  const { currentUser, userProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';

  const handleNavClick = (section: string, action?: () => void) => {
    triggerHapticFeedback('light');
    if (action) {
      action();
    } else {
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: activeSection === 'home' || activeSection === '',
      onClick: () => handleNavClick('home')
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: GraduationCap,
      isActive: activeSection === 'exams' || activeSection === 'competitions',
      onClick: () => handleNavClick('exams')
    },
    {
      id: 'crowdfunding',
      label: 'Relief',
      icon: HeartHandshake,
      isActive: activeSection === 'crowdfunding' || activeSection === 'campaigns',
      onClick: () => handleNavClick('crowdfunding')
    },
    {
      id: 'donate',
      label: 'Donate',
      icon: CreditCard,
      isActive: activeSection === 'donate',
      onClick: () => handleNavClick('donate')
    },
    {
      id: 'profile',
      label: currentUser ? 'Portal' : 'Sign In',
      icon: User,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: activeSection === 'portal' || activeSection === 'dashboard' || activeSection === 'profile',
      onClick: () => {
        if (currentUser) {
          handleNavClick('dashboard', () => onOpenUserDashboard());
        } else {
          handleNavClick('auth', () => onOpenAuth());
        }
      }
    }
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              id={`mobile-nav-btn-${item.id}`}
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive 
                  ? 'text-emerald-400 font-semibold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>

              {isActive && (
                <span 
                  className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400"
                  style={{ backgroundColor: primaryGreen }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
