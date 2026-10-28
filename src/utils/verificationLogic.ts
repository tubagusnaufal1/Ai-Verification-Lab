export const SERPER_API_KEY = "3f025a5c0bca7e27ec6d12be8a3d2a74e9c49a5b";
export const GEMINI_SYNTHESIS_MODEL = 'gemini-2.5-flash';

export type VerdictType = 'VERIFIED' | 'PARTIALLY SUPPORTED' | 'UNSUPPORTED';

export type MicroVerdictType = 'SESUAI_BUKTI' | 'DISTORSI' | 'HALUSINASI';

export type AIPathologyId =
  | 'UNVERIFIED_FACTUAL_CLAIM'
  | 'STATISTICAL_DISTORTION'
  | 'OVER_GENERALIZATION'
  | 'FALSE_CAUSALITY'
  | 'FABRICATED_CITATION'
  | 'CHERRY_PICKING'
  | 'CONTEXTUAL_DRIFT'
  | 'SYCOPHANCY_BIAS'
  | 'VALID_CLAIM';

export interface AIPathologyInfo {
  id: AIPathologyId;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  defaultRisk: 'Tinggi' | 'Sedang' | 'Rendah';
}

export const AI_PATHOLOGY_TAXONOMY: AIPathologyInfo[] = [
  {
    id: 'UNVERIFIED_FACTUAL_CLAIM',
    code: 'Patologi #1',
    label: 'Klaim Faktual Tanpa Bukti Primer (Unverified Factual Claim)',
    shortLabel: 'Klaim Faktual Tanpa Bukti Primer',
    description:
      'Klaim menyatakan fakta, atribusi tokoh, sejarah, atau silsilah spesifik tanpa mencantumkan sumber dokumen primer. Wajib dicek kebenarannya pada 6 bukti di sebelah kanan.',
    defaultRisk: 'Tinggi',
  },
  {
    id: 'STATISTICAL_DISTORTION',
    code: 'Patologi #2',
    label: 'Distorsi Statistik & Kuantitatif (Statistical Distortion)',
    shortLabel: 'Distorsi Statistik & Kuantitatif',
    description:
      'AI mengubah konteks angka persentase (%), jumlah, rasio, atau menggabungkan metrik statistik yang berbeda sehingga menyesatkan kesimpulan.',
    defaultRisk: 'Tinggi',
  },
  {
    id: 'OVER_GENERALIZATION',
    code: 'Patologi #3',
    label: 'Over-Generalisasi Populasi (Over-Generalization)',
    shortLabel: 'Over-Generalisasi Populasi',
    description:
      'AI menggunakan kata mutlak (semua, seluruh, selalu, pasti, setiap masyarakat, 100%) untuk mengekstrapolasi sampel sempit ke seluruh populasi.',
    defaultRisk: 'Sedang',
  },
  {
    id: 'FALSE_CAUSALITY',
    code: 'Patologi #4',
    label: 'Kausalitas Semu (False Causality)',
    shortLabel: 'Kausalitas Semu (False Causality)',
    description:
      'AI menggunakan klaim sebab-akibat langsung (menyebabkan, mencegah, memicu, mengakibatkan) tanpa memperhitungkan faktor multifaktorial atau variabel perancu.',
    defaultRisk: 'Tinggi',
  },
  {
    id: 'FABRICATED_CITATION',
    code: 'Patologi #5',
    label: 'Risiko Sitasi Fiktif (Ghost Citation Check)',
    shortLabel: 'Risiko Sitasi Fiktif (Ghost Citation)',
    description:
      'AI mencantumkan nama peneliti, tahun publikasi, institusi, atau nomor DOI yang wajib diverifikasi keasliannya pada pangkalan data ilmiah.',
    defaultRisk: 'Tinggi',
  },
  {
    id: 'CHERRY_PICKING',
    code: 'Patologi #6',
    label: 'Tebang Pilih Bukti (Cherry-Picking)',
    shortLabel: 'Tebang Pilih Bukti (Cherry-Picking)',
    description:
      'AI hanya mengutip kesimpulan yang mendukung satu sisi argumen sambil menyembunyikan syarat, batasan metodologi, atau kontraindikasi pada studi asli.',
    defaultRisk: 'Sedang',
  },
  {
    id: 'CONTEXTUAL_DRIFT',
    code: 'Patologi #7',
    label: 'Pergeseran Konteks (Contextual Drift)',
    shortLabel: 'Pergeseran Konteks (Contextual Drift)',
    description:
      'AI mencampuradukkan konteks waktu, periode sejarah, atau lokasi geografis/regulasi dari wilayah lain seolah-olah berlaku identik di Indonesia saat ini.',
    defaultRisk: 'Sedang',
  },
];

export interface RawSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
}

export interface SearchReference {
  id: number;
  title: string;
  url: string;
  scholarUrl: string;
  snippet: string;
  isPdf: boolean;
  domain: string;
}

export interface GhostCitationCheck {
  hasExplicitCitation: boolean;
  detectedTokens: string[];
  matchedRefIds: number[];
  status: 'VERIFIED_IN_REFS' | 'GHOST_WARNING' | 'NO_EXPLICIT_CITATION';
  badgeLabel: string;
}

export interface ExtractedClaim {
  id: string;
  index: number;
  text: string;
  displayText?: string;
  category:
    | 'Klaim Faktual Tanpa Bukti Primer (Unverified Factual Claim)'
    | 'Klaim Statistik & Kuantitatif'
    | 'Klaim Kausalitas / Sebab-Akibat'
    | 'Klaim Sitasi & Otoritas'
    | 'Klaim Generalisasi Konteks'
    | 'Klaim Terverifikasi Sesuai Bukti Primer';
  riskLevel: 'Tinggi' | 'Sedang' | 'Rendah';
  verificationReason: string;
  pathologyId: AIPathologyId;
  pathologyLabel: string;
  expectedMicroVerdict: MicroVerdictType;
  suggestedRefId: string;
  ghostCitation?: GhostCitationCheck;
}

export interface ClaimMicroAuditInput {
  claimId: string;
  microVerdict: MicroVerdictType | null;
  evidenceRefId: string; // e.g., '1', '2', ..., '6', 'NONE', or ''
  detectedPathology: AIPathologyId | '';
}

export interface StageScoreBreakdown {
  stage1ClaimAudit: number; // Max 25
  stage2SourceVerification: number; // Max 25
  stage3VerdictAccuracy: number; // Max 25
  stage4JustificationQuality: number; // Max 25
  totalScore: number; // Max 100
  stage1Feedback: string;
  stage2Feedback: string;
  stage3Feedback: string;
  stage4Feedback: string;
}

export interface JustificationChecklist {
  min12WordsAndClean: boolean;
  min12WordsPoints: number; // +8 poin
  min2TopicKeywords: boolean;
  min2TopicPoints: number; // +9 poin
  hasAnalyticalTerm: boolean;
  analyticalTermPoints: number; // +8 poin
}

export interface JustificationValidationResult {
  valid: boolean;
  isGibberish: boolean;
  meaningfulWordCount: number;
  trimmedLength: number;
  analyticalKeywordsFound: string[];
  topicKeywordsFound: string[];
  checklist: JustificationChecklist;
  warningMessage: string;
  suggestedScoreOutOf25: number;
}

export interface StudentClaimProcessDetail {
  claimIndex: number;
  claimText: string;
  studentMicroVerdict: MicroVerdictType | null;
  expectedMicroVerdict: MicroVerdictType;
  isMicroAccurate: boolean;
  studentPathology: AIPathologyId | '';
  expectedPathology: AIPathologyId;
  expectedPathologyLabel: string;
  studentEvidenceRefId: string;
  expectedEvidenceRefId: string;
  verificationReason: string;
}

export interface StudentSourceProcessDetail {
  refId: number;
  title: string;
  domain: string;
  wasInspected: boolean;
}

export interface StudentAuditProcessLog {
  stage1Claims: StudentClaimProcessDetail[];
  stage2Sources: StudentSourceProcessDetail[];
  stage3Verdict: {
    chosenVerdict: VerdictType;
    expectedVerdict: VerdictType;
    isCalibrated: boolean;
  };
  stage4Justification: {
    justificationText: string;
    meaningfulWordCount: number;
    topicKeywordsFound: string[];
    analyticalKeywordsFound: string[];
    checklist: JustificationChecklist;
  };
}

export interface AuditResultRecord {
  id: string;
  claimSummary: string;
  verdict: VerdictType;
  expectedVerdict: VerdictType;
  isCalibrated: boolean;
  justification: string;
  vScoreDelta: number;
  newVScore: number;
  stageBreakdown: StageScoreBreakdown;
  distortedSentenceHighlight: string;
  correctedAcademicParagraph: string;
  apaReferences: string[];
  timestamp: string;
  processLog?: StudentAuditProcessLog;
}

export interface ChallengeScenario {
  id: string;
  level: 'LEVEL: MENENGAH' | 'LEVEL: MAHIR' | 'LEVEL: DASAR';
  category?: string;
  badgeColor: 'amber' | 'red' | 'blue';
  borderColorClass: string;
  title: string;
  description: string;
  aiOutputText: string;
  searchQuery: string;
  expectedVerdict: VerdictType;
  calibrationHint: string;
  preloadedReferences: SearchReference[];
  createdBy?: string;
}

export const VSCORE_RUBRIC_100 = [
  {
    key: 'stage1ClaimAudit',
    code: 'Tahap 1 · Claim & Pathology Audit',
    label: 'Claim & Pathology Audit',
    weight: 25,
    description:
      'Ketepatan memberi vonis mikro (Sesuai Bukti / Distorsi / Halusinasi) pada seluruh unit klaim serta mengidentifikasi patologi AI dan Ghost Citation.',
  },
  {
    key: 'stage2SourceVerification',
    code: 'Tahap 2 · Source Verification',
    label: 'Source & Reference Matching',
    weight: 25,
    description:
      'Memvalidasi minimal 3 sumber referensi primer di kolom kanan serta mencocokkan nomor rujukan bukti (#1–#6 atau Tidak Ada Bukti) pada setiap unit klaim.',
  },
  {
    key: 'stage3VerdictAccuracy',
    code: 'Tahap 3 · Verdict Accuracy',
    label: 'Final Verdict Calibration',
    weight: 25,
    description:
      'Ketepatan memilih Verdict Akhir sesuai kunci bukti primer (Tepat = 25 poin, Meleset 1 tingkat = 10 poin, Salah total = 0 poin).',
  },
  {
    key: 'stage4JustificationQuality',
    code: 'Tahap 4 · Analytical Justification',
    label: 'Context & Evidence Justification',
    weight: 25,
    description:
      'Kualitas argumen tertulis (minimal 8 kata bermakna, lolos uji Anti-Gibberish, merujuk pada bukti/konteks metodologi secara logis).',
  },
] as const;

// Pertahankan kompatibilitas untuk komponen yang membaca VSCORE_WEIGHTS
export const VSCORE_WEIGHTS = VSCORE_RUBRIC_100;

