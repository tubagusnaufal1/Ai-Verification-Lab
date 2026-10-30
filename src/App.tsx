/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTabId } from './components/Navbar';
import { BerandaView } from './components/BerandaView';
import { TanyaAIView } from './components/TanyaAIView';
import { UjiOutputView } from './components/UjiOutputView';
import { ChallengeLabView } from './components/ChallengeLabView';
import { PortalMentorView, MentorSubTab } from './components/PortalMentorView';
import { InitialLoginGate } from './components/InitialLoginGate';
import { RoleLoginModal } from './components/RoleLoginModal';
import { ToastContainer, ToastItem } from './components/ToastContainer';
import {
  CHALLENGE_SCENARIOS,
  ChallengeScenario,
  SearchReference,
  VerdictType,
  AuditResultRecord,
  buildScholarSearchUrl,
  sanitizeSnippetText,
} from './utils/verificationLogic';
import {
  STORAGE_KEYS,
  UserRole,
  StudentIdentity,
  StudentScoreEntry,
  CrowdsourcedReport,
  loadScenarios,
  saveScenarios,
  loadStudentScores,
  saveStudentScores,
  upsertStudentScoreEntry,
  clearAllStudentScores,
  resetStudentScoresToDefault,
  loadCrowdsourcedReports,
  saveCrowdsourcedReports,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  isMentorRole,
} from './utils/storageService';
import {
  DEFAULT_ROOM_CODE,
  fetchRoomState,
  pushSubmissionToRoom,
  pushScenarioToRoom,
  pushReportToRoom,
  resetRoomStateOnServer,
} from './utils/syncService';
import { generateStandaloneSingleFileHtml } from './utils/standaloneHtmlBuilder';
import { Search, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

export default function App() {
  // Initial Role-Based Authentication Session
  const [initialSession] = useState(() => loadAuthSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => initialSession.isAuthenticated
  );
  const [activeRole, setActiveRole] = useState<UserRole>(() => initialSession.role);
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity>(
    () => initialSession.studentIdentity
  );

  const [activeTab, setActiveTab] = useState<NavTabId>(() =>
    isMentorRole(initialSession.role) ? 'mentor-builder' : 'beranda'
  );
  // Sub-view inside "Tanya AI & Lab Audit" unified menu ('search' | 'audit')
  const [labSubView, setLabSubView] = useState<'search' | 'audit'>('search');

  const [vScore, setVScore] = useState<number>(78);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [scenarios, setScenarios] = useState<ChallengeScenario[]>(() => loadScenarios());
  const [studentScores, setStudentScores] = useState<StudentScoreEntry[]>(() =>
    loadStudentScores()
  );
  const [crowdsourcedReports, setCrowdsourcedReports] = useState<CrowdsourcedReport[]>(() =>
    loadCrowdsourcedReports()
  );
  const [isSyncingRoom, setIsSyncingRoom] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');

  const handleNotify = useCallback(
    (
      title: string,
      message: string,
      type: 'success' | 'info' | 'warning' = 'info'
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const applyServerRoomPayload = useCallback(
    (payload: Awaited<ReturnType<typeof fetchRoomState>>) => {
      if (!payload) return;
      if (Array.isArray(payload.submissions)) {
        setStudentScores(payload.submissions);
        saveStudentScores(payload.submissions);
      }
      if (Array.isArray(payload.customScenarios) && payload.customScenarios.length > 0) {
        setScenarios(payload.customScenarios);
        saveScenarios(payload.customScenarios);
      }
      if (Array.isArray(payload.communityReports)) {
        setCrowdsourcedReports(payload.communityReports);
        saveCrowdsourcedReports(payload.communityReports);
      }
      setLastSyncedAt(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    },
    []
  );

  const syncFromCloudRoom = useCallback(
    async (showToast = false) => {
      if (showToast) setIsSyncingRoom(true);
      try {
        const roomData = await fetchRoomState(DEFAULT_ROOM_CODE);
        if (roomData) {
          applyServerRoomPayload(roomData);
          if (showToast) {
            handleNotify(
              'Sinkronisasi Lintas Perangkat Berhasil',
              `Data Room ${DEFAULT_ROOM_CODE} (${roomData.submissions.length} nilai peserta, ${roomData.customScenarios.length} soal, ${roomData.communityReports.length} laporan) telah diperbarui.`,
              'success'
            );
          }
        }
      } finally {
        if (showToast) setIsSyncingRoom(false);
      }
    },
    [applyServerRoomPayload, handleNotify]
  );

  // SPESIFIKASI 1b: Auto-Polling Sinkronisasi Lintas Perangkat setiap 3 detik + Cross-Tab Storage Event
  useEffect(() => {
    syncFromCloudRoom(false);
    const interval = setInterval(() => {
      syncFromCloudRoom(false);
    }, 3000);

    const handleStorageSync = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEYS.STUDENT_SCORES) {
        setStudentScores(loadStudentScores());
      }
      if (!event.key || event.key === STORAGE_KEYS.SCENARIOS) {
        setScenarios(loadScenarios());
      }
      if (!event.key || event.key === STORAGE_KEYS.CROWDSOURCED_REPORTS) {
        setCrowdsourcedReports(loadCrowdsourcedReports());
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [syncFromCloudRoom]);

  // State for "Uji Output AI" 4-Stage VERIFY Pipeline
  const [auditClaimText, setAuditClaimText] = useState<string>(
    CHALLENGE_SCENARIOS[0].aiOutputText
  );
  const [auditReferences, setAuditReferences] = useState<SearchReference[]>(
    CHALLENGE_SCENARIOS[0].preloadedReferences
  );
  const [auditExpectedVerdict, setAuditExpectedVerdict] = useState<VerdictType>(
    CHALLENGE_SCENARIOS[0].expectedVerdict
  );
  const [activeScenarioTitle, setActiveScenarioTitle] = useState<string | undefined>(
    CHALLENGE_SCENARIOS[0].title
  );
  const [activeCalibrationHint, setActiveCalibrationHint] = useState<string | undefined>(
    CHALLENGE_SCENARIOS[0].calibrationHint
  );
  const [auditHistory, setAuditHistory] = useState<AuditResultRecord[]>([]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (tab: NavTabId) => {
    if (isMentorRole(activeRole)) {
      if (
        tab === 'mentor-builder' ||
        tab === 'mentor-diagnostics' ||
        tab === 'mentor-moderation' ||
        tab === 'portal-mentor'
      ) {
        setActiveTab(tab === 'portal-mentor' ? 'mentor-builder' : tab);
      } else {
        setActiveTab('mentor-builder');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Student Role: Zero access to Mentor tabs
    if (
      tab === 'portal-mentor' ||
      tab === 'mentor-builder' ||
      tab === 'mentor-diagnostics' ||
      tab === 'mentor-moderation'
    ) {
      setActiveTab('beranda');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'uji-output') {
      setActiveTab('tanya-ai');
      setLabSubView('audit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginStudent = (identity: StudentIdentity) => {
    setActiveRole('STUDENT');
    setStudentIdentity(identity);
    setIsAuthenticated(true);
    saveAuthSession({
      isAuthenticated: true,
      role: 'STUDENT',
      studentIdentity: identity,
    });
    setActiveTab('beranda');
    syncFromCloudRoom(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Sesi Peserta (Mahasiswa) Aktif',
      `Selamat datang, ${identity.name} (${identity.nim}). Seluruh hasil audit dan sertifikat PDF akan tercatat atas nama Anda dan tersinkron ke Room ${DEFAULT_ROOM_CODE}.`,
      'info'
    );
  };

  const handleLoginMentor = () => {
    setActiveRole('MENTOR');
    setIsAuthenticated(true);
    saveAuthSession({
      isAuthenticated: true,
      role: 'MENTOR',
      studentIdentity,
    });
    setActiveTab('mentor-builder');
    syncFromCloudRoom(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Dashboard Penguji (Mentor) Aktif',
      `Akses eksklusif ke 1. Pembuat Soal, 2. Rekap & Diagnostik Nilai Kelas, dan 3. Moderasi Laporan Kasus telah dibuka (Room: ${DEFAULT_ROOM_CODE}).`,
      'success'
    );
  };

  const handleLogoutOrSwitchRole = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setIsLoginModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendToAudit = (params: {
    claimText: string;
    references: SearchReference[];
    expectedVerdict?: VerdictType;
    scenarioTitle?: string;
    calibrationHint?: string;
  }) => {
    setAuditClaimText(params.claimText);
    setAuditReferences(params.references);
    setAuditExpectedVerdict(params.expectedVerdict ?? 'VERIFIED');
    setActiveScenarioTitle(params.scenarioTitle);
    setActiveCalibrationHint(params.calibrationHint);
    setActiveTab('tanya-ai');
    setLabSubView('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Teks & 6 Bukti Dikunci ke Meja Audit Side-by-Side',
      params.scenarioTitle
        ? `Memuat "${params.scenarioTitle}" beserta ${params.references.length} bukti yang relevan ke meja audit.`
        : 'Teks sintesis dan 6 bukti telah dikunci untuk diuji pada 4 tahap VERIFY.',
      'info'
    );
  };

  const handleLoadChallengeScenario = (scenario: ChallengeScenario) => {
    setAuditClaimText(scenario.aiOutputText);
    setAuditReferences(scenario.preloadedReferences);
    setAuditExpectedVerdict(scenario.expectedVerdict);
    setActiveScenarioTitle(scenario.title);
    setActiveCalibrationHint(scenario.calibrationHint);
    setActiveTab('tanya-ai');
    setLabSubView('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Kasus Challenge Dimuat ke Meja Audit',
      `${scenario.title} berhasil dimuat lengkap dengan ${scenario.preloadedReferences.length} bukti pembanding.`,
      'info'
    );
  };

  const handleImportScenarioToken = (importedScenario: ChallengeScenario) => {
    setScenarios((prev) => {
      const exists = prev.some((s) => s.title === importedScenario.title);
      const updated = exists ? prev : [importedScenario, ...prev];
      saveScenarios(updated);
      return updated;
    });
    pushScenarioToRoom(importedScenario, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleLoadChallengeScenario(importedScenario);
    handleNotify(
      'Kode Token Soal Berhasil Diimpor!',
      `Soal "${importedScenario.title}" dari Mentor telah ditambahkan dan dibuka di Meja Audit.`,
      'success'
    );
  };

  const handleCompleteAudit = (record: AuditResultRecord) => {
    setVScore(record.newVScore);
    setAuditHistory((prev) => [record, ...prev]);

    const newScoreEntry: StudentScoreEntry = {
      id: record.id,
      studentName: studentIdentity.name,
      studentNim: studentIdentity.nim,
      scenarioTitle: activeScenarioTitle || 'Audit Mandiri Output AI',
      chosenVerdict: record.verdict,
      expectedVerdict: record.expectedVerdict,
      isCalibrated: record.isCalibrated,
      justification: record.justification,
      vScore: record.newVScore,
      vScoreDelta: record.vScoreDelta,
      stageBreakdown: record.stageBreakdown,
      attemptCount: 1,
      processLog: record.processLog,
      timestamp: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setStudentScores((prev) => upsertStudentScoreEntry(prev, newScoreEntry));
    pushSubmissionToRoom(newScoreEntry, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });

    handleNotify(
      record.isCalibrated
        ? `Audit Final Terkunci! Skor: ${record.newVScore}/100`
        : `Audit Final Terkunci (Skor: ${record.newVScore}/100)`,
      `Hasil audit oleh ${studentIdentity.name} telah dikunci dan disinkronkan secara otomatis ke Dashboard Mentor (Room: ${DEFAULT_ROOM_CODE}).`,
      record.isCalibrated ? 'success' : 'info'
    );
  };

  const handleImportStudentScoreEntry = (importedEntry: StudentScoreEntry) => {
    setStudentScores((prev) => upsertStudentScoreEntry(prev, importedEntry));
    pushSubmissionToRoom(importedEntry, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleNotify(
      'Token Nilai Peserta Berhasil Diimpor!',
      `Skor V-Score (${importedEntry.vScore}/100) beserta detail 4 tahap milik ${importedEntry.studentName} telah ditambahkan ke Rekap Nilai Kelas.`,
      'success'
    );
  };

  const handleClearAllStudentScores = () => {
    const empty = clearAllStudentScores();
    setStudentScores(empty);
    resetRoomStateOnServer('clear', DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleNotify(
      'Data Rekap Skor Dihapus',
      'Seluruh baris pada tabel Rekap Nilai Mahasiswa telah dikosongkan di semua perangkat.',
      'warning'
    );
  };

  const handleResetStudentScoresToDefault = () => {
    const defaults = resetStudentScoresToDefault();
    setStudentScores(defaults);
    resetRoomStateOnServer('default', DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleNotify(
      'Data Rekap Skor Direset ke Default',
      'Tabel Rekap Nilai Mahasiswa telah dikembalikan ke 3 entri sampel awal di semua perangkat.',
      'info'
    );
  };

  const handleAddScenarioFromMentor = (newScenario: ChallengeScenario) => {
    setScenarios((prev) => {
      const updated = [newScenario, ...prev];
      saveScenarios(updated);
      return updated;
    });
    pushScenarioToRoom(newScenario, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleNotify(
      'Soal Baru Diterbitkan & Disinkronkan!',
      `"${newScenario.title}" kini langsung tayang di layar seluruh peserta (Room: ${DEFAULT_ROOM_CODE}).`,
      'success'
    );
  };

  const handleSubmitCrowdsourcedReport = (
    reportData: Omit<CrowdsourcedReport, 'id' | 'status' | 'createdAt'>
  ) => {
    const newReport: CrowdsourcedReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setCrowdsourcedReports((prev) => {
      const updated = [newReport, ...prev];
      saveCrowdsourcedReports(updated);
      return updated;
    });
    pushReportToRoom(newReport, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });
    handleNotify(
      'Laporan Halusinasi AI Terkirim!',
      `Laporan Anda langsung tersinkron ke antrean Moderasi di Dashboard Mentor (Room: ${DEFAULT_ROOM_CODE}).`,
      'success'
    );
  };

  const handlePromoteReportToScenario = (reportId: string) => {
    const target = crowdsourcedReports.find((r) => r.id === reportId);
    if (!target || target.status === 'PROMOTED') return;

    const cleanTopic = target.topicCategory || 'Temuan Komunitas';
    const promotedScenario: ChallengeScenario = {
      id: `crowd-case-${Date.now()}`,
      level: target.suggestedVerdict === 'UNSUPPORTED' ? 'LEVEL: MAHIR' : 'LEVEL: MENENGAH',
      category: target.topicCategory,
      badgeColor: target.suggestedVerdict === 'UNSUPPORTED' ? 'red' : 'amber',
      borderColorClass:
        target.suggestedVerdict === 'UNSUPPORTED' ? 'border-red-500/70' : 'border-amber-500/70',
      title: `Kasus Komunitas: Audit Klaim ${target.aiPlatform} (${cleanTopic})`,
      description: `Temuan lapangan oleh ${target.reporterName} (${target.reporterNim}) mengenai indikasi halusinasi/distorsi pada ${target.aiPlatform}.`,
      aiOutputText: sanitizeSnippetText(target.hallucinationText),
      searchQuery: `${cleanTopic} jurnal penelitian ilmiah`,
      expectedVerdict: target.suggestedVerdict,
      calibrationHint: sanitizeSnippetText(target.correctionEvidence),
      createdBy: `${target.reporterName} (Crowdsourcing)`,
      preloadedReferences: [
        {
          id: 1,
          title: `[PDF] Bukti Koreksi Faktual & Literatur Primer: ${cleanTopic}`,
          url: buildScholarSearchUrl(`${cleanTopic} penelitian Indonesia`),
          scholarUrl: buildScholarSearchUrl(`${cleanTopic} penelitian Indonesia`),
          snippet: sanitizeSnippetText(target.correctionEvidence),
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 2,
          title: `[PDF] Evaluasi Keakuratan Klaim ${target.aiPlatform} pada Bidang ${cleanTopic}`,
          url: buildScholarSearchUrl(`Evaluasi Klaim AI ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(`Evaluasi Klaim AI ${cleanTopic}`),
          snippet: `Audit literatur mengonfirmasi perlunya membandingkan klaim AI terhadap regulasi resmi dan publikasi ilmiah terindeks.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 3,
          title: `[PDF] Kajian Akademik & Data Resmi Nasional Terkait ${cleanTopic}`,
          url: buildScholarSearchUrl(`Kajian Akademik Data Resmi ${cleanTopic} Indonesia`),
          scholarUrl: buildScholarSearchUrl(`Kajian Akademik Data Resmi ${cleanTopic} Indonesia`),
          snippet: `Data primer dari repositori nasional menunjukkan bahwa klaim mutlak tanpa rujukan terverifikasi tidak dapat dijadikan dasar pengambilan keputusan.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 4,
          title: `[PDF] Tinjauan Metodologi dan Mitigasi Misinformasi AI pada Sektor ${cleanTopic}`,
          url: buildScholarSearchUrl(`Mitigasi Misinformasi AI ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(`Mitigasi Misinformasi AI ${cleanTopic}`),
          snippet: `Penerapan protokol Verification-First membantu mahasiswa mengidentifikasi kesalahan sitasi dan angka statistik fiktif.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 5,
          title: `[PDF] Pedoman Literasi Kritis & Verifikasi Sumber Primer di Perguruan Tinggi`,
          url: buildScholarSearchUrl(`Pedoman Literasi Kritis Verifikasi Sumber Primer`),
          scholarUrl: buildScholarSearchUrl(`Pedoman Literasi Kritis Verifikasi Sumber Primer`),
          snippet: `Setiap klaim kuantitatif dan referensi regulasi wajib dicocokkan langsung pada dokumen sumber aslinya.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 6,
          title: `[PDF] Standar Audit Sitasi & Deteksi Ghost Citation pada Publikasi ${cleanTopic}`,
          url: buildScholarSearchUrl(`Audit Sitasi Ghost Citation ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(`Audit Sitasi Ghost Citation ${cleanTopic}`),
          snippet: `Verifikasi silang nama penulis, tahun terbit, dan DOI pada Google Scholar mencegah penyebaran sitasi fiktif.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
      ],
    };

    const promotedReport: CrowdsourcedReport = {
      ...target,
      status: 'PROMOTED',
    };

    setCrowdsourcedReports((prev) => {
      const updated = prev.map((r) => (r.id === reportId ? promotedReport : r));
      saveCrowdsourcedReports(updated);
      return updated;
    });

    setScenarios((prev) => {
      const updated = [promotedScenario, ...prev];
      saveScenarios(updated);
      return updated;
    });

    pushReportToRoom(promotedReport, DEFAULT_ROOM_CODE);
    pushScenarioToRoom(promotedScenario, DEFAULT_ROOM_CODE).then((payload) => {
      if (payload) applyServerRoomPayload(payload);
    });

    handleNotify(
      'Laporan Diangkat Menjadi Soal Ujian Kelas!',
      `Laporan dari ${target.reporterName} kini telah tayang sebagai soal resmi di layar seluruh mahasiswa.`,
      'success'
    );
  };

  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneSingleFileHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI-Literacy-Lab-Verification-First-SPA.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleNotify(
      'Single-File HTML Diunduh',
      'File SPA mandiri lengkap (Tailwind CDN + Vanilla JS) berhasil diunduh.',
      'success'
    );
  };

  // GERBANG LOGIN AWAL (HALAMAN UTAMA SEBELUM MASUK APLIKASI)
  if (!isAuthenticated) {
    return (
      <>
        <InitialLoginGate
          defaultStudentIdentity={studentIdentity}
          onLoginStudent={handleLoginStudent}
          onLoginMentor={handleLoginMentor}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  const isMentor = isMentorRole(activeRole);
  const activeMentorSubTab: MentorSubTab =
    activeTab === 'mentor-diagnostics'
      ? 'class-diagnostics'
      : activeTab === 'mentor-moderation'
        ? 'crowdsourcing-moderation'
        : 'scenario-builder';

  const handleSelectMentorSubTab = (sub: MentorSubTab) => {
    if (sub === 'class-diagnostics') {
      setActiveTab('mentor-diagnostics');
    } else if (sub === 'crowdsourcing-moderation') {
      setActiveTab('mentor-moderation');
    } else {
      setActiveTab('mentor-builder');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 md:pb-0 bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          vScore={vScore}
          activeRole={activeRole}
          studentIdentity={studentIdentity}
          onLogout={handleLogoutOrSwitchRole}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenRoleModal={() => setIsLoginModalOpen(true)}
        />
      </div>

      {/* SPESIFIKASI 1b: Live Cloud Sync Bar (Student Mode) */}
      {!isMentor && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 no-print">
          <div className="bg-[#0b1120]/90 border border-slate-800/90 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="inline-flex items-center gap-2 text-emerald-300 font-bold">
              <span>🟢 Live Cloud Sync Aktif (Room: {DEFAULT_ROOM_CODE})</span>
              {lastSyncedAt && (
                <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                  · Diperbarui {lastSyncedAt}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => syncFromCloudRoom(true)}
              disabled={isSyncingRoom}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-blue-300 hover:text-white text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className={`w-3 h-3 ${isSyncingRoom ? 'animate-spin' : ''}`} />
              <span>🔄 Sinkronkan Sekarang</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {isMentor ? (
          /* DASHBOARD PENGUJI (MENTOR) EKSKLUSIF — 100% TERPISAH DARI HALAMAN PESERTA */
          <PortalMentorView
            activeRole={activeRole}
            activeSubTab={activeMentorSubTab}
            onSelectSubTab={handleSelectMentorSubTab}
            onUnlockMentorRole={handleLoginMentor}
            scenarios={scenarios}
            onAddScenario={handleAddScenarioFromMentor}
            studentScores={studentScores}
            onImportStudentScoreEntry={handleImportStudentScoreEntry}
            onClearAllScores={handleClearAllStudentScores}
            onResetScoresToDefault={handleResetStudentScoresToDefault}
            crowdsourcedReports={crowdsourcedReports}
            onPromoteReportToScenario={handlePromoteReportToScenario}
            onManualSyncNow={() => syncFromCloudRoom(true)}
            isSyncing={isSyncingRoom}
            lastSyncedAt={lastSyncedAt}
            onNotify={handleNotify}
          />
        ) : (
          /* DASHBOARD PESERTA (MAHASISWA) EKSKLUSIF — 100% TERPISAH DARI PORTAL MENTOR */
          <>
            {activeTab === 'beranda' && (
              <BerandaView
                onNavigate={handleNavigate}
                onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
              />
            )}

            {(activeTab === 'tanya-ai' || activeTab === 'uji-output') && (
              <div className="space-y-2">
                {/* Unified Sub-Workspace Switcher for Menu 2: Tanya AI & Lab Audit */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 no-print">
                  <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => setLabSubView('search')}
                        className={`flex-1 inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                          labSubView === 'search'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-[#020617]/70 text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Search className="w-4 h-4 shrink-0" />
                        <span>Tahap A: Tanya AI &amp; Sintesis 6 Bukti (Serper.dev)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLabSubView('audit')}
                        className={`flex-1 inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                          labSubView === 'audit'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-[#020617]/70 text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>
                          Tahap B: Meja Audit Side-by-Side, Rewriter &amp; Sertifikat PDF (
                          {auditReferences.length} Bukti Terkunci)
                        </span>
                      </button>
                    </div>
                    {labSubView === 'search' && (
                      <button
                        type="button"
                        onClick={() => setLabSubView('audit')}
                        className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <span>Langsung ke Meja Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {labSubView === 'search' ? (
                  <TanyaAIView onSendToAudit={handleSendToAudit} onNotify={handleNotify} />
                ) : (
                  <UjiOutputView
                    claimText={auditClaimText}
                    onChangeClaimText={setAuditClaimText}
                    references={auditReferences}
                    onUpdateReferences={setAuditReferences}
                    expectedVerdict={auditExpectedVerdict}
                    onChangeExpectedVerdict={setAuditExpectedVerdict}
                    activeScenarioTitle={activeScenarioTitle}
                    calibrationHint={activeCalibrationHint}
                    currentVScore={vScore}
                    studentIdentity={studentIdentity}
                    onCompleteAudit={handleCompleteAudit}
                    auditHistory={auditHistory}
                    onNotify={handleNotify}
                  />
                )}
              </div>
            )}

            {activeTab === 'challenge-lab' && (
              <ChallengeLabView
                scenarios={scenarios}
                studentIdentity={studentIdentity}
                studentScores={studentScores}
                auditHistory={auditHistory}
                currentVScore={vScore}
                crowdsourcedReports={crowdsourcedReports}
                onLoadScenario={handleLoadChallengeScenario}
                onImportScenarioToken={handleImportScenarioToken}
                onSubmitReport={handleSubmitCrowdsourcedReport}
                onNotify={handleNotify}
              />
            )}
          </>
        )}
      </main>

      {/* Calm Minimal Academic Footer — Strictly Role-Separated */}
      <footer className="border-t border-slate-800/80 bg-[#020617] py-6 px-4 sm:px-6 lg:px-8 mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <strong className="text-slate-200">AI LITERACY LAB</strong> — Model Pembelajaran
            Verification-First · Inisiatif Pemuda untuk Asta Cita Nusantara Poin 4
          </div>
          {isMentor ? (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleNavigate('mentor-builder')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                1. Pembuat Soal
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleNavigate('mentor-diagnostics')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                2. Rekap &amp; Diagnostik Kelas
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleNavigate('mentor-moderation')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                3. Moderasi Laporan Kasus
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleNavigate('beranda')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Beranda &amp; Asta Cita
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tanya-ai');
                  setLabSubView('audit');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Tanya AI &amp; Lab Audit
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleNavigate('challenge-lab')}
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Challenge &amp; Riwayat Saya
              </button>
            </div>
          )}
        </div>
      </footer>

      <RoleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        activeRole={activeRole}
        studentIdentity={studentIdentity}
        onSwitchToMahasiswa={handleLoginStudent}
        onSwitchToMentor={handleLoginMentor}
      />

      <div className="no-print">
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    </div>
  );
}
