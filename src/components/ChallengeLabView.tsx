import React, { useState } from 'react';
import {
  ChallengeScenario,
  VerdictType,
  AuditResultRecord,
  decodeScenarioToken,
  downloadAuditReportAsPdf,
  generateVerifiedAcademicRewrite,
  CHALLENGE_SCENARIOS,
} from '../utils/verificationLogic';
import {
  CrowdsourcedReport,
  StudentIdentity,
  StudentScoreEntry,
} from '../utils/storageService';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BookOpenCheck,
  Send,
  MessageSquareWarning,
  CheckCircle2,
  UserCheck,
  KeyRound,
  Download,
  BarChart3,
  History,
  FileText,
} from 'lucide-react';

interface ChallengeLabViewProps {
  scenarios: ChallengeScenario[];
  studentIdentity: StudentIdentity;
  studentScores?: StudentScoreEntry[];
  auditHistory?: AuditResultRecord[];
  currentVScore?: number;
  crowdsourcedReports: CrowdsourcedReport[];
  onLoadScenario: (scenario: ChallengeScenario) => void;
  onImportScenarioToken: (scenario: ChallengeScenario) => void;
  onSubmitReport: (
    report: Omit<CrowdsourcedReport, 'id' | 'status' | 'createdAt'>
  ) => void;
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

type ChallengeSubSection = 'ALL' | 'BAGIAN_1' | 'BAGIAN_2' | 'BAGIAN_3';

export const ChallengeLabView: React.FC<ChallengeLabViewProps> = ({
  scenarios,
  studentIdentity,
  studentScores = [],
  auditHistory = [],
  currentVScore = 78,
  crowdsourcedReports,
  onLoadScenario,
  onImportScenarioToken,
  onSubmitReport,
  onNotify,
}) => {
  const [activeSection, setActiveSection] = useState<ChallengeSubSection>('ALL');
  const [tokenInput, setTokenInput] = useState('');

  // Bagian 2: Form "Kirim Laporan Temuan Halusinasi AI ke Mentor"
  const [combinedTopicAndAi, setCombinedTopicAndAi] = useState('Kesehatan - ChatGPT');
  const [hallucinationText, setHallucinationText] = useState('');
  const [correctionEvidence, setCorrectionEvidence] = useState('');
  const [suggestedVerdict, setSuggestedVerdict] = useState<VerdictType>('UNSUPPORTED');

  const handleImportToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      onNotify(
        'Masukkan Kode Token Soal',
        'Tempelkan kode token Base64 (AILAB-TOKEN-v1:...) yang dibagikan oleh Mentor Anda.',
        'warning'
      );
      return;
    }

    const decoded = decodeScenarioToken(tokenInput);
    if (!decoded) {
      onNotify(
        'Format Token Tidak Valid',
        'Kode token soal tidak dapat dibaca. Pastikan Anda menyalin seluruh teks token dari Portal Mentor.',
        'warning'
      );
      return;
    }