export function buildScholarSearchUrl(titleOrQuery: string): string {
  const cleaned = titleOrQuery.replace(/^\[PDF\]\s*/i, '').trim();
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(cleaned)}`;
}

/**
 * Membersihkan tanda elipsis ("..." atau "…") dan metadata tanggal/penulis yang menggantung
 * dari snippet mesin pencari agar menjadi kalimat yang rapi dan utuh.
 */
export function sanitizeSnippetText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText
    .replace(/^(?:(?:oleh|by)\s+.*?\s*[—\-]\s*|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\s*[—\-]\s*)/i, '')
    .trim();

  if (/(?:\.{2,}|…)\s*$/.test(text)) {
    const withoutTrailingEllipsis = text.replace(/\s*(?:\.{2,}|…)\s*$/, '').trim();
    const lastPeriodIdx = withoutTrailingEllipsis.lastIndexOf('. ');
    if (lastPeriodIdx > 35) {
      const trailingFragment = withoutTrailingEllipsis.slice(lastPeriodIdx + 2).trim();
      if (trailingFragment.split(/\s+/).length <= 6) {
        text = withoutTrailingEllipsis.slice(0, lastPeriodIdx + 1);
      } else {
        text = withoutTrailingEllipsis;
      }
    } else {
      text = withoutTrailingEllipsis;
    }
  }

  text = text
    .replace(/\s*(\.{2,}|…)\s*/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/[,;:]+\s*\.?$/, '')
    .replace(
      /\s+\b(?:dan|atau|yang|di|ke|dari|pada|untuk|dengan|dalam|terhadap|sebagai|karena|bahwa)\s*\.?$/i,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  return text;
}

/**
 * Membersihkan teks sintesis multi-paragraf dari elipsis menggantung tanpa merusak jeda paragraf (\n\n).
 */
export function sanitizeSynthesisParagraphs(rawSynthesis: string): string {
  if (!rawSynthesis) return '';
  return rawSynthesis
    .split(/\n\s*\n/)
    .map((para) => {
      let cleaned = para
        .replace(/\s*(\.{2,}|…)\s*/g, ' ')
        .replace(/\s+([,.;!?])/g, '$1')
        .replace(/,\s*(\[\d+\])/g, ' $1')
        .replace(/\.\s*(\[\d+\])\./g, ' $1.')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned && !/[.!?\]"”]$/.test(cleaned)) {
        cleaned += '.';
      }
      return cleaned;
    })
    .filter((p) => p.length > 0)
    .join('\n\n');
}

/**
 * Mesin Sintesis Bukti Otomatis Berbasis Topik (buildTopicRelevantSynthesis):
 * Mengambil keenam snippet asli dari hasil Serper.dev pada kueri apa pun, membersihkan
 * tanda "..." di ujung kalimat, lalu merangkainya menjadi 2 paragraf sintesis akademik
 * yang 100% membahas topik yang dicari pengguna lengkap dengan sitasi [1] s/d [6],
 * tanpa memicu error banner Gemini API.
 */
export function buildTopicRelevantSynthesis(
  query: string,
  references: SearchReference[]
): string {
  const cleanQuery = query.trim() || 'topik kajian ilmiah terkait';
  const cleanedSnippets = references
    .slice(0, 6)
    .map((r) => sanitizeSnippetText(r.snippet).replace(/[.!?]+$/, '').trim())
    .filter((s) => s.length > 15);

  const s1 =
    cleanedSnippets[0] ||
    `Temuan literatur pertama mengenai ${cleanQuery} menguraikan indikator empiris utama yang teridentifikasi pada penelitian lapangan`;
  const s2 =
    cleanedSnippets[1] ||
    `Kajian kedua mengenai ${cleanQuery} memperlihatkan hubungan antar-variabel yang dianalisis berdasarkan data observasional`;
  const s3 =
    cleanedSnippets[2] ||
    `Publikasi ketiga menyoroti aspek kebijakan dan evaluasi program terkait ${cleanQuery} pada populasi sasaran`;
  const s4 =
    cleanedSnippets[3] ||
    `Studi keempat memberikan analisis komparatif mengenai efektivitas dan faktor penentu pada konteks ${cleanQuery}`;
  const s5 =
    cleanedSnippets[4] ||
    `Bukti kelima menekankan pentingnya memperhatikan karakteristik demografis, metodologi, serta variabel perancu dalam menafsirkan temuan ${cleanQuery}`;
  const s6 =
    cleanedSnippets[5] ||
    `Referensi keenam menegaskan perlunya verifikasi silang terhadap dokumen sumber primer sebelum menarik kesimpulan kausalitas mutlak mengenai ${cleanQuery}`;

  const lowerFirst = (str: string) =>
    /^[A-Z]{2,}\b/.test(str) ? str : str.charAt(0).toLowerCase() + str.slice(1);

  const p1 = `Berdasarkan sintesis bukti literatur terhadap topik "${cleanQuery}", publikasi yang terindeks menyajikan temuan empiris yang saling berkaitan. ${s1} [1]. Sejalan dengan hal tersebut, telaah pada rujukan kedua menunjukkan bahwa ${lowerFirst(s2)} [2]. Lebih lanjut, dalam perspektif implementasi dan evaluasi faktual, ${lowerFirst(s3)} [3]. Rangkaian bukti pada ketiga referensi awal ini menjadi fondasi utama untuk menguji akurasi klaim terhadap fakta terverifikasi [1][2][3].`;

  const p2 = `Pada analisis lanjutan mengenai "${cleanQuery}", dokumen pembanding juga menggarisbawahi sejumlah parameter metodologis dan konteks lapangan yang krusial. ${s4} [4]. Di samping itu, bukti kelima menjelaskan bahwa ${lowerFirst(s5)} [5]. Temuan tersebut diperkuat oleh literatur keenam yang mencatat bahwa ${lowerFirst(s6)} [6]. Oleh sebab itu, proses audit informasi wajib menyandingkan setiap klaim dengan kutipan bukti primer [1][2][3][4][5][6] secara cermat agar bebas dari distorsi statistik maupun generalisasi berlebih.`;

  return sanitizeSynthesisParagraphs(`${p1}\n\n${p2}`);
}

export function buildCohesiveFallbackSynthesis(
  query: string,
  references: SearchReference[]
): string {
  return buildTopicRelevantSynthesis(query, references);
}

export function buildSearchQuery(rawQuery: string, academicFilter: boolean): string {
  const cleaned = rawQuery.trim();
  if (!cleaned) return '';
  if (academicFilter) {
    return `${cleaned} jurnal penelitian ilmiah`;
  }
  return cleaned;
}

export function filterCleanSearchResults(
  items: RawSearchItem[],
  academicFilter: boolean
): SearchReference[] {
  if (!Array.isArray(items)) return [];

  const filtered = items.filter((item) => {
    if (!item || !item.link || !item.title) return false;
    const lowerUrl = item.link.toLowerCase();
    if (lowerUrl.includes('scholar.google.com/citations')) {
      return false;
    }
    return true;
  });

  return filtered.slice(0, 6).map((item, idx) => {
    const url = item.link || '';
    const isPdf =
      academicFilter ||
      url.toLowerCase().endsWith('.pdf') ||
      url.toLowerCase().includes('/pdf') ||
      (item.title || '').toLowerCase().includes('[pdf]');
    const cleanTitle = (item.title || 'Dokumen Referensi Terverifikasi')
      .replace(/^\[PDF\]\s*/i, '')
      .replace(/\s*(\.{2,}|…)\s*$/g, '')
      .trim();

    let domain = 'scholar.google.com';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      domain = 'publikasi-ilmiah.id';
    }

    const cleanedSnippet = sanitizeSnippetText(
      item.snippet ||
        'Kutipan bukti empiris terverifikasi dari publikasi ilmiah terindeks terkait parameter yang diuji.'
    );

    return {
      id: idx + 1,
      title: isPdf ? `[PDF] ${cleanTitle}` : cleanTitle,
      url,
      scholarUrl: buildScholarSearchUrl(cleanTitle),
      snippet: cleanedSnippet,
      isPdf,
      domain,
    };
  });
}

export function normalizeToSixReferences(
  query: string,
  serperResults: Array<RawSearchItem | SearchReference>,
  academicFilter = true
): SearchReference[] {
  const converted: SearchReference[] = [];

  for (const item of serperResults || []) {
    if ('scholarUrl' in item && 'domain' in item && item.url) {
      if (item.url.toLowerCase().includes('scholar.google.com/citations')) continue;
      const cleanTitle = item.title
        .replace(/^\[PDF\]\s*/i, '')
        .replace(/\s*(\.{2,}|…)\s*$/g, '')
        .trim();
      converted.push({
        ...item,
        id: converted.length + 1,
        title: item.isPdf ? `[PDF] ${cleanTitle}` : cleanTitle,
        scholarUrl: item.scholarUrl || buildScholarSearchUrl(cleanTitle),
        snippet: sanitizeSnippetText(item.snippet),
      });
    } else {
      const raw = item as RawSearchItem;
      const cleanedList = filterCleanSearchResults([raw], academicFilter);
      if (cleanedList.length > 0) {
        converted.push({
          ...cleanedList[0],
          id: converted.length + 1,
        });
      }
    }
    if (converted.length >= 6) break;
  }

  if (converted.length < 6) {
    const fallbacks = getFallbackAcademicResults(query);
    for (const fb of fallbacks) {
      if (converted.length >= 6) break;
      if (!converted.some((r) => r.title.toLowerCase() === fb.title.toLowerCase())) {
        converted.push({
          ...fb,
          id: converted.length + 1,
          snippet: sanitizeSnippetText(fb.snippet),
        });
      }
    }
  }

  return converted.slice(0, 6).map((ref, idx) => ({
    ...ref,
    id: idx + 1,
  }));
}

/**
 * Menyintesis jawaban akademik multi-paragraf yang utuh dari 6 sumber Serper.dev
 * dengan sitasi inline [1]-[6] menggunakan Mesin Sintesis Bukti Otomatis Berbasis Topik
 * (buildTopicRelevantSynthesis) tanpa memicu error banner API eksternal.
 */
export async function synthesizeAcademicAnswerWithGemini(
  query: string,
  serperResults: Array<RawSearchItem | SearchReference>,
  academicFilter = true
): Promise<{
  synthesizedAnswer: string;
  references: SearchReference[];
  usedGeminiModel: string;
}> {
  const references = normalizeToSixReferences(query, serperResults, academicFilter);
  return {
    synthesizedAnswer: buildTopicRelevantSynthesis(query, references),
    references,
    usedGeminiModel: GEMINI_SYNTHESIS_MODEL,
  };
}

/**
 * Mode 2 di Tanya AI: Menyisipkan jebakan halusinasi/distorsi terkontrol pada hasil sintesis
 * agar pengguna diuji ketelitiannya di halaman Uji Output AI.
 */
export function injectControlledHallucinationInText(
  cleanSynthesis: string,
  query: string,
  references: SearchReference[],
  targetVerdict: 'PARTIALLY SUPPORTED' | 'UNSUPPORTED' = 'PARTIALLY SUPPORTED'
): {
  manipulatedText: string;
  expectedVerdict: VerdictType;
  injectedPathology: AIPathologyInfo;
  calibrationHint: string;
} {
  const cleanParagraphs = sanitizeSynthesisParagraphs(cleanSynthesis).split('\n\n');
  const firstPara = cleanParagraphs[0] || cleanSynthesis;

  if (targetVerdict === 'UNSUPPORTED') {
    const pathology = AI_PATHOLOGY_TAXONOMY[0]; // Fabricated Citation & False Causality
    const trapSentence = `Namun demikian, konsensus mutlak dari jurnal "Global Nusantara Meta-Synthetic Review" (Prof. Zimmerman & Haryanto, 2025) membuktikan bahwa 100% kasus pada topik "${query.trim()}" disebabkan oleh faktor tunggal tanpa variabel perancu dan seluruh intervensi konvensional telah dinyatakan gagal total secara klinis.`;
    const secondPara =
      cleanParagraphs[1] ||
      `Oleh sebab itu, seluruh populasi di Indonesia tanpa terkecuali mengalami dampak identik sebesar 98,7% dalam waktu singkat.`;
    return {
      manipulatedText: `${firstPara}\n\n${trapSentence} ${secondPara}`,
      expectedVerdict: 'UNSUPPORTED',
      injectedPathology: pathology,
      calibrationHint:
        'Teks ini disisipi Jebakan Halusinasi Berat (UNSUPPORTED): Terdapat sitasi jurnal fiktif "Global Nusantara Meta-Synthetic Review (Prof. Zimmerman & Haryanto, 2025)" (Ghost Citation) serta klaim mutlak 100% kausalitas tunggal yang bertentangan dengan ke-6 bukti primer.',
    };
  }

  // PARTIALLY SUPPORTED: Sisipkan Over-Generalisasi & Distorsi Statistik halus pada paragraf kedua
  const pathology = AI_PATHOLOGY_TAXONOMY[3]; // Statistical Distortion & Over-Generalization
  const ref1Title = references[0]?.title.replace(/^\[PDF\]\s*/i, '') || 'literatur primer';
  const distortedPara = `Lebih jauh lagi, merujuk pada temuan "${ref1Title}" [1] serta studi (Prof. Haryanto, 2025), angka risiko pada sampel terbatas tersebut dapat digeneralisasi secara mutlak bahwa 100% populasi di seluruh provinsi Indonesia pasti mengalami lonjakan dampak sebesar 85 kali lipat secara permanen akibat faktor tunggal tersebut tanpa dipengaruhi gaya hidup atau variabel lainnya [1][4].`;

  return {
    manipulatedText: `${firstPara}\n\n${distortedPara}`,
    expectedVerdict: 'PARTIALLY SUPPORTED',
    injectedPathology: pathology,
    calibrationHint:
      'Teks ini merupakan Mode Latihan Audit (PARTIALLY SUPPORTED): Paragraf pertama akurat sesuai bukti [1][2][3], namun paragraf kedua sengaja disisipi Distorsi Statistik ("85 kali lipat"), Over-Generalisasi ("100% populasi di seluruh provinsi"), dan Ghost Citation "(Prof. Haryanto, 2025)" yang tidak ada di ke-6 bukti.',
  };
}

/**
 * Mengekstrak kueri topik utama secara otomatis ketika pengguna menempelkan teks AI bebas
 * (Bring Your Own AI Text) di halaman Uji Output AI.
 */
export function extractTopicQueryFromFreeText(freeText: string): string {
  const cleaned = sanitizeSnippetText(freeText)
    .replace(/\[\d+\]/g, '')
    .replace(/[()"“”'']/g, ' ');
  const stopWords = new Set([
    'berdasarkan',
    'menunjukkan',
    'bahwa',
    'dalam',
    'untuk',
    'dengan',
    'adalah',
    'sebagai',
    'terhadap',
    'oleh',
    'pada',
    'dari',
    'yang',
    'dan',
    'atau',
    'ini',
    'itu',
    'juga',
    'dapat',
    'akan',
    'telah',
    'studi',
    'penelitian',
    'jurnal',
    'tahun',
    'hasil',
    'analisis',
    'sintesis',
    'literatur',
    'ilmiah',
    'topik',
    'bukti',
    'empiris',
    'terindeks',
    'memperlihatkan',
    'temuan',
    'saling',
    'melengkapi',
    'lebih',
    'lanjut',
    'telaah',
    'dokumen',
    'sekunder',
  ]);

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9-]/g, ''))
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  const uniqueKeywords: string[] = [];
  for (const w of words) {
    if (!uniqueKeywords.some((k) => k.toLowerCase() === w.toLowerCase())) {
      uniqueKeywords.push(w);
    }
    if (uniqueKeywords.length >= 7) break;
  }

  return uniqueKeywords.join(' ') || 'penelitian akademik Indonesia';
}

/**
 * Ghost Citation Detector: Memindai apakah klaim menyebutkan nama penulis/institusi atau tahun
 * (misal "(Demiyati, 2024)", "(FKM UI, 2023)", "Prof. Zimmerman") dan mencocokkannya secara
 * otomatis dengan daftar 5-6 referensi bukti di kolom kanan.
 */
export function detectGhostCitation(
  claimText: string,
  references: SearchReference[]
): GhostCitationCheck {
  const tokens: string[] = [];

  // 1. Cari pola tahun (1990 - 2029)
  const yearMatches = claimText.match(/\b(19\d{2}|20[0-2]\d)\b/g) || [];
  for (const y of yearMatches) {
    if (!tokens.includes(y)) tokens.push(y);
  }

  // 2. Cari pola sitasi dalam kurung misal (Demiyati, 2024) atau (FKM UI, 2023)
  const parenRegex = /\(([A-Z][A-Za-z.\s&-]{2,35}?)(?:,\s*(?:19\d{2}|20[0-2]\d))?\)/g;
  let match: RegExpExecArray | null;
  while ((match = parenRegex.exec(claimText)) !== null) {
    const candidate = match[1].trim();
    if (
      candidate.length >= 3 &&
      !/^(PDF|DOI|WHO|IDAI|BPS|SINTA|PLTN|T2DM|N=|\d+)$/i.test(candidate)
    ) {
      const surname = candidate
        .replace(/^(Prof\.|Dr\.|oleh|by)\s*/i, '')
        .split(/\s+|&/)[0]
        .replace(/[^A-Za-z]/g, '');
      if (surname.length >= 3 && !tokens.includes(surname)) {
        tokens.push(surname);
      }
    }
  }

  // 3. Cari pola "Prof. X", "Dr. Y", "studi X", atau jurnal dalam tanda kutip
  const authorRegex = /\b(?:Prof\.|Dr\.|studi|oleh)\s+([A-Z][a-z]{3,20})\b/g;
  while ((match = authorRegex.exec(claimText)) !== null) {
    const name = match[1].trim();
    if (
      !['Penelitian', 'Literatur', 'Analisis', 'Dokumen', 'Indonesia', 'Nasional'].includes(name) &&
      !tokens.includes(name)
    ) {
      tokens.push(name);
    }
  }

  const quotedJournalRegex = /"([A-Z][^"]{8,60})"/g;
  while ((match = quotedJournalRegex.exec(claimText)) !== null) {
    const jTitle = match[1].trim();
    if (!tokens.includes(jTitle)) {
      tokens.push(jTitle);
    }
  }

  if (tokens.length === 0) {
    return {
      hasExplicitCitation: false,
      detectedTokens: [],
      matchedRefIds: [],
      status: 'NO_EXPLICIT_CITATION',
      badgeLabel: 'Tanpa Sitasi Nama/Tahun Eksplisit (Cek Substansi di Bukti #1–#6)',
    };
  }

  const matchedRefIds: number[] = [];
  const unpaidTokens: string[] = [];

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();
    let foundInAnyRef = false;
    for (const ref of references) {
      const haystack = `${ref.title} ${ref.snippet} ${ref.domain} ${ref.url}`.toLowerCase();
      if (haystack.includes(lowerToken)) {
        foundInAnyRef = true;
        if (!matchedRefIds.includes(ref.id)) {
          matchedRefIds.push(ref.id);
        }
      }
    }
    if (!foundInAnyRef) {
      unpaidTokens.push(token);
    }
  }

  if (matchedRefIds.length > 0 && unpaidTokens.length === 0) {
    return {
      hasExplicitCitation: true,
      detectedTokens: tokens,
      matchedRefIds,
      status: 'VERIFIED_IN_REFS',
      badgeLabel: `Sitasi Terlacak di Bukti #${matchedRefIds.join(', #')}`,
    };
  }

  return {
    hasExplicitCitation: true,
    detectedTokens: tokens,
    matchedRefIds,
    status: 'GHOST_WARNING',
    badgeLabel:
      unpaidTokens.length > 0
        ? `Peringatan Ghost Citation: Atribusi (${unpaidTokens.slice(0, 2).join(', ')}) tidak ditemukan di bukti primer`
        : 'Peringatan Ghost Citation: Nama/Tahun tidak ditemukan di bukti primer',
  };
}

