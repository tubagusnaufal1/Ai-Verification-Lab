import {
  CHALLENGE_SCENARIOS,
  ChallengeScenario,
  VerdictType,
  StageScoreBreakdown,
  StudentAuditProcessLog,
} from './verificationLogic';

export type UserRole = 'STUDENT' | 'MENTOR' | 'mahasiswa' | 'mentor';

export function isMentorRole(role: UserRole): boolean {
  return role === 'MENTOR' || role === 'mentor';
}

export interface StudentIdentity {
  name: string;
  nim: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  role: 'STUDENT' | 'MENTOR';
  studentIdentity: StudentIdentity;
}

export interface StudentScoreEntry {
  id: string;
  studentName: string;
  studentNim: string;
  scenarioTitle: string;
  chosenVerdict: VerdictType;
  expectedVerdict: VerdictType;
  isCalibrated: boolean;
  justification: string;
  vScore: number;
  vScoreDelta: number;
  stageBreakdown: StageScoreBreakdown;
  timestamp: string;
  attemptCount?: number;
  processLog?: StudentAuditProcessLog;
}

export interface CrowdsourcedReport {
  id: string;
  reporterName: string;
  reporterNim: string;
  aiPlatform: string;
  topicCategory: string;
  hallucinationText: string;
  correctionEvidence: string;
  suggestedVerdict: VerdictType;
  status: 'PENDING' | 'PROMOTED';
  createdAt: string;
}

export const STORAGE_KEYS = {
  SCENARIOS: 'ailab_scenarios_v3',
  STUDENT_SCORES: 'ailab_student_scores_v5',
  CROWDSOURCED_REPORTS: 'ailab_crowdsourced_reports_v3',
  ACTIVE_ROLE: 'role',
  STUDENT_IDENTITY: 'ailab_student_identity_v3',
  AUTH_SESSION: 'ailab_auth_session_v4',
};

const KEYS = STORAGE_KEYS;

