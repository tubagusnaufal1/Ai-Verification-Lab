import React, { useState, useEffect } from 'react';
import {
  SearchReference,
  VerdictType,
  MicroVerdictType,
  AIPathologyId,
  AI_PATHOLOGY_TAXONOMY,
  VSCORE_RUBRIC_100,
  AuditResultRecord,
  ExtractedClaim,
  ClaimMicroAuditInput,
  extractClaimsFromText,
  extractTopicQueryFromFreeText,
  detectGhostCitation,
  stripInlineCitationMarkers,
  validateAnalyticalJustification,
  evaluateVerdictAndCalculateVScore,
  generateVerifiedAcademicRewrite,
  downloadAuditReportAsPdf,
  analyzeReferenceCredibility,
  detectEpistemicStanceForTopic,
} from '../utils/verificationLogic';
import {
  performCleanLiveSearch,
  gradeAnalyticalJustificationWithAI,
} from '../utils/liveSearchService';
import { StudentIdentity } from '../utils/storageService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  ExternalLink,
  Download,
  RotateCcw,
  Sparkles,
  FileSearch,
  CheckSquare,
  GraduationCap,
  ShieldAlert,
  Copy,
  Check,
  BookOpen,
  ClipboardPaste,
  Award,
  X,
  Info,
} from 'lucide-react';

interface UjiOutputViewProps {
  claimText: string;
  onChangeClaimText: (text: string) => void;
  references: SearchReference[];
  onUpdateReferences: (refs: SearchReference[]) => void;
  expectedVerdict: VerdictType;
  onChangeExpectedVerdict?: (verdict: VerdictType) => void;
  activeScenarioTitle?: string;
  calibrationHint?: string;
  currentVScore: number;
  studentIdentity: StudentIdentity;
  onCompleteAudit: (record: AuditResultRecord) => void;
  auditHistory: AuditResultRecord[];
  onNotify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

function formatMicroVerdictLabel(verdict: MicroVerdictType | null): string {
  if (verdict === 'SESUAI_BUKTI') return '✅ Sesuai Bukti';
  if (verdict === 'DISTORSI') return '⚠️ Distorsi / Overclaim';
  if (verdict === 'HALUSINASI') return '❌ Halusinasi / Tidak Terbukti';
  return 'Belum Dipilih';
}

export const UjiOutputView: React.FC<UjiOutputViewProps> = ({
  claimText,
  onChangeClaimText,
  references,
  onUpdateReferences,
  expectedVerdict,
  onChangeExpectedVerdict,
  activeScenarioTitle,
  calibrationHint,
  currentVScore,
  studentIdentity,
  onCompleteAudit,
  auditHistory,
  onNotify,
}) => {
  const [justification, setJustification] = useState<string>('');
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictType | null>(null);
  const [isAuditLocked, setIsAuditLocked] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AuditResultRecord | null>(null);
  const [microAudits, setMicroAudits] = useState<Record<string, ClaimMicroAuditInput>>({});
  const [inspectedReferenceIds, setInspectedReferenceIds] = useState<number[]>([1, 2, 3]);
  const [extractedClaims, setExtractedClaims] = useState<ExtractedClaim[]>(() =>
    extractClaimsFromText(claimText, references, expectedVerdict)
  );
  const [isExtractingByoText, setIsExtractingByoText] = useState<boolean>(false);
  const [showByoPanel, setShowByoPanel] = useState<boolean>(false);
  const [byoInputText, setByoInputText] = useState<string>('');
  const [isGradingVerdict, setIsGradingVerdict] = useState<boolean>(false);
  const [copiedRewrite, setCopiedRewrite] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'meja-audit' | 'riwayat-saya'>('meja-audit');

  // Re-extract claims and Ghost Citations whenever claimText, references, or expectedVerdict change
  // PENTING (Spesifikasi 1a & 1b): Jangan membocorkan suggestedRefId atau pathologyId di awal sebelum dikunci!
  useEffect(() => {
    const localClaims = extractClaimsFromText(claimText, references, expectedVerdict);
    setExtractedClaims(localClaims);
    setMicroAudits((prev) => {
      const next: Record<string, ClaimMicroAuditInput> = {};
      for (const c of localClaims) {
        next[c.id] = prev[c.id] || {
          claimId: c.id,
          microVerdict: null,
          evidenceRefId: '',
          detectedPathology: '',
        };
      }
      return next;
    });
  }, [claimText, references, expectedVerdict]);

  // Reset lock and micro-audits when scenario changes from parent
  useEffect(() => {
    setIsAuditLocked(false);
    setSelectedVerdict(null);
    setLatestEvaluation(null);
    const localClaims = extractClaimsFromText(claimText, references, expectedVerdict);
    const freshMicro: Record<string, ClaimMicroAuditInput> = {};
    for (const c of localClaims) {
      freshMicro[c.id] = {
        claimId: c.id,
        microVerdict: null,
        evidenceRefId: '',
        detectedPathology: '',
      };
    }
    setMicroAudits(freshMicro);
  }, [activeScenarioTitle]);

  const justificationValidation = validateAnalyticalJustification(
    justification,
    claimText,
    references
  );

  const handleResetNewAuditSession = () => {
    setIsAuditLocked(false);
    setSelectedVerdict(null);
    setJustification('');
    setLatestEvaluation(null);
    const localClaims = extractClaimsFromText(claimText, references, expectedVerdict);
    const resetMicro: Record<string, ClaimMicroAuditInput> = {};
    for (const c of localClaims) {
      resetMicro[c.id] = {
        claimId: c.id,
        microVerdict: null,
        evidenceRefId: '',
        detectedPathology: '',
      };
    }
    setMicroAudits(resetMicro);
    onNotify(
      'Sesi Audit Baru Dimulai',
      'Kunci jawaban telah dibuka kembali. Silakan lakukan pemeriksaan ulang klaim dan bukti.',
      'info'
    );
  };

  // SPESIFIKASI 1c & 4a: Hubungan logis otomatis pada 3 tombol Vonis Mikro + Auto-select Rujukan Bukti jika masih kosong
  const handleSetMicroVerdict = (claimId: string, verdict: MicroVerdictType) => {
    if (isAuditLocked) return;
    const targetClaim = extractedClaims.find((c) => c.id === claimId);
    const fallbackRefId =
      targetClaim?.suggestedRefId && targetClaim.suggestedRefId !== ''
        ? targetClaim.suggestedRefId
        : String(((targetClaim ? targetClaim.index - 1 : 0) % Math.max(1, references.length)) + 1);

    const numericFallbackRef = Number(fallbackRefId);
    if (!Number.isNaN(numericFallbackRef) && numericFallbackRef > 0) {
      setInspectedReferenceIds((prev) =>
        prev.includes(numericFallbackRef) ? prev : [...prev, numericFallbackRef]
      );
    }

    setMicroAudits((prev) => {
      const existing = prev[claimId] || {
        claimId,
        microVerdict: null,
        evidenceRefId: '',
        detectedPathology: '',
      };

      // SPESIFIKASI 4a: Jika dropdown Rujukan Bukti masih kosong, otomatis pilihkan nomor sumber yang paling relevan
      const nextEvidenceRefId =
        existing.evidenceRefId && existing.evidenceRefId !== ''
          ? existing.evidenceRefId
          : verdict === 'HALUSINASI' && targetClaim?.suggestedRefId === 'NONE'
            ? 'NONE'
            : fallbackRefId;

      let nextPathology: AIPathologyId | '' = existing.detectedPathology;
      if (verdict === 'SESUAI_BUKTI') {
        // Otomatis set dropdown Patologi klaim tersebut menjadi "Bebas Patologi (Sesuai Bukti Primer)"
        nextPathology = 'VALID_CLAIM';
      } else {
        // Jika memilih Distorsi atau Halusinasi, kosongkan VALID_CLAIM agar wajib memilih dari 7 Taksonomi Patologi AI
        if (nextPathology === 'VALID_CLAIM' || !nextPathology) {
          nextPathology = '';
        }
      }

      return {
        ...prev,
        [claimId]: {
          ...existing,
          microVerdict: verdict,
          evidenceRefId: nextEvidenceRefId,
          detectedPathology: nextPathology,
        },
      };
    });
  };

  const handleSetClaimRefId = (claimId: string, refId: string) => {
    if (isAuditLocked) return;
    const numericRefId = Number(refId);
    if (!Number.isNaN(numericRefId) && numericRefId > 0) {
      setInspectedReferenceIds((prev) =>
        prev.includes(numericRefId) ? prev : [...prev, numericRefId]
      );
    }
    setMicroAudits((prev) => ({
      ...prev,
      [claimId]: {
        ...(prev[claimId] || { claimId, microVerdict: null, detectedPathology: '' }),
        evidenceRefId: refId,
      },
    }));
  };

  const handleSetClaimPathology = (claimId: string, pathology: AIPathologyId | '') => {
    if (isAuditLocked) return;
    setMicroAudits((prev) => {
      const existing = prev[claimId] || {
        claimId,
        microVerdict: null,
        evidenceRefId: '',
        detectedPathology: '',
      };
      return {
        ...prev,
        [claimId]: {
          ...existing,
          detectedPathology: pathology,
        },
      };
    });
  };

  const handleToggleInspectRef = (refId: number) => {
    if (isAuditLocked) return;
    setInspectedReferenceIds((prev) =>
      prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]
    );
  };