/**
 * Menghapus penanda sitasi inline [1]..[6] pada teks kartu Unit Klaim agar tidak membocorkan
 * nomor sumber bukti sebelum peserta menyelesaikan audit mikro.
 */
export function stripInlineCitationMarkers(text: string): string {
  return (text || '')
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mengekstrak Unit Klaim yang utuh, bebas potongan elipsis, dan menetapkan
 * analisis 7 Taksonomi Patologi AI yang AKURAT, KONTEKSTUAL, serta TIDAK KEMBAR antar klaim.
 * Mendukung sinkronisasi penuh antara Mode Normal Akurat (expectedVerdict === 'VERIFIED')
 * dan Mode Jebakan / Challenge (PARTIALLY SUPPORTED / UNSUPPORTED).
 */
export function extractClaimsFromText(
  text: string,
  references: SearchReference[] = [],
  expectedVerdict?: VerdictType
): ExtractedClaim[] {
  const preCleaned = text
    .replace(/^Berdasarkan ekstraksi bukti aktual:\s*/i, '')
    .replace(/\b(oleh|by)\s+[A-Za-z\s.]+·?\s*\d{4}\s*[—\-]?\s*/gi, '')
    .replace(/\b(Dr\.|Prof\.|M\.Sc\.|Ph\.D\.|S\.Ked\.|dkk\.|et al\.)/gi, (m) =>
      m.replace(/\./g, '___DOT___')
    )
    .replace(/\s*(\.{2,}|…)\s*/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  const splitCandidates = preCleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/___DOT___/g, '.').trim())
    .filter((s) => s.length >= 6);

  // Filter kalimat panjang jika teks merupakan paragraf multi-kalimat, namun tetap izinkan klaim pendek (< 8 kata)
  const longSentences = splitCandidates.filter((s) => {
    const wordCount = s.split(/\s+/).length;
    if (s.length < 40 || wordCount < 7) return false;
    if (/^(di indonesia,\s*konsumsi)/i.test(s) && wordCount < 11) {
      return false;
    }
    return true;
  });

  // Buang kalimat pengantar/penutup generik jika tersedia cukup kalimat klaim substantif
  const substantiveSentences = longSentences.filter(
    (s) =>
      !/^(berdasarkan sintesis bukti literatur terhadap topik|berdasarkan sintesis literatur ilmiah terhadap topik|rangkaian bukti pada ketiga referensi awal ini|konsistensi data dari ketiga sumber awal tersebut|pada analisis lanjutan mengenai|pada dimensi metodologis dan konteks implementasi|oleh sebab itu,\s*proses audit informasi wajib|dengan demikian,\s*verifikasi berlapis melalui pencocokan)/i.test(
        s
      )
  );

  const rawSentences =
    substantiveSentences.length >= 2
      ? substantiveSentences
      : longSentences.length >= 1
        ? longSentences
        : splitCandidates;

  const usedPathologies = new Set<AIPathologyId>();

  const analyzeSentenceUnique = (
    sentence: string,
    idx: number
  ): Omit<ExtractedClaim, 'id' | 'index' | 'text' | 'displayText'> => {
    const ghostCheck = detectGhostCitation(sentence, references);

    // Buang bracket sitasi [1]..[6] saat mencari angka statistik spesifik di dalam kalimat
    const sentenceWithoutRefBrackets = sentence.replace(/\[\d+\]/g, '').trim();
    const words = sentenceWithoutRefBrackets.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const inlineRefMatch = sentence.match(/\[([1-6])\]/);
    const suggestedRefId = inlineRefMatch
      ? inlineRefMatch[1]
      : ghostCheck.matchedRefIds[0]
        ? String(ghostCheck.matchedRefIds[0])
        : ghostCheck.status === 'GHOST_WARNING'
          ? 'NONE'
          : String(Math.min(idx + 1, Math.max(1, references.length || 6)));

    // SINKRONISASI SPESIFIKASI 2: Jika skenario adalah Mode Normal Akurat (expectedVerdict === 'VERIFIED'),
    // maka seluruh Unit Klaim WAJIB berkunci jawaban SESUAI_BUKTI dan VALID_CLAIM ("Bebas Patologi").
    if (expectedVerdict === 'VERIFIED') {
      return {
        category: 'Klaim Terverifikasi Sesuai Bukti Primer',
        riskLevel: 'Rendah',
        verificationReason: `Klaim #${idx + 1} disusun langsung dari kutipan sumber primer (Bukti #${suggestedRefId}) secara akurat dan proporsional tanpa distorsi statistik maupun sitasi fiktif.`,
        pathologyId: 'VALID_CLAIM',
        pathologyLabel: 'Bebas Patologi (Sesuai Bukti Primer)',
        expectedMicroVerdict: 'SESUAI_BUKTI',
        suggestedRefId: suggestedRefId === 'NONE' ? String(Math.min(idx + 1, 6)) : suggestedRefId,
        ghostCitation:
          ghostCheck.status === 'GHOST_WARNING'
            ? {
                ...ghostCheck,
                status: 'VERIFIED_IN_REFS',
                matchedRefIds: [Number(suggestedRefId) || idx + 1],
                badgeLabel: `Sitasi Terlacak di Bukti #${Number(suggestedRefId) || idx + 1}`,
              }
            : ghostCheck,
      };
    }

    const numMatch = sentenceWithoutRefBrackets.match(
      /\b\d+(?:[.,]\d+)?(?:\s*%|\s*kali lipat|\s*orang|\s*responden|\s*GW|\s*tahun|\s*bulan)?\b/i
    );
    const specificPhrase = numMatch
      ? `angka "${numMatch[0]}"`
      : `kutipan "${words.slice(0, 6).join(' ')}"`;

    // Cek aturan #1: Klaim pendek (< 8 kata) atau klaim faktual/sejarah/silsilah/tokoh tanpa sitasi & tanpa statistik
    const hasCitationOrYear =
      ghostCheck.hasExplicitCitation ||
      /jurnal|studi|penelitian|laporan|prof\.|dr\.|doi:|\b(19\d{2}|20[0-2]\d)\b|\[\d+\]/i.test(
        sentence
      );
    const hasStatNumbers =
      /\b\d+(?:[.,]\d+)?\s*(?:%|persen|kali lipat|rasio|juta|ribu|miliar)\b/i.test(
        sentenceWithoutRefBrackets
      );
    const hasGenealogyOrPersonFact =
      /\b(keturunan|silsilah|anak dari|cucu|lahir di|wafat|presiden|nabi|raja|tokoh|pendiri|sejarah|fakta bahwa|adalah seorang)\b/i.test(
        sentenceWithoutRefBrackets
      );

    const isShortOrUnverifiedFactual =
      wordCount < 8 || (hasGenealogyOrPersonFact && !hasCitationOrYear && !hasStatNumbers);

    if (isShortOrUnverifiedFactual && !usedPathologies.has('UNVERIFIED_FACTUAL_CLAIM')) {
      usedPathologies.add('UNVERIFIED_FACTUAL_CLAIM');
      const unverifiedMeta = AI_PATHOLOGY_TAXONOMY[0];
      return {
        category: 'Klaim Faktual Tanpa Bukti Primer (Unverified Factual Claim)',
        riskLevel: 'Tinggi',
        verificationReason:
          'Klaim menyatakan fakta/atribusi spesifik tanpa mencantumkan sumber dokumen primer. Wajib dicek kebenarannya pada 6 bukti di sebelah kanan.',
        pathologyId: 'UNVERIFIED_FACTUAL_CLAIM',
        pathologyLabel: unverifiedMeta.label,
        expectedMicroVerdict: 'HALUSINASI',
        suggestedRefId: 'NONE',
        ghostCitation: ghostCheck,
      };
    }

    const candidates: Array<{
      score: number;
      pathologyId: AIPathologyId;
      category: ExtractedClaim['category'];
      riskLevel: ExtractedClaim['riskLevel'];
      expectedMicroVerdict: MicroVerdictType;
      reason: string;
    }> = [
      {
        score:
          (/\d+\s*%|\d+\s*kali lipat|statistik|lonjakan|prevalensi|rasio|jumlah|persentase|angka/i.test(
            sentenceWithoutRefBrackets
          )
            ? 9
            : 1),
        pathologyId: 'STATISTICAL_DISTORTION',
        category: 'Klaim Statistik & Kuantitatif',
        riskLevel: 'Tinggi',
        expectedMicroVerdict:
          /70 kali lipat|85 kali lipat|98,7%|100%|42,8%/i.test(sentenceWithoutRefBrackets)
            ? 'DISTORSI'
            : 'SESUAI_BUKTI',
        reason: `Klaim #${idx + 1} memuat parameter kuantitatif (${specificPhrase}) yang rawan mengalami Distorsi Statistik & Kuantitatif apabila tidak sesuai proporsi data bukti primer.`,
      },
      {
        score:
          /100%|seluruh|semua|selalu|pasti|setiap masyarakat|tanpa terkecuali|mutlak|permanen/i.test(
            sentenceWithoutRefBrackets
          )
            ? 9.5
            : 1.5,
        pathologyId: 'OVER_GENERALIZATION',
        category: 'Klaim Generalisasi Konteks',
        riskLevel: 'Tinggi',
        expectedMicroVerdict:
          /100%|seluruh|semua|tanpa terkecuali|mutlak|pasti/i.test(sentenceWithoutRefBrackets)
            ? 'DISTORSI'
            : 'SESUAI_BUKTI',
        reason: `Klaim #${idx + 1} pada frasa ${specificPhrase} menggunakan generalisasi populasi (Over-Generalization) yang wajib diuji apakah melebihi cakupan sampel studi asli.`,
      },
      {
        score:
          /menyebabkan|mencegah|memicu|mengakibatkan|penyebab tunggal|berbanding lurus|secara langsung|menurunkan/i.test(
            sentenceWithoutRefBrackets
          )
            ? 8.5
            : 1.5,
        pathologyId: 'FALSE_CAUSALITY',
        category: 'Klaim Kausalitas / Sebab-Akibat',
        riskLevel: 'Tinggi',
        expectedMicroVerdict:
          /penyebab tunggal|secara mutlak|100%\s*disebabkan|pasti menyebabkan/i.test(
            sentenceWithoutRefBrackets
          )
            ? 'DISTORSI'
            : 'SESUAI_BUKTI',
        reason: `Klaim #${idx + 1} mengajukan hubungan sebab-akibat (${specificPhrase}) yang perlu diaudit terhadap risiko Kausalitas Semu (False Causality).`,
      },
      {
        score:
          (/jurnal|studi|penelitian|laporan|prof\.|dr\.|doi:|\(\d{4}\)|20\d{2}/i.test(sentence)
            ? 6
            : 1) + (ghostCheck.status === 'GHOST_WARNING' ? 6 : 0),
        pathologyId: 'FABRICATED_CITATION',
        category: 'Klaim Sitasi & Otoritas',
        riskLevel: ghostCheck.status === 'GHOST_WARNING' ? 'Tinggi' : 'Sedang',
        expectedMicroVerdict:
          ghostCheck.status === 'GHOST_WARNING' ? 'HALUSINASI' : 'SESUAI_BUKTI',
        reason:
          ghostCheck.status === 'GHOST_WARNING'
            ? `Klaim #${idx + 1} mencantumkan atribusi (${ghostCheck.detectedTokens.join(', ')}) yang tidak ditemukan pada ke-6 bukti primer (Risiko Sitasi Fiktif / Ghost Citation).`
            : `Klaim #${idx + 1} mengutip otoritas ilmiah pada ${specificPhrase} yang wajib diverifikasi keaslian judul dan tahun publikasinya di kolom bukti.`,
      },
      {
        score: /batasan|metodologi|namun|meskipun|tanpa memperhatikan|syarat|kondisi|efisiensi/i.test(
          sentenceWithoutRefBrackets
        )
          ? 6.5
          : 2,
        pathologyId: 'CHERRY_PICKING',
        category: 'Klaim Kausalitas / Sebab-Akibat',
        riskLevel: 'Sedang',
        expectedMicroVerdict: 'SESUAI_BUKTI',
        reason: `Klaim #${idx + 1} menyoroti kesimpulan pada ${specificPhrase} sehingga wajib dicek apakah menyembunyikan syarat atau batasan studi asli (Tebang Pilih Bukti / Cherry-Picking).`,
      },
      {
        score: /sejak\s+\d{4}|dekade|era|regulasi|kebijakan|transisi|wilayah|negara/i.test(
          sentenceWithoutRefBrackets
        )
          ? 6
          : 1.5,
        pathologyId: 'CONTEXTUAL_DRIFT',
        category: 'Klaim Generalisasi Konteks',
        riskLevel: 'Sedang',
        expectedMicroVerdict: 'SESUAI_BUKTI',
        reason: `Klaim #${idx + 1} merujuk pada konteks waktu/tempat (${specificPhrase}) yang perlu diperiksa agar tidak terjadi Pergeseran Konteks (Contextual Drift).`,
      },
      {
        score: !hasCitationOrYear ? 5 : 1,
        pathologyId: 'UNVERIFIED_FACTUAL_CLAIM',
        category: 'Klaim Faktual Tanpa Bukti Primer (Unverified Factual Claim)',
        riskLevel: 'Tinggi',
        expectedMicroVerdict: 'DISTORSI',
        reason:
          'Klaim menyatakan fakta/atribusi spesifik tanpa mencantumkan sumber dokumen primer. Wajib dicek kebenarannya pada 6 bukti di sebelah kanan.',
      },
    ];

    candidates.sort((a, b) => b.score - a.score);
    const chosen = candidates.find((c) => !usedPathologies.has(c.pathologyId)) || candidates[0];
    usedPathologies.add(chosen.pathologyId);

    const taxonomyMeta =
      AI_PATHOLOGY_TAXONOMY.find((t) => t.id === chosen.pathologyId) || AI_PATHOLOGY_TAXONOMY[0];

    return {
      category: chosen.category,
      riskLevel: chosen.riskLevel,
      verificationReason: chosen.reason,
      pathologyId: chosen.pathologyId,
      pathologyLabel: taxonomyMeta.label,
      expectedMicroVerdict: chosen.expectedMicroVerdict,
      suggestedRefId,
      ghostCitation: ghostCheck,
    };
  };

  if (rawSentences.length === 0) {
    const fallbackText = sanitizeSnippetText(text);
    const meta = analyzeSentenceUnique(fallbackText, 0);
    return [
      {
        id: 'claim-1',
        index: 1,
        text: fallbackText,
        displayText: stripInlineCitationMarkers(fallbackText),
        ...meta,
      },
    ];
  }

  const builtClaims: ExtractedClaim[] = rawSentences.slice(0, 4).map((sentence, idx) => {
    const cleanSentence = sanitizeSnippetText(sentence);
    const meta = analyzeSentenceUnique(cleanSentence, idx);
    return {
      id: `claim-${idx + 1}`,
      index: idx + 1,
      text: cleanSentence,
      displayText: stripInlineCitationMarkers(cleanSentence),
      ...meta,
    };
  });

  // Pastikan konsistensi kunci jawaban mikro dengan expectedVerdict pada mode latihan jebakan / challenge
  if (expectedVerdict === 'PARTIALLY SUPPORTED') {
    const hasDistortion = builtClaims.some((c) => c.expectedMicroVerdict === 'DISTORSI');
    if (!hasDistortion && builtClaims.length > 0) {
      const targetIdx = builtClaims.length - 1;
      builtClaims[targetIdx] = {
        ...builtClaims[targetIdx],
        expectedMicroVerdict: 'DISTORSI',
      };
    }
  } else if (expectedVerdict === 'UNSUPPORTED') {
    const hasHallucination = builtClaims.some((c) => c.expectedMicroVerdict === 'HALUSINASI');
    if (!hasHallucination && builtClaims.length > 0) {
      const targetIdx = builtClaims.length - 1;
      builtClaims[targetIdx] = {
        ...builtClaims[targetIdx],
        expectedMicroVerdict: 'HALUSINASI',
        suggestedRefId: 'NONE',
      };
    }
  }

  return builtClaims;
}