    onImportScenarioToken(decoded);
    setTokenInput('');
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hallucinationText.trim().length < 15 || correctionEvidence.trim().length < 15) {
      onNotify(
        'Lengkapi Detail Laporan Halusinasi AI',
        'Mohon isi kutipan klaim/output AI yang berhalusinasi dan bukti koreksi faktualnya (minimal 15 karakter).',
        'warning'
      );
      return;
    }

    // Parse Kategori Topik & Nama AI (misal: "Kesehatan - ChatGPT" atau "Hukum - Gemini")
    const parts = combinedTopicAndAi.split('-').map((p) => p.trim());
    const parsedTopic = parts[0] || 'Sains & Teknologi';
    const parsedPlatform = parts.slice(1).join(' - ') || 'ChatGPT / LLM Umum';

    onSubmitReport({
      reporterName: studentIdentity.name,
      reporterNim: studentIdentity.nim,
      aiPlatform: parsedPlatform,
      topicCategory: parsedTopic,
      hallucinationText: hallucinationText.trim(),
      correctionEvidence: correctionEvidence.trim(),
      suggestedVerdict,
    });

    setHallucinationText('');
    setCorrectionEvidence('');
  };

  const handleDownloadHistoryPdf = (entry: StudentScoreEntry) => {
    const matchingScenario =
      scenarios.find((s) => entry.scenarioTitle.includes(s.title)) || CHALLENGE_SCENARIOS[0];
    const rewrite = generateVerifiedAcademicRewrite(
      matchingScenario.aiOutputText,
      matchingScenario.preloadedReferences,
      entry.expectedVerdict
    );

    const syntheticRecord: AuditResultRecord = {
      id: entry.id,
      timestamp: entry.timestamp,
      claimSummary: matchingScenario.aiOutputText.slice(0, 120) + '...',
      verdict: entry.chosenVerdict,
      expectedVerdict: entry.expectedVerdict,
      isCalibrated: entry.isCalibrated,
      vScoreDelta: entry.vScoreDelta,
      newVScore: entry.vScore,
      justification: entry.justification,
      distortedSentenceHighlight: matchingScenario.aiOutputText,
      correctedAcademicParagraph: rewrite.correctedParagraph,
      apaReferences: rewrite.apaReferences,
      stageBreakdown: entry.stageBreakdown,
      processLog: entry.processLog,
    };

    downloadAuditReportAsPdf({
      studentName: studentIdentity.name,
      studentNim: studentIdentity.nim,
      scenarioTitle: entry.scenarioTitle,
      evaluation: syntheticRecord,
    });

    onNotify(
      'Rapor Audit PDF Diunduh',
      `File PDF A4 untuk "${entry.scenarioTitle}" berhasil diunduh.`,
      'success'
    );
  };

  const getBadgeStyle = (badgeColor: ChallengeScenario['badgeColor']) => {
    if (badgeColor === 'amber') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    if (badgeColor === 'red') {
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  const showPart1 = activeSection === 'ALL' || activeSection === 'BAGIAN_1';
  const showPart2 = activeSection === 'ALL' || activeSection === 'BAGIAN_2';
  const showPart3 = activeSection === 'ALL' || activeSection === 'BAGIAN_3';

  return (
    <div className="animate-page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Section Header & 3 Sub-Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            Menu 3 · Tantangan Kasus, Lapor Halusinasi AI ke Mentor &amp; Riwayat Rapor PDF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Challenge &amp; Riwayat Verifikasi Peserta
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl">
            Kerjakan tantangan kasus atau <strong className="text-amber-300">Token Soal</strong> dari
            Mentor, kirimkan <strong className="text-emerald-400">Laporan Temuan Halusinasi AI</strong>{' '}
            ke Portal Mentor untuk dijadikan soal kelas baru, dan unduh{' '}
            <strong className="text-blue-300">Rapor PDF Saya</strong>.
          </p>
        </div>

        {/* Sub-Tab Selector for the 3 Mandatory Sections */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0b1120] border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tampilkan Semua (1–3)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('BAGIAN_1')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'BAGIAN_1'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Tantangan &amp; Token Soal
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('BAGIAN_2')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'BAGIAN_2'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. 🚨 Kirim Laporan Halusinasi AI
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('BAGIAN_3')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'BAGIAN_3'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Riwayat Audit &amp; Rapor PDF Saya
          </button>
        </div>
      </div>

      {/* ===================================================================
          BAGIAN 1: TANTANGAN KASUS DARI MENTOR & INPUT TOKEN SOAL
         =================================================================== */}
      {showPart1 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Bagian 1 dari 3
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Bagian 1: Tantangan Kasus dari Mentor &amp; Input Token Soal
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {scenarios.length} Studi Kasus Aktif
            </span>
          </div>

          {/* KOLOM IMPOR KODE TOKEN SOAL DARI MENTOR */}
          <div className="bg-gradient-to-r from-amber-950/35 via-[#0b1120] to-blue-950/35 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                📥 Masukkan Kode Token Soal dari Mentor (Lintas Perangkat / Tanpa Backend)
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Punya kode token soal (
                <code className="text-amber-300 font-mono">AILAB-TOKEN-v1:...</code>) yang dibagikan
                dosen/mentor lewat grup kelas? Tempelkan di sini untuk langsung memuat dan
                mengerjakan soal tersebut!
              </p>
            </div>

            <form onSubmit={handleImportToken} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Tempelkan Kode Token Soal dari Mentor (contoh: AILAB-TOKEN-v1:eyJpZCI6...)"
                className="flex-1 bg-[#020617] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Impor &amp; Kerjakan Soal Token
              </button>
            </form>
          </div>

          {/* Dynamic Scenarios Grid (Strict Role Privacy: expectedVerdict is hidden from Student cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`group bg-[#0b1120] hover:bg-[#0f172a] border-2 ${scenario.borderColorClass} rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ease-out hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${getBadgeStyle(
                        scenario.badgeColor
                      )}`}
                    >
                      {scenario.level}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {scenario.category || 'Sains & Teknologi'}
                    </span>
                  </div>

                  {scenario.createdBy && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                      <UserCheck className="w-3 h-3" />
                      Soal dari: {scenario.createdBy}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold text-white leading-snug group-hover:text-blue-300 transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="bg-[#020617]/90 border border-slate-800/90 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Output AI yang Akan Diuji
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {scenario.preloadedReferences.length} Bukti Primer
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed font-editorial">
                      &ldquo;{scenario.aiOutputText}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onLoadScenario(scenario)}
                    className="w-full bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs sm:text-sm rounded-xl px-4 py-3.5 transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BookOpenCheck className="w-4 h-4" />
                    Uji Kasus Ini di Pipeline Audit →
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================
          BAGIAN 2: 🚨 KIRIM LAPORAN TEMUAN HALUSINASI AI KE MENTOR
         =================================================================== */}
      {showPart2 && (
        <section className="bg-[#0b1120] border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
                <MessageSquareWarning className="w-4 h-4" />
                Bagian 2 dari 3 · Konektivitas Crowdsourcing Mahasiswa → Portal Mentor
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Bagian 2: 🚨 Kirim Laporan Temuan Halusinasi AI ke Mentor
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                Menemukan jawaban ChatGPT, Gemini, atau Claude yang mengarang sitasi jurnal,
                memanipulasi statistik, atau keliru konteks? Kirimkan laporan Anda di bawah ini agar
                langsung masuk ke antrean{' '}
                <strong className="text-emerald-400">3. Moderasi Laporan Kasus</strong> di Dashboard
                Mentor!
              </p>
            </div>
            <div className="bg-[#0f172a] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-slate-300 shrink-0">
              Identitas Pelapor: <strong className="text-white">{studentIdentity.name}</strong> (
              {studentIdentity.nim})
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulir Interaktif Lapor Kasus Halusinasi AI */}
            <form onSubmit={handleReportSubmit} className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="report-topic-ai-input"
                    className="block text-xs font-bold text-slate-200 mb-1.5"
                  >
                    Kategori Topik &amp; Nama AI (misal: Kesehatan - ChatGPT, Hukum - Gemini)
                  </label>
                  <input
                    id="report-topic-ai-input"
                    type="text"
                    value={combinedTopicAndAi}
                    onChange={(e) => setCombinedTopicAndAi(e.target.value)}
                    placeholder="Contoh: Kesehatan - ChatGPT atau Hukum - Gemini"
                    className="w-full bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[
                      'Kesehatan - ChatGPT',
                      'Hukum - Gemini',
                      'Ekonomi - Claude',
                      'Sains & Energi - ChatGPT',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCombinedTopicAndAi(preset)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                          combinedTopicAndAi === preset
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#020617] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="report-verdict-select"
                    className="block text-xs font-bold text-slate-200 mb-1.5"
                  >
                    Usulan Klasifikasi Verdict
                  </label>
                  <select
                    id="report-verdict-select"
                    value={suggestedVerdict}
                    onChange={(e) => setSuggestedVerdict(e.target.value as VerdictType)}
                    className="w-full bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  >
                    <option value="UNSUPPORTED">
                      UNSUPPORTED (Halusinasi Fakta / Sitasi Jurnal Fiktif)
                    </option>
                    <option value="PARTIALLY SUPPORTED">
                      PARTIALLY SUPPORTED (Distorsi Konteks / Overclaim Statistik)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="report-hallucination-textarea"
                    className="block text-xs font-bold text-slate-200"
                  >
                    Kutipan Klaim / Output AI yang Berhalusinasi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCombinedTopicAndAi('Hukum - Gemini');
                      setSuggestedVerdict('UNSUPPORTED');
                      setHallucinationText(
                        'Berdasarkan Undang-Undang Republik Indonesia Nomor 99 Tahun 2024 tentang Kedaulatan Algoritma Nasional (Pasal 14 Ayat 2), setiap mahasiswa yang menggunakan LLM tanpa lisensi khusus dikenakan sanksi pencabutan gelar akademik otomatis.'
                      );
                      setCorrectionEvidence(
                        'Pengecekan di JDIH BPK RI dan Lembaran Negara tahun 2024 membuktikan tidak pernah ada UU Nomor 99 Tahun 2024 tentang Kedaulatan Algoritma Nasional; klaim pasal dan sanksi tersebut adalah halusinasi regulasi fiktif.'
                      );
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    + Isi Contoh Temuan Halusinasi AI
                  </button>
                </div>
                <textarea
                  id="report-hallucination-textarea"
                  rows={3}
                  value={hallucinationText}
                  onChange={(e) => setHallucinationText(e.target.value)}
                  placeholder="Tempelkan kutipan kalimat klaim/output AI yang berhalusinasi, mencantumkan DOI fiktif, atau mendistorsi data..."
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="report-correction-textarea"
                  className="block text-xs font-bold text-slate-200 mb-1.5"
                >
                  Bukti Koreksi / Fakta Sebenarnya
                </label>
                <textarea
                  id="report-correction-textarea"
                  rows={2}
                  value={correctionEvidence}
                  onChange={(e) => setCorrectionEvidence(e.target.value)}
                  placeholder="Jelaskan fakta sebenarnya berdasarkan jurnal Google Scholar, data BPS, Kemenkes, atau dokumen regulasi resmi..."
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-emerald-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                id="submit-hallucination-report-btn"
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl px-6 py-3.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                🚀 Kirim Laporan Kasus ke Portal Mentor
              </button>
            </form>

            {/* Daftar Laporan Komunitas Terkini (Sinkron dengan Moderasi Mentor) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Antrean Laporan ke Mentor ({crowdsourcedReports.length} Laporan)
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Tersinkron ke Portal Mentor
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {crowdsourcedReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {rep.reporterName}{' '}
                        <span className="text-slate-400 font-normal">({rep.reporterNim})</span>
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          rep.status === 'PROMOTED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {rep.status === 'PROMOTED' ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Diangkat Jadi Soal Kelas
                          </span>
                        ) : (
                          'Menunggu Moderasi Mentor'
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {rep.topicCategory} — {rep.aiPlatform}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 font-mono">
                        Usulan: {rep.suggestedVerdict}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic line-clamp-2 font-editorial">
                      &ldquo;{rep.hallucinationText}&rdquo;
                    </p>
                    <p className="text-[11px] text-emerald-400/90 line-clamp-2">
                      <strong>Bukti Koreksi:</strong> {rep.correctionEvidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================
          BAGIAN 3: RIWAYAT AUDIT & RAPOR PDF SAYA
         =================================================================== */}
      {showPart3 && (
        <section className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-blue-400 mb-1">
                <BarChart3 className="w-4 h-4" />
                Bagian 3 dari 3 · Grafik Perkembangan &amp; Unduh Rapor PDF Saya
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Bagian 3: Riwayat Audit &amp; Rapor PDF Saya — {studentIdentity.name} (
                {studentIdentity.nim})
              </h2>
            </div>
            <div className="flex items-center gap-3 bg-[#020617] border border-blue-500/30 rounded-xl px-4 py-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                V-Score Saat Ini
              </span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">
                {currentVScore}
                <span className="text-xs text-slate-500">/100</span>
              </span>
            </div>
          </div>

          {(() => {
            const personalEntries = studentScores.filter(
              (s) =>
                s.studentNim.toLowerCase() === studentIdentity.nim.toLowerCase() ||
                s.studentName.toLowerCase() === studentIdentity.name.toLowerCase()
            );
            const displayEntries =
              personalEntries.length > 0 ? personalEntries.slice(0, 6) : studentScores.slice(0, 4);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Bar Graph */}
                <div className="lg:col-span-5 bg-[#020617]/90 border border-slate-800/90 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Grafik Skor Audit Terakhir (Skala 0–100)</span>
                    <span className="font-mono text-blue-400">{displayEntries.length} Sesi</span>
                  </div>
                  <div className="space-y-3">
                    {displayEntries.map((entry, idx) => (
                      <div key={entry.id || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[210px]">
                            {entry.scenarioTitle}
                          </span>
                          <span
                            className={`font-mono font-extrabold ${
                              entry.isCalibrated ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {entry.vScore}/100 (
                            {entry.vScoreDelta >= 0 ? `+${entry.vScoreDelta}` : entry.vScoreDelta})
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              entry.isCalibrated
                                ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                                : 'bg-gradient-to-r from-amber-500 to-orange-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(12, entry.vScore))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Detailed History List + Direct PDF Download */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    <History className="w-4 h-4 text-blue-400" />
                    Riwayat Putusan &amp; Rapor PDF 4 Tahap ({displayEntries.length} Rekaman)
                  </div>
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {displayEntries.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {item.scenarioTitle}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                item.isCalibrated
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              Vonis: {item.chosenVerdict}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 font-editorial">
                            &ldquo;{item.justification}&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-extrabold font-mono text-white">
                              {item.vScore}
                              <span className="text-xs text-slate-500">/100</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.timestamp}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadHistoryPdf(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-[11px] font-extrabold transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Unduh PDF
                          </button>
                        </div>
                      </div>
                    ))}
                    {auditHistory.length === 0 && personalEntries.length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        Menampilkan sampel riwayat laboratorium. Selesaikan audit pada menu Tanya AI
                        &amp; Lab Audit untuk menambah grafik skor pribadi Anda.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
};