  // Mode "Tempel Teks AI Eksternal (ChatGPT/Claude/Lainnya)"
  const handleExtractAndFetchByoEvidence = async () => {
    const targetText = (byoInputText.trim() || claimText.trim()).trim();
    if (targetText.length < 6) {
      onNotify(
        'Teks Terlalu Pendek',
        'Tempelkan minimal 1 kalimat klaim dari output AI untuk diaudit.',
        'warning'
      );
      return;
    }

    setIsExtractingByoText(true);
    try {
      onChangeClaimText(targetText);
      const extractedTopic = extractTopicQueryFromFreeText(targetText);
      const liveSearchRes = await performCleanLiveSearch(extractedTopic, true);
      onUpdateReferences(liveSearchRes.references);

      const stance = detectEpistemicStanceForTopic(targetText, liveSearchRes.references);
      const newClaims = extractClaimsFromText(targetText, liveSearchRes.references);
      const hasGhost = newClaims.some((c) => c.ghostCitation?.status === 'GHOST_WARNING');
      const hasDistortion = newClaims.some((c) => c.expectedMicroVerdict === 'DISTORSI');
      const hasHallucination = newClaims.some((c) => c.expectedMicroVerdict === 'HALUSINASI');

      let computedExpected: VerdictType = stance.recommendedExpectedVerdict;
      if (hasGhost && /doi:|journal of|prof\./i.test(targetText)) {
        computedExpected = 'UNSUPPORTED';
      } else if (
        stance.hasCriticalOrDebunkingStance ||
        hasDistortion ||
        hasHallucination ||
        hasGhost
      ) {
        computedExpected = 'PARTIALLY SUPPORTED';
      }

      if (onChangeExpectedVerdict) {
        onChangeExpectedVerdict(computedExpected);
      }

      const syncedClaims = extractClaimsFromText(
        targetText,
        liveSearchRes.references,
        computedExpected
      );
      setExtractedClaims(syncedClaims);

      const freshMicro: Record<string, ClaimMicroAuditInput> = {};
      for (const c of syncedClaims) {
        freshMicro[c.id] = {
          claimId: c.id,
          microVerdict: null,
          evidenceRefId: '',
          detectedPathology: '',
        };
      }
      setMicroAudits(freshMicro);

      setIsAuditLocked(false);
      setSelectedVerdict(null);
      setLatestEvaluation(null);
      setShowByoPanel(false);
      onNotify(
        'Ekstrak Klaim & Penarikan 6 Bukti Selesai',
        `Topik "${extractedTopic}" berhasil dipindai di Serper.dev dan menghasilkan ${liveSearchRes.references.length} referensi pembanding di kolom kanan.`,
        'success'
      );
    } finally {
      setIsExtractingByoText(false);
    }
  };

  const handleChooseVerdictOption = (verdict: VerdictType) => {
    if (isAuditLocked) return;
    setSelectedVerdict(verdict);
  };

  // PENGUNCIAN JAWABAN PERMANEN (ONE-SHOT SUBMISSION LOCK)
  const handleLockAndSubmitFinalAudit = async () => {
    if (isAuditLocked) return;

    // Validasi bahwa apabila peserta memilih Distorsi atau Halusinasi pada klaim mana pun,
    // mereka wajib memilih jenis patologi dari 7 Taksonomi Patologi AI
    for (const c of extractedClaims) {
      const m = microAudits[c.id];
      if (
        m &&
        (m.microVerdict === 'DISTORSI' || m.microVerdict === 'HALUSINASI') &&
        (!m.detectedPathology || m.detectedPathology === 'VALID_CLAIM')
      ) {
        onNotify(
          `Pilih Jenis Patologi pada Unit Klaim #${c.index}`,
          `Karena Anda memilih vonis "${formatMicroVerdictLabel(m.microVerdict)}" pada Klaim #${c.index}, wajib memilih jenis patologinya dari 7 Taksonomi Patologi AI.`,
          'warning'
        );
        return;
      }
    }

    if (!selectedVerdict) {
      onNotify(
        'Pilih Keputusan Verdict Terlebih Dahulu',
        'Silakan klik salah satu dari 3 kartu Verdict (VERIFIED, PARTIALLY SUPPORTED, atau UNSUPPORTED) sebelum mengunci jawaban.',
        'warning'
      );
      return;
    }

    if (justification.trim().length === 0) {
      onNotify(
        'Tuliskan Argumen Analitis Anda',
        'Kolom alasan verifikasi (Tahap 4) tidak boleh kosong sebelum mengunci jawaban.',
        'warning'
      );
      return;
    }

    setIsGradingVerdict(true);
    try {
      const semanticGrade = await gradeAnalyticalJustificationWithAI({
        justification,
        claimText,
        references,
        expectedVerdict,
        chosenVerdict: selectedVerdict,
      });

      const evaluation = evaluateVerdictAndCalculateVScore({
        currentVScore,
        verdict: selectedVerdict,
        justification,
        claimText,
        references,
        expectedVerdict,
        extractedClaims,
        microAudits,
        inspectedReferenceIds,
        semanticJustificationScore: semanticGrade.scoreOutOf25,
      });

      const rewrite = generateVerifiedAcademicRewrite(claimText, references, expectedVerdict);
      const completeRecord: AuditResultRecord = {
        ...evaluation,
        correctedAcademicParagraph: rewrite.correctedParagraph,
        apaReferences: rewrite.apaReferences,
      };

      setIsAuditLocked(true);
      setLatestEvaluation(completeRecord);
      onCompleteAudit(completeRecord);
    } finally {
      setIsGradingVerdict(false);
    }
  };

