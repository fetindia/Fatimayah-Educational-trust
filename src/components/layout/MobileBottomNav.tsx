/**
 * @license
 * Mobile Bottom Navigation Bar (Android & PWA Native Experience)
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  Home, 
  BookOpen, 
  HeartHandshake, 
  Calendar, 
  ShoppingBag,
  Menu,
  X,
  Award
} from 'lucide-react';
import { triggerHapticFeedback } from '../../lib/appBridge';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useCart } from '../../contexts/CartContext';
import { useModuleControls } from '../../contexts/ModuleControlsContext';

interface MobileBottomNavProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenAuth: () => void;
  onOpenUserDashboard: (tab?: any) => void;
  onOpenMoreMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  setActiveSection,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { unreadCount } = useNotifications();
  const { cart, openCartDrawer } = useCart();
  const { isModuleEnabled } = useModuleControls();
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';

  const handleShortcutClick = (section: string) => {
    triggerHapticFeedback('light');
    if (isMobileMenuOpen) {
      onToggleMobileMenu();
    }
    setActiveSection(section);
  };

  const isStoreOn = isModuleEnabled('store');

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: !isMobileMenuOpen && (activeSection === 'home' || activeSection === ''),
      onClick: () => handleShortcutClick('home')
    },
    isStoreOn ? {
      id: 'store',
      label: 'Store',
      icon: ShoppingBag,
      badge: cart.totalItems > 0 ? cart.totalItems : undefined,
      isActive: !isMobileMenuOpen && activeSection === 'store',
      onClick: () => {
        if (activeSection === 'store') {
          openCartDrawer();
        } else {
          handleShortcutClick('store');
        }
      }
    } : {
      id: 'examinations',
      label: 'Exams',
      icon: Award,
      isActive: !isMobileMenuOpen && (activeSection === 'examinations' || activeSection === 'examination'),
      onClick: () => handleShortcutClick('examinations')
    },
    {
      id: 'donate',
      label: 'Donate',
      icon: HeartHandshake,
      isActive: !isMobileMenuOpen && (activeSection === 'donate' || activeSection === 'crowdfunding'),
      onClick: () => handleShortcutClick('donate')
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: BookOpen,
      isActive: !isMobileMenuOpen && activeSection === 'programs',
      onClick: () => handleShortcutClick('programs')
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: isMobileMenuOpen ? X : Menu,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: isMobileMenuOpen,
      onClick: () => {
        triggerHapticFeedback('medium');
        onToggleMobileMenu();
      }
    }
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 px-1 py-1 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          const isMenuBtn = item.id === 'menu';

          return (
            <button
              key={item.id}
              id={`mobile-nav-btn-${item.id}`}
              onClick={item.onClick}
              aria-label={isMenuBtn ? (isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Full Navigation Menu') : item.label}
              aria-expanded={isMenuBtn ? isMobileMenuOpen : undefined}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 min-w-[54px] min-h-[44px] cursor-pointer active:scale-95 ${
                isActive 
                  ? 'text-amber-400 font-extrabold' 
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-950 shadow-xs animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight leading-none whitespace-nowrap ${
                isActive ? 'text-amber-300 font-bold' : 'text-slate-300'
              }`}>
                {item.label}
              </span>

              {isActive && (
                <span 
                  className="absolute bottom-0 w-6 h-0.5 rounded-full bg-amber-400"
                  style={{ backgroundColor: isMenuBtn ? '#F59E0B' : primaryGreen }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
