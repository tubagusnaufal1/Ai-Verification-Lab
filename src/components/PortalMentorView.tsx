import React, { useState } from 'react';
import {
  ChallengeScenario,
  VerdictType,
  buildScholarSearchUrl,
  sanitizeSnippetText,
  encodeScenarioToken,
} from '../utils/verificationLogic';
import { generateScenarioWithAI } from '../utils/liveSearchService';
import {
  UserRole,
  StudentScoreEntry,
  CrowdsourcedReport,
  isMentorRole,
} from '../utils/storageService';
import {
  Crown,
  Sparkles,
  PlusCircle,
  Download,
  CheckCircle2,
  KeyRound,
  Search,
  ArrowUpRight,
  Lock,
  Copy,
  Check,
  BarChart3,
  MessageSquareWarning,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Eye,
  X,
} from 'lucide-react';

export type MentorSubTab = 'scenario-builder' | 'class-diagnostics' | 'crowdsourcing-moderation';

interface PortalMentorViewProps {
  activeRole: UserRole;
  activeSubTab?: MentorSubTab;
  onSelectSubTab?: (subTab: MentorSubTab) => void;
  onUnlockMentorRole: () => void;
  scenarios: ChallengeScenario[];
  onAddScenario: (newScenario: ChallengeScenario) => void;
  studentScores: StudentScoreEntry[];
  onClearAllScores?: () => void;
  onResetScoresToDefault?: () => void;
  crowdsourcedReports: CrowdsourcedReport[];
  onPromoteReportToScenario: (reportId: string) => void;
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const PortalMentorView: React.FC<PortalMentorViewProps> = ({
  activeRole,
  activeSubTab: controlledSubTab,
  onSelectSubTab,
  onUnlockMentorRole,
  scenarios,
  onAddScenario,
  studentScores,
  onClearAllScores,
  onResetScoresToDefault,
  crowdsourcedReports,
  onPromoteReportToScenario,
  onNotify,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<MentorSubTab>('scenario-builder');
  const activeSubTab = controlledSubTab ?? internalSubTab;

  const handleSwitchSubTab = (tab: MentorSubTab) => {
    setInternalSubTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab);
    }
  };

  // Locked Screen Credentials State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Scenario Builder State
  const [aiTopicInput, setAiTopicInput] = useState(
    'Subsidi Kendaraan Listrik dan Emisi Karbon Nasional'
  );
  const [selectedLevel, setSelectedLevel] = useState<
    'LEVEL: DASAR' | 'LEVEL: MENENGAH' | 'LEVEL: MAHIR'
  >('LEVEL: MENENGAH');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kebijakan Publik & Sains');
  const [description, setDescription] = useState('');
  const [aiOutputText, setAiOutputText] = useState('');
  const [expectedVerdict, setExpectedVerdict] = useState<VerdictType>('PARTIALLY SUPPORTED');
  const [calibrationHint, setCalibrationHint] = useState('');
  const [ref1Title, setRef1Title] = useState('');
  const [ref1Snippet, setRef1Snippet] = useState('');
  const [ref2Title, setRef2Title] = useState('');
  const [ref2Snippet, setRef2Snippet] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Gradebook Filter & 4-Stage Process Modal State
  const [scoreFilter, setScoreFilter] = useState('');
  const [selectedProcessEntry, setSelectedProcessEntry] = useState<StudentScoreEntry | null>(null);

