import {
  SearchReference,
  ChallengeScenario,
  VerdictType,
  buildSearchQuery,
  buildScholarSearchUrl,
  filterCleanSearchResults,
  getFallbackAcademicResults,
  synthesizeAcademicAnswerWithGemini,
  injectControlledHallucinationInText,
  sanitizeSnippetText,
  sanitizeSynthesisParagraphs,
  validateAnalyticalJustification,
} from './verificationLogic';

export interface LiveSearchResponse {
  queryUsed: string;
  synthesizedAnswer: string;
  references: SearchReference[];
  usedFallback: boolean;
}

/**
 * Menjalankan pencarian live melalui Serper.dev (mengambil 6 referensi bersih)
 * lalu memanggil synthesizeAcademicAnswerWithGemini (gemini-2.5-flash) untuk menyintesis
 * rangkuman akademik multi-paragraf utuh dengan sitasi inline [1]-[6] tanpa elipsis.
 */
export async function performCleanLiveSearch(
  rawQuery: string,
  academicFilter: boolean
): Promise<LiveSearchResponse> {
  const queryUsed = buildSearchQuery(rawQuery, academicFilter);
  let cleanedRefs: SearchReference[] = [];
  let usedFallback = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/api/serper/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: queryUsed,
        gl: 'id',
        hl: 'id',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const organic = Array.isArray(data?.organic) ? data.organic : [];
      cleanedRefs = filterCleanSearchResults(organic, academicFilter);
      if (data?.fallback) {
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }
  } catch {
    usedFallback = true;
  }

  const synthesisResult = await synthesizeAcademicAnswerWithGemini(
    rawQuery,
    cleanedRefs,
    academicFilter
  );

  return {
    queryUsed,
    synthesizedAnswer: synthesisResult.synthesizedAnswer,
    references: synthesisResult.references,
    usedFallback: usedFallback || cleanedRefs.length === 0,
  };
}

/**
 * Mode Injeksi Halusinasi Terkontrol saat mengirim hasil sintesis dari Tanya AI ke Uji Output AI.
 */
export async function generateControlledHallucinationMode(
  cleanSynthesis: string,
  query: string,
  references: SearchReference[],
  targetVerdict: 'PARTIALLY SUPPORTED' | 'UNSUPPORTED' = 'PARTIALLY SUPPORTED'
): Promise<{
  manipulatedText: string;
  expectedVerdict: VerdictType;
  calibrationHint: string;
}> {
  const localInjected = injectControlledHallucinationInText(
    cleanSynthesis,
    query,
    references,
    targetVerdict
  );

  return {
    manipulatedText: localInjected.manipulatedText,
    expectedVerdict: localInjected.expectedVerdict,
    calibrationHint: localInjected.calibrationHint,
  };
}

/**
 * Evaluasi semantik argumen mahasiswa (Tahap 4 V-Score) menggunakan filter ketat Anti-Basa-Basi & Anti-Off-Topic.
 */
export async function gradeAnalyticalJustificationWithAI(params: {
  justification: string;
  claimText: string;
  expectedVerdict: VerdictType;
  chosenVerdict: VerdictType;
  references?: SearchReference[];
}): Promise<{
  scoreOutOf25: number;
  feedback: string;
  isGibberish: boolean;
}> {
  const localCheck = validateAnalyticalJustification(
    params.justification,
    params.claimText,
    params.references || []
  );
  return {
    scoreOutOf25: localCheck.suggestedScoreOutOf25,
    feedback: localCheck.warningMessage || '',
    isGibberish: localCheck.isGibberish,
  };
}

/**
 * Auto-Generate Soal Halusinasi AI (Scenario Builder) untuk Portal Mentor.
 */