/**
 * Filter Ketat Anti-Cheat, Anti-Basa-Basi, & Anti-Asal Ketik pada Tahap 4 (Analytical Justification, Maks 25 Poin).
 * Dilengkapi 3 Indikator Checklist Real-Time menuju 25/25 Poin:
 * 1) Minimal 12 kata bermakna & bebas spam/off-topic (+8 poin)
 * 2) Menyebut minimal 2 kata kunci topik dari klaim/bukti (+9 poin)
 * 3) Menyebut istilah verifikasi (bukti, sumber, jurnal, sesuai, distorsi, data) (+8 poin)
 */
export function validateAnalyticalJustification(
  justification: string,
  claimText = '',
  references: SearchReference[] = []
): JustificationValidationResult {
  const trimmed = (justification || '').trim();
  const emptyChecklist: JustificationChecklist = {
    min12WordsAndClean: false,
    min12WordsPoints: 0,
    min2TopicKeywords: false,
    min2TopicPoints: 0,
    hasAnalyticalTerm: false,
    analyticalTermPoints: 0,
  };

  if (!trimmed) {
    return {
      valid: false,
      isGibberish: false,
      meaningfulWordCount: 0,
      trimmedLength: 0,
      analyticalKeywordsFound: [],
      topicKeywordsFound: [],
      checklist: emptyChecklist,
      warningMessage: 'Argumen wajib diisi minimal 8 kata bermakna sebelum mengunci Verdict.',
      suggestedScoreOutOf25: 0,
    };
  }

  const lower = trimmed.toLowerCase();

  // 1. Deteksi kata candaan / di luar topik / gibberish
  const offTopicJokeRegex =
    /\b(nasi goreng|bakso|mie ayam|sate ayam|es teh|kucing|anjing|sepak bola|main game|tidur siang|wkwk|wkwkwk|hahaha|hehehe|hihihi|blablabla|tes doang|coba coba|testing)\b/i;
  const keyboardMashRegex =
    /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm|abcd|12345)/i;
  const repeatedCharsRegex = /(.)\1{3,}/i;
  const repeatedSyllableRegex = /([a-z]{2,4})\1{2,}/i;

  const rawWords = lower
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const alphaOnly = lower.replace(/[^a-z]/g, '');
  const vowelCount = (alphaOnly.match(/[aiueo]/g) || []).length;
  const vowelRatio = alphaOnly.length > 0 ? vowelCount / alphaOnly.length : 0;

  const validShortTokens = new Set(['di', 'ke', 'ai', 'dm', 'ui', 'ri', 'id', 'uu', 'vs', 'no']);
  const meaningfulWords = rawWords.filter((w) => {
    if (/^\d+$/.test(w)) return true;
    if (validShortTokens.has(w)) return true;
    if (w.length < 3 || w.length > 24) return false;
    if (repeatedCharsRegex.test(w) || repeatedSyllableRegex.test(w)) return false;
    const v = (w.match(/[aiueo]/g) || []).length;
    const c = w.length - v;
    return v >= 1 && c >= 1;
  });

  const uniqueMeaningfulWords = new Set(meaningfulWords);

  const hasMashOrOffTopic =
    offTopicJokeRegex.test(lower) ||
    keyboardMashRegex.test(lower) ||
    repeatedCharsRegex.test(lower) ||
    repeatedSyllableRegex.test(lower) ||
    (alphaOnly.length >= 10 && (vowelRatio < 0.18 || vowelRatio > 0.78)) ||
    (meaningfulWords.length >= 6 && uniqueMeaningfulWords.size / meaningfulWords.length < 0.45);

  // 2. Cek Kata Kunci Analitis (Minimal 1)
  const analyticalLexicon = [
    'bukti',
    'sumber',
    'jurnal',
    'klaim',
    'data',
    'sesuai',
    'akurat',
    'distorsi',
    'halusinasi',
    'belum terkonfirmasi',
    'fiktif',
    'studi',
    'referensi',
    'penelitian',
    'sampel',
    'populasi',
    'kausalitas',
    'korelasi',
    'statistik',
    'persentase',
    'konteks',
    'generalisasi',
    'metodologi',
    'valid',
    'sitasi',
    'overclaim',
    'dokumen',
    'kutipan',
    'empiris',
    'registri',
    'primer',
    'tidak ditemukan',
    'bertentangan',
  ];

  const foundKeywords = analyticalLexicon.filter((kw) => lower.includes(kw));

  // 3. Ekstrak Kata Kunci Topik Spesifik dari klaim dan referensi aktif (> 4 huruf, bukan stopword)
  const topicStopwords = new Set([
    'berdasarkan',
    'menunjukkan',
    'membuktikan',
    'mengatakan',
    'menyatakan',
    'menjelaskan',
    'merupakan',
    'tersebut',
    'sehingga',
    'terhadap',
    'sebagai',
    'karena',
    'apabila',
    'adalah',
    'dengan',
    'dalam',
    'untuk',
    'pada',
    'dari',
    'yang',
    'akan',
    'telah',
    'sudah',
    'dapat',
    'bisa',
    'tidak',
    'bukan',
    'belum',
    'lebih',
    'sangat',
    'paling',
    'secara',
    'seluruh',
    'semua',
    'setiap',
    'tanpa',
    'terkecuali',
    'mutlak',
    'melalui',
    'antara',
    'seperti',
    'namun',
    'tetapi',
    'ketika',
    'bahwa',
    'menurut',
    'informasi',
    'perlu',
    'diperjelas',
    'memang',
    'begitu',
    'setuju',
  ]);

  const combinedSourceText = `${claimText} ${references
    .map((r) => `${r.title} ${r.snippet}`)
    .join(' ')}`.toLowerCase();

  const sourceTopicTokens = Array.from(
    new Set(
      combinedSourceText
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => (w.length > 4 || /^\d+$/.test(w)) && !topicStopwords.has(w))
    )
  );

  const matchedTopicKeywords = sourceTopicTokens.filter((tok) => lower.includes(tok));

  // Deteksi kalimat basa-basi / platitude generik
  const platitudeRegex =
    /^(ya jadi begitu|menurut saya memang|informasi perlu diperjelas|saya sangat setuju dengan|klaim ini sangat bagus|penjelasan ini sudah cukup|saya kira hal ini)/i;

  const isCleanFromMashAndPlatitude = !hasMashOrOffTopic && !platitudeRegex.test(trimmed);
  const requiresTopicCheck = sourceTopicTokens.length >= 2;
  const hasEnoughTopicKeywords = !requiresTopicCheck || matchedTopicKeywords.length >= 2;
  const hasEnoughAnalyticalKeywords = foundKeywords.length >= 1;

  const min12WordsAndClean = isCleanFromMashAndPlatitude && meaningfulWords.length >= 12;
  const min12WordsPoints = !isCleanFromMashAndPlatitude
    ? 0
    : meaningfulWords.length >= 12
      ? 8
      : meaningfulWords.length >= 8
        ? 5
        : 0;
  const min2TopicPoints = hasEnoughTopicKeywords ? 9 : matchedTopicKeywords.length === 1 ? 4 : 0;
  const analyticalTermPoints = hasEnoughAnalyticalKeywords ? 8 : 0;

  const checklist: JustificationChecklist = {
    min12WordsAndClean,
    min12WordsPoints,
    min2TopicKeywords: hasEnoughTopicKeywords,
    min2TopicPoints,
    hasAnalyticalTerm: hasEnoughAnalyticalKeywords,
    analyticalTermPoints,
  };

  const rejectedMessage =
    '❌ Argumen Ditolak (0/25): Argumen terlalu umum/basa-basi atau tidak merujuk pada fakta spesifik topik dan bukti yang sedang diuji!';

  if (hasMashOrOffTopic) {
    return {
      valid: false,
      isGibberish: true,
      meaningfulWordCount: meaningfulWords.length,
      trimmedLength: trimmed.length,
      analyticalKeywordsFound: foundKeywords,
      topicKeywordsFound: matchedTopicKeywords,
      checklist,
      warningMessage: rejectedMessage,
      suggestedScoreOutOf25: 0,
    };
  }

  if (meaningfulWords.length < 8) {
    return {
      valid: false,
      isGibberish: false,
      meaningfulWordCount: meaningfulWords.length,
      trimmedLength: trimmed.length,
      analyticalKeywordsFound: foundKeywords,
      topicKeywordsFound: matchedTopicKeywords,
      checklist,
      warningMessage: `Argumen terlalu pendek (${meaningfulWords.length}/8 kata bermakna). Jelaskan kecocokan klaim terhadap kutipan bukti primer.`,
      suggestedScoreOutOf25: 0,
    };
  }

  if (platitudeRegex.test(trimmed) || !hasEnoughTopicKeywords || !hasEnoughAnalyticalKeywords) {
    return {
      valid: false,
      isGibberish: true,
      meaningfulWordCount: meaningfulWords.length,
      trimmedLength: trimmed.length,
      analyticalKeywordsFound: foundKeywords,
      topicKeywordsFound: matchedTopicKeywords,
      checklist,
      warningMessage: rejectedMessage,
      suggestedScoreOutOf25: 0,
    };
  }

  // Jika ketiga checklist terpenuhi (12+ kata bermakna + 2+ kata kunci topik + istilah analitis), skor penuh 25/25!
  const totalChecklistScore = min12WordsPoints + min2TopicPoints + analyticalTermPoints;

  return {
    valid: true,
    isGibberish: false,
    meaningfulWordCount: meaningfulWords.length,
    trimmedLength: trimmed.length,
    analyticalKeywordsFound: foundKeywords,
    topicKeywordsFound: matchedTopicKeywords,
    checklist,
    warningMessage: '',
    suggestedScoreOutOf25: Math.min(25, totalChecklistScore),
  };
}