export const INITIAL_STUDENT_SCORES: StudentScoreEntry[] = [
  {
    id: 'score-seed-1',
    studentName: 'Alya Rahmawati',
    studentNim: '2401928310 · UI',
    scenarioTitle: 'Kasus 1: Manipulasi Konteks Statistik Kesehatan (Percobaan #1)',
    chosenVerdict: 'PARTIALLY SUPPORTED',
    expectedVerdict: 'PARTIALLY SUPPORTED',
    isCalibrated: true,
    justification:
      'Data IDAI tahun 2023 memang mencatat lonjakan 70 kali lipat, namun bukti jurnal menunjukkan lebih dari 80% kasus anak adalah DM Tipe 1 autoimun, bukan 100% akibat minuman boba.',
    vScore: 92,
    vScoreDelta: +14,
    attemptCount: 1,
    stageBreakdown: {
      stage1ClaimAudit: 24,
      stage2SourceVerification: 23,
      stage3VerdictAccuracy: 25,
      stage4JustificationQuality: 20,
      totalScore: 92,
      stage1Feedback: 'Sangat Tajam',
      stage2Feedback: 'Sangat Teliti',
      stage3Feedback: 'Tepat Sasaran (25/25)',
      stage4Feedback: 'Argumen Analitis Kuat',
    },
    processLog: {
      stage1Claims: [
        {
          claimIndex: 1,
          claimText:
            'Ikatan Dokter Anak Indonesia (IDAI) melaporkan bahwa prevalensi kasus diabetes melitus pada anak meningkat 70 kali lipat pada Januari 2023 dibandingkan tahun 2010.',
          studentMicroVerdict: 'SESUAI_BUKTI',
          expectedMicroVerdict: 'SESUAI_BUKTI',
          isMicroAccurate: true,
          studentPathology: 'VALID_CLAIM',
          expectedPathology: 'VALID_CLAIM',
          expectedPathologyLabel: 'Bebas Patologi (Sesuai Bukti Primer)',
          studentEvidenceRefId: '1',
          expectedEvidenceRefId: '1',
          verificationReason:
            'Angka lonjakan 70 kali lipat pada Januari 2023 terkonfirmasi akurat dalam rilis resmi IDAI.',
        },
        {
          claimIndex: 2,
          claimText:
            'Seluruh peningkatan 70 kali lipat tersebut murni disebabkan 100% oleh konsumsi minuman manis kemasan (boba dan kopi susu) tanpa keterlibatan faktor autoimun.',
          studentMicroVerdict: 'DISTORSI',
          expectedMicroVerdict: 'DISTORSI',
          isMicroAccurate: true,
          studentPathology: 'FALSE_CAUSALITY',
          expectedPathology: 'FALSE_CAUSALITY',
          expectedPathologyLabel: 'Kausalitas Semu (False Causality)',
          studentEvidenceRefId: '2',
          expectedEvidenceRefId: '2',
          verificationReason:
            'Bukti #2 menegaskan lebih dari 80% kasus anak adalah DM Tipe 1 autoimun, bukan 100% akibat minuman boba.',
        },
      ],
      stage2Sources: [
        {
          refId: 1,
          title: 'Rilis Data Diabetes Anak IDAI Januari 2023 (Sari Pediatri)',
          domain: 'saripediatri.org',
          wasInspected: true,
        },
        {
          refId: 2,
          title: 'Epidemiology of Type 1 and Type 2 Diabetes Mellitus in Indonesian Children',
          domain: 'ncbi.nlm.nih.gov',
          wasInspected: true,
        },
        {
          refId: 3,
          title: 'Pedoman Nasional Pelayanan Kedokteran (PNPK) Diabetes Melitus Anak',
          domain: 'kemkes.go.id',
          wasInspected: true,
        },
      ],
      stage3Verdict: {
        chosenVerdict: 'PARTIALLY SUPPORTED',
        expectedVerdict: 'PARTIALLY SUPPORTED',
        isCalibrated: true,
      },
      stage4Justification: {
        justificationText:
          'Data IDAI tahun 2023 memang mencatat lonjakan 70 kali lipat, namun bukti jurnal menunjukkan lebih dari 80% kasus anak adalah DM Tipe 1 autoimun, bukan 100% akibat minuman boba.',
        meaningfulWordCount: 28,
        topicKeywordsFound: ['idai', '2023', 'autoimun', 'boba', 'anak'],
        analyticalKeywordsFound: ['data', 'bukti', 'jurnal', 'bukan'],
        checklist: {
          min12WordsAndClean: true,
          min12WordsPoints: 8,
          min2TopicKeywords: true,
          min2TopicPoints: 9,
          hasAnalyticalTerm: true,
          analyticalTermPoints: 8,
        },
      },
    },
    timestamp: '16 Okt 2026, 09:15',
  },
  {
    id: 'score-seed-2',
    studentName: 'Dimas Prasetyo',
    studentNim: '13522048 · ITB',
    scenarioTitle: 'Kasus 2: Halusinasi Sitasi Jurnal Fiktif (Ghost Citation) (Percobaan #1)',
    chosenVerdict: 'UNSUPPORTED',
    expectedVerdict: 'UNSUPPORTED',
    isCalibrated: true,
    justification:
      'Jurnal Nusantara Digital Macroeconomics dan DOI 10.1093/jndm/2024.089 tidak ditemukan di indeks Scholar maupun BPS; klaim penurunan pengangguran 42,8% adalah halusinasi sitasi.',
    vScore: 95,
    vScoreDelta: +17,
    attemptCount: 1,
    stageBreakdown: {
      stage1ClaimAudit: 25,
      stage2SourceVerification: 22,
      stage3VerdictAccuracy: 25,
      stage4JustificationQuality: 23,
      totalScore: 95,
      stage1Feedback: 'Sangat Tajam',
      stage2Feedback: 'Sangat Teliti',
      stage3Feedback: 'Tepat Sasaran (25/25)',
      stage4Feedback: 'Argumen Analitis Kuat',
    },
    processLog: {
      stage1Claims: [
        {
          claimIndex: 1,
          claimText:
            'Menurut publikasi Prof. Hendra Wijaya (2024) dalam Journal of Nusantara Digital Macroeconomics (DOI: 10.1093/jndm/2024.089), adopsi AI menurunkan pengangguran sebesar 42,8%.',
          studentMicroVerdict: 'HALUSINASI',
          expectedMicroVerdict: 'HALUSINASI',
          isMicroAccurate: true,
          studentPathology: 'FABRICATED_CITATION',
          expectedPathology: 'FABRICATED_CITATION',
          expectedPathologyLabel: 'Risiko Sitasi Fiktif (Ghost Citation)',
          studentEvidenceRefId: 'NONE',
          expectedEvidenceRefId: '1',
          verificationReason:
            'Nama jurnal dan DOI 10.1093/jndm/2024.089 tidak terdaftar di Crossref/Scholar dan bertentangan dengan data BPS.',
        },
      ],
      stage2Sources: [
        {
          refId: 1,
          title: 'Keadaan Ketenagakerjaan Indonesia Agustus 2024 (Berita Resmi Statistik BPS)',
          domain: 'bps.go.id',
          wasInspected: true,
        },
        {
          refId: 2,
          title: 'Audit Direktori Jurnal Internasional & Validasi Metadata DOI Crossref',
          domain: 'scholar.google.com',
          wasInspected: true,
        },
      ],
      stage3Verdict: {
        chosenVerdict: 'UNSUPPORTED',
        expectedVerdict: 'UNSUPPORTED',
        isCalibrated: true,
      },
      stage4Justification: {
        justificationText:
          'Jurnal Nusantara Digital Macroeconomics dan DOI 10.1093/jndm/2024.089 tidak ditemukan di indeks Scholar maupun BPS; klaim penurunan pengangguran 42,8% adalah halusinasi sitasi.',
        meaningfulWordCount: 22,
        topicKeywordsFound: ['nusantara', 'macroeconomics', 'pengangguran', 'bps'],
        analyticalKeywordsFound: ['jurnal', 'doi', 'halusinasi', 'sitasi', 'klaim'],
        checklist: {
          min12WordsAndClean: true,
          min12WordsPoints: 8,
          min2TopicKeywords: true,
          min2TopicPoints: 9,
          hasAnalyticalTerm: true,
          analyticalTermPoints: 8,
        },
      },
    },
    timestamp: '16 Okt 2026, 10:02',
  },
  {
    id: 'score-seed-3',
    studentName: 'Ni Putu Maharani',
    studentNim: '23/518920/TK · UGM',
    scenarioTitle: 'Kasus 3: Over-Generalisasi (Sampel Terbatas vs Klaim Global) (Percobaan #1)',
    chosenVerdict: 'PARTIALLY SUPPORTED',
    expectedVerdict: 'PARTIALLY SUPPORTED',
    isCalibrated: true,
    justification:
      'Studi asli hanya melibatkan kelompok responden kelas eksploratif tanpa protokol verifikasi, sehingga klaim mutlak 85% di seluruh perguruan tinggi Indonesia merupakan over-generalisasi.',
    vScore: 86,
    vScoreDelta: +8,
    attemptCount: 1,
    stageBreakdown: {
      stage1ClaimAudit: 22,
      stage2SourceVerification: 20,
      stage3VerdictAccuracy: 25,
      stage4JustificationQuality: 19,
      totalScore: 86,
      stage1Feedback: 'Sangat Tajam',
      stage2Feedback: 'Cukup Teliti',
      stage3Feedback: 'Tepat Sasaran (25/25)',
      stage4Feedback: 'Argumen Baik',
    },
    processLog: {
      stage1Claims: [
        {
          claimIndex: 1,
          claimText:
            'Pemanfaatan chatbot AI tanpa pengawasan dosen secara permanen menurunkan 85% kemampuan berpikir kritis pada seluruh mahasiswa perguruan tinggi di Indonesia.',
          studentMicroVerdict: 'DISTORSI',
          expectedMicroVerdict: 'DISTORSI',
          isMicroAccurate: true,
          studentPathology: 'OVER_GENERALIZATION',
          expectedPathology: 'OVER_GENERALIZATION',
          expectedPathologyLabel: 'Over-Generalisasi Populasi',
          studentEvidenceRefId: '1',
          expectedEvidenceRefId: '1',
          verificationReason:
            'Studi hanya menguji sampel terbatas tanpa protokol verifikasi, bukan seluruh perguruan tinggi di Indonesia.',
        },
      ],
      stage2Sources: [
        {
          refId: 1,
          title: 'Cognitive Offloading and Critical Thinking in AI-Assisted Learning',
          domain: 'doaj.org',
          wasInspected: true,
        },
        {
          refId: 2,
          title: 'Dampak Penggunaan Generative AI terhadap Kemandirian Belajar Mahasiswa',
          domain: 'scholar.google.com',
          wasInspected: true,
        },
      ],
      stage3Verdict: {
        chosenVerdict: 'PARTIALLY SUPPORTED',
        expectedVerdict: 'PARTIALLY SUPPORTED',
        isCalibrated: true,
      },
      stage4Justification: {
        justificationText:
          'Studi asli hanya melibatkan kelompok responden kelas eksploratif tanpa protokol verifikasi, sehingga klaim mutlak 85% di seluruh perguruan tinggi Indonesia merupakan over-generalisasi.',
        meaningfulWordCount: 22,
        topicKeywordsFound: ['responden', 'eksploratif', 'perguruan', 'indonesia'],
        analyticalKeywordsFound: ['studi', 'verifikasi', 'klaim', 'over-generalisasi'],
        checklist: {
          min12WordsAndClean: true,
          min12WordsPoints: 8,
          min2TopicKeywords: true,
          min2TopicPoints: 9,
          hasAnalyticalTerm: true,
          analyticalTermPoints: 8,
        },
      },
    },
    timestamp: '16 Okt 2026, 11:28',
  },
];