export async function generateScenarioWithAI(
  topic: string,
  level: 'LEVEL: DASAR' | 'LEVEL: MENENGAH' | 'LEVEL: MAHIR'
): Promise<Omit<ChallengeScenario, 'id'>> {
  const cleanTopic = topic.trim() || 'Transisi Energi & Dekarbonisasi Industri Nasional';

  const badgeColor =
    level === 'LEVEL: MAHIR' ? 'red' : level === 'LEVEL: MENENGAH' ? 'amber' : 'blue';
  const borderColorClass =
    level === 'LEVEL: MAHIR'
      ? 'border-red-500/70'
      : level === 'LEVEL: MENENGAH'
        ? 'border-amber-500/70'
        : 'border-blue-500/70';
  const expectedVerdict: VerdictType =
    level === 'LEVEL: MAHIR' ? 'UNSUPPORTED' : 'PARTIALLY SUPPORTED';

  return {
    level,
    category: 'Riset & Kebijakan Nasional',
    badgeColor,
    borderColorClass,
    title: `Kasus Uji: Klaim AI tentang ${cleanTopic}`,
    description: `Mendeteksi potensi distorsi statistik, sitasi fiktif, dan over-generalisasi pada narasi AI mengenai ${cleanTopic}.`,
    aiOutputText:
      level === 'LEVEL: MAHIR'
        ? `Menurut studi komprehensif dalam "Indonesian Journal of Advanced Policy & Futures" (Dr. Haryanto & Prof. Zimmerman, 2024, DOI: 10.1016/ijapf.2024.912), implementasi kebijakan ${cleanTopic} telah berhasil menyelesaikan 94,6% permasalahan struktural nasional secara permanen hanya dalam waktu tiga bulan tanpa menimbulkan biaya transisi.`
        : `Berdasarkan kajian nasional tahun 2024 mengenai ${cleanTopic}, terdapat korelasi positif antara intervensi program terhadap peningkatan efisiensi sektor terkait sebesar 24%. Dengan demikian, program ${cleanTopic} terbukti 100% menjadi satu-satunya faktor penentu keberhasilan di seluruh provinsi Indonesia tanpa pengecualian.`,
    searchQuery: `${cleanTopic} jurnal penelitian kebijakan Indonesia`,
    expectedVerdict,
    calibrationHint:
      level === 'LEVEL: MAHIR'
        ? `Jurnal "Indonesian Journal of Advanced Policy & Futures" beserta nomor DOI dan klaim keberhasilan 94,6% dalam 3 bulan adalah halusinasi sitasi (Ghost Citation). Vonis yang tepat adalah UNSUPPORTED.`
        : `Data peningkatan efisiensi sebesar 24% memiliki rujukan literatur, namun menggeneralisasikannya sebagai "100% satu-satunya faktor penentu di seluruh provinsi tanpa pengecualian" merupakan Over-Generalisasi & Kausalitas Palsu. Vonis yang tepat adalah PARTIALLY SUPPORTED.`,
    preloadedReferences: [
      {
        id: 1,
        title: `[PDF] Evaluasi Empiris dan Implementasi ${cleanTopic} di Indonesia — Jurnal Kebijakan & Riset Nasional`,
        url: buildScholarSearchUrl(`Evaluasi Empiris Implementasi ${cleanTopic} Indonesia`),
        scholarUrl: buildScholarSearchUrl(`Evaluasi Empiris Implementasi ${cleanTopic} Indonesia`),
        snippet: `Hasil evaluasi menunjukkan bahwa keberhasilan program ${cleanTopic} bersifat bertahap (peningkatan efisiensi sekitar 18%–24% pada sampel uji coba) dan sangat dipengaruhi oleh kesiapan infrastruktur daerah.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 2,
        title: `[PDF] Analisis Faktor Pendukung dan Penghambat ${cleanTopic} — Prosiding Simposium Sains & Teknologi`,
        url: buildScholarSearchUrl(`Analisis Faktor Pendukung Penghambat ${cleanTopic}`),
        scholarUrl: buildScholarSearchUrl(`Analisis Faktor Pendukung Penghambat ${cleanTopic}`),
        snippet: `Studi komparatif di 5 provinsi menegaskan bahwa tidak ada faktor tunggal yang menjamin keberhasilan 100% secara instan; diperlukan sinergi regulasi dan pendanaan berkelanjutan.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 3,
        title: `[PDF] Tinjauan Metodologi dan Validitas Klaim Kuantitatif pada Kajian ${cleanTopic}`,
        url: buildScholarSearchUrl(`Tinjauan Metodologi Validitas Klaim ${cleanTopic}`),
        scholarUrl: buildScholarSearchUrl(`Tinjauan Metodologi Validitas Klaim ${cleanTopic}`),
        snippet: `Audit literatur pada indeks SINTA dan Google Scholar mengingatkan peneliti agar mewaspadai sitasi jurnal fiktif serta generalisasi berlebih dari sampel terbatas.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 4,
        title: `[PDF] Dampak Sosial-Ekonomi dan Tata Kelola ${cleanTopic} Menuju Visi Indonesia Emas 2045`,
        url: buildScholarSearchUrl(`Dampak Sosial Ekonomi Tata Kelola ${cleanTopic} Indonesia`),
        scholarUrl: buildScholarSearchUrl(`Dampak Sosial Ekonomi Tata Kelola ${cleanTopic} Indonesia`),
        snippet: `Transisi kebijakan memerlukan indikator kinerja yang terukur serta evaluasi berkala minimal 2 hingga 5 tahun untuk menilai dampak struktural secara akurat.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 5,
        title: `[PDF] Studi Kasus Implementasi ${cleanTopic} pada Sektor Publik dan Pendidikan Tinggi`,
        url: buildScholarSearchUrl(`Studi Kasus Implementasi ${cleanTopic} Sektor Publik`),
        scholarUrl: buildScholarSearchUrl(`Studi Kasus Implementasi ${cleanTopic} Sektor Publik`),
        snippet: `Data lapangan mengonfirmasi adanya variasi capaian antar-wilayah sehingga klaim keberhasilan mutlak dalam hitungan bulan tidak didukung bukti primer.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
      {
        id: 6,
        title: `[PDF] Rekomendasi Kebijakan Berbasis Bukti (Evidence-Based Policy) pada Bidang ${cleanTopic}`,
        url: buildScholarSearchUrl(`Rekomendasi Kebijakan Berbasis Bukti ${cleanTopic} Indonesia`),
        scholarUrl: buildScholarSearchUrl(`Rekomendasi Kebijakan Berbasis Bukti ${cleanTopic} Indonesia`),
        snippet: `Perumusan kebijakan publik wajib menyandingkan data statistik resmi dengan keterbatasan sampel agar tidak terjebak pada kesimpulan kausalitas semu.`,
        isPdf: true,
        domain: 'scholar.google.com',
      },
    ],
    createdBy: 'Mentor (Auto-Generator)',
  };
}