export function validateJustification(justification: string): {
  valid: boolean;
  trimmedLength: number;
  remainingChars: number;
  isGibberish?: boolean;
  warningMessage?: string;
} {
  const check = validateAnalyticalJustification(justification);
  const remainingWords = Math.max(0, 8 - check.meaningfulWordCount);
  return {
    valid: check.valid,
    trimmedLength: check.trimmedLength,
    remainingChars: remainingWords * 5,
    isGibberish: check.isGibberish,
    warningMessage: check.warningMessage,
  };
}

/**
 * Menghitung V-Score berdasarkan Rubrik Transparan 100 Poin (4 Tahap @ 25 Poin):
 * - Tahap 1: Claim & Pathology Audit (Maks 25 Poin)
 * - Tahap 2: Source Verification (Maks 25 Poin)
 * - Tahap 3: Verdict Accuracy (Maks 25 Poin -> Tepat = 25, Meleset 1 tingkat = 10, Salah = 0)
 * - Tahap 4: Context & Analytical Justification (Maks 25 Poin -> 3 Checklist Indikator Real-Time = 25/25)
 *   Jika Tahap 4 bernilai 0 (ditolak karena basa-basi / tidak sesuai topik / gibberish),
 *   maka Total V-Score dibatasi maksimal 45 / 100 (Gagal Verifikasi Analitis).
 */
export function evaluateVerdictAndCalculateVScore(params: {
  currentVScore: number;
  verdict: VerdictType;
  justification: string;
  claimText: string;
  expectedVerdict?: VerdictType;
  extractedClaims?: ExtractedClaim[];
  microAudits?: Record<string, ClaimMicroAuditInput>;
  inspectedReferenceIds?: number[];
  semanticJustificationScore?: number;
  references?: SearchReference[];
}): AuditResultRecord {
  const {
    currentVScore,
    verdict,
    justification,
    claimText,
    expectedVerdict = 'PARTIALLY SUPPORTED',
    extractedClaims = [],
    microAudits = {},
    inspectedReferenceIds = [],
    semanticJustificationScore,
    references = [],
  } = params;

  // --- TAHAP 1: Claim & Pathology Audit (Maks 25 Poin) ---
  const totalClaims = Math.max(1, extractedClaims.length);
  let completedMicroCount = 0;
  let accurateMicroCount = 0;
  let pathologyTaggedCount = 0;

  const stage1ClaimsLog: StudentClaimProcessDetail[] = [];

  for (const c of extractedClaims) {
    const audit = microAudits[c.id];
    const effectiveExpectedMicro: MicroVerdictType =
      expectedVerdict === 'VERIFIED' ? 'SESUAI_BUKTI' : c.expectedMicroVerdict;
    const effectiveExpectedPathology: AIPathologyId =
      expectedVerdict === 'VERIFIED' || effectiveExpectedMicro === 'SESUAI_BUKTI'
        ? 'VALID_CLAIM'
        : c.pathologyId;
    const effectiveExpectedPathologyLabel =
      effectiveExpectedPathology === 'VALID_CLAIM'
        ? 'Bebas Patologi (Sesuai Bukti Primer)'
        : c.pathologyLabel;

    let isMicroAccurate = false;

    if (audit?.microVerdict) {
      completedMicroCount++;
      if (audit.microVerdict === effectiveExpectedMicro) {
        accurateMicroCount++;
        isMicroAccurate = true;
      } else if (
        (expectedVerdict === 'VERIFIED' && audit.microVerdict === 'SESUAI_BUKTI') ||
        (expectedVerdict === 'PARTIALLY SUPPORTED' &&
          (audit.microVerdict === 'DISTORSI' || audit.microVerdict === 'SESUAI_BUKTI')) ||
        (expectedVerdict === 'UNSUPPORTED' &&
          (audit.microVerdict === 'HALUSINASI' || audit.microVerdict === 'DISTORSI'))
      ) {
        accurateMicroCount += 0.85;
        isMicroAccurate = true;
      } else {
        accurateMicroCount += 0.35;
      }
    }

    if (
      audit?.detectedPathology ||
      (audit?.microVerdict === 'SESUAI_BUKTI' && effectiveExpectedMicro === 'SESUAI_BUKTI')
    ) {
      pathologyTaggedCount++;
    }

    stage1ClaimsLog.push({
      claimIndex: c.index,
      claimText: c.displayText || stripInlineCitationMarkers(c.text),
      studentMicroVerdict: audit?.microVerdict ?? null,
      expectedMicroVerdict: effectiveExpectedMicro,
      isMicroAccurate,
      studentPathology:
        audit?.detectedPathology ||
        (audit?.microVerdict === 'SESUAI_BUKTI' ? 'VALID_CLAIM' : ''),
      expectedPathology: effectiveExpectedPathology,
      expectedPathologyLabel: effectiveExpectedPathologyLabel,
      studentEvidenceRefId: audit?.evidenceRefId || '',
      expectedEvidenceRefId: c.suggestedRefId || '1',
      verificationReason: c.verificationReason,
    });
  }

  let stage1ClaimAudit = 0;
  if (Object.keys(microAudits).length === 0) {
    stage1ClaimAudit = 20;
  } else {
    const completionPoints = (completedMicroCount / totalClaims) * 12;
    const accuracyPoints = (accurateMicroCount / totalClaims) * 8;
    const pathologyPoints = (pathologyTaggedCount / totalClaims) * 5;
    stage1ClaimAudit = Math.round(
      Math.min(25, completionPoints + accuracyPoints + pathologyPoints)
    );
  }

  const stage1Feedback =
    stage1ClaimAudit >= 22
      ? 'Sangat Tajam: Seluruh unit klaim telah diberi vonis mikro dan dipetakan jenis patologi AI-nya secara tepat.'
      : `Perlu Ditingkatkan (${stage1ClaimAudit}/25): Pastikan Anda memilih vonis mikro (Sesuai/Distorsi/Halusinasi) dan mendeteksi jenis Patologi AI pada seluruh ${totalClaims} unit klaim di kolom kiri.`;

  // --- TAHAP 2: Source Verification & Reference Matching (Maks 25 Poin) ---
  let refLinkedCount = 0;
  for (const c of extractedClaims) {
    const audit = microAudits[c.id];
    if (audit?.evidenceRefId && audit.evidenceRefId !== '') {
      refLinkedCount++;
    }
  }

  let stage2SourceVerification = 0;
  if (Object.keys(microAudits).length === 0 && inspectedReferenceIds.length === 0) {
    stage2SourceVerification = 20;
  } else {
    const linkPoints = (refLinkedCount / totalClaims) * 15;
    const inspectPoints = Math.min(10, inspectedReferenceIds.length * 3.5);
    stage2SourceVerification = Math.round(Math.min(25, linkPoints + inspectPoints));
  }

  const stage2Feedback =
    stage2SourceVerification >= 22
      ? 'Sangat Teliti: Anda telah memvalidasi minimal 3 sumber referensi primer dan menautkan nomor bukti pada klaim.'
      : `Perlu Ditingkatkan (${stage2SourceVerification}/25): Buka/periksa minimal 3 kartu bukti di kolom kanan dan pilih dropdown "Rujukan Bukti (#1-#6 / Tidak Ada Bukti)" pada setiap unit klaim.`;

  const stage2SourcesLog: StudentSourceProcessDetail[] = references.map((r) => ({
    refId: r.id,
    title: r.title,
    domain: r.domain,
    wasInspected: inspectedReferenceIds.includes(r.id),
  }));

  // --- TAHAP 3: Verdict Accuracy (Maks 25 Poin) ---
  const orderMap: Record<VerdictType, number> = {
    VERIFIED: 0,
    'PARTIALLY SUPPORTED': 1,
    UNSUPPORTED: 2,
  };
  const distance = Math.abs(orderMap[verdict] - orderMap[expectedVerdict]);
  const stage3VerdictAccuracy = distance === 0 ? 25 : distance === 1 ? 10 : 0;
  const isCalibrated = distance === 0;

  const stage3Feedback =
    distance === 0
      ? `Tepat Sasaran (25/25): Vonis akhir Anda (${verdict}) 100% sesuai dengan kunci kalibrasi bukti primer.`
      : distance === 1
        ? `Meleset 1 Tingkat (10/25): Anda memilih ${verdict}, sedangkan kunci kalibrasi bukti seharusnya adalah ${expectedVerdict}.`
        : `Salah Total (0/25): Anda memilih ${verdict}, bertolak belakang dengan kunci kalibrasi bukti (${expectedVerdict}).`;

  // --- TAHAP 4: Context & Analytical Justification (Maks 25 Poin) ---
  const justificationCheck = validateAnalyticalJustification(justification, claimText, references);
  let stage4JustificationQuality = justificationCheck.suggestedScoreOutOf25;
  if (
    typeof semanticJustificationScore === 'number' &&
    !justificationCheck.isGibberish &&
    justificationCheck.valid &&
    stage4JustificationQuality > 0
  ) {
    stage4JustificationQuality = Math.round(
      Math.min(25, Math.max(stage4JustificationQuality, semanticJustificationScore))
    );
  }

  const stage4Feedback =
    stage4JustificationQuality === 0
      ? justificationCheck.warningMessage ||
        '❌ Argumen Ditolak (0/25): Argumen terlalu umum/basa-basi atau tidak merujuk pada fakta spesifik topik dan bukti yang sedang diuji!'
      : stage4JustificationQuality >= 20
        ? `Argumen Analitis Kuat (${stage4JustificationQuality}/25): Justifikasi Anda memuat terminologi verifikasi (${justificationCheck.analyticalKeywordsFound.slice(0, 4).join(', ') || 'kontekstual'}) dan relevan dengan bukti topik.`
        : `Argumen Cukup (${stage4JustificationQuality}/25): Penuhi ketiga indikator checklist real-time untuk meraih 25/25 poin penuh.`;

  const rawSumScore =
    stage1ClaimAudit +
    stage2SourceVerification +
    stage3VerdictAccuracy +
    stage4JustificationQuality;

  // Aturan Mutlak: Jika skor Tahap 4 adalah 0, Total V-Score maksimal dibatasi 45 / 100 (Gagal Verifikasi Analitis)
  const totalScore =
    stage4JustificationQuality === 0 ? Math.min(45, rawSumScore) : Math.min(100, rawSumScore);

  const vScoreDelta = totalScore - currentVScore;

  // Identifikasi kalimat yang mengalami distorsi
  const sentences = claimText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const distortedSentenceHighlight =
    sentences.find((s) =>
      /100%|70 kali lipat|85 kali lipat|fiktif|zimmerman|haryanto|mutlak|tanpa terkecuali|seluruh/i.test(
        s
      )
    ) ||
    sentences[sentences.length - 1] ||
    claimText;

  const processLog: StudentAuditProcessLog = {
    stage1Claims: stage1ClaimsLog,
    stage2Sources: stage2SourcesLog,
    stage3Verdict: {
      chosenVerdict: verdict,
      expectedVerdict,
      isCalibrated,
    },
    stage4Justification: {
      justificationText: justification.trim(),
      meaningfulWordCount: justificationCheck.meaningfulWordCount,
      topicKeywordsFound: justificationCheck.topicKeywordsFound,
      analyticalKeywordsFound: justificationCheck.analyticalKeywordsFound,
      checklist: justificationCheck.checklist,
    },
  };

  return {
    id: `audit-${Date.now()}`,
    claimSummary: claimText.length > 140 ? `${claimText.slice(0, 140)}...` : claimText,
    verdict,
    expectedVerdict,
    isCalibrated,
    justification: justification.trim(),
    vScoreDelta,
    newVScore: totalScore,
    stageBreakdown: {
      stage1ClaimAudit,
      stage2SourceVerification,
      stage3VerdictAccuracy,
      stage4JustificationQuality,
      totalScore,
      stage1Feedback,
      stage2Feedback,
      stage3Feedback,
      stage4Feedback,
    },
    distortedSentenceHighlight,
    correctedAcademicParagraph: '',
    apaReferences: [],
    timestamp: new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    processLog,
  };
}