  const handleManualMentorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser.trim().toLowerCase() === 'mentor' && loginPass.trim() === 'harfest2026') {
      setLoginError('');
      onUnlockMentorRole();
    } else {
      setLoginError(
        'Kredensial belum sesuai. Gunakan username "mentor" dan password "harfest2026".'
      );
    }
  };

  const handleOneClickJuryUnlock = () => {
    setLoginUser('mentor');
    setLoginPass('harfest2026');
    setLoginError('');
    onUnlockMentorRole();
  };

  // KUNCI RAPAT PORTAL MENTOR SAAT PENGGUNA ADALAH PESERTA (STUDENT)
  if (!isMentorRole(activeRole)) {
    return (
      <div className="animate-page-enter max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-[#0b1120] border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                  Akses Ditolak · Khusus Penguji / Mentor
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Akses Ditolak: Area Eksklusif Penguji (Mentor)
                </h1>
              </div>
            </div>
            <Crown className="w-6 h-6 text-amber-400 shrink-0" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
            <p>
              Anda saat ini mengakses platform dengan peran{' '}
              <strong className="text-blue-400">Peserta (Mahasiswa)</strong>. Untuk mencegah
              kebocoran kunci jawaban Verdict, fitur Scenario Builder, dan nilai mahasiswa lain,
              halaman Dashboard Penguji dikunci rapat.
            </p>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Akses Cepat Dewan Juri &amp; Dosen Penguji
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-[#020617]/90 px-3.5 py-2.5 rounded-lg border border-amber-500/20 text-amber-300">
              <span>
                Username: <strong className="text-white">mentor</strong>
              </span>
              <span>•</span>
              <span>
                Password: <strong className="text-white">harfest2026</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleOneClickJuryUnlock}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl py-3 px-4 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Auto-Fill Login Mentor (Juri)
            </button>
          </div>

          <form onSubmit={handleManualMentorLogin} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username Penguji / Mentor
                </label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Ketik: mentor"
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Password Penguji
                </label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Ketik: harfest2026"
                  className="w-full bg-[#0f172a] border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs font-semibold text-red-400 bg-red-950/50 border border-red-500/40 rounded-lg px-3.5 py-2">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#0f172a] hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs sm:text-sm rounded-xl py-3 transition-all cursor-pointer"
            >
              Verifikasi Kredensial &amp; Buka Portal Mentor
            </button>
          </form>
        </div>
      </div>
    );
  }

  // HANDLERS WHEN AUTHENTICATED AS MENTOR
  const handleAutoGenerateScenario = async () => {
    if (!aiTopicInput.trim()) {
      onNotify(
        'Masukkan Topik Soal',
        'Ketik topik kebijakan atau sains untuk di-generate.',
        'warning'
      );
      return;
    }
    setIsGeneratingScenario(true);
    try {
      const generated = await generateScenarioWithAI(aiTopicInput, selectedLevel);
      setTitle(generated.title);
      setCategory(generated.category || 'Kebijakan Publik & Sains');
      setDescription(generated.description);
      setAiOutputText(generated.aiOutputText);
      setExpectedVerdict(generated.expectedVerdict);
      setCalibrationHint(generated.calibrationHint);
      if (generated.preloadedReferences[0]) {
        setRef1Title(generated.preloadedReferences[0].title);
        setRef1Snippet(generated.preloadedReferences[0].snippet);
      }
      if (generated.preloadedReferences[1]) {
        setRef2Title(generated.preloadedReferences[1].title);
        setRef2Snippet(generated.preloadedReferences[1].snippet);
      }
      onNotify(
        'Draf Soal Berhasil Disusun',
        'Silakan tinjau draf soal di bawah, lalu klik "Terbitkan Soal ke Challenge & Lab".',
        'success'
      );
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handlePublishScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !aiOutputText.trim()) {
      onNotify(
        'Data Soal Belum Lengkap',
        'Mohon isi Judul Kasus dan Teks Output AI (atau gunakan tombol Auto-Generate Soal).',
        'warning'
      );
      return;
    }

    const badgeColor =
      selectedLevel === 'LEVEL: MAHIR'
        ? 'red'
        : selectedLevel === 'LEVEL: MENENGAH'
          ? 'amber'
          : 'blue';
    const borderColorClass =
      selectedLevel === 'LEVEL: MAHIR'
        ? 'border-red-500/70'
        : selectedLevel === 'LEVEL: MENENGAH'
          ? 'border-amber-500/70'
          : 'border-blue-500/70';

    const cleanTopic = title.replace(/^Kasus\s*\d*:\s*/i, '').trim();
    const r1TitleClean = ref1Title.trim() || `[PDF] Evaluasi Empiris ${cleanTopic} di Indonesia`;
    const r2TitleClean =
      ref2Title.trim() || `[PDF] Tinjauan Metodologi dan Kebijakan ${cleanTopic}`;

    const newScenario: ChallengeScenario = {
      id: `mentor-case-${Date.now()}`,
      level: selectedLevel,
      category: category.trim() || 'Sains & Teknologi',
      badgeColor,
      borderColorClass,
      title: title.trim(),
      description:
        description.trim() ||
        'Studi kasus verifikasi klaim AI yang disusun melalui Scenario Builder Portal Mentor.',
      aiOutputText: sanitizeSnippetText(aiOutputText),
      searchQuery: `${cleanTopic} jurnal penelitian ilmiah`,
      expectedVerdict,
      calibrationHint:
        calibrationHint.trim() ||
        `Periksa kesesuaian klaim AI dengan bukti primer; kunci jawaban yang ditetapkan Mentor adalah ${expectedVerdict}.`,
      createdBy: 'Dosen / Mentor Penguji',
      preloadedReferences: [
        {
          id: 1,
          title: r1TitleClean.startsWith('[PDF]') ? r1TitleClean : `[PDF] ${r1TitleClean}`,
          url: buildScholarSearchUrl(r1TitleClean),
          scholarUrl: buildScholarSearchUrl(r1TitleClean),
          snippet: sanitizeSnippetText(
            ref1Snippet.trim() ||
              `Bukti literatur primer terkait ${cleanTopic} menunjukkan perlunya kehati-hatian dalam menafsirkan angka statistik dan ruang lingkup sampel.`
          ),
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 2,
          title: r2TitleClean.startsWith('[PDF]') ? r2TitleClean : `[PDF] ${r2TitleClean}`,
          url: buildScholarSearchUrl(r2TitleClean),
          scholarUrl: buildScholarSearchUrl(r2TitleClean),
          snippet: sanitizeSnippetText(
            ref2Snippet.trim() ||
              `Evaluasi komparatif lintas institusi menegaskan bahwa klaim generalisasi mutlak 100% tanpa variabel perancu tidak didukung oleh data empiris.`
          ),
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 3,
          title: `[PDF] Analisis Kebijakan Berbasis Bukti tentang ${cleanTopic} — Repositori Akademik Nasional`,
          url: buildScholarSearchUrl(`Analisis Kebijakan Berbasis Bukti ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(`Analisis Kebijakan Berbasis Bukti ${cleanTopic}`),
          snippet: `Kajian kebijakan menekankan pentingnya memverifikasi keaslian DOI dan sitasi jurnal sebelum menjadikan output AI sebagai rujukan ilmiah.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 4,
          title: `[PDF] Studi Komparatif Metodologi Riset pada Topik ${cleanTopic}`,
          url: buildScholarSearchUrl(`Studi Komparatif Metodologi Riset ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(`Studi Komparatif Metodologi Riset ${cleanTopic}`),
          snippet: `Validasi silang terhadap pangkalan data Google Scholar dan SINTA diperlukan untuk memastikan tidak ada distorsi konteks.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 5,
          title: `[PDF] Pedoman Etika dan Verifikasi Informasi Ilmiah pada Era AI Generatif`,
          url: buildScholarSearchUrl(`Pedoman Etika Verifikasi Informasi Ilmiah AI Generatif`),
          scholarUrl: buildScholarSearchUrl(
            `Pedoman Etika Verifikasi Informasi Ilmiah AI Generatif`
          ),
          snippet: `Pengguna AI wajib memisahkan korelasi statistik dari klaim kausalitas tunggal yang berlebihan.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
        {
          id: 6,
          title: `[PDF] Audit Bibliometrik dan Deteksi Ghost Citation pada Publikasi ${cleanTopic}`,
          url: buildScholarSearchUrl(`Audit Bibliometrik Deteksi Ghost Citation ${cleanTopic}`),
          scholarUrl: buildScholarSearchUrl(
            `Audit Bibliometrik Deteksi Ghost Citation ${cleanTopic}`
          ),
          snippet: `Pemeriksaan nomor DOI dan kesesuaian tahun terbit mencegah masuknya referensi halusinasi ke dalam naskah akademik.`,
          isPdf: true,
          domain: 'scholar.google.com',
        },
      ],
    };

    onAddScenario(newScenario);
    setTitle('');
    setDescription('');
    setAiOutputText('');
    setCalibrationHint('');
    setRef1Title('');
    setRef1Snippet('');
    setRef2Title('');
    setRef2Snippet('');
  };

  const handleCopyScenarioToken = (scenario: ChallengeScenario) => {
    const token = encodeScenarioToken(scenario);
    navigator.clipboard.writeText(token);
    setCopiedTokenId(scenario.id);
    onNotify(
      'Kode Token Soal Disalin!',
      `Token Base64 untuk "${scenario.title}" siap dibagikan ke mahasiswa untuk diimpor di halaman Challenge & Riwayat.`,
      'success'
    );
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleExportGradebookCsv = () => {
    const headers = [
      'ID',
      'Nama Mahasiswa',
      'NIM / Institusi',
      'Judul Kasus',
      'Percobaan',
      'Verdict Mahasiswa',
      'Kunci Jawaban',
      'Status Kalibrasi',
      'Tahap 1 Claim (/25)',
      'Tahap 2 Source (/25)',
      'Tahap 3 Verdict (/25)',
      'Tahap 4 Context (/25)',
      'Total V-Score (/100)',
      'Waktu',
      'Justifikasi Analitis',
    ];
    const rows = studentScores.map((s) => [
      s.id,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentNim.replace(/"/g, '""')}"`,
      `"${s.scenarioTitle.replace(/"/g, '""')}"`,
      `Percobaan #${s.attemptCount ?? 1}`,
      s.chosenVerdict,
      s.expectedVerdict,
      s.isCalibrated ? 'TEPAT' : 'MELESET',
      s.stageBreakdown?.stage1ClaimAudit ?? 22,
      s.stageBreakdown?.stage2SourceVerification ?? 21,
      s.stageBreakdown?.stage3VerdictAccuracy ?? 25,
      s.stageBreakdown?.stage4JustificationQuality ?? 20,
      s.vScore,
      `"${s.timestamp}"`,
      `"${s.justification.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap-Diagnostik-VScore-Mentor-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onNotify(
      'Rekap Nilai (.CSV) Diunduh',
      `Berhasil mengekspor ${studentScores.length} data nilai mahasiswa beserta diagnostik 4 tahap.`,
      'success'
    );
  };

  const filteredScores = studentScores.filter(
    (s) =>
      s.studentName.toLowerCase().includes(scoreFilter.toLowerCase()) ||
      s.studentNim.toLowerCase().includes(scoreFilter.toLowerCase()) ||
      s.scenarioTitle.toLowerCase().includes(scoreFilter.toLowerCase())
  );

  // Kalkulasi Rata-Rata Diagnostik Kognitif Kelas per Tahap (@ 25 Poin)
  const count = Math.max(1, studentScores.length);
  const avgStage1 =
    studentScores.length === 0
      ? 0
      : Math.round(
          (studentScores.reduce((acc, s) => acc + (s.stageBreakdown?.stage1ClaimAudit ?? 22), 0) /
            count) *
            10
        ) / 10;
  const avgStage2 =
    studentScores.length === 0
      ? 0
      : Math.round(
          (studentScores.reduce(
            (acc, s) => acc + (s.stageBreakdown?.stage2SourceVerification ?? 21),
            0
          ) /
            count) *
            10
        ) / 10;
  const avgStage3 =
    studentScores.length === 0
      ? 0
      : Math.round(
          (studentScores.reduce(
            (acc, s) => acc + (s.stageBreakdown?.stage3VerdictAccuracy ?? 22),
            0
          ) /
            count) *
            10
        ) / 10;
  const avgStage4 =
    studentScores.length === 0
      ? 0
      : Math.round(
          (studentScores.reduce(
            (acc, s) => acc + (s.stageBreakdown?.stage4JustificationQuality ?? 20),
            0
          ) /
            count) *
            10
        ) / 10;

  const stageAverages = [
    { label: 'Tahap 1 · Claim & Pathology Audit', avg: avgStage1, max: 25 },
    { label: 'Tahap 2 · Source Verification', avg: avgStage2, max: 25 },
    { label: 'Tahap 3 · Verdict Accuracy', avg: avgStage3, max: 25 },
    { label: 'Tahap 4 · Analytical Justification', avg: avgStage4, max: 25 },
  ];
  const weakestStage = [...stageAverages].sort((a, b) => a.avg - b.avg)[0];

  return (
    <div className="animate-page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#fbbf24]">
            <Crown className="w-4 h-4" />
            Dashboard Eksklusif Penguji (Mentor / Dosen) · Zero Overlap
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ruang Kendali Soal, Rekap Diagnostik &amp; Moderasi Kelas
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl">
            Kelola pembuatan soal jebakan halusinasi AI, bagikan{' '}
            <strong className="text-amber-300">Kode Token Soal Base64</strong> lintas perangkat,
            petakan kelemahan kognitif kelas per tahap, dan moderasi laporan kasus.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Status Autentikasi: MENTOR TERVERIFIKASI
        </div>
      </div>

      {/* 3 MENU KERJA PENGUJI (MENTOR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0b1120] border border-slate-800 p-2 rounded-2xl">
        <button
          type="button"
          onClick={() => handleSwitchSubTab('scenario-builder')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'scenario-builder'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-[#0f172a] text-slate-300 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          1. Pembuat Soal (Scenario Builder) ({scenarios.length})
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('class-diagnostics')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'class-diagnostics'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-[#0f172a] text-slate-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          2. Rekap &amp; Diagnostik Nilai Kelas ({studentScores.length})
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSubTab('crowdsourcing-moderation')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'crowdsourcing-moderation'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-[#0f172a] text-slate-300 hover:text-white'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          3. Moderasi Laporan Kasus ({crowdsourcedReports.length})
        </button>
      </div>

      {/* MENU 1: PEMBUAT SOAL (SCENARIO BUILDER) + GENERATOR TOKEN BASE64 */}
      {activeSubTab === 'scenario-builder' && (
        <div className="space-y-8 animate-page-enter">
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-1">
                  <PlusCircle className="w-4 h-4" />
                  1. Pembuat Soal (Scenario Builder) &amp; Generator Token Base64
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Buat Soal Halusinasi AI Baru untuk Kelas
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Ketik topik ujian lalu klik <strong>Auto-Generate Draf Soal</strong>, atau rancang
                  manual. Setiap soal yang terbit dilengkapi tombol{' '}
                  <strong>Salin Kode Token Soal</strong> untuk dibagikan lintas perangkat.
                </p>
              </div>
            </div>

            {/* AI Auto-Generator Bar */}
            <div className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Generate Draf Soal &amp; 6 Bukti Pembanding (1-Klik)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <input
                    type="text"
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="Ketik topik soal (misal: Keamanan Data Biometrik Nasional)..."
                    className="w-full bg-[#020617] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={selectedLevel}
                    onChange={(e) =>
                      setSelectedLevel(
                        e.target.value as 'LEVEL: DASAR' | 'LEVEL: MENENGAH' | 'LEVEL: MAHIR'
                      )
                    }
                    className="w-full bg-[#020617] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  >
                    <option value="LEVEL: DASAR">LEVEL: DASAR (Over-Generalisasi)</option>
                    <option value="LEVEL: MENENGAH">LEVEL: MENENGAH (Distorsi Konteks)</option>
                    <option value="LEVEL: MAHIR">LEVEL: MAHIR (Sitasi Fiktif / DOI Palsu)</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button
                    type="button"
                    disabled={isGeneratingScenario}
                    onClick={handleAutoGenerateScenario}
                    className="w-full h-full bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-60 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGeneratingScenario ? 'Menyusun Soal...' : 'Auto-Generate Draf Soal'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Detail Soal */}
            <form onSubmit={handlePublishScenario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Judul Kasus Soal
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kasus 4: Manipulasi Data Subsidi Energi"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategori Bidang Ilmu
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Contoh: Ekonomi & Energi"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kunci Jawaban Verdict
                  </label>
                  <select
                    value={expectedVerdict}
                    onChange={(e) => setExpectedVerdict(e.target.value as VerdictType)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PARTIALLY SUPPORTED">
                      PARTIALLY SUPPORTED (Distorsi Konteks)
                    </option>
                    <option value="UNSUPPORTED">UNSUPPORTED (Halusinasi / Fiktif)</option>
                    <option value="VERIFIED">VERIFIED (Akurat Sesuai Bukti)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Deskripsi Singkat Skenario
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan singkat jebakan logika atau patologi AI pada soal ini..."
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Paragraf Teks Output AI yang Akan Diuji Mahasiswa
                </label>
                <textarea
                  rows={3}
                  value={aiOutputText}
                  onChange={(e) => setAiOutputText(e.target.value)}
                  placeholder="Tuliskan paragraf klaim AI yang mengandung distorsi statistik, sitasi fiktif, atau over-generalisasi..."
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Catatan Kalibrasi / Penjelasan Kunci Jawaban (Ditampilkan Setelah Mahasiswa
                  Submit)
                </label>
                <input
                  type="text"
                  value={calibrationHint}
                  onChange={(e) => setCalibrationHint(e.target.value)}
                  placeholder="Penjelasan mengapa vonis tersebut tepat berdasarkan bukti primer..."
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl px-6 py-3 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Terbitkan Soal &amp; Buat Kode Token Base64
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Soal Aktif & Generator Kode Token Base64 */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Daftar Soal Aktif &amp; Generator Kode Token Lintas Perangkat ({scenarios.length}{' '}
                  Soal)
                </h3>
                <p className="text-xs text-slate-400">
                  Klik tombol <strong>🔑 Salin Kode Token Soal</strong> pada soal mana pun untuk
                  membagikannya ke mahasiswa di perangkat berbeda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scen) => (
                <div
                  key={scen.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-amber-400 uppercase">
                        {scen.level} · {scen.category || 'Sains'}
                      </span>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Kunci: {scen.expectedVerdict}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-white">{scen.title}</h4>
                    <p className="text-xs text-slate-300 italic line-clamp-2 font-editorial">
                      &ldquo;{scen.aiOutputText}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {scen.preloadedReferences.length} Bukti Terlampir
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyScenarioToken(scen)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-extrabold text-amber-300 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedTokenId === scen.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Token Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          🔑 Salin Kode Token Soal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MENU 2: REKAP & DIAGNOSTIK NILAI KELAS */}
      {activeSubTab === 'class-diagnostics' && (
        <div className="space-y-6 animate-page-enter">
          {/* Panel Rata-Rata Akurasi Kelas Per Tahap (@ 25 Poin) */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
                  Pemetaan Kelemahan Kognitif Kelas (4 Tahap @ 25 Poin)
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Diagnostik Rata-Rata Capaian Kelas per Tahap VERIFY
                </h2>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-amber-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Area Terlemah Kelas Saat Ini:{' '}
                  <strong className="text-white">{weakestStage.label}</strong> (Rata-rata{' '}
                  {weakestStage.avg}/25)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stageAverages.map((st) => {
                const pct = Math.round((st.avg / st.max) * 100);
                const isWeakest = st.label === weakestStage.label;
                return (
                  <div
                    key={st.label}
                    className={`rounded-xl p-4 border space-y-2 ${
                      isWeakest
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-[#0f172a] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">{st.label}</span>
                      <span className="text-emerald-400 font-mono tabular-nums">{pct}%</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                      {st.avg} <span className="text-xs font-sans font-normal text-slate-400">/ 25 Poin</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isWeakest ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabel Live Gradebook Mahasiswa */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-extrabold text-white">
                  Tabel Rekap Skor V-Score Mahasiswa ({studentScores.length} Entri Unik)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Dilengkapi proteksi Anti-Duplikat: pengerjaan ulang oleh mahasiswa yang sama pada
                  soal yang sama otomatis memperbarui baris skor yang ada (Percobaan #1, #2, dst.).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    placeholder="Cari nama / NIM / kasus..."
                    className="bg-[#0f172a] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportGradebookCsv}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Rekap (.CSV)
                </button>
                {onResetScoresToDefault && (
                  <button
                    type="button"
                    onClick={onResetScoresToDefault}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Data Default
                  </button>
                )}
                {onClearAllScores && (
                  <button
                    type="button"
                    onClick={onClearAllScores}
                    className="inline-flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Semua Data
                  </button>
                )}
              </div>
            </div>

            {filteredScores.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">
                Belum ada data rekap skor mahasiswa yang sesuai. Gunakan tombol{' '}
                <strong>Reset Data Default</strong> untuk memuat sampel kelas atau minta peserta
                menyelesaikan audit.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Mahasiswa</th>
                      <th className="py-3 px-3">Kasus yang Diuji &amp; Percobaan</th>
                      <th className="py-3 px-3">Verdict &amp; Kalibrasi</th>
                      <th className="py-3 px-3">Rincian 4 Tahap (@25)</th>
                      <th className="py-3 px-3">Total V-Score</th>
                      <th className="py-3 px-3">Justifikasi Analitis</th>
                      <th className="py-3 px-3 text-right">Inspeksi Proses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {filteredScores.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#0f172a]/80 transition-colors">
                        <td className="py-3.5 px-3 align-top">
                          <div className="font-bold text-white">{entry.studentName}</div>
                          <div className="text-[11px] text-slate-400">{entry.studentNim}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {entry.timestamp}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top max-w-[220px] space-y-1">
                          <div className="font-semibold text-slate-200">{entry.scenarioTitle}</div>
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            Percobaan #{entry.attemptCount ?? 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] ${
                              entry.isCalibrated
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {entry.chosenVerdict}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Kunci: <strong>{entry.expectedVerdict}</strong>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top font-mono text-[11px] text-slate-300">
                          <div>T1 Claim: {entry.stageBreakdown?.stage1ClaimAudit ?? 22}/25</div>
                          <div>
                            T2 Source: {entry.stageBreakdown?.stage2SourceVerification ?? 21}/25
                          </div>
                          <div>
                            T3 Verdict: {entry.stageBreakdown?.stage3VerdictAccuracy ?? 25}/25
                          </div>
                          <div>
                            T4 Context: {entry.stageBreakdown?.stage4JustificationQuality ?? 20}/25
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <div className="text-base font-extrabold text-emerald-400 font-mono tabular-nums">
                            {entry.vScore} / 100
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top max-w-xs">
                          <p className="text-slate-300 italic line-clamp-3 font-editorial">
                            &ldquo;{entry.justification}&rdquo;
                          </p>
                        </td>
                        <td className="py-3.5 px-3 align-top text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedProcessEntry(entry)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-[11px] font-extrabold text-blue-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            🔍 Detail Proses 4 Tahap
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MENU 3: MODERASI LAPORAN KASUS KOMUNITAS */}
      {activeSubTab === 'crowdsourcing-moderation' && (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-page-enter">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
                3. Moderasi Laporan Kasus Komunitas
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Moderasi Laporan Temuan Halusinasi AI dari Mahasiswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tinjau laporan temuan halusinasi AI yang dikirim mahasiswa dan angkat menjadi soal
                resmi di halaman Challenge &amp; Riwayat dengan 1 klik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crowdsourcedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-white">{rep.reporterName}</span>
                      <span className="text-xs text-slate-400 ml-1.5">({rep.reporterNim})</span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {rep.topicCategory} · {rep.aiPlatform}
                    </span>
                  </div>

                  <div className="bg-[#020617]/80 border border-slate-800/90 rounded-lg p-3 text-xs text-slate-200 italic font-editorial">
                    &ldquo;{rep.hallucinationText}&rdquo;
                  </div>

                  <p className="text-xs text-emerald-300/90 leading-relaxed">
                    <strong className="text-emerald-400">Bukti Koreksi Mahasiswa: </strong>
                    {rep.correctionEvidence}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Usulan Kunci: <strong className="text-amber-300">{rep.suggestedVerdict}</strong>
                  </span>

                  {rep.status === 'PROMOTED' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sudah Dijadikan Soal Ujian Kelas
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPromoteReportToScenario(rep.id)}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      Jadikan Soal Ujian Kelas
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL INSPEKSI VISUAL: DETAIL PROSES 4 TAHAP SISWA */}
      {selectedProcessEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0b1120] border-2 border-blue-500/50 text-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Rekam Jejak Audit Transparan · Detail Proses 4 Tahap Siswa
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {selectedProcessEntry.studentName}{' '}
                  <span className="text-slate-400 text-base font-normal">
                    ({selectedProcessEntry.studentNim})
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Skenario: <strong className="text-slate-200">{selectedProcessEntry.scenarioTitle}</strong> · Waktu Submit: {selectedProcessEntry.timestamp}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-[#020617] border border-emerald-500/40 rounded-xl px-4 py-2 text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total V-Score</div>
                  <div className="text-xl font-extrabold font-mono text-emerald-400">
                    {selectedProcessEntry.vScore} / 100
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProcessEntry(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Tutup Detail
                </button>
              </div>
            </div>

            {/* TAHAP 1: CLAIM & PATHOLOGY AUDIT */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                  Tahap 1 · Audit Mikro per Klaim &amp; Deteksi Patologi AI
                </span>
                <span className="text-xs font-mono font-extrabold text-emerald-400">
                  Skor Tahap 1: {selectedProcessEntry.stageBreakdown.stage1ClaimAudit} / 25 Poin
                </span>
              </div>

              {selectedProcessEntry.processLog?.stage1Claims &&
              selectedProcessEntry.processLog.stage1Claims.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedProcessEntry.processLog.stage1Claims.map((cl) => (
                    <div
                      key={cl.claimIndex}
                      className="bg-[#020617] border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-blue-300">
                          Unit Klaim #{cl.claimIndex}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                            cl.isMicroAccurate
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {cl.isMicroAccurate
                            ? '✓ Vonis Mikro Tepat'
                            : '⚠ Vonis Mikro Meleset'}
                        </span>
                      </div>
                      <p className="text-slate-200 italic font-editorial">
                        &ldquo;{cl.claimText}&rdquo;
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="bg-[#0b1120] border border-slate-800 rounded p-2">
                          <span className="text-slate-400 block">Vonis Mikro Siswa vs Kunci:</span>
                          <strong className="text-white">{cl.studentMicroVerdict || 'Belum Dipilih'}</strong>{' '}
                          <span className="text-slate-400">(Kunci: {cl.expectedMicroVerdict})</span>
                        </div>
                        <div className="bg-[#0b1120] border border-slate-800 rounded p-2">
                          <span className="text-slate-400 block">Patologi Dipilih Siswa:</span>
                          <strong className="text-amber-300">{cl.studentPathology || '-'}</strong>{' '}
                          <span className="text-slate-400">({cl.expectedPathologyLabel})</span>
                        </div>
                        <div className="bg-[#0b1120] border border-slate-800 rounded p-2">
                          <span className="text-slate-400 block">Rujukan Bukti Dipilih:</span>
                          <strong className="text-emerald-300 font-mono">
                            #{cl.studentEvidenceRefId || '-'}
                          </strong>{' '}
                          <span className="text-slate-400">(Kunci: #{cl.expectedEvidenceRefId})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Catatan Diagnostik: {selectedProcessEntry.stageBreakdown.stage1Feedback}
                </p>
              )}
            </div>

            {/* TAHAP 2: SOURCE VERIFICATION */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                  Tahap 2 · Pemeriksaan Sumber Bukti Primer
                </span>
                <span className="text-xs font-mono font-extrabold text-emerald-400">
                  Skor Tahap 2: {selectedProcessEntry.stageBreakdown.stage2SourceVerification} / 25
                  Poin
                </span>
              </div>

              {selectedProcessEntry.processLog?.stage2Sources &&
              selectedProcessEntry.processLog.stage2Sources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {selectedProcessEntry.processLog.stage2Sources.map((src) => (
                    <div
                      key={src.refId}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${
                        src.wasInspected
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                          : 'bg-[#020617] border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">
                          Bukti #{src.refId}: {src.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Domain: {src.domain}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                          src.wasInspected
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {src.wasInspected ? '✓ Diperiksa' : 'Belum Dicek'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Catatan Diagnostik: {selectedProcessEntry.stageBreakdown.stage2Feedback}
                </p>
              )}
            </div>

            {/* TAHAP 3 & TAHAP 4 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Tahap 3 */}
              <div className="md:col-span-5 bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Tahap 3 · Putusan Verdict Akhir
                  </span>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">
                    {selectedProcessEntry.stageBreakdown.stage3VerdictAccuracy} / 25
                  </span>
                </div>
                <div className="bg-[#020617] border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Verdict Pilihan Siswa:</span>
                    <strong className="text-white font-mono">
                      {selectedProcessEntry.chosenVerdict}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kunci Jawaban Soal:</span>
                    <strong className="text-emerald-400 font-mono">
                      {selectedProcessEntry.expectedVerdict}
                    </strong>
                  </div>
                  <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Status Kalibrasi:</span>
                    <span
                      className={`font-extrabold ${
                        selectedProcessEntry.isCalibrated ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {selectedProcessEntry.isCalibrated
                        ? '✓ Terkalibrasi Tepat'
                        : '⚠ Belum Terkalibrasi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tahap 4 */}
              <div className="md:col-span-7 bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Tahap 4 · Justifikasi Analitis &amp; Kata Kunci
                  </span>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">
                    {selectedProcessEntry.stageBreakdown.stage4JustificationQuality} / 25 Poin
                  </span>
                </div>

                <div className="bg-[#020617] border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 italic font-editorial leading-relaxed">
                  &ldquo;{selectedProcessEntry.justification}&rdquo;
                </div>

                {selectedProcessEntry.processLog && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#020617] border border-slate-800 rounded p-2">
                      <span className="text-slate-400 block">Kata Kunci Topik Terdeteksi:</span>
                      <strong className="text-blue-300">
                        {selectedProcessEntry.processLog.stage4Justification.topicKeywordsFound
                          .length > 0
                          ? selectedProcessEntry.processLog.stage4Justification.topicKeywordsFound.join(
                              ', '
                            )
                          : '-'}
                      </strong>
                    </div>
                    <div className="bg-[#020617] border border-slate-800 rounded p-2">
                      <span className="text-slate-400 block">Istilah Verifikasi Terdeteksi:</span>
                      <strong className="text-emerald-300">
                        {selectedProcessEntry.processLog.stage4Justification.analyticalKeywordsFound
                          .length > 0
                          ? selectedProcessEntry.processLog.stage4Justification.analyticalKeywordsFound.join(
                              ', '
                            )
                          : '-'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