export const INITIAL_CROWDSOURCED_REPORTS: CrowdsourcedReport[] = [
  {
    id: 'report-seed-1',
    reporterName: 'Rizky Ramadhan',
    reporterNim: '2206081142 · ITS',
    aiPlatform: 'ChatGPT / LLM Umum',
    topicCategory: 'Energi & Lingkungan',
    hallucinationText:
      'Berdasarkan Peraturan Menteri ESDM Nomor 88 Tahun 2024 (DOI: 10.1016/esdm.2024.88), seluruh kendaraan berbahan bakar bensin di Pulau Jawa wajib dihentikan total operasinya pada Januari 2026 karena emisi karbon telah turun 65%.',
    correctionEvidence:
      'Pengecekan di JDIH Kementerian ESDM dan Google Scholar membuktikan tidak ada Permen ESDM Nomor 88 Tahun 2024 tentang pelarangan total kendaraan bensin pada Januari 2026; target transisi kendaraan listrik dilakukan bertahap menuju 2045–2060.',
    suggestedVerdict: 'UNSUPPORTED',
    status: 'PENDING',
    createdAt: '16 Okt 2026, 08:40',
  },
  {
    id: 'report-seed-2',
    reporterName: 'Siti Nurhaliza Putri',
    reporterNim: '2450602011 · UB',
    aiPlatform: 'Asisten AI Akademik',
    topicCategory: 'Kesehatan & Gizi',
    hallucinationText:
      'Penelitian klinis Kemenkes RI (2024) menyimpulkan bahwa konsumsi suplemen herbal daun insulin selama 7 hari terbukti menyembuhkan 100% pasien gagal ginjal kronis stadium 4 tanpa perlu hemodialisis.',
    correctionEvidence:
      'Pedoman klinis Kemenkes RI dan Pernefri menegaskan gagal ginjal kronis stadium lanjut memerlukan terapi pengganti ginjal terstandar; klaim kesembuhan 100% dalam 7 hari tanpa dialisis adalah misinformasi medis berbahaya.',
    suggestedVerdict: 'UNSUPPORTED',
    status: 'PENDING',
    createdAt: '16 Okt 2026, 10:50',
  },
];