  const handleCopyRewrite = () => {
    if (!latestEvaluation) return;
    const fullCopy = `${latestEvaluation.correctedAcademicParagraph}\n\nDaftar Pustaka (APA 7th Edition):\n${latestEvaluation.apaReferences.join('\n')}`;
    navigator.clipboard.writeText(fullCopy);
    setCopiedRewrite(true);
    onNotify(
      'Paragraf Akademik Bersih Disalin',
      'Paragraf terkoreksi beserta Daftar Pustaka APA 7th Edition siap ditempel ke tugas/skripsi Anda.',
      'success'
    );
    setTimeout(() => setCopiedRewrite(false), 2500);
  };

  const handleDirectDownloadPdf = () => {
    if (!latestEvaluation) return;
    downloadAuditReportAsPdf({
      studentName: studentIdentity.name,
      studentNim: studentIdentity.nim,
      scenarioTitle: activeScenarioTitle,
      evaluation: latestEvaluation,
    });
    setShowCertificateModal(true);
    onNotify(
      'Sertifikat & Rapor Audit (PDF A4) Diunduh Langsung',
      `File PDF A4 resmi untuk ${studentIdentity.name} (V-Score ${latestEvaluation.newVScore}/100) berhasil diunduh ke perangkat Anda.`,
      'success'
    );
  };

  const completedMicroVerdictCount = extractedClaims.filter(
    (c) => Boolean(microAudits[c.id]?.microVerdict)
  ).length;

  // Hitung rekap Vonis Mikro pilihan peserta saat ini untuk Panduan Konsistensi Verdict
  const microCounts = extractedClaims.reduce(
    (acc, c) => {
      const v = microAudits[c.id]?.microVerdict;
      if (v === 'SESUAI_BUKTI') acc.sesuai += 1;
      else if (v === 'DISTORSI') acc.distorsi += 1;
      else if (v === 'HALUSINASI') acc.halusinasi += 1;
      return acc;
    },
    { sesuai: 0, distorsi: 0, halusinasi: 0 }
  );

  let recommendedConsistentVerdict: VerdictType | null = null;
  if (completedMicroVerdictCount > 0) {
    if (microCounts.halusinasi > 0 && microCounts.halusinasi >= microCounts.distorsi) {
      recommendedConsistentVerdict = 'UNSUPPORTED';
    } else if (microCounts.distorsi > 0 || microCounts.halusinasi > 0) {
      recommendedConsistentVerdict = 'PARTIALLY SUPPORTED';
    } else if (microCounts.sesuai === extractedClaims.length) {
      recommendedConsistentVerdict = 'VERIFIED';
    }
  }

  const checklist = justificationValidation.checklist;
  const liveChecklistPoints =
    checklist.min12WordsPoints +
    checklist.min2TopicPoints +
    checklist.analyticalTermPoints;

  return (
    <div className="animate-page-enter max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Mode Switcher (Meja Audit Side-by-Side vs Riwayat Audit Saya) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            <FileSearch className="w-4 h-4" />
            Fase 3 · Meja Audit Side-by-Side, 7 Patologi AI &amp; One-Shot Submission Lock
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pipeline Uji Output AI &amp; Audit Bukti Mandiri
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-3xl">
            Bandingkan unit klaim di <strong className="text-white">Kolom Kiri</strong> secara
            langsung dengan 6 kartu bukti di <strong className="text-emerald-400">Kolom Kanan</strong>
            , pilih Verdict Akhir yang konsisten, lalu klik{' '}
            <strong className="text-amber-300">🔒 Kunci Jawaban &amp; Submit Audit Final</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowByoPanel((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-xs font-extrabold text-blue-300 hover:text-white transition-all cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4" />
            Tempel Teks AI Eksternal (ChatGPT/Claude/Lainnya)
          </button>

          <div className="inline-flex p-1 rounded-xl bg-[#0b1120] border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubView('meja-audit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeSubView === 'meja-audit'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Meja Audit Utama
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('riwayat-saya')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeSubView === 'riwayat-saya'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Riwayat Audit Saya ({auditHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* PANEL "TEMPEL TEKS AI EKSTERNAL (BRING YOUR OWN AI TEXT)" */}
      {showByoPanel && activeSubView === 'meja-audit' && (
        <div className="bg-[#0b1120] border border-blue-500/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl no-print">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4" />
                Mode Bring Your Own AI Text (Audit Teks ChatGPT / Claude / Gemini Eksternal)
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Tempelkan klaim atau paragraf jawaban AI dari platform mana pun di bawah ini. Sistem
                otomatis mengekstrak topik utama, menarik 6 jurnal pembanding dari Serper.dev ke
                kolom kanan, dan membedah unit klaim di kolom kiri.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowByoPanel(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            rows={4}
            value={byoInputText}
            onChange={(e) => setByoInputText(e.target.value)}
            placeholder="Tempelkan paragraf output AI dari ChatGPT, Claude, atau sumber eksternal di sini..."
            className="w-full bg-[#020617] border border-slate-700 focus:border-blue-500 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setByoInputText(
                    'Menurut laporan riset Prof. Zimmerman (2025) di Journal of Asian Clinical Nutrition, konsumsi minuman boba 2 kali seminggu terbukti 100% menyebabkan gagal ginjal akut dan diabetes permanen pada seluruh remaja di Indonesia tanpa terkecuali.'
                  )
                }
                className="text-[11px] font-semibold bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Contoh Teks AI Mengandung Halusinasi Sitasi
              </button>
            </div>

            <button
              type="button"
              disabled={isExtractingByoText}
              onClick={handleExtractAndFetchByoEvidence}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isExtractingByoText
                ? 'Mengekstrak Topik & Menarik 6 Jurnal Serper...'
                : 'Ekstrak Klaim & Tarik Bukti Pembanding'}
            </button>
          </div>
        </div>
      )}

      {/* Active Scenario Banner */}
      {activeScenarioTitle && activeSubView === 'meja-audit' && (
        <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Skenario Aktif: <strong className="text-white">{activeScenarioTitle}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuditLocked && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-md">
                <Lock className="w-3.5 h-3.5" /> Jawaban Terkunci Permanen
              </span>
            )}
            <span className="text-xs text-slate-300">
              Peserta Aktif: <strong className="text-emerald-400">{studentIdentity.name}</strong> (
              {studentIdentity.nim})
            </span>
          </div>
        </div>
      )}