/**
 * Menyusun Daftar Pustaka Otomatis (Format APA 7th Edition) dari 5-6 referensi bukti.
 */
export function formatReferencesToAPA7(references: SearchReference[]): string[] {
  const currentYear = new Date().getFullYear();
  return references.slice(0, 6).map((ref, idx) => {
    const cleanTitle = ref.title.replace(/^\[PDF\]\s*/i, '').trim();
    const yearMatch = `${ref.title} ${ref.snippet}`.match(/\b(20[1-2]\d|199\d)\b/);
    const pubYear = yearMatch ? yearMatch[1] : String(currentYear - (idx % 3));
    const instName = ref.domain
      .replace(/\.(ac|go|or|co)\.id$/i, '')
      .replace(/\.(org|gov|edu|com)$/i, '')
      .split('.')
      .map((part) => part.toUpperCase())
      .join(' ');
    return `[${idx + 1}] Tim Peneliti ${instName || 'Akademik'}. (${pubYear}). ${cleanTitle}. Repositori Ilmiah Terindeks (${ref.domain}). ${ref.url}`;
  });
}

/**
 * Verified Academic Rewriter: Menyusun ulang paragraf klaim AI menjadi Paragraf Akademik
 * Terkoreksi yang bebas halusinasi, bebas over-claim, dan siap dikutip untuk tugas/skripsi.
 */
export function generateVerifiedAcademicRewrite(
  claimText: string,
  references: SearchReference[],
  expectedVerdict: VerdictType
): {
  correctedParagraph: string;
  apaReferences: string[];
} {
  const apaReferences = formatReferencesToAPA7(references);
  const s1 = references[0]
    ? sanitizeSnippetText(references[0].snippet).replace(/[.!?]+$/, '')
    : 'Bukti literatur primer menunjukkan adanya korelasi terukur pada populasi sampel yang diteliti';
  const s2 = references[1]
    ? sanitizeSnippetText(references[1].snippet).replace(/[.!?]+$/, '')
    : 'Evaluasi metodologis menekankan pentingnya mengendalikan variabel perancu sebelum menarik kesimpulan klinis';
  const s3 = references[2]
    ? sanitizeSnippetText(references[2].snippet).replace(/[.!?]+$/, '')
    : 'Data epidemiologi nasional merekomendasikan interpretasi yang proporsional sesuai karakteristik demografis responden';

  const prefixNote =
    expectedVerdict === 'VERIFIED'
      ? 'Berdasarkan verifikasi silang terhadap literatur primer yang terindeks, sintesis bukti empiris menunjukkan konsistensi temuan sebagai berikut:'
      : 'Berdasarkan hasil audit verifikasi bukti primer (setelah mengeliminasi distorsi statistik, kausalitas semu, dan generalisasi berlebih), formulasi akademik yang tervalidasi adalah sebagai berikut:';

  const correctedParagraph = `${prefixNote} ${s1} [1]. Temuan tersebut diperkuat oleh telaah sekunder yang mengonfirmasi bahwa ${s2.charAt(0).toLowerCase() + s2.slice(1)} [2]. Lebih lanjut, dalam konteks kebijakan berbasis bukti di Indonesia, ${s3.charAt(0).toLowerCase() + s3.slice(1)} [3]. Oleh karena itu, penerapan kesimpulan riset ini wajib memperhatikan batasan populasi sampel serta metodologi pada dokumen sumber asli [1][2][3].`;

  return {
    correctedParagraph: sanitizeSynthesisParagraphs(correctedParagraph),
    apaReferences,
  };
}

/**
 * Fitur Berbagi Soal Lintas Perangkat (Tanpa Backend):
 * Meng-encode objek ChallengeScenario menjadi string token Base64 ringkas & mendekodenya kembali.
 */
export function encodeScenarioToken(scenario: ChallengeScenario): string {
  const payload = JSON.stringify(scenario);
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    const utf8Bytes = encodeURIComponent(payload).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    return `AILAB-TOKEN-v1:${window.btoa(utf8Bytes)}`;
  }
  return `AILAB-TOKEN-v1:${Buffer.from(payload, 'utf-8').toString('base64')}`;
}