export function normalizeStudentScoreEntry(raw: Partial<StudentScoreEntry> | null | undefined, idx = 0): StudentScoreEntry {
  const sb = raw?.stageBreakdown;
  const pl = raw?.processLog;
  return {
    id: raw?.id || `score-fallback-${idx}`,
    studentName: raw?.studentName || 'Mahasiswa Peserta',
    studentNim: raw?.studentNim || '-',
    scenarioTitle: raw?.scenarioTitle || 'Audit Mandiri Output AI',
    chosenVerdict: raw?.chosenVerdict || 'PARTIALLY SUPPORTED',
    expectedVerdict: raw?.expectedVerdict || 'PARTIALLY SUPPORTED',
    isCalibrated: Boolean(raw?.isCalibrated),
    justification: raw?.justification || '-',
    vScore: typeof raw?.vScore === 'number' ? raw.vScore : 80,
    vScoreDelta: typeof raw?.vScoreDelta === 'number' ? raw.vScoreDelta : 0,
    attemptCount: typeof raw?.attemptCount === 'number' ? raw.attemptCount : 1,
    timestamp: raw?.timestamp || '-',
    stageBreakdown: {
      stage1ClaimAudit: sb?.stage1ClaimAudit ?? 22,
      stage2SourceVerification: sb?.stage2SourceVerification ?? 21,
      stage3VerdictAccuracy: sb?.stage3VerdictAccuracy ?? 25,
      stage4JustificationQuality: sb?.stage4JustificationQuality ?? 20,
      totalScore: sb?.totalScore ?? (typeof raw?.vScore === 'number' ? raw.vScore : 80),
      stage1Feedback: sb?.stage1Feedback || 'Audit klaim selesai.',
      stage2Feedback: sb?.stage2Feedback || 'Verifikasi sumber selesai.',
      stage3Feedback: sb?.stage3Feedback || 'Evaluasi putusan selesai.',
      stage4Feedback: sb?.stage4Feedback || 'Justifikasi tercatat.',
    },
    processLog: pl
      ? {
          stage1Claims: Array.isArray(pl?.stage1Claims) ? pl.stage1Claims : [],
          stage2Sources: Array.isArray(pl?.stage2Sources) ? pl.stage2Sources : [],
          stage3Verdict: {
            chosenVerdict: pl?.stage3Verdict?.chosenVerdict || raw?.chosenVerdict || 'PARTIALLY SUPPORTED',
            expectedVerdict: pl?.stage3Verdict?.expectedVerdict || raw?.expectedVerdict || 'PARTIALLY SUPPORTED',
            isCalibrated: Boolean(pl?.stage3Verdict?.isCalibrated ?? raw?.isCalibrated),
          },
          stage4Justification: {
            justificationText: pl?.stage4Justification?.justificationText || raw?.justification || '-',
            meaningfulWordCount: pl?.stage4Justification?.meaningfulWordCount ?? 15,
            topicKeywordsFound: Array.isArray(pl?.stage4Justification?.topicKeywordsFound)
              ? pl.stage4Justification.topicKeywordsFound
              : [],
            analyticalKeywordsFound: Array.isArray(pl?.stage4Justification?.analyticalKeywordsFound)
              ? pl.stage4Justification.analyticalKeywordsFound
              : [],
            checklist: {
              min12WordsAndClean: Boolean(pl?.stage4Justification?.checklist?.min12WordsAndClean ?? true),
              min12WordsPoints: pl?.stage4Justification?.checklist?.min12WordsPoints ?? 8,
              min2TopicKeywords: Boolean(pl?.stage4Justification?.checklist?.min2TopicKeywords ?? true),
              min2TopicPoints: pl?.stage4Justification?.checklist?.min2TopicPoints ?? 9,
              hasAnalyticalTerm: Boolean(pl?.stage4Justification?.checklist?.hasAnalyticalTerm ?? true),
              analyticalTermPoints: pl?.stage4Justification?.checklist?.analyticalTermPoints ?? 8,
            },
          },
        }
      : undefined,
  };
}