      {/* PANDUAN RUBRIK TRANSPARAN 100 POIN (4 TAHAP @ 25 POIN) */}
      {activeSubView === 'meja-audit' && (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-4 sm:p-5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Panduan Transparan: Indikator V-Score 100 Poin (4 Tahap @ 25 Poin)
            </div>
            <div className="text-xs text-slate-400">
              Progres Audit Mikro:{' '}
              <strong className="text-emerald-400 font-mono">
                {completedMicroVerdictCount}/{extractedClaims.length} Klaim
              </strong>{' '}
              · Bukti Diperiksa:{' '}
              <strong className="text-blue-400 font-mono">
                {inspectedReferenceIds.length}/{references.length} Sumber
              </strong>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VSCORE_RUBRIC_100.map((r) => (
              <div
                key={r.key}
                className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-3 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-blue-400">{r.code}</span>
                  <span className="text-emerald-400 font-mono tabular-nums">
                    Maks {r.weight} Poin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: RIWAYAT AUDIT SAYA */}
      {activeSubView === 'riwayat-saya' && (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-6 space-y-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Riwayat Audit Saya — {studentIdentity.name} ({studentIdentity.nim})
              </h2>
              <p className="text-xs text-slate-400">
                Menampilkan rekam jejak verifikasi pribadi Anda. Sesuai kebijakan privasi peran,
                nilai peserta lain hanya dapat diakses oleh Penguji/Mentor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubView('meja-audit')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
            >
              ← Kembali ke Meja Audit
            </button>
          </div>

          {auditHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Belum ada riwayat audit pada sesi ini. Silakan selesaikan audit di Meja Audit Utama.
            </div>
          ) : (
            <div className="space-y-3">
              {auditHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        Pilihan: {item.verdict}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        Kunci: {item.expectedVerdict}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2 font-editorial">
                      &ldquo;{item.claimSummary}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-400 italic">
                      Argumen: &ldquo;{item.justification}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        Skor V-Score
                      </div>
                      <div className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                        {item.newVScore} / 100
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEJA AUDIT UTAMA: TATA LETAK SIDE-BY-SIDE (KOLOM KIRI KLAIM vs KOLOM KANAN 6 BUKTI) */}
      {activeSubView === 'meja-audit' && (
        <div className="space-y-6 no-print">
          {/* Box 1 (Full-Width): Paragraf Klaim yang Diuji */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="audit-claim-textarea"
                className="text-xs font-extrabold uppercase tracking-wider text-blue-400"
              >
                Teks Output AI yang Sedang Diaudit{' '}
                {isAuditLocked ? '(Terkunci — Sesi Audit Selesai)' : '(Dapat Diedit / Ditempel Langsung)'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isExtractingByoText || isAuditLocked}
                  onClick={handleExtractAndFetchByoEvidence}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {isExtractingByoText
                    ? 'Menarik Bukti Serper...'
                    : '🔄 Ekstrak Klaim & Tarik Bukti Pembanding'}
                </button>
                <button
                  type="button"
                  onClick={handleResetNewAuditSession}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  🔄 Mulai Sesi Audit Baru / Reset
                </button>
              </div>
            </div>

            <textarea
              id="audit-claim-textarea"
              rows={3}
              readOnly={isAuditLocked}
              value={isAuditLocked ? claimText : stripInlineCitationMarkers(claimText)}
              onChange={(e) => {
                if (!isAuditLocked) {
                  onChangeClaimText(e.target.value);
                }
              }}
              placeholder="Tempelkan klaim atau paragraf jawaban AI yang ingin Anda uji kebenarannya di sini..."
              className={`w-full bg-[#0f172a] border rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none leading-relaxed font-editorial ${
                isAuditLocked
                  ? 'border-slate-800 opacity-80 cursor-not-allowed'
                  : 'border-slate-700 focus:border-blue-500'
              }`}
            />
          </div>

          {/* GRID SIDE-BY-SIDE SEJAJAR: TAHAP 1 (KIRI - 7 KOLOM) vs TAHAP 2 (KANAN - 5 KOLOM) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI (7 KOLOM): EKSTRAKSI KLAIM, GHOST CITATION, & AUDIT MIKRO */}
            <div className="lg:col-span-7">
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Tahap 1 · Dekonstruksi Unit Klaim, Ghost Citation &amp; Audit Mikro
                    </h2>
                    <p className="text-xs text-slate-400">
                      Bandingkan setiap kalimat klaim dengan ke-6 Kartu Bukti di kolom kanan, pilih
                      Vonis Mikro, nomor bukti rujukan (#1–#6), dan identifikasi patologi AI.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0 font-mono">
                    {completedMicroVerdictCount} / {extractedClaims.length} Klaim Diaudit
                  </span>
                </div>

                <div className="space-y-4">
                  {extractedClaims.map((claim) => {
                    const auditState = microAudits[claim.id] || {
                      claimId: claim.id,
                      microVerdict: null,
                      evidenceRefId: '',
                      detectedPathology: '',
                    };
                    const ghost =
                      claim.ghostCitation || detectGhostCitation(claim.text, references);

                    // SPESIFIKASI 1b: Sembunyikan penanda sitasi [1], [2], [3] sebelum jawaban dikunci
                    const displayedClaimSentence = isAuditLocked
                      ? claim.text
                      : claim.displayText || stripInlineCitationMarkers(claim.text);

                    const processClaimDetail = latestEvaluation?.processLog?.stage1Claims.find(
                      (sc) => sc.claimIndex === claim.index
                    );
                    const isMicroChoiceMatchingKey = processClaimDetail
                      ? processClaimDetail.isMicroAccurate
                      : auditState.microVerdict === claim.expectedMicroVerdict ||
                        ((claim.expectedMicroVerdict === 'DISTORSI' ||
                          claim.expectedMicroVerdict === 'HALUSINASI') &&
                          (auditState.microVerdict === 'DISTORSI' ||
                            auditState.microVerdict === 'HALUSINASI'));

                    const requiresPathologySelection =
                      (auditState.microVerdict === 'DISTORSI' ||
                        auditState.microVerdict === 'HALUSINASI') &&
                      (!auditState.detectedPathology ||
                        auditState.detectedPathology === 'VALID_CLAIM');

                    return (
                      <div
                        key={claim.id}
                        className={`rounded-xl p-4 sm:p-5 border transition-all space-y-3.5 ${
                          isAuditLocked
                            ? isMicroChoiceMatchingKey
                              ? 'bg-emerald-950/15 border-emerald-500/40'
                              : 'bg-amber-950/15 border-amber-500/40'
                            : auditState.microVerdict
                              ? 'bg-slate-900/90 border-blue-500/50'
                              : 'bg-[#0f172a] border-slate-800'
                        }`}
                      >
                        {/* Top Row: Claim Index & Status Badge (No Spoiler Before Lock!) */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Unit Klaim #{claim.index}
                            </span>

                            {/* SPESIFIKASI 1a: Sebelum dikunci (!isAuditLocked), JANGAN tampilkan badge patologi kuning! */}
                            {!isAuditLocked ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                                {auditState.microVerdict
                                  ? `Pilihan Anda: ${formatMicroVerdictLabel(auditState.microVerdict)}`
                                  : '🔍 Status: Menunggu Audit Mikro Peserta'}
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Kunci Patologi: {claim.pathologyLabel}
                              </span>
                            )}
                          </div>

                          {!isAuditLocked ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              Cocokkan dengan Bukti #1–#{references.length}
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded border ${
                                isMicroChoiceMatchingKey
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {isMicroChoiceMatchingKey
                                ? '✓ Vonis Mikro Tepat'
                                : `⚠ Kunci Vonis: ${formatMicroVerdictLabel(claim.expectedMicroVerdict)}`}
                            </span>
                          )}
                        </div>

                        {/* Claim Sentence (without [1], [2], [3] before lock) */}
                        <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium font-editorial">
                          &ldquo;{displayedClaimSentence}&rdquo;
                        </p>

                        {/* GHOST CITATION DETECTOR BADGE */}
                        <div
                          className={`rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2 border ${
                            ghost.status === 'VERIFIED_IN_REFS'
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : ghost.status === 'GHOST_WARNING'
                                ? 'bg-red-950/50 border-red-500/50 text-red-300'
                                : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{ghost.badgeLabel}</span>
                        </div>

                        {/* SPESIFIKASI 1a: Sebelum dikunci, sembunyikan kotak "Analisis Spesifik Klaim". Sesudah dikunci, tampilkan Kunci Pembahasan! */}
                        {!isAuditLocked ? (
                          <div className="bg-[#020617]/70 border border-slate-800/90 rounded-lg p-3 text-xs text-slate-400 leading-relaxed flex items-center gap-2">
                            <FileSearch className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>
                              <strong className="text-slate-200">
                                🔍 Status: Menunggu Audit Mikro Peserta
                              </strong>{' '}
                              — Baca ke-{references.length} Kartu Bukti di kolom kanan untuk
                              memvalidasi klaim ini, lalu tentukan Vonis Mikro dan Rujukan Bukti di
                              bawah. (Kunci pembahasan klaim akan terbuka setelah Anda menekan
                              Submit Audit Final).
                            </span>
                          </div>
                        ) : (
                          <div className="bg-amber-950/25 border border-amber-500/40 rounded-lg p-3.5 text-xs text-slate-200 leading-relaxed space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-extrabold text-amber-300 uppercase tracking-wider">
                                🔓 Kunci Pembahasan &amp; Analisis Spesifik Klaim #{claim.index}
                              </span>
                              <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                                Rujukan Kunci: Bukti #{claim.suggestedRefId}
                              </span>
                            </div>
                            <p className="text-slate-200">{claim.verificationReason}</p>
                          </div>
                        )}

                        {/* 3 TOMBOL VONIS MIKRO PER KLAIM */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            Pilih Vonis Mikro untuk Unit Klaim #{claim.index}:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              disabled={isAuditLocked}
                              onClick={() => handleSetMicroVerdict(claim.id, 'SESUAI_BUKTI')}
                              className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                                isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                              } ${
                                auditState.microVerdict === 'SESUAI_BUKTI'
                                  ? 'bg-emerald-600 text-white border-emerald-400'
                                  : 'bg-[#020617] text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40'
                              }`}
                            >
                              ✅ Sesuai Bukti
                            </button>

                            <button
                              type="button"
                              disabled={isAuditLocked}
                              onClick={() => handleSetMicroVerdict(claim.id, 'DISTORSI')}
                              className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                                isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                              } ${
                                auditState.microVerdict === 'DISTORSI'
                                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                                  : 'bg-[#020617] text-amber-400 border-amber-500/30 hover:bg-amber-950/40'
                              }`}
                            >
                              ⚠️ Distorsi / Overclaim
                            </button>

                            <button
                              type="button"
                              disabled={isAuditLocked}
                              onClick={() => handleSetMicroVerdict(claim.id, 'HALUSINASI')}
                              className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                                isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                              } ${
                                auditState.microVerdict === 'HALUSINASI'
                                  ? 'bg-red-600 text-white border-red-400'
                                  : 'bg-[#020617] text-red-400 border-red-500/30 hover:bg-red-950/40'
                              }`}
                            >
                              ❌ Halusinasi / Tidak Terbukti
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Rujukan Bukti (#1-#6 / Tidak Ada Bukti) & Checklist Patologi AI */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Rujukan Bukti Pembanding (Pilih Nomor Sumber):
                            </label>
                            <select
                              disabled={isAuditLocked}
                              value={auditState.evidenceRefId}
                              onChange={(e) => handleSetClaimRefId(claim.id, e.target.value)}
                              className="w-full bg-[#020617] border border-slate-700 focus:border-blue-500 disabled:opacity-70 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                            >
                              <option value="">-- Pilih Nomor Bukti (#1–#{references.length}) --</option>
                              {references.map((r) => (
                                <option key={r.id} value={String(r.id)}>
                                  Bukti #{r.id} — {r.title.slice(0, 42)}...
                                </option>
                              ))}
                              <option value="NONE">
                                Tidak Ada Bukti di Kolom Kanan (Sitasi Fiktif / Halusinasi)
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Patologi AI yang Terdeteksi:
                            </label>
                            <select
                              disabled={
                                isAuditLocked || auditState.microVerdict === 'SESUAI_BUKTI'
                              }
                              value={auditState.detectedPathology}
                              onChange={(e) =>
                                handleSetClaimPathology(claim.id, e.target.value as AIPathologyId)
                              }
                              className={`w-full bg-[#020617] border rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none disabled:opacity-80 ${
                                requiresPathologySelection
                                  ? 'border-amber-500 ring-1 ring-amber-500/40'
                                  : 'border-slate-700 focus:border-amber-500'
                              }`}
                            >
                              {auditState.microVerdict === 'SESUAI_BUKTI' ? (
                                <option value="VALID_CLAIM">
                                  Bebas Patologi (Sesuai Bukti Primer)
                                </option>
                              ) : (
                                <>
                                  <option value="">
                                    -- Wajib Pilih Jenis Patologi AI (7 Taksonomi) --
                                  </option>
                                  {AI_PATHOLOGY_TAXONOMY.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.code}: {p.shortLabel}
                                    </option>
                                  ))}
                                  <option value="VALID_CLAIM">
                                    Bebas Patologi (Sesuai Bukti Primer)
                                  </option>
                                </>
                              )}
                            </select>
                            {requiresPathologySelection && !isAuditLocked && (
                              <p className="text-[11px] text-amber-300 mt-1 font-semibold">
                                ⚠ Pilih 1 dari 7 Taksonomi Patologi AI sesuai temuan distorsi/halusinasi.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (5 KOLOM): 5-6 KARTU BUKTI MANDIRI SIDE-BY-SIDE SEJAJAR */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      Tahap 2 · Kartu Bukti Mandiri ({references.length} Sumber)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sandingkan kutipan di bawah ini dengan klaim di kolom kiri tanpa berpindah tab.
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 font-mono">
                    {inspectedReferenceIds.length}/{references.length} Diperiksa
                  </span>
                </div>

                <div className="space-y-3.5">
                  {references.map((ref) => {
                    const isInspected = inspectedReferenceIds.includes(ref.id);
                    const cred = analyzeReferenceCredibility(ref);
                    return (
                      <div
                        key={ref.id}
                        className={`rounded-xl p-4 border transition-all space-y-3 ${
                          isInspected
                            ? 'bg-[#0f172a] border-emerald-500/40'
                            : 'bg-[#0f172a]/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            <span className="shrink-0 px-2 py-0.5 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold text-xs font-mono tabular-nums">
                              Bukti #{ref.id}
                            </span>
                            <div className="space-y-1.5">
                              <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                {ref.title}
                              </h3>
                              {/* SPESIFIKASI 3b: Badge Tingkat Kredibilitas & Peran Sumber */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    cred.sourceTier === 'PRIMARY_ACADEMIC'
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                      : 'bg-orange-950/60 text-orange-300 border-orange-500/40'
                                  }`}
                                >
                                  {cred.credibilityBadge}
                                </span>
                                {cred.isCriticalStance && cred.criticalStanceBadge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40">
                                    {cred.criticalStanceBadge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAuditLocked}
                            onClick={() => handleToggleInspectRef(ref.id)}
                            className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 ${
                              isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              isInspected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <CheckSquare className="w-3 h-3" />
                            {isInspected ? 'Tervalidasi' : 'Tandai Cek'}
                          </button>
                        </div>

                        <div className="bg-[#020617]/90 border border-slate-800/90 rounded-lg p-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-editorial">
                          &ldquo;{ref.snippet}&rdquo;
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (!isAuditLocked && !inspectedReferenceIds.includes(ref.id)) {
                                handleToggleInspectRef(ref.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-[11px] font-bold text-blue-300 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            🔗 Buka Web Asli
                          </a>

                          <a
                            href={ref.scholarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (!isAuditLocked && !inspectedReferenceIds.includes(ref.id)) {
                                handleToggleInspectRef(ref.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white transition-colors"
                          >
                            <GraduationCap className="w-3 h-3" />
                            🎓 Cari Judul di Google Scholar
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAHAP 3 & 4: FILTER RELEVANSI ARGUMEN, CHECKLIST REAL-TIME 25/25, PANDUAN KONSISTENSI VERDICT & PENGUNCIAN JAWABAN */}
      {activeSubView === 'meja-audit' && (
        <div className="bg-[#0b1120] border-2 border-blue-500/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                Tahap 3 &amp; 4 · Checklist Argumen 25/25 Poin, Konsistensi Verdict &amp; One-Shot Lock
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Tuliskan Analisis Bukti, Pilih Verdict Akhir, lalu Kunci Jawaban Final
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Penuhi 3 indikator Checklist Real-Time di bawah ini untuk meraih skor penuh{' '}
                <strong className="text-emerald-400">25/25 Poin pada Tahap 4</strong> (sehingga
                total V-Score Anda dapat mencapai <strong className="text-white">100/100</strong>).
              </p>
            </div>

            <div
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold font-mono ${
                isAuditLocked
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : liveChecklistPoints === 25
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400'
                    : justificationValidation.isGibberish
                      ? 'bg-red-950/60 border-red-500/60 text-red-300'
                      : 'bg-blue-950/50 border-blue-500/40 text-blue-300'
              }`}
            >
              {isAuditLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  Audit Terkunci ({latestEvaluation?.newVScore ?? currentVScore}/100)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Estimasi Skor Tahap 4: {liveChecklistPoints} / 25 Poin
                </>
              )}
            </div>
          </div>

          {/* Justification Textarea + Checklist Indikator Real-Time Menuju 25/25 Poin */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <label htmlFor="justification-input" className="font-bold text-slate-200">
                Alasan &amp; Justifikasi Verifikasi Anda (Tahap 4 — Maksimal 25 Poin):
              </label>
              <span className="text-slate-400">
                Jumlah kata bermakna:{' '}
                <strong className="text-emerald-400 font-mono">
                  {justificationValidation.meaningfulWordCount} kata
                </strong>
              </span>
            </div>

            <textarea
              id="justification-input"
              rows={3}
              readOnly={isAuditLocked}
              value={justification}
              onChange={(e) => {
                if (!isAuditLocked) {
                  setJustification(e.target.value);
                }
              }}
              placeholder="Contoh: Berdasarkan Bukti #1 dan #2 dari laporan jurnal, angka statistik dasar memang benar, namun terdapat distorsi kausalitas dan over-generalisasi sampel pada klaim AI..."
              className={`w-full bg-[#020617] border rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all leading-relaxed ${
                isAuditLocked
                  ? 'border-slate-800 opacity-80 cursor-not-allowed'
                  : justificationValidation.isGibberish
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : liveChecklistPoints === 25
                      ? 'border-emerald-500/70 focus:border-emerald-400'
                      : 'border-slate-700 focus:border-blue-500'
              }`}
            />

            {/* SPESIFIKASI 2: CHECKLIST INDIKATOR REAL-TIME MENUJU 25/25 POIN */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Checklist Indikator Real-Time Menuju 25/25 Poin (Tahap 4):
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Status Argumen:{' '}
                  <strong
                    className={
                      liveChecklistPoints === 25 ? 'text-emerald-400' : 'text-amber-300'
                    }
                  >
                    {liveChecklistPoints}/25 Poin
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Indikator 1 (+8 poin) */}
                <div
                  className={`rounded-lg p-3 border flex items-start gap-2.5 transition-all ${
                    checklist.min12WordsAndClean
                      ? 'bg-emerald-950/35 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#020617] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-mono font-extrabold text-sm shrink-0">
                    {checklist.min12WordsAndClean ? '[✓]' : '[ ]'}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      Minimal 12 kata bermakna &amp; bebas spam/off-topic{' '}
                      <span className="font-mono text-emerald-400">(+8 poin)</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      Saat ini: {justificationValidation.meaningfulWordCount}/12 kata bermakna
                    </div>
                  </div>
                </div>

                {/* Indikator 2 (+9 poin) */}
                <div
                  className={`rounded-lg p-3 border flex items-start gap-2.5 transition-all ${
                    checklist.min2TopicKeywords
                      ? 'bg-emerald-950/35 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#020617] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-mono font-extrabold text-sm shrink-0">
                    {checklist.min2TopicKeywords ? '[✓]' : '[ ]'}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      Menyebut minimal 2 kata kunci topik dari klaim/bukti{' '}
                      <span className="font-mono text-emerald-400">(+9 poin)</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      Terdeteksi ({justificationValidation.topicKeywordsFound.length}/2):{' '}
                      {justificationValidation.topicKeywordsFound.length > 0
                        ? justificationValidation.topicKeywordsFound.slice(0, 4).join(', ')
                        : 'belum ada'}
                    </div>
                  </div>
                </div>

                {/* Indikator 3 (+8 poin) */}
                <div
                  className={`rounded-lg p-3 border flex items-start gap-2.5 transition-all ${
                    checklist.hasAnalyticalTerm
                      ? 'bg-emerald-950/35 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#020617] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-mono font-extrabold text-sm shrink-0">
                    {checklist.hasAnalyticalTerm ? '[✓]' : '[ ]'}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      Menyebut istilah verifikasi (bukti, sumber, jurnal, sesuai, distorsi, data){' '}
                      <span className="font-mono text-emerald-400">(+8 poin)</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      Terdeteksi:{' '}
                      {justificationValidation.analyticalKeywordsFound.length > 0
                        ? justificationValidation.analyticalKeywordsFound.slice(0, 4).join(', ')
                        : 'belum ada'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peringatan Merah Anti-Gibberish / Anti-Basa-Basi / Off-Topic */}
            {!justificationValidation.valid && justification.trim().length > 0 && (
              <div
                className={`rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2.5 border ${
                  justificationValidation.isGibberish
                    ? 'bg-red-950/60 border-red-500/60 text-red-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{justificationValidation.warningMessage}</span>
              </div>
            )}
          </div>

          {/* SPESIFIKASI 1d: KOTAK "PANDUAN KONSISTENSI VERDICT" DI ATAS 3 TOMBOL VERDICT AKHIR */}
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Panduan Konsistensi Verdict (Hubungan Vonis Mikro Tahap 1 → Verdict Akhir Tahap 3)
              </div>
              {recommendedConsistentVerdict && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/40 text-blue-300">
                  Berdasarkan Vonis Mikro Anda ({microCounts.sesuai} Sesuai, {microCounts.distorsi}{' '}
                  Distorsi, {microCounts.halusinasi} Halusinasi) → Rekomendasi Logis:{' '}
                  <strong className="text-white font-mono">{recommendedConsistentVerdict}</strong>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#020617]/80 border border-emerald-500/30 rounded-lg p-2.5 text-slate-300">
                • Semua klaim <strong className="text-emerald-400">✅ Sesuai Bukti</strong> →
                Rekomendasi logis: <strong className="text-emerald-400 font-mono">VERIFIED</strong>
              </div>
              <div className="bg-[#020617]/80 border border-amber-500/30 rounded-lg p-2.5 text-slate-300">
                • Ada klaim <strong className="text-amber-400">⚠️ Distorsi / Overclaim</strong> →
                Rekomendasi logis:{' '}
                <strong className="text-amber-400 font-mono">PARTIALLY SUPPORTED</strong>
              </div>
              <div className="bg-[#020617]/80 border border-red-500/30 rounded-lg p-2.5 text-slate-300">
                • Mayoritas/klaim inti <strong className="text-red-400">❌ Halusinasi</strong> →
                Rekomendasi logis: <strong className="text-red-400 font-mono">UNSUPPORTED</strong>
              </div>
            </div>
          </div>

          {/* Langkah 1: Pilih 1 dari 3 Kartu Verdict Sementara */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Langkah 1 · Pilih Keputusan Verdict Akhir (Tahap 3 — 25 Poin):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                disabled={isAuditLocked || isGradingVerdict}
                onClick={() => handleChooseVerdictOption('VERIFIED')}
                className={`group rounded-xl p-5 border text-left transition-all duration-200 ${
                  isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  selectedVerdict === 'VERIFIED'
                    ? 'bg-emerald-900/50 border-2 border-emerald-400 ring-2 ring-emerald-500/30'
                    : 'bg-emerald-950/20 hover:bg-emerald-900/35 border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                    VERIFIED
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seluruh unit klaim faktual, statistik, dan sitasi terkonfirmasi akurat serta
                  proporsional sesuai bukti primer.
                </p>
              </button>

              <button
                type="button"
                disabled={isAuditLocked || isGradingVerdict}
                onClick={() => handleChooseVerdictOption('PARTIALLY SUPPORTED')}
                className={`group rounded-xl p-5 border text-left transition-all duration-200 ${
                  isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  selectedVerdict === 'PARTIALLY SUPPORTED'
                    ? 'bg-amber-900/50 border-2 border-amber-400 ring-2 ring-amber-500/30'
                    : 'bg-amber-950/20 hover:bg-amber-900/35 border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">
                    PARTIALLY SUPPORTED
                  </span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sebagian data dasar benar, namun terdapat distorsi konteks, kausalitas semu, atau
                  over-generalisasi.
                </p>
              </button>

              <button
                type="button"
                disabled={isAuditLocked || isGradingVerdict}
                onClick={() => handleChooseVerdictOption('UNSUPPORTED')}
                className={`group rounded-xl p-5 border text-left transition-all duration-200 ${
                  isAuditLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  selectedVerdict === 'UNSUPPORTED'
                    ? 'bg-red-900/50 border-2 border-red-400 ring-2 ring-red-500/30'
                    : 'bg-red-950/20 hover:bg-red-900/35 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-extrabold text-red-400 uppercase tracking-wider">
                    UNSUPPORTED
                  </span>
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Klaim mengandung halusinasi fakta, sitasi jurnal fiktif (Ghost Citation), atau
                  bertentangan dengan bukti.
                </p>
              </button>
            </div>
          </div>

          {/* Langkah 2: Tombol Kunci Jawaban & Submit Audit Final */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              {selectedVerdict ? (
                <span>
                  Verdict dipilih:{' '}
                  <strong className="text-white font-mono">{selectedVerdict}</strong>. Klik tombol
                  kunci di kanan untuk menilai &amp; membuka Kunci Pembahasan.
                </span>
              ) : (
                <span>Pilih salah satu dari 3 Verdict di atas terlebih dahulu.</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAuditLocked && (
                <button
                  type="button"
                  onClick={handleResetNewAuditSession}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 hover:text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  🔄 Mulai Sesi Audit Baru / Reset
                </button>
              )}

              <button
                id="lock-submit-audit-btn"
                type="button"
                disabled={isAuditLocked || isGradingVerdict || !selectedVerdict}
                onClick={handleLockAndSubmitFinalAudit}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  isAuditLocked
                    ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 cursor-not-allowed'
                    : selectedVerdict
                      ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                      : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isAuditLocked
                    ? '✓ Jawaban Audit Final Telah Terkunci'
                    : isGradingVerdict
                      ? 'Mengunci & Menilai Audit...'
                      : '🔒 Kunci Jawaban & Submit Audit Final'}
                </span>
              </button>
            </div>
          </div>

          {/* POST-AUDIT REVIEW, BEDAH KUNCI JAWABAN, VERIFIED ACADEMIC REWRITER, & EKSPOR PDF A4 */}
          {latestEvaluation && (
            <div className="mt-6 bg-[#020617] border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-7 space-y-6 animate-page-enter">
              {/* SPESIFIKASI 5a: KOTAK KESIMPULAN FAKTA ATAS TESIS/KLAIM AWAL DI BAGIAN PALING ATAS HASIL AUDIT */}
              {latestEvaluation.thesisConclusion && (
                <div
                  className={`rounded-xl p-5 border-2 space-y-2.5 ${
                    latestEvaluation.thesisConclusion.statusCategory === 'TERBUKTI_ILMIAH'
                      ? 'bg-emerald-950/35 border-emerald-500/50'
                      : latestEvaluation.thesisConclusion.statusCategory ===
                          'SPEKULATIF_DIPERDEBATKAN'
                        ? 'bg-amber-950/35 border-amber-500/50'
                        : 'bg-red-950/35 border-red-500/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                      ⚖️ KESIMPULAN FAKTA ATAS TESIS/KLAIM AWAL:{' '}
                      <span className="text-blue-300">
                        {activeScenarioTitle || latestEvaluation.thesisConclusion.topicLabel}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-lg border ${
                        latestEvaluation.thesisConclusion.statusCategory === 'TERBUKTI_ILMIAH'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : latestEvaluation.thesisConclusion.statusCategory ===
                              'SPEKULATIF_DIPERDEBATKAN'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {latestEvaluation.thesisConclusion.statusLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {latestEvaluation.thesisConclusion.epistemicSummary}
                  </p>
                </div>
              )}

              {/* Top Result Summary & PDF Button */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                        latestEvaluation.isCalibrated
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {latestEvaluation.isCalibrated
                        ? '✓ Verdict Terkalibrasi Tepat (25/25 Poin)'
                        : `⚠ Kalibrasi Verdict Meleset (${latestEvaluation.stageBreakdown.stage3VerdictAccuracy}/25 Poin)`}
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      Total V-Score Audit Ini:{' '}
                      <span className="text-emerald-400 text-lg font-mono tabular-nums">
                        {latestEvaluation.newVScore} / 100
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bedah Kunci Jawaban &amp; Diagnostik Skor 4 Tahap untuk peserta{' '}
                    <strong className="text-white">{studentIdentity.name}</strong> (
                    {studentIdentity.nim}). Kunci pembahasan per klaim kini juga terbuka pada kartu
                    Unit Klaim di atas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDirectDownloadPdf}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Sertifikat &amp; Rapor Audit (PDF A4)
                </button>
              </div>

              {/* Rincian Perolehan Poin Tahap 1, 2, 3, dan 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-blue-400">Tahap 1 · Claim Audit</span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      {latestEvaluation.stageBreakdown.stage1ClaimAudit} / 25
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {latestEvaluation.stageBreakdown.stage1Feedback}
                  </p>
                </div>

                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-cyan-400">Tahap 2 · Source Check</span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      {latestEvaluation.stageBreakdown.stage2SourceVerification} / 25
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {latestEvaluation.stageBreakdown.stage2Feedback}
                  </p>
                </div>

                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-amber-400">Tahap 3 · Verdict Accuracy</span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      {latestEvaluation.stageBreakdown.stage3VerdictAccuracy} / 25
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {latestEvaluation.stageBreakdown.stage3Feedback}
                  </p>
                </div>

                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-emerald-400">Tahap 4 · Justification</span>
                    <span
                      className={`font-mono tabular-nums ${
                        latestEvaluation.stageBreakdown.stage4JustificationQuality === 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {latestEvaluation.stageBreakdown.stage4JustificationQuality} / 25
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {latestEvaluation.stageBreakdown.stage4Feedback}
                  </p>
                </div>
              </div>

              {/* Perbandingan Berdampingan Verdict Pilihan Anda vs Verdict Kunci Seharusnya */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Perbandingan Keputusan Vonis (Verdict Comparison)
                  </div>
                  <div className="flex items-center justify-between bg-[#0f172a] rounded-lg p-3 border border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400">Verdict Pilihan Anda:</div>
                      <div className="text-sm font-extrabold text-white">
                        {latestEvaluation.verdict}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Verdict Kunci Seharusnya:</div>
                      <div className="text-sm font-extrabold text-emerald-400">
                        {latestEvaluation.expectedVerdict}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-400">Penjelasan Kunci Kalibrasi: </strong>
                    {calibrationHint ||
                      `Berdasarkan pencocokan terhadap ke-${references.length} bukti primer, kunci jawaban yang tepat adalah ${latestEvaluation.expectedVerdict}.`}
                  </p>
                </div>

                <div className="bg-[#0b1120] border border-red-500/30 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Sorotan Kalimat yang Mengalami Distorsi / Kritis
                  </div>
                  <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-xs text-red-200 italic leading-relaxed font-editorial">
                    &ldquo;{latestEvaluation.distortedSentenceHighlight}&rdquo;
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kalimat di atas ditandai karena memuat klaim mutlak, angka ekstrem, atau
                    atribusi yang harus dikoreksi menggunakan fitur Verified Academic Rewriter di
                    bawah ini.
                  </p>
                </div>
              </div>

              {/* FITUR VERIFIED ACADEMIC REWRITER + DAFTAR PUSTAKA APA 7TH EDITION */}
              <div className="bg-[#0b1120] border border-emerald-500/40 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Verified Academic Rewriter (Paragraf Akademik Terkoreksi &amp; Bebas Bias)
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hasil penulisan ulang yang telah dibersihkan dari halusinasi/over-claim dan
                      siap dikutip untuk makalah, esai, atau skripsi Anda.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyRewrite}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all cursor-pointer"
                  >
                    {copiedRewrite ? (
                      <>
                        <Check className="w-4 h-4" />
                        Tersalin ke Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        📋 Salin Paragraf Bersih
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#020617] border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-100 leading-relaxed font-editorial">
                  {latestEvaluation.correctedAcademicParagraph}
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Daftar Pustaka Otomatis (Format APA 7th Edition):
                  </div>
                  <div className="bg-[#020617] border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300 font-mono">
                    {latestEvaluation.apaReferences.map((apa, idx) => (
                      <div key={idx} className="leading-relaxed break-all">
                        {apa}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PRATINJAU SERTIFIKAT & RAPOR AUDIT RESMI A4 */}
      {showCertificateModal && latestEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="print-only-certificate w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 my-8 border border-slate-300">
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                Sertifikat &amp; Rapor Audit Resmi (File PDF A4 Telah Diunduh)
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    downloadAuditReportAsPdf({
                      studentName: studentIdentity.name,
                      studentNim: studentIdentity.nim,
                      scenarioTitle: activeScenarioTitle,
                      evaluation: latestEvaluation,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Ulang File PDF (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Tutup Pratinjau
                </button>
              </div>
            </div>

            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-blue-700">
                  Inisiatif Asta Cita Nusantara Poin 4 · Sains &amp; Teknologi
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  AI LITERACY LAB — VERIFICATION-FIRST MODEL
                </h1>
                <p className="text-xs text-slate-600">
                  Sertifikat &amp; Rapor Diagnostik Verifikasi Bukti Ilmiah Berbasis Rubrik 4×25
                  Poin
                </p>
              </div>
              <div className="text-left sm:text-right bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Skor Total V-Score
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
                  {latestEvaluation.newVScore} / 100
                </div>
                <div className="text-[10px] font-mono text-slate-600">{latestEvaluation.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">Nama Peserta Audit:</span>{' '}
                  <strong className="text-slate-900">{studentIdentity.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">NIM / Institusi:</span>{' '}
                  <strong className="text-slate-900">{studentIdentity.nim}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Tanggal &amp; Waktu:</span>{' '}
                  <strong className="text-slate-900">
                    {new Date().toLocaleDateString('id-ID')} · {latestEvaluation.timestamp}
                  </strong>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">Verdict Pilihan Peserta:</span>{' '}
                  <strong className="text-slate-900">{latestEvaluation.verdict}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Kunci Kalibrasi Bukti:</span>{' '}
                  <strong className="text-emerald-700">{latestEvaluation.expectedVerdict}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status Kalibrasi:</span>{' '}
                  <strong
                    className={
                      latestEvaluation.isCalibrated ? 'text-emerald-700' : 'text-amber-700'
                    }
                  >
                    {latestEvaluation.isCalibrated
                      ? 'TERKALIBRASI TEPAT'
                      : 'MELESET DARI KUNCI BUKTI'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                1. Rincian Diagnostik Rubrik V-Score (4 Tahap @ 25 Poin)
              </h2>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-300 p-2">Tahap Evaluasi</th>
                    <th className="border border-slate-300 p-2">Skor</th>
                    <th className="border border-slate-300 p-2">Catatan Diagnostik</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Tahap 1 · Claim &amp; Pathology Audit
                    </td>
                    <td className="border border-slate-300 p-2 font-extrabold tabular-nums">
                      {latestEvaluation.stageBreakdown.stage1ClaimAudit} / 25
                    </td>
                    <td className="border border-slate-300 p-2">
                      {latestEvaluation.stageBreakdown.stage1Feedback}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Tahap 2 · Source Verification
                    </td>
                    <td className="border border-slate-300 p-2 font-extrabold tabular-nums">
                      {latestEvaluation.stageBreakdown.stage2SourceVerification} / 25
                    </td>
                    <td className="border border-slate-300 p-2">
                      {latestEvaluation.stageBreakdown.stage2Feedback}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Tahap 3 · Verdict Accuracy
                    </td>
                    <td className="border border-slate-300 p-2 font-extrabold tabular-nums">
                      {latestEvaluation.stageBreakdown.stage3VerdictAccuracy} / 25
                    </td>
                    <td className="border border-slate-300 p-2">
                      {latestEvaluation.stageBreakdown.stage3Feedback}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">
                      Tahap 4 · Analytical Justification
                    </td>
                    <td className="border border-slate-300 p-2 font-extrabold tabular-nums">
                      {latestEvaluation.stageBreakdown.stage4JustificationQuality} / 25
                    </td>
                    <td className="border border-slate-300 p-2">
                      {latestEvaluation.stageBreakdown.stage4Feedback}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-xs">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-800">
                2. Justifikasi Tertulis Peserta
              </h2>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 italic">
                &ldquo;{latestEvaluation.justification}&rdquo;
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-800">
                3. Paragraf Akademik Terkoreksi (Verified Academic Rewriter)
              </h2>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 leading-relaxed">
                {latestEvaluation.correctedAcademicParagraph}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-800">
                4. Daftar Pustaka Terverifikasi (APA 7th Edition)
              </h2>
              <div className="space-y-1 font-mono text-slate-700">
                {latestEvaluation.apaReferences.map((apa, idx) => (
                  <div key={idx}>{apa}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
