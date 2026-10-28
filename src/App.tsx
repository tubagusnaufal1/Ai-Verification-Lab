/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  UserRole,
  StudentIdentity,
  StudentScoreEntry,
  CrowdsourcedReport,
  loadScenarios,
  saveScenarios,
  loadStudentScores,
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
import { generateStandaloneSingleFileHtml } from './utils/standaloneHtmlBuilder';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';

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

  const handleNotify = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Sesi Peserta (Mahasiswa) Aktif',
      `Selamat datang, ${identity.name} (${identity.nim}). Seluruh hasil audit dan sertifikat PDF akan tercatat atas nama Anda.`,
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNotify(
      'Dashboard Penguji (Mentor) Aktif',
      'Akses eksklusif ke 1. Pembuat Soal, 2. Rekap & Diagnostik Nilai Kelas, dan 3. Moderasi Laporan Kasus telah dibuka.',
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

    handleNotify(
      record.isCalibrated
        ? `Audit Final Terkunci! Skor: ${record.newVScore}/100`
        : `Audit Final Terkunci (Skor: ${record.newVScore}/100)`,
      `Hasil audit oleh ${studentIdentity.name} telah dikunci dan disimpan tanpa duplikasi baris.`,
      record.isCalibrated ? 'success' : 'info'
    );
  };

  const handleClearAllStudentScores = () => {
    const empty = clearAllStudentScores();
    setStudentScores(empty);
    handleNotify(
      'Data Rekap Skor Dihapus',
      'Seluruh baris pada tabel Rekap Nilai Mahasiswa telah dikosongkan.',
      'warning'
    );
  };

  const handleResetStudentScoresToDefault = () => {
    const defaults = resetStudentScoresToDefault();
    setStudentScores(defaults);
    handleNotify(
      'Data Rekap Skor Direset ke Default',
      'Tabel Rekap Nilai Mahasiswa telah dikembalikan ke 3 entri sampel awal.',
      'info'
    );
  };

  const handleAddScenarioFromMentor = (newScenario: ChallengeScenario) => {
    setScenarios((prev) => {
      const updated = [newScenario, ...prev];
      saveScenarios(updated);
      return updated;
    });
    handleNotify(
      'Soal Baru Diterbitkan!',
      `"${newScenario.title}" kini aktif dan siap dibagikan ke mahasiswa menggunakan Kode Token Soal Base64.`,
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
    handleNotify(
      'Laporan Halusinasi AI Terkirim!',
      'Terima kasih atas kontribusi Anda. Laporan kini masuk ke antrean Moderasi di Dashboard Mentor.',
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

    setCrowdsourcedReports((prev) => {
      const updated = prev.map((r) =>
        r.id === reportId ? { ...r, status: 'PROMOTED' as const } : r
      );
      saveCrowdsourcedReports(updated);
      return updated;
    });

    setScenarios((prev) => {
      const updated = [promotedScenario, ...prev];
      saveScenarios(updated);
      return updated;
    });

    handleNotify(
      'Laporan Diangkat Menjadi Soal Ujian Kelas!',
      `Laporan dari ${target.reporterName} kini telah tayang sebagai soal resmi.`,
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
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
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
            onClearAllScores={handleClearAllStudentScores}
            onResetScoresToDefault={handleResetStudentScoresToDefault}
            crowdsourcedReports={crowdsourcedReports}
            onPromoteReportToScenario={handlePromoteReportToScenario}
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 no-print">
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
                        <Search className="w-4 h-4" />
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
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          Tahap B: Meja Audit Side-by-Side, Rewriter &amp; Sertifikat PDF ({auditReferences.length} Bukti Terkunci)
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