export const SCORE_TOKEN_PREFIX = 'AILAB-SCORE-v1:';

export function encodeSubmissionScoreToken(entry: StudentScoreEntry): string {
  const normalized = normalizeStudentScoreEntry(entry, 0);
  const json = JSON.stringify(normalized);
  if (typeof Buffer !== 'undefined') {
    return `${SCORE_TOKEN_PREFIX}${Buffer.from(json, 'utf-8').toString('base64')}`;
  }
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `${SCORE_TOKEN_PREFIX}${btoa(binary)}`;
}

export function decodeSubmissionScoreToken(token: string): StudentScoreEntry | null {
  try {
    const clean = (token || '').trim();
    const base64Part = clean.startsWith(SCORE_TOKEN_PREFIX)
      ? clean.slice(SCORE_TOKEN_PREFIX.length).trim()
      : clean;
    if (!base64Part) return null;

    let json = '';
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(base64Part, 'base64').toString('utf-8');
    } else {
      const binary = atob(base64Part);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || (!parsed.studentName && !parsed.vScore)) {
      return null;
    }
    return normalizeStudentScoreEntry(parsed, 0);
  } catch {
    return null;
  }
}

export function loadScenarios(): ChallengeScenario[] {
  try {
    const raw = localStorage.getItem(KEYS.SCENARIOS);
    if (!raw) {
      localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(CHALLENGE_SCENARIOS));
      return CHALLENGE_SCENARIOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s, idx) => ({
        ...CHALLENGE_SCENARIOS[0],
        ...s,
        id: s?.id || `scen-${idx}`,
        title: s?.title || 'Studi Kasus Verifikasi AI',
        aiOutputText: s?.aiOutputText || CHALLENGE_SCENARIOS[0].aiOutputText,
        expectedVerdict: s?.expectedVerdict || 'PARTIALLY SUPPORTED',
        preloadedReferences: Array.isArray(s?.preloadedReferences)
          ? s.preloadedReferences
          : CHALLENGE_SCENARIOS[0].preloadedReferences,
      }));
    }
  } catch {
    // ignore storage errors
  }
  return CHALLENGE_SCENARIOS;
}

