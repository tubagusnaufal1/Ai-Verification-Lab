import React, { useEffect, useState } from 'react';
import { StudentIdentity, UserRole, isMentorRole } from '../utils/storageService';
import { GraduationCap, Crown, LogOut } from 'lucide-react';

export type NavTabId =
  | 'beranda'
  | 'tanya-ai'
  | 'uji-output'
  | 'challenge-lab'
  | 'portal-mentor'
  | 'mentor-builder'
  | 'mentor-diagnostics'
  | 'mentor-moderation';

interface NavbarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  vScore: number;
  activeRole: UserRole;
  studentIdentity: StudentIdentity;
  onLogout?: () => void;
  onLogoutToGate?: () => void;
  onOpenLoginModal?: (initialTab?: UserRole) => void;
  onOpenRoleModal?: () => void;
}

const STUDENT_NAV_ITEMS: { id: NavTabId; label: string; isMentor?: boolean }[] = [
  { id: 'beranda', label: 'Beranda & Asta Cita' },
  { id: 'tanya-ai', label: 'Tanya AI & Lab Audit' },
  { id: 'challenge-lab', label: 'Challenge & Riwayat Saya' },
];

const MENTOR_NAV_ITEMS: { id: NavTabId; label: string; isMentor?: boolean }[] = [
  { id: 'mentor-builder', label: '1. Pembuat Soal (Scenario Builder)', isMentor: true },
  { id: 'mentor-diagnostics', label: '2. Rekap & Diagnostik Nilai Kelas', isMentor: true },
  { id: 'mentor-moderation', label: '3. Moderasi Laporan Kasus', isMentor: true },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  vScore,
  activeRole,
  studentIdentity,
  onLogout,
  onLogoutToGate,
  onOpenLoginModal,
  onOpenRoleModal,
}) => {
  const [displayedScore, setDisplayedScore] = useState(vScore);
  const [scoreBump, setScoreBump] = useState(false);
  const displayedRef = React.useRef(vScore);

  const isMentor = isMentorRole(activeRole);
  const visibleNavItems = isMentor ? MENTOR_NAV_ITEMS : STUDENT_NAV_ITEMS;

  const isNavItemActive = (itemId: NavTabId) => {
    if (!isMentor) {
      if (itemId === 'tanya-ai' && (activeTab === 'tanya-ai' || activeTab === 'uji-output')) {
        return true;
      }
      return activeTab === itemId;
    }
    if (itemId === 'mentor-builder' && (activeTab === 'mentor-builder' || activeTab === 'portal-mentor')) {
      return true;
    }
    return activeTab === itemId;
  };

  useEffect(() => {
    if (vScore === displayedRef.current) return;
    setScoreBump(true);
    const startVal = displayedRef.current;
    const diff = vScore - startVal;
    const steps = Math.max(1, Math.min(15, Math.abs(diff)));
    const stepDuration = Math.max(16, Math.floor(240 / steps));
    let current = startVal;

    const interval = setInterval(() => {
      if (current < vScore) {
        current += 1;
      } else if (current > vScore) {
        current -= 1;
      }
      displayedRef.current = current;
      setDisplayedScore(current);
      if (current === vScore) {
        clearInterval(interval);
      }
    }, stepDuration);

    const bumpTimer = setTimeout(() => setScoreBump(false), 500);
    return () => {
      clearInterval(interval);
      clearTimeout(bumpTimer);
    };
  }, [vScore]);

  const handleRoleOrLogoutClick = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else if (typeof onLogoutToGate === 'function') {
      onLogoutToGate();
    } else if (typeof onOpenLoginModal === 'function') {
      onOpenLoginModal(activeRole);
    } else if (typeof onOpenRoleModal === 'function') {
      onOpenRoleModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#020617]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Zone 1: Single-line Brand Title */}
          <button
            type="button"
            onClick={() => onSelectTab(isMentor ? 'mentor-builder' : 'beranda')}
            className="text-base sm:text-lg font-extrabold tracking-tight text-white hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none"
          >
            AI LITERACY LAB
          </button>

          {/* Zone 2: Strictly Separated Navigation Links (Zero Overlap between Student and Mentor) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden lg:flex items-center gap-5 h-full"
          >
            {visibleNavItems.map((item) => {
              const isActive = isNavItemActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative h-full inline-flex items-center px-1 text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                    isActive
                      ? item.isMentor
                        ? 'text-amber-400 border-amber-400'
                        : 'text-blue-400 border-blue-400'
                      : item.isMentor
                        ? 'text-slate-300 hover:text-amber-300 border-transparent'
                        : 'text-slate-300 hover:text-white border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Role Status / V-Score Metric (Student Only) + Logout Button */}
          <div className="flex items-center gap-3 shrink-0">
            {!isMentor ? (
              <div
                aria-live="polite"
                className={`inline-flex items-center gap-2 rounded-lg bg-[#0b1120] border border-slate-800 px-3 py-1.5 transition-transform duration-200 ${
                  scoreBump ? 'scale-105 border-emerald-500/70' : ''
                }`}
              >
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                  V-Score Saya
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-400 tabular-nums">
                  {displayedScore}
                </span>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mode Penguji (Mentor)</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRoleOrLogoutClick}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isMentor
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-[#0b1120] border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {!isMentor && (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="hidden xl:inline max-w-[120px] truncate">
                    {studentIdentity.name}
                  </span>
                  <span className="hidden xl:inline text-slate-400" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5 text-white">
                <LogOut className="w-3.5 h-3.5" />
                <span>
                  {isMentor ? 'Logout / Pindah ke Peserta' : 'Ganti Peran / Logout'}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <nav
          aria-label="Navigasi Mobile"
          className="flex lg:hidden items-center gap-2 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar"
        >
          {visibleNavItems.map((item) => {
            const isActive = isNavItemActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  isActive
                    ? item.isMentor
                      ? 'text-amber-400 border-amber-400 bg-amber-950/20 rounded-t-md'
                      : 'text-blue-400 border-blue-400 bg-blue-950/20 rounded-t-md'
                    : item.isMentor
                      ? 'text-slate-300 hover:text-amber-300 border-transparent'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