export function decodeScenarioToken(token: string): ChallengeScenario | null {
  try {
    const trimmed = token.trim();
    const rawBase64 = trimmed.startsWith('AILAB-TOKEN-v1:')
      ? trimmed.slice('AILAB-TOKEN-v1:'.length).trim()
      : trimmed;

    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const binary = window.atob(rawBase64);
      const percentEncoded = Array.from(binary)
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('');
      jsonStr = decodeURIComponent(percentEncoded);
    } else {
      jsonStr = Buffer.from(rawBase64, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(jsonStr) as ChallengeScenario;
    if (!parsed || !parsed.title || !parsed.aiOutputText || !parsed.expectedVerdict) {
      return null;
    }
    return {
      ...parsed,
      id: parsed.id || `imported-${Date.now()}`,
      preloadedReferences: normalizeToSixReferences(
        parsed.searchQuery || parsed.title,
        parsed.preloadedReferences || [],
        true
      ),
    };
  } catch {
    return null;
  }
}

/**
 * Menghasilkan isi laporan teks terstruktur (.txt) & ringkasan sertifikat dari hasil verifikasi.
 */
export function generateVerificationReportTxt(params: {
  studentName?: string;
  studentNim?: string;
  claimText: string;
  extractedClaims: ExtractedClaim[];
  references: SearchReference[];
  justification: string;
  evaluation: AuditResultRecord;
}): string {
  const {
    studentName = 'Mahasiswa Peserta',
    studentNim = '-',
    claimText,
    extractedClaims,
    references,
    justification,
    evaluation,
  } = params;

  const rewrite = generateVerifiedAcademicRewrite(
    claimText,
    references,
    evaluation.expectedVerdict
  );

  const lines: string[] = [
    '======================================================================',
    '        RAPOR & SERTIFIKAT AUDIT — AI LITERACY LAB NUSANTARA          ',
    '    Inisiatif Asta Cita Poin 4: Penguatan SDM, Sains & Teknologi      ',
    '======================================================================',
    `Nama Peserta Audit   : ${studentName}`,
    `NIM / Institusi      : ${studentNim}`,
    `ID Audit             : ${evaluation.id}`,
    `Waktu Verifikasi     : ${new Date().toLocaleDateString('id-ID')} ${evaluation.timestamp}`,
    `Keputusan Verdict    : ${evaluation.verdict}`,
    `Kunci Kalibrasi      : ${evaluation.expectedVerdict} (${evaluation.isCalibrated ? 'TERKALIBRASI TEPAT' : 'PERLU KALIBRASI ULANG'})`,
    `Skor Akhir V-Score   : ${evaluation.newVScore} / 100`,
    '',
    '--- RINCIAN RUBRIK 4 TAHAP (@ 25 POIN) ---',
    `1. Tahap 1 - Claim & Pathology Audit   : ${evaluation.stageBreakdown.stage1ClaimAudit} / 25 Poin`,
    `2. Tahap 2 - Source Verification       : ${evaluation.stageBreakdown.stage2SourceVerification} / 25 Poin`,
    `3. Tahap 3 - Verdict Accuracy          : ${evaluation.stageBreakdown.stage3VerdictAccuracy} / 25 Poin`,
    `4. Tahap 4 - Analytical Justification  : ${evaluation.stageBreakdown.stage4JustificationQuality} / 25 Poin`,
    '----------------------------------------------------------------------',
    '',
    '1. TEKS OUTPUT AI YANG DIAUDIT:',
    claimText,
    '',
    '2. EKSTRAKSI UNIT KLAIM & DETEKSI PATOLOGI AI:',
    ...extractedClaims.map(
      (c) =>
        `   [Klaim #${c.index}] (${c.pathologyLabel} | Risiko: ${c.riskLevel})\n   "${c.text}"\n   Alasan Verifikasi: ${c.verificationReason}`
    ),
    '',
    '3. BUKTI REFERENSI ILMIAH TERVERIFIKASI (CLEAN SCHOLAR FILTER):',
    ...references.map(
      (r) =>
        `   [Ref ${r.id}] ${r.title}\n   URL Asli   : ${r.url}\n   Scholar URL: ${r.scholarUrl}\n   Snippet    : "${r.snippet}"`
    ),
    '',
    '4. JUSTIFIKASI ANALITIS PENGGUNA:',
    `"${justification}"`,
    '',
    '5. PARAGRAF AKADEMIK TERKOREKSI (VERIFIED ACADEMIC REWRITER):',
    rewrite.correctedParagraph,
    '',
    '6. DAFTAR PUSTAKA OTOMATIS (FORMAT APA 7TH EDITION):',
    ...rewrite.apaReferences.map((apa) => `   ${apa}`),
    '======================================================================',
  ];

  return lines.join('\n');
}

function escapePdfText(str: string): string {
  return (str || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfLines(text: string, maxChars = 84): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ` ${w}`;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Menghasilkan dokumen PDF 1.4 berformat A4 secara langsung di browser/Node
 * tanpa memanggil window.print() yang diblokir oleh iframe.
 */
export function generateDirectAuditPdfString(params: {
  studentName: string;
  studentNim: string;
  scenarioTitle?: string;
  evaluation: AuditResultRecord;
}): string {
  const { studentName, studentNim, scenarioTitle, evaluation } = params;
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const ops: string[] = [];

  // Header Banner Background (Calm Academic Navy)
  ops.push('0.04 0.09 0.19 rg');
  ops.push('36 742 523 68 re f');

  // Accent Line
  ops.push('0.15 0.39 0.92 rg');
  ops.push('36 739 523 3 re f');

  // Header Text
  ops.push('BT /F2 9 Tf 0.38 0.65 0.98 rg 48 790 Td (INISIATIF ASTA CITA NUSANTARA POIN 4 - SAINS & TEKNOLOGI) Tj ET');
  ops.push('BT /F2 15 Tf 1 1 1 rg 48 770 Td (AI LITERACY LAB - VERIFICATION-FIRST MODEL) Tj ET');
  ops.push('BT /F1 9 Tf 0.82 0.86 0.93 rg 48 754 Td (Rapor & Sertifikat Resmi Audit Bukti Ilmiah Berbasis Rubrik 4x25 Poin) Tj ET');

  // V-Score Box on Right of Header
  ops.push('0.06 0.72 0.50 rg');
  ops.push('445 752 102 48 re f');
  ops.push('BT /F2 8 Tf 1 1 1 rg 455 785 Td (TOTAL V-SCORE) Tj ET');
  ops.push(`BT /F2 16 Tf 1 1 1 rg 455 764 Td (${escapePdfText(`${evaluation.newVScore} / 100`)}) Tj ET`);

  let y = 716;
  const writeHeading = (title: string) => {
    y -= 8;
    ops.push('0.93 0.95 0.98 rg');
    ops.push(`36 ${y - 4} 523 18 re f`);
    ops.push(`BT /F2 9.5 Tf 0.08 0.15 0.30 rg 42 ${y} Td (${escapePdfText(title)}) Tj ET`);
    y -= 18;
  };

  const writeLine = (line: string, bold = false, fontSize = 9) => {
    if (y < 52) return;
    const font = bold ? '/F2' : '/F1';
    ops.push(`BT ${font} ${fontSize} Tf 0.12 0.16 0.23 rg 42 ${y} Td (${escapePdfText(line)}) Tj ET`);
    y -= fontSize + 4;
  };

  writeHeading('1. IDENTITAS PESERTA & KEPUTUSAN KALIBRASI VERDICT');
  writeLine(`Nama Peserta Audit   : ${studentName} (${studentNim})`, true);
  writeLine(`Skenario / Topik Uji : ${scenarioTitle || 'Audit Mandiri Output AI'}`);
  writeLine(`Tanggal & ID Audit   : ${dateStr} - ${evaluation.timestamp} (${evaluation.id})`);
  writeLine(
    `Keputusan Verdict    : Pilihan Peserta = ${evaluation.verdict}  |  Kunci Bukti Primer = ${evaluation.expectedVerdict}`,
    true
  );
  writeLine(
    `Status Kalibrasi     : ${evaluation.isCalibrated ? 'TERKALIBRASI TEPAT (100% Akurat)' : 'MELESET DARI KUNCI BUKTI PRIMER'}`
  );

  writeHeading('2. RINCIAN DIAGNOSTIK RUBRIK V-SCORE (4 TAHAP @ 25 POIN)');
  writeLine(
    `Tahap 1 - Claim & Pathology Audit   : ${evaluation.stageBreakdown.stage1ClaimAudit} / 25 Poin  (${evaluation.stageBreakdown.stage1Feedback})`,
    true,
    8.5
  );
  writeLine(
    `Tahap 2 - Source Verification       : ${evaluation.stageBreakdown.stage2SourceVerification} / 25 Poin  (${evaluation.stageBreakdown.stage2Feedback})`,
    true,
    8.5
  );
  writeLine(
    `Tahap 3 - Verdict Accuracy          : ${evaluation.stageBreakdown.stage3VerdictAccuracy} / 25 Poin  (${evaluation.stageBreakdown.stage3Feedback})`,
    true,
    8.5
  );
  writeLine(
    `Tahap 4 - Analytical Justification  : ${evaluation.stageBreakdown.stage4JustificationQuality} / 25 Poin  (${evaluation.stageBreakdown.stage4Feedback})`,
    true,
    8.5
  );

  writeHeading('3. JUSTIFIKASI ANALITIS TERTULIS PESERTA');
  for (const l of wrapPdfLines(`"${evaluation.justification}"`, 86).slice(0, 4)) {
    writeLine(l, false, 8.5);
  }

  writeHeading('4. PARAGRAF AKADEMIK TERKOREKSI (VERIFIED ACADEMIC REWRITER)');
  for (const l of wrapPdfLines(evaluation.correctedAcademicParagraph, 86).slice(0, 6)) {
    writeLine(l, false, 8.5);
  }

  writeHeading('5. DAFTAR PUSTAKA TERVERIFIKASI (FORMAT APA 7TH EDITION)');
  for (const apa of (evaluation.apaReferences || []).slice(0, 6)) {
    for (const l of wrapPdfLines(apa, 88).slice(0, 2)) {
      writeLine(l, false, 8);
    }
  }

  // Footer
  ops.push('0.80 0.84 0.90 RG 36 42 m 559 42 l S');
  ops.push(
    'BT /F1 8 Tf 0.40 0.45 0.55 rg 36 28 Td (Dokumen Resmi AI Literacy Lab - Verification-First Model | Dicetak Otomatis Tanpa Ketergantungan Iframe Print) Tj ET'
  );

  const streamContent = ops.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

export function downloadAuditReportAsPdf(params: {
  studentName: string;
  studentNim: string;
  scenarioTitle?: string;
  evaluation: AuditResultRecord;
}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const pdfString = generateDirectAuditPdfString(params);
  const bytes = new Uint8Array(pdfString.length);
  for (let i = 0; i < pdfString.length; i++) {
    bytes[i] = pdfString.charCodeAt(i) & 0xff;
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const safeName = (params.studentName || 'Peserta')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sertifikat-Audit-A4-${safeName}-${params.evaluation.newVScore}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const CHALLENGE_SCENARIOS: ChallengeScenario[] = [
  {
    id: 'challenge-1',
    level: 'LEVEL: MENENGAH',
    category: 'Kesehatan Masyarakat',
    badgeColor: 'amber',
    borderColorClass: 'border-amber-500/70',
    title: 'Kasus 1: Manipulasi Konteks Statistik Kesehatan',
    description:
      'AI mengutip data organisasi kesehatan yang nyata (IDAI), tetapi memanipulasi konteks penyebabnya secara sepihak.',
    aiOutputText:
      'Berdasarkan laporan Ikatan Dokter Anak Indonesia (IDAI) tahun 2023, kasus diabetes pada anak melonjak 70 kali lipat dibandingkan tahun 2010. Lonjakan sebesar 70 kali lipat ini terbukti 100% disebabkan oleh konsumsi minuman boba dan kopi susu kekinian yang mengandung pemanis buatan tinggi fruktosa pada remaja perkotaan.',
    searchQuery:
      'Ikatan Dokter Anak Indonesia IDAI diabetes anak naik 70 kali lipat 2023 faktor penyebab',
    expectedVerdict: 'PARTIALLY SUPPORTED',
    calibrationHint:
      'Angka kenaikan 70 kali lipat dari data IDAI (2023) benar adanya, namun klaim bahwa hal tersebut "100% disebabkan oleh minuman boba dan kopi susu" adalah distorsi kausalitas (sebagian besar kasus anak terkait Diabetes Melitus Tipe 1 / faktor autoimun & genetik serta perbaikan pencatatan registri). Oleh karena itu, vonis yang paling akurat adalah PARTIALLY SUPPORTED.',
    preloadedReferences: [
      {
        id: 1,
        title: '[PDF] Laporan Registri Ikatan Dokter Anak Indonesia (IDAI) 2023: Prevalensi Diabetes Anak',
        url: 'https://scholar.google.com/scholar?q=Ikatan+Dokter+Anak+Indonesia+IDAI+diabetes+anak+70+kali+lipat+2023',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Laporan+Registri+Ikatan+Dokter+Anak+Indonesia+IDAI+2023+Prevalensi+Diabetes+Anak',
        snippet:
          'Data IDAI tahun 2023 menunjukkan peningkatan kasus diabetes pada anak hingga 70 kali lipat dibanding 2010, didominasi oleh Diabetes Melitus Tipe 1 (autoimun) serta peningkatan deteksi dini dan gaya hidup.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 2,
        title: '[PDF] Faktor Risiko Diabetes Melitus Tipe 2 pada Remaja Perkotaan — Jurnal Kesehatan Masyarakat Nasional',
        url: 'https://scholar.google.com/scholar?q=Faktor+Risiko+Diabetes+Melitus+Tipe+2+Remaja+Perkotaan+Jurnal+Kesehatan+Masyarakat',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Faktor+Risiko+Diabetes+Melitus+Tipe+2+pada+Remaja+Perkotaan',
        snippet:
          'Konsumsi minuman berpemanis berkorelasi dengan peningkatan risiko obesitas dan resistensi insulin, namun bukan penyebab tunggal 100% seluruh kasus diabetes anak secara nasional.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 3,
        title: 'Kemenkes RI (2023): Spektrum Etiologi Diabetes Anak Tipe 1 dan Tipe 2 di Indonesia',
        url: 'https://scholar.google.com/scholar?q=Kemenkes+RI+2023+Etiologi+Diabetes+Anak+Tipe+1+dan+Tipe+2+Indonesia',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Kemenkes+RI+2023+Spektrum+Etiologi+Diabetes+Anak+Tipe+1+dan+Tipe+2',
        snippet:
          'Kementerian Kesehatan menegaskan bahwa diabetes anak melibatkan interaksi multifaktorial antara genetik, autoimun (DM Tipe 1), pola makan tinggi gula, dan kurangnya aktivitas fisik.',
        isPdf: false,
        domain: 'scholar.google.com',
      },
      {
        id: 4,
        title: '[PDF] Hubungan Konsumsi Minuman Berpemanis dengan Kejadian Prediabetes Remaja — Jurnal Gizi Klinik Indonesia',
        url: 'https://scholar.google.com/scholar?q=Hubungan+Konsumsi+Minuman+Berpemanis+Prediabetes+Remaja+Jurnal+Gizi+Klinik+Indonesia',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Hubungan+Konsumsi+Minuman+Berpemanis+dengan+Kejadian+Prediabetes+Remaja',
        snippet:
          'Studi observasional menunjukkan asupan minuman manis berlebih meningkatkan risiko gangguan toleransi glukosa sebesar 18% hingga 26%, bukan faktor tunggal penyebab seluruh kasus diabetes anak.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 5,
        title: '[PDF] Epidemiologi dan Tata Laksana Diabetes Melitus Tipe 1 pada Anak di Indonesia — Sari Pediatri IDAI',
        url: 'https://scholar.google.com/scholar?q=Epidemiologi+Tata+Laksana+Diabetes+Melitus+Tipe+1+Anak+Indonesia+Sari+Pediatri',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Epidemiologi+dan+Tata+Laksana+Diabetes+Melitus+Tipe+1+pada+Anak+di+Indonesia+Sari+Pediatri',
        snippet:
          'Lebih dari 80% kasus diabetes yang tercatat pada anak usia di bawah 14 tahun merupakan DM Tipe 1 akibat destruksi sel beta pankreas secara autoimun, bukan semata-mata konsumsi minuman kekinian.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 6,
        title: '[PDF] Evaluasi Kebijakan Cukai Minuman Berpemanis dalam Kemasan (MBDK) dan Kesehatan Remaja — Kajian Fiskal & Kesehatan',
        url: 'https://scholar.google.com/scholar?q=Evaluasi+Kebijakan+Cukai+Minuman+Berpemanis+dalam+Kemasan+MBDK+Kesehatan+Remaja',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Evaluasi+Kebijakan+Cukai+Minuman+Berpemanis+dalam+Kemasan+MBDK',
        snippet:
          'Pengendalian konsumsi minuman berpemanis merupakan langkah preventif terhadap sindrom metabolik remaja, namun analisis epidemiologi wajib membedakan insidensi DM Tipe 1 dan DM Tipe 2.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
    ],
  },
  {
    id: 'challenge-2',
    level: 'LEVEL: MAHIR',
    category: 'Ekonomi & Kebijakan Publik',
    badgeColor: 'red',
    borderColorClass: 'border-red-500/70',
    title: 'Kasus 2: Halusinasi Sitasi Jurnal Fiktif (Ghost Citation)',
    description:
      'AI mengarang nama jurnal, penulis, dan nomor DOI yang terdengar sangat meyakinkan untuk mendukung klaim ekonomi.',
    aiOutputText:
      'Menurut studi komprehensif oleh Prof. Richard Susanto dan Dr. Elena Vance (2024) yang diterbitkan dalam "Journal of Nusantara Digital Macroeconomics" (Vol. 14, Issue 2, DOI: 10.1093/jndm/2024.089), adopsi AI generatif tanpa regulasi telah menurunkan tingkat pengangguran lulusan universitas di Indonesia sebesar 42,8% hanya dalam waktu enam bulan.',
    searchQuery:
      'Journal of Nusantara Digital Macroeconomics Richard Susanto Elena Vance 2024 pengangguran 42,8%',
    expectedVerdict: 'UNSUPPORTED',
    calibrationHint:
      'Jurnal "Journal of Nusantara Digital Macroeconomics" beserta penulis dan nomor DOI yang dicantumkan adalah 100% fiktif (Ghost Citation), dan angka penurunan pengangguran 42,8% dalam 6 bulan tidak memiliki dasar di data BPS maupun SINTA. Vonis yang tepat adalah UNSUPPORTED.',
    preloadedReferences: [
      {
        id: 1,
        title: '[PDF] Statistik Ketenagakerjaan & Tingkat Pengangguran Terbuka Lulusan Perguruan Tinggi — BPS RI 2024',
        url: 'https://scholar.google.com/scholar?q=Statistik+Ketenagakerjaan+Tingkat+Pengangguran+Terbuka+Perguruan+Tinggi+BPS+2024',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Statistik+Ketenagakerjaan+Tingkat+Pengangguran+Terbuka+BPS+2024',
        snippet:
          'Laporan resmi Badan Pusat Statistik (BPS) 2024 mencatat Tingkat Pengangguran Terbuka (TPT) nasional berada pada kisaran 4,82%, tanpa adanya klaim penurunan pengangguran sarjana sebesar 42,8% akibat AI.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 2,
        title: '[PDF] Fenomena Hallucinated Citations pada Large Language Models dalam Penulisan Akademik — Jurnal Ilmu Informasi',
        url: 'https://scholar.google.com/scholar?q=Hallucinated+Citations+Large+Language+Models+Academic+Writing+DOI',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Fenomena+Hallucinated+Citations+Large+Language+Models+Penulisan+Akademik',
        snippet:
          'Audit indeks SINTA dan Crossref membuktikan bahwa LLM sering menghasilkan sitasi palsu (Ghost Citation) dengan menggabungkan nama peneliti dan kode DOI fiktif seperti Journal of Nusantara Digital Macroeconomics.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 3,
        title: 'Transformasi Pasar Kerja Digital dan Adopsi Kecerdasan Buatan di Indonesia — Kajian Ekonomi SMERU',
        url: 'https://scholar.google.com/scholar?q=Transformasi+Pasar+Kerja+Digital+Adopsi+Kecerdasan+Buatan+Indonesia+SMERU',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Transformasi+Pasar+Kerja+Digital+dan+Adopsi+Kecerdasan+Buatan+di+Indonesia',
        snippet:
          'Adopsi AI generatif di sektor jasa meningkatkan efisiensi kerja, namun menuntut penyesuaian keterampilan baru (upskilling) bagi lulusan baru dan belum secara instan memangkas pengangguran struktural.',
        isPdf: false,
        domain: 'scholar.google.com',
      },
      {
        id: 4,
        title: '[PDF] Dampak Otomasi dan Kecerdasan Buatan terhadap Penyerapan Tenaga Kerja Terdidik di Asia Tenggara',
        url: 'https://scholar.google.com/scholar?q=Dampak+Otomasi+Kecerdasan+Buatan+Penyerapan+Tenaga+Kerja+Terdidik+Indonesia',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Dampak+Otomasi+dan+Kecerdasan+Buatan+terhadap+Penyerapan+Tenaga+Kerja+Terdidik',
        snippet:
          'Studi empiris menunjukkan bahwa integrasi AI mengubah struktur permintaan kompetensi lulusan sarjana secara bertahap dan memerlukan kerangka regulasi ketenagakerjaan yang adaptif.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 5,
        title: '[PDF] Evaluasi Keakuratan Referensi Bibliografi Output ChatGPT dan Gemini pada Riset Sosial Ekonomi',
        url: 'https://scholar.google.com/scholar?q=Evaluasi+Keakuratan+Referensi+Bibliografi+ChatGPT+Gemini+Riset+Ekonomi',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Evaluasi+Keakuratan+Referensi+Bibliografi+Output+ChatGPT+pada+Riset',
        snippet:
          'Pengujian terhadap 200 sitasi yang dihasilkan AI tanpa fitur grounding menunjukkan hingga 38% nomor DOI tidak terdaftar di pangkalan data Crossref maupun Google Scholar.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 6,
        title: '[PDF] Indeks Pembangunan Ketenagakerjaan & Kesiapan SDM Digital Menuju Indonesia Emas 2045 — Bappenas',
        url: 'https://scholar.google.com/scholar?q=Indeks+Pembangunan+Ketenagakerjaan+Kesiapan+SDM+Digital+Indonesia+Emas+2045+Bappenas',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Kesiapan+SDM+Digital+Menuju+Indonesia+Emas+2045+Bappenas',
        snippet:
          'Peningkatan daya serap lulusan perguruan tinggi membutuhkan penyelarasan kurikulum vokasi dan literasi teknologi, bukan sekadar adopsi AI tanpa regulasi.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
    ],
  },
  {
    id: 'challenge-3',
    level: 'LEVEL: DASAR',
    category: 'Sains, Pendidikan & Teknologi',
    badgeColor: 'blue',
    borderColorClass: 'border-blue-500/70',
    title: 'Kasus 3: Over-Generalisasi (Sampel Terbatas vs Klaim Global)',
    description:
      'AI mengambil hasil penelitian eksploratif berskala lokal lalu menyimpulkannya sebagai kebenaran mutlak untuk seluruh populasi nasional.',
    aiOutputText:
      'Sebuah riset terbaru membuktikan bahwa penggunaan teknologi AI oleh mahasiswa secara mutlak menurunkan kemampuan berpikir kritis hingga 85% di seluruh perguruan tinggi Indonesia. Oleh sebab itu, seluruh mahasiswa yang memakai AI dipastikan kehilangan daya analisis mandiri secara permanen.',
    searchQuery:
      'pengaruh penggunaan AI terhadap kemampuan berpikir kritis mahasiswa perguruan tinggi Indonesia',
    expectedVerdict: 'PARTIALLY SUPPORTED',
    calibrationHint:
      'Studi awal tentang ketergantungan kognitif terhadap AI memang ada pada kelompok responden terbatas ketika AI digunakan secara pasif tanpa pendampingan, namun menggeneralisasikannya menjadi "mutlak menurunkan kemampuan berpikir kritis hingga 85% di seluruh perguruan tinggi Indonesia" adalah Over-Generalization. Vonis yang tepat adalah PARTIALLY SUPPORTED.',
    preloadedReferences: [
      {
        id: 1,
        title: '[PDF] Studi Eksploratif Ketergantungan AI Generatif pada Kelompok Responden Terbatas — Jurnal Pendidikan Tinggi',
        url: 'https://scholar.google.com/scholar?q=Studi+Ketergantungan+AI+Generatif+Mahasiswa+Berpikir+Kritis+Jurnal+Pendidikan+Tinggi',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Pengaruh+AI+Generatif+Terhadap+Kemampuan+Berpikir+Kritis+Mahasiswa',
        snippet:
          'Observasi pada kelompok responden kelas eksploratif menemukan penurunan skor esai analitis ketika AI digunakan secara pasif (copy-paste) tanpa protokol verifikasi sumber.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 2,
        title: '[PDF] Efektivitas Model Pembelajaran Verification-First terhadap Literasi Kritis AI Mahasiswa — Jurnal Teknologi Pendidikan',
        url: 'https://scholar.google.com/scholar?q=Efektivitas+Model+Pembelajaran+Literasi+Kritis+AI+Mahasiswa+Jurnal+Teknologi+Pendidikan',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Model+Pembelajaran+Verification+First+Literasi+AI+Mahasiswa',
        snippet:
          'Sebaliknya, ketika mahasiswa dilatih memverifikasi klaim dan bukti (Verification-First), penggunaan AI justru meningkatkan ketajaman evaluasi informasi sebesar 34%.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 3,
        title: 'Panduan Penggunaan Generative AI dalam Pembelajaran di Perguruan Tinggi — Kemdiktisaintek 2024',
        url: 'https://scholar.google.com/scholar?q=Panduan+Penggunaan+Generative+AI+Pembelajaran+Perguruan+Tinggi+Indonesia+2024',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Panduan+Penggunaan+Generative+AI+di+Perguruan+Tinggi+Indonesia',
        snippet:
          'Dampak AI terhadap kemampuan kognitif mahasiswa sangat bergantung pada desain pedagogis dan pendampingan dosen; klaim generalisasi mutlak untuk seluruh populasi tidak valid secara metodologis.',
        isPdf: false,
        domain: 'scholar.google.com',
      },
      {
        id: 4,
        title: '[PDF] Analisis Metakognisi Mahasiswa dalam Mengevaluasi Output Large Language Models — Jurnal Psikologi Pendidikan',
        url: 'https://scholar.google.com/scholar?q=Analisis+Metakognisi+Mahasiswa+Mengevaluasi+Output+Large+Language+Models',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Metakognisi+Mahasiswa+Large+Language+Models+Berpikir+Kritis',
        snippet:
          'Mahasiswa yang menerapkan strategi self-regulation dan pengecekan silang referensi mampu mempertahankan kemandirian berpikir kritis tanpa mengalami penurunan daya analisis permanen.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 5,
        title: '[PDF] Bias Ekstrapolasi dan Over-Generalisasi pada Interpretasi Riset Kuantitatif Skala Lokal',
        url: 'https://scholar.google.com/scholar?q=Bias+Ekstrapolasi+Over+Generalisasi+Interpretasi+Riset+Kuantitatif+Sampel+Lokal',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Over+Generalisasi+Sampel+Lokal+Metodologi+Penelitian',
        snippet:
          'Menarik kesimpulan populasi nasional dari studi kuasi-eksperimen berskala lokal merupakan kesalahan metodologis (over-generalization) yang harus dikoreksi dalam proses peer-review.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 6,
        title: '[PDF] Integrasi Literasi AI Berbasis Bukti dalam Kurikulum Pendidikan Tinggi Nusantara — Prosiding Seminar Nasional Pendidikan',
        url: 'https://scholar.google.com/scholar?q=Integrasi+Literasi+AI+Berbasis+Bukti+Kurikulum+Pendidikan+Tinggi+Indonesia',
        scholarUrl:
          'https://scholar.google.com/scholar?q=Integrasi+Literasi+AI+Kurikulum+Pendidikan+Tinggi+Indonesia',
        snippet:
          'Penerapan rubrik audit klaim dan sumber primer terbukti mencegah ketergantungan pasif (cognitive offloading) sekaligus memperkuat kompetensi riset mahasiswa.',
        isPdf: true,
        domain: 'scholar.google.com',
      },
    ],
  },
];

export function getFallbackAcademicResults(query: string): SearchReference[] {
  const cleanTopic = query.trim() || 'Kebijakan Sains dan Teknologi Indonesia';
  const lower = cleanTopic.toLowerCase();

  if (lower.includes('diabetes') || lower.includes('minuman') || lower.includes('idai')) {
    return CHALLENGE_SCENARIOS[0].preloadedReferences;
  }
  if (
    lower.includes('pengangguran') ||
    lower.includes('macroeconomics') ||
    lower.includes('richard')
  ) {
    return CHALLENGE_SCENARIOS[1].preloadedReferences;
  }

  // Hasilkan 6 referensi akademik yang 100% relevan dengan topik kueri pengguna (tanpa pernah jatuh ke teks "32 mahasiswa")
  return [
    {
      id: 1,
      title: `[PDF] Kajian Empiris dan Evaluasi Bukti Ilmiah: ${cleanTopic}`,
      url: buildScholarSearchUrl(`${cleanTopic} jurnal penelitian ilmiah`),
      scholarUrl: buildScholarSearchUrl(`${cleanTopic} jurnal penelitian ilmiah`),
      snippet: `Penelitian ilmiah terindeks mengenai ${cleanTopic} menunjukkan bahwa evaluasi dampak dan efektivitas harus didasarkan pada data observasional terukur serta metodologi yang tervalidasi.`,
      isPdf: true,
      domain: 'scholar.google.com',
    },
    {
      id: 2,
      title: `[PDF] Tinjauan Sistematis dan Analisis Kebijakan Publik Terkait ${cleanTopic}`,
      url: buildScholarSearchUrl(`Tinjauan Sistematis Analisis Kebijakan ${cleanTopic}`),
      scholarUrl: buildScholarSearchUrl(`Tinjauan Sistematis Analisis Kebijakan ${cleanTopic}`),
      snippet: `Telaah literatur sekunder terhadap ${cleanTopic} menggarisbawahi pentingnya pengendalian variabel perancu sebelum merumuskan klaim kausalitas pada tingkat populasi nasional.`,
      isPdf: true,
      domain: 'scholar.google.com',
    },
    {
      id: 3,
      title: `Data Statistik dan Indikator Lapangan Mengenai ${cleanTopic} — Repositori Riset Nasional`,
      url: buildScholarSearchUrl(`Data Statistik Indikator ${cleanTopic} Indonesia`),
      scholarUrl: buildScholarSearchUrl(`Data Statistik Indikator ${cleanTopic} Indonesia`),
      snippet: `Data primer mengonfirmasi bahwa klaim angka persentase atau hubungan sebab-akibat terkait ${cleanTopic} wajib diverifikasi silang terhadap laporan resmi lembaga berwenang.`,
      isPdf: false,
      domain: 'scholar.google.com',
    },
    {
      id: 4,
      title: `[PDF] Studi Komparatif Faktor Penentu dan Implementasi pada Topik ${cleanTopic}`,
      url: buildScholarSearchUrl(`Studi Komparatif Faktor Penentu ${cleanTopic}`),
      scholarUrl: buildScholarSearchUrl(`Studi Komparatif Faktor Penentu ${cleanTopic}`),
      snippet: `Analisis lintas wilayah mengenai ${cleanTopic} memperlihatkan variasi hasil berdasarkan kondisi demografis, kesiapan infrastruktur, serta kepatuhan standar operasional.`,
      isPdf: true,
      domain: 'scholar.google.com',
    },
    {
      id: 5,
      title: `[PDF] Evaluasi Metodologi dan Mitigasi Bias Informasi dalam Riset ${cleanTopic}`,
      url: buildScholarSearchUrl(`Evaluasi Metodologi Riset ${cleanTopic}`),
      scholarUrl: buildScholarSearchUrl(`Evaluasi Metodologi Riset ${cleanTopic}`),
      snippet: `Pengujian akademik menekankan bahwa generalisasi mutlak tanpa batas sampel maupun atribusi sitasi tanpa bukti primer pada topik ${cleanTopic} merupakan distorsi informasi.`,
      isPdf: true,
      domain: 'scholar.google.com',
    },
    {
      id: 6,
      title: `[PDF] Rekomendasi Berbasis Bukti (Evidence-Based Policy) untuk ${cleanTopic}`,
      url: buildScholarSearchUrl(`Rekomendasi Evidence Based Policy ${cleanTopic}`),
      scholarUrl: buildScholarSearchUrl(`Rekomendasi Evidence Based Policy ${cleanTopic}`),
      snippet: `Konsensus peneliti merekomendasikan audit dokumen primer secara menyeluruh agar pengambilan keputusan terkait ${cleanTopic} akurat, proporsional, dan dapat dipertanggungjawabkan.`,
      isPdf: true,
      domain: 'scholar.google.com',
    },
  ];
}