export function saveScenarios(scenarios: ChallengeScenario[]): void {
  try {
    localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));
  } catch {
    // ignore
  }
}

export function loadStudentScores(): StudentScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDENT_SCORES);
    if (!raw) {
      localStorage.setItem(KEYS.STUDENT_SCORES, JSON.stringify(INITIAL_STUDENT_SCORES));
      return INITIAL_STUDENT_SCORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => normalizeStudentScoreEntry(item, idx));
    }
  } catch {
    // ignore
  }
  return INITIAL_STUDENT_SCORES;
}

export function saveStudentScores(scores: StudentScoreEntry[]): void {
  try {
    localStorage.setItem(KEYS.STUDENT_SCORES, JSON.stringify(scores));
  } catch {
    // ignore
  }
}

export function upsertStudentScoreEntry(
  prevScores: StudentScoreEntry[],
  newEntry: StudentScoreEntry
): StudentScoreEntry[] {
  const safePrev = Array.isArray(prevScores)
    ? prevScores.map((item, i) => normalizeStudentScoreEntry(item, i))
    : [];
  const normalizedNew = normalizeStudentScoreEntry(newEntry, 0);
  const cleanName = (normalizedNew.studentName || '').trim().toLowerCase();
  const cleanNim = (normalizedNew.studentNim || '').trim().toLowerCase();
  const baseScenarioTitle = (normalizedNew.scenarioTitle || 'Audit Mandiri Output AI')
    .replace(/\s*\(Percobaan\s*#\d+\)\s*$/i, '')
    .trim();

  const existingIndex = safePrev.findIndex((item) => {
    const itemBaseTitle = (item?.scenarioTitle || '')
      .replace(/\s*\(Percobaan\s*#\d+\)\s*$/i, '')
      .trim()
      .toLowerCase();
    const sameStudent =
      (item?.studentNim || '').trim().toLowerCase() === cleanNim ||
      (item?.studentName || '').trim().toLowerCase() === cleanName;
    return sameStudent && itemBaseTitle === baseScenarioTitle.toLowerCase();
  });

  if (existingIndex === -1) {
    const firstAttemptEntry: StudentScoreEntry = {
      ...normalizedNew,
      attemptCount: 1,
      scenarioTitle: `${baseScenarioTitle} (Percobaan #1)`,
    };
    const updated = [firstAttemptEntry, ...safePrev];
    saveStudentScores(updated);
    return updated;
  }

  const existing = safePrev[existingIndex];
  const nextAttemptCount = (existing?.attemptCount || 1) + 1;
  const updatedEntry: StudentScoreEntry = {
    ...normalizedNew,
    attemptCount: nextAttemptCount,
    scenarioTitle: `${baseScenarioTitle} (Percobaan #${nextAttemptCount})`,
  };

  const remaining = safePrev.filter((_, idx) => idx !== existingIndex);
  const updated = [updatedEntry, ...remaining];
  saveStudentScores(updated);
  return updated;
}

export function clearAllStudentScores(): StudentScoreEntry[] {
  saveStudentScores([]);
  return [];
}

export function resetStudentScoresToDefault(): StudentScoreEntry[] {
  saveStudentScores(INITIAL_STUDENT_SCORES);
  return INITIAL_STUDENT_SCORES;
}

export function loadCrowdsourcedReports(): CrowdsourcedReport[] {
  try {
    const raw = localStorage.getItem(KEYS.CROWDSOURCED_REPORTS);
    if (!raw) {
      localStorage.setItem(KEYS.CROWDSOURCED_REPORTS, JSON.stringify(INITIAL_CROWDSOURCED_REPORTS));
      return INITIAL_CROWDSOURCED_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((rep, idx) => ({
        id: rep?.id || `rep-fallback-${idx}`,
        reporterName: rep?.reporterName || 'Mahasiswa Pelapor',
        reporterNim: rep?.reporterNim || '-',
        aiPlatform: rep?.aiPlatform || 'LLM Umum',
        topicCategory: rep?.topicCategory || 'Sains & Teknologi',
        hallucinationText: rep?.hallucinationText || '-',
        correctionEvidence: rep?.correctionEvidence || '-',
        suggestedVerdict: rep?.suggestedVerdict || 'UNSUPPORTED',
        status: rep?.status === 'PROMOTED' ? 'PROMOTED' : 'PENDING',
        createdAt: rep?.createdAt || '-',
      }));
    }
  } catch {
    // ignore
  }
  return INITIAL_CROWDSOURCED_REPORTS;
}

export function saveCrowdsourcedReports(reports: CrowdsourcedReport[]): void {
  try {
    localStorage.setItem(KEYS.CROWDSOURCED_REPORTS, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

export function loadActiveRole(): 'STUDENT' | 'MENTOR' {
  try {
    const val = localStorage.getItem(KEYS.ACTIVE_ROLE);
    if (val === 'MENTOR' || val === 'mentor') return 'MENTOR';
    if (val === 'STUDENT' || val === 'mahasiswa') return 'STUDENT';
  } catch {
    // ignore
  }
  return 'STUDENT';
}

export function saveActiveRole(role: UserRole): void {
  const normalized: 'STUDENT' | 'MENTOR' = isMentorRole(role) ? 'MENTOR' : 'STUDENT';
  try {
    localStorage.setItem(KEYS.ACTIVE_ROLE, normalized);
  } catch {
    // ignore
  }
}

export function loadStudentIdentity(): StudentIdentity {
  try {
    const raw = localStorage.getItem(KEYS.STUDENT_IDENTITY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.name && parsed?.nim) return parsed;
    }
  } catch {
    // ignore
  }
  return {
    name: 'Budi Santoso',
    nim: '2401018821 · Kelas Sains & Teknologi A',
  };
}

export function saveStudentIdentity(identity: StudentIdentity): void {
  try {
    localStorage.setItem(KEYS.STUDENT_IDENTITY, JSON.stringify(identity));
    localStorage.setItem('studentName', identity.name);
    localStorage.setItem('studentNim', identity.nim);
  } catch {
    // ignore
  }
}

export function loadAuthSession(): AuthSession {
  try {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return {
        isAuthenticated: true,
        role: 'STUDENT',
        studentIdentity: loadStudentIdentity(),
      };
    }
    const raw = localStorage.getItem(KEYS.AUTH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.isAuthenticated && (parsed.role === 'STUDENT' || parsed.role === 'MENTOR')) {
        return {
          isAuthenticated: true,
          role: parsed.role,
          studentIdentity: parsed.studentIdentity || loadStudentIdentity(),
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    isAuthenticated: false,
    role: 'STUDENT',
    studentIdentity: loadStudentIdentity(),
  };
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify(session));
    saveActiveRole(session.role);
    saveStudentIdentity(session.studentIdentity);
  } catch {
    // ignore
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(KEYS.AUTH_SESSION);
    localStorage.removeItem(KEYS.ACTIVE_ROLE);
  } catch {
    // ignore
  }
}
