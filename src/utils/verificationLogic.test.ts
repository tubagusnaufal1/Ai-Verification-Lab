import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSnippetText,
  cleanAcademicSnippet,
  repairBrokenCitationsAndPunctuation,
  buildTopicRelevantSynthesis,
  filterCleanSearchResults,
  analyzeReferenceCredibility,
  detectEpistemicStanceForTopic,
  generateVerifiedAcademicRewrite,
  stripInlineCitationMarkers,
  buildSearchQuery,
  getFallbackAcademicResults,
  extractClaimsFromText,
  detectGhostCitation,
  injectControlledHallucinationInText,
  validateAnalyticalJustification,
  evaluateVerdictAndCalculateVScore,
  evaluateCognitiveShift,
  tokenizeForensicHighlights,
  getPedagogicalInterventionRecommendation,
  encodeScenarioToken,
  decodeScenarioToken,
  generateDirectAuditPdfString,
  CHALLENGE_SCENARIOS,
  SearchReference,
} from './verificationLogic';
import {
  upsertStudentScoreEntry,
  encodeSubmissionScoreToken,
  decodeSubmissionScoreToken,
  INITIAL_STUDENT_SCORES,
} from './storageService';

test('stripInlineCitationMarkers removes inline [1], [2], [3] markers cleanly', () => {
  const raw =
    'Berdasarkan studi IDAI tahun 2023 [1], prevalensi diabetes meningkat tajam [2] pada kelompok remaja [3].';
  const stripped = stripInlineCitationMarkers(raw);
  assert.ok(!stripped.includes('[1]'));
  assert.ok(!stripped.includes('[2]'));
  assert.ok(!stripped.includes('[3]'));
  assert.ok(stripped.includes('Berdasarkan studi IDAI tahun 2023, prevalensi diabetes meningkat tajam'));
});

test('repairBrokenCitationsAndPunctuation fixes unclosed author-year citations like (Horriyah 2011. and robotic transition phrases are never emitted', () => {
  const broken =
    'Berdasarkan temuan historis (Horriyah 2011. klaim lokasi Saba masih diperdebatkan.';
  const repaired = repairBrokenCitationsAndPunctuation(broken);
  assert.ok(repaired.includes('(Horriyah, 2011)'));
  assert.ok(!repaired.includes('(Horriyah 2011.'));

  const refs = getFallbackAcademicResults('Kerajaan Nabi Sulaiman di Indonesia');
  const synthesis = buildTopicRelevantSynthesis('Kerajaan Nabi Sulaiman di Indonesia', refs);
  assert.ok(!/dalam perspektif implementasi dan evaluasi faktual/i.test(synthesis));
  assert.ok(!/pada aspek kebijakan dan epidemiologi/i.test(synthesis));
  assert.ok(!/sejalan dengan hal tersebut, telaah pada rujukan kedua/i.test(synthesis));
  assert.ok(!/di samping itu, bukti kelima menjelaskan bahwa/i.test(synthesis));
  assert.ok(!/temuan tersebut diperkuat oleh literatur keenam/i.test(synthesis));
});

test('evaluateCognitiveShift, tokenizeForensicHighlights, and getPedagogicalInterventionRecommendation work accurately', () => {
  const shift = evaluateCognitiveShift('CONVINCING', 'PARTIALLY SUPPORTED', 'PARTIALLY SUPPORTED');
  assert.equal(shift.shiftCategory, 'FLUENCY_ILLUSION_BROKEN');
  assert.ok(shift.headline.includes('Ilusi Kefasihan AI'));

  const claimTokens = tokenizeForensicHighlights(
    'Konsumsi boba terbukti mutlak 100% menyebabkan gagal ginjal pada seluruh remaja.',
    'CLAIM'
  );
  assert.ok(
    claimTokens.some(
      (t) => t.highlightType === 'EXTREME_CLAIM' || t.highlightType === 'QUANTITATIVE_YEAR'
    )
  );

  const evidenceTokens = tokenizeForensicHighlights(
    'Studi kritis perspektif Ad-Dakhil dan Israiliyat mencatat klaim ini belum terkonfirmasi.',
    'EVIDENCE'
  );
  assert.ok(
    evidenceTokens.some(
      (t) => t.highlightType === 'CRITICAL_STANCE' || t.highlightType === 'METHODOLOGY_SIGNAL'
    )
  );

  const pedAdvice = getPedagogicalInterventionRecommendation([
    { label: 'Tahap 1 · Claim & Pathology Audit', avg: 23, max: 25 },
    { label: 'Tahap 2 · Source Verification', avg: 22, max: 25 },
    { label: 'Tahap 3 · Verdict Accuracy', avg: 24, max: 25 },
    { label: 'Tahap 4 · Analytical Justification', avg: 18.5, max: 25 },
  ]);
  assert.ok(pedAdvice.weakestStageLabel.includes('Tahap 4'));
  assert.ok(pedAdvice.actionItems.length > 0);
});

test('cleanAcademicSnippet removes raw meta-abstract phrases and buildTopicRelevantSynthesis never appends boilerplate audit sentences', () => {
  const rawAbstract =
    'Berdasarkan latar belakang di atas, penelitian ini akan menganalisa tentang klaim peninggalan Ratu Balqis dan Nabi Sulaiman di Nusantara || metode yang digunakan adalah studi kepustakaan...';
  const cleaned = cleanAcademicSnippet(
    rawAbstract,
    'Studi Kritis Klaim Peninggalan Nabi Sulaiman di Nusantara'
  );
  assert.ok(!/penelitian ini akan menganalisa/i.test(cleaned));
  assert.ok(!/metode yang digunakan adalah/i.test(cleaned));
  assert.ok(!cleaned.includes('||'));
  assert.ok(!cleaned.includes('...'));

  const refs = getFallbackAcademicResults('Transisi Energi Baru Terbarukan');
  const synthesis = buildTopicRelevantSynthesis('Transisi Energi Baru Terbarukan', refs);
  assert.ok(
    !/proses audit informasi wajib menyandingkan/i.test(synthesis),
    'Should never contain system audit boilerplate'
  );
  assert.ok(
    !/rangkaian bukti pada ketiga referensi awal ini/i.test(synthesis),
    'Should never contain system filler sentence'
  );
});

test('filterCleanSearchResults only sets [PDF] on genuine PDF URLs and analyzeReferenceCredibility detects popular media vs critical academic journals', () => {
  const rawItems = [
    {
      title: '[PDF] Klaim Candi Borobudur Peninggalan Nabi Sulaiman Viral',
      link: 'https://poskotakaltimnews.com/read/2024/candi-borobudur-nabi-sulaiman',
      snippet: 'Beredar klaim populer bahwa Candi Borobudur merupakan peninggalan Nabi Sulaiman.',
    },
    {
      title: 'Studi Kritis Ad-Dakhil dan Israiliyat pada Tafsir Kisah Nabi Sulaiman di Indonesia',
      link: 'https://journal.uinjkt.ac.id/index.php/ushuluddin/article/download/1234/pdf/',
      snippet:
        'Kajian tafsir ini membantah klaim sepihak mengenai lokasi Kerajaan Nabi Sulaiman di Jawa sebagai riwayat Israiliyat dan cocoklogi.',
    },
  ];

  const cleanedRefs = filterCleanSearchResults(rawItems, true);
  assert.equal(cleanedRefs.length, 2);

  // Item 1 is poskotakaltimnews.com (not a PDF!)
  assert.equal(cleanedRefs[0].isPdf, false);
  assert.ok(!cleanedRefs[0].title.startsWith('[PDF]'));
  const cred0 = analyzeReferenceCredibility(cleanedRefs[0]);
  assert.equal(cred0.sourceTier, 'SECONDARY_POPULAR');
  assert.ok(cred0.credibilityBadge.includes('Sumber Sekunder / Media Populer'));

  // Item 2 is journal.uinjkt.ac.id with /pdf/ and critical/ad-dakhil stance
  assert.equal(cleanedRefs[1].isPdf, true);
  assert.ok(cleanedRefs[1].title.startsWith('[PDF]'));
  const cred1 = analyzeReferenceCredibility(cleanedRefs[1]);
  assert.equal(cred1.sourceTier, 'PRIMARY_ACADEMIC');
  assert.equal(cred1.isCriticalStance, true);
  assert.ok(cred1.criticalStanceBadge?.includes('Literatur Pengkritisi / Evaluatif'));
});

test('detectEpistemicStanceForTopic, evaluateVerdictAndCalculateVScore, and generateVerifiedAcademicRewrite handle controversial claims (Kerajaan Nabi Sulaiman di Indonesia) with full critical thinking score', () => {
  const sulaimanRefs: SearchReference[] = [
    {
      id: 1,
      title: 'Studi Kritis Klaim Kerajaan Nabi Sulaiman di Indonesia Perspektif Ad-Dakhil',
      url: 'https://journal.uinjkt.ac.id/index.php/quhas/article/view/29410',
      scholarUrl: 'https://scholar.google.com/scholar?q=Studi+Kritis+Klaim+Kerajaan+Nabi+Sulaiman',
      snippet:
        'Kajian historiografi dan tafsir Ad-Dakhil menyimpulkan bahwa klaim Candi Borobudur sebagai peninggalan Nabi Sulaiman merupakan spekulasi tanpa bukti arkeologis primer.',
      isPdf: false,
      domain: 'journal.uinjkt.ac.id',
    },
    {
      id: 2,
      title: 'Sejarah Arkeologi Candi Borobudur pada Masa Dinasti Syailendra Abad ke-8',
      url: 'https://jurnal.ugm.ac.id/humaniora/article/view/11201',
      scholarUrl: 'https://scholar.google.com/scholar?q=Sejarah+Arkeologi+Candi+Borobudur+Syailendra',
      snippet:
        'Bukti prasasti Kayumwungan dan arkeologi memastikan Candi Borobudur dibangun pada masa Dinasti Syailendra abad ke-8 Masehi.',
      isPdf: false,
      domain: 'jurnal.ugm.ac.id',
    },
    {
      id: 3,
      title: 'Klaim Borobudur Peninggalan Nabi Sulaiman Kembali Ramai Dibahas',
      url: 'https://poskotakaltimnews.com/berita/borobudur-sulaiman',
      scholarUrl: 'https://scholar.google.com/scholar?q=Klaim+Borobudur+Peninggalan+Nabi+Sulaiman',
      snippet:
        'Narasi populer di media sosial menyebutkan teori spekulatif mengenai negeri Saba di Nusantara namun dibantah oleh para sejarawan.',
      isPdf: false,
      domain: 'poskotakaltimnews.com',
    },
    {
      id: 4,
      title: 'Analisis Israiliyat dalam Penafsiran Kisah Ratu Saba dan Nabi Sulaiman',
      url: 'https://ejournal.uin-suka.ac.id/ushuluddin/esensia/article/view/4412',
      scholarUrl: 'https://scholar.google.com/scholar?q=Analisis+Israiliyat+Ratu+Saba+Nabi+Sulaiman',
      snippet:
        'Literatur tafsir kritis mengidentifikasi masuknya unsur Israiliyat dalam spekulasi lokasi geografis Saba di luar Jazirah Arab Selatan (Yaman).',
      isPdf: false,
      domain: 'ejournal.uin-suka.ac.id',
    },
    {
      id: 5,
      title: 'Epigrafi dan Kronologi Pembangunan Kompleks Candi Buddha Jawa Tengah',
      url: 'https://kemdikbud.go.id/arkeologi/borobudur-syailendra',
      scholarUrl: 'https://scholar.google.com/scholar?q=Epigrafi+Kronologi+Borobudur',
      snippet:
        'Data stratigrafi dan epigrafi Balai Konservasi Borobudur mengonfirmasi corak arsitektur Buddha Mahayana abad ke-8 hingga ke-9 Masehi.',
      isPdf: false,
      domain: 'kemdikbud.go.id',
    },
    {
      id: 6,
      title: 'Kritik Metodologi Cocoklogi Sejarah Kuno Nusantara dalam Kajian Akademik',
      url: 'https://journal.ui.ac.id/sejarah/article/view/8891',
      scholarUrl: 'https://scholar.google.com/scholar?q=Kritik+Metodologi+Cocoklogi+Sejarah+Nusantara',
      snippet:
        'Sejarawan menolak klaim pseudo-historis yang mengaitkan situs klasik Nusantara dengan kerajaan Timur Tengah Kuno tanpa bukti artefak.',
      isPdf: false,
      domain: 'journal.ui.ac.id',
    },
  ];

  const synthesis = buildTopicRelevantSynthesis(
    'Kerajaan Nabi Sulaiman ada di Indonesia',
    sulaimanRefs
  );
  const stance = detectEpistemicStanceForTopic(
    'Kerajaan Nabi Sulaiman ada di Indonesia',
    sulaimanRefs
  );

  assert.equal(stance.hasCriticalOrDebunkingStance, true);
  assert.equal(stance.recommendedExpectedVerdict, 'PARTIALLY SUPPORTED');
  assert.equal(stance.thesisConclusion.statusCategory, 'SPEKULATIF_DIPERDEBATKAN');

  const claims = extractClaimsFromText(synthesis, sulaimanRefs, 'VERIFIED');
  assert.ok(claims.length >= 2);

  // Student critically marks claims as DISTORSI / HALUSINASI and chooses PARTIALLY SUPPORTED
  const studentMicroAudits: Record<string, {
    claimId: string;
    microVerdict: 'DISTORSI' | 'HALUSINASI';
    evidenceRefId: string;
    detectedPathology: 'CONTEXTUAL_DRIFT';
  }> = {};
  for (const c of claims) {
    studentMicroAudits[c.id] = {
      claimId: c.id,
      microVerdict: 'DISTORSI',
      evidenceRefId: '', // Even if student forgot dropdown, Stage 2 should still get 25/25 with 3+ inspected refs!
      detectedPathology: 'CONTEXTUAL_DRIFT',
    };
  }

  const criticalJustification =
    'Berdasarkan bukti sumber jurnal studi kritis Ad-Dakhil dan Israiliyat serta arkeologi Borobudur Syailendra, klaim Kerajaan Nabi Sulaiman di Indonesia adalah spekulatif dan mengandung distorsi konteks sejarah.';

  const evaluation = evaluateVerdictAndCalculateVScore({
    currentVScore: 80,
    verdict: 'PARTIALLY SUPPORTED',
    justification: criticalJustification,
    claimText: synthesis,
    references: sulaimanRefs,
    expectedVerdict: 'VERIFIED', // Even if sent from Normal mode, student's critical verdict is rewarded 100%!
    extractedClaims: claims,
    microAudits: studentMicroAudits,
    inspectedReferenceIds: [1, 2, 3, 4],
    preAuditIntuition: 'CONVINCING',
    thesisQuery: 'Kerajaan Nabi Sulaiman ada di Indonesia',
  });

  assert.equal(evaluation.stageBreakdown.stage1ClaimAudit, 25);
  assert.equal(evaluation.stageBreakdown.stage2SourceVerification, 25);
  assert.equal(evaluation.stageBreakdown.stage3VerdictAccuracy, 25);
  assert.equal(evaluation.stageBreakdown.stage4JustificationQuality, 25);
  assert.equal(evaluation.newVScore, 100);
  assert.equal(evaluation.isCalibrated, true);
  assert.ok(evaluation.thesisConclusion);
  assert.equal(evaluation.thesisConclusion?.statusCategory, 'SPEKULATIF_DIPERDEBATKAN');
  assert.ok(evaluation.cognitiveShift);
  assert.equal(evaluation.cognitiveShift?.shiftCategory, 'FLUENCY_ILLUSION_BROKEN');

  const rewrite = generateVerifiedAcademicRewrite(synthesis, sulaimanRefs, 'PARTIALLY SUPPORTED');
  assert.ok(
    /hipotesis spekulatif yang (?:dikritisi|mendapat sorotan kritis) dalam kajian tafsir dan historiografi \(Ad-Dakhil \/ Isra'iliyat\)/i.test(
      rewrite.correctedParagraph
    )
  );
});

test('extractClaimsFromText synchronizes with expectedVerdict === VERIFIED (Mode Normal Akurat)', () => {
  const scenario = CHALLENGE_SCENARIOS[0];
  const claimsVerified = extractClaimsFromText(
    scenario.aiOutputText,
    scenario.preloadedReferences,
    'VERIFIED'
  );
  assert.ok(claimsVerified.length >= 2);
  for (const c of claimsVerified) {
    assert.equal(c.expectedMicroVerdict, 'SESUAI_BUKTI');
    assert.equal(c.pathologyId, 'VALID_CLAIM');
  }
});

test('sanitizeSnippetText removes hanging ellipses and ensures complete academic punctuation', () => {
  const dirty =
    'Berdasarkan penelitian terbaru mengenai efektivitas pembelajaran berbasis proyek... ditemukan bahwa metode ini...';
  const cleaned = sanitizeSnippetText(dirty);
  assert.ok(!cleaned.includes('...'), 'Should not contain triple dots');
  assert.ok(/[.!?]$/.test(cleaned), 'Should end with valid sentence punctuation');
});

test('buildSearchQuery excludes unstable garuda domain and appends stable academic operators', () => {
  const query = buildSearchQuery('Dampak AI terhadap Berpikir Kritis', true);
  assert.ok(!query.includes('garuda.kemdikbud.go.id'));
  assert.ok(query.includes('jurnal penelitian ilmiah'));
});

test('getFallbackAcademicResults returns 6 topic-matched references with valid Scholar URLs', () => {
  const refs = getFallbackAcademicResults('Kebijakan Subsidi Kendaraan Listrik Indonesia');
  assert.equal(refs.length, 6);
  for (const ref of refs) {
    assert.ok(ref.scholarUrl.startsWith('https://scholar.google.com/scholar?q='));
    assert.ok(!ref.snippet.includes('...'));
  }
});

test('injectControlledHallucinationInText injects distortion or ghost citation when trap mode is active', () => {
  const refs = getFallbackAcademicResults('Stunting dan Gizi Anak');
  const baseText =
    'Program intervensi gizi terpadu menunjukkan perbaikan bertahap pada indikator pertumbuhan balita di beberapa daerah prioritas [1].';
  const trapped = injectControlledHallucinationInText(
    baseText,
    'Stunting dan Gizi Anak',
    refs,
    'PARTIALLY SUPPORTED'
  );
  assert.equal(trapped.expectedVerdict, 'PARTIALLY SUPPORTED');
  assert.ok(trapped.manipulatedText.length > baseText.length);
});

test('detectGhostCitation flags fictional authors/DOIs not present in references', () => {
  const scenario2 = CHALLENGE_SCENARIOS[1];
  const ghostCheck = detectGhostCitation(scenario2.aiOutputText, scenario2.preloadedReferences);
  assert.equal(ghostCheck.status, 'GHOST_WARNING');
});

test('validateAnalyticalJustification & evaluateVerdictAndCalculateVScore award full 100/100 when all 4 stages are met', () => {
  const scenario1 = CHALLENGE_SCENARIOS[0];
  const claims = extractClaimsFromText(
    scenario1.aiOutputText,
    scenario1.preloadedReferences,
    scenario1.expectedVerdict
  );

  const perfectMicroAudits: Record<string, {
    claimId: string;
    microVerdict: typeof claims[number]['expectedMicroVerdict'];
    evidenceRefId: string;
    detectedPathology: typeof claims[number]['pathologyId'];
  }> = {};
  for (const c of claims) {
    perfectMicroAudits[c.id] = {
      claimId: c.id,
      microVerdict: c.expectedMicroVerdict,
      evidenceRefId: c.suggestedRefId,
      detectedPathology: c.pathologyId,
    };
  }

  const strongJustification =
    'Berdasarkan bukti sumber jurnal IDAI tahun 2023 dan data klinis anak, lonjakan 70 kali lipat memang sesuai statistik, namun klaim 100% disebabkan boba adalah distorsi kausalitas karena mayoritas merupakan autoimun.';

  const check = validateAnalyticalJustification(
    strongJustification,
    scenario1.aiOutputText,
    scenario1.preloadedReferences
  );
  assert.equal(check.valid, true);
  assert.equal(check.checklist.min12WordsAndClean, true);
  assert.equal(check.checklist.min2TopicKeywords, true);
  assert.equal(check.checklist.hasAnalyticalTerm, true);

  const evalStrong = evaluateVerdictAndCalculateVScore({
    currentVScore: 80,
    verdict: 'PARTIALLY SUPPORTED',
    justification: strongJustification,
    claimText: scenario1.aiOutputText,
    references: scenario1.preloadedReferences,
    expectedVerdict: 'PARTIALLY SUPPORTED',
    extractedClaims: claims,
    microAudits: perfectMicroAudits,
    inspectedReferenceIds: [1, 2, 3, 4, 5, 6],
  });

  assert.equal(evalStrong.stageBreakdown.stage1ClaimAudit, 25);
  assert.equal(evalStrong.stageBreakdown.stage2SourceVerification, 25);
  assert.equal(evalStrong.stageBreakdown.stage3VerdictAccuracy, 25);
  assert.equal(evalStrong.stageBreakdown.stage4JustificationQuality, 25);
  assert.equal(evalStrong.newVScore, 100);
  assert.ok(evalStrong.processLog);
  assert.equal(evalStrong.processLog?.stage1Claims.length, claims.length);
  assert.equal(evalStrong.processLog?.stage3Verdict.chosenVerdict, 'PARTIALLY SUPPORTED');
});

test('encodeScenarioToken and decodeScenarioToken round-trip scenario across devices', () => {
  const sample = CHALLENGE_SCENARIOS[0];
  const token = encodeScenarioToken(sample);
  assert.ok(token.startsWith('AILAB-TOKEN-v1:'));

  const decoded = decodeScenarioToken(token);
  assert.ok(decoded !== null);
  assert.equal(decoded?.title, sample.title);
  assert.equal(decoded?.expectedVerdict, sample.expectedVerdict);
});

test('upsertStudentScoreEntry updates existing student row and increments attemptCount instead of duplicating', () => {
  const baseScores = [...INITIAL_STUDENT_SCORES];
  const firstAttempt = {
    ...INITIAL_STUDENT_SCORES[0],
    id: 'new-attempt-id',
    vScore: 96,
    scenarioTitle: 'Kasus 1: Manipulasi Konteks Statistik Kesehatan',
  };

  const afterUpsert = upsertStudentScoreEntry(baseScores, firstAttempt);
  assert.equal(afterUpsert.length, baseScores.length);
  assert.equal(afterUpsert[0].vScore, 96);
  assert.equal(afterUpsert[0].attemptCount, 2);
  assert.ok(afterUpsert[0].scenarioTitle.includes('(Percobaan #2)'));
});

test('encodeSubmissionScoreToken and decodeSubmissionScoreToken round-trip student score entry for mentor import', () => {
  const sampleScore = INITIAL_STUDENT_SCORES[0];
  const token = encodeSubmissionScoreToken(sampleScore);
  assert.ok(token.startsWith('AILAB-SCORE-v1:'));

  const decoded = decodeSubmissionScoreToken(token);
  assert.ok(decoded !== null);
  assert.equal(decoded?.studentName, sampleScore.studentName);
  assert.equal(decoded?.studentNim, sampleScore.studentNim);
  assert.equal(decoded?.vScore, sampleScore.vScore);
  assert.equal(decoded?.stageBreakdown.stage1ClaimAudit, sampleScore.stageBreakdown.stage1ClaimAudit);
  assert.equal(decoded?.processLog?.stage3Verdict.chosenVerdict, sampleScore.processLog?.stage3Verdict.chosenVerdict);
});

test('generateDirectAuditPdfString generates valid PDF 1.4 with fixed standard A4 MediaBox [0 0 595.28 841.89]', () => {
  const scenario1 = CHALLENGE_SCENARIOS[0];
  const evalSample = evaluateVerdictAndCalculateVScore({
    currentVScore: 80,
    verdict: 'PARTIALLY SUPPORTED',
    justification:
      'Berdasarkan bukti sumber jurnal IDAI tahun 2023 dan data klinis anak, lonjakan 70 kali lipat memang sesuai statistik, namun klaim 100% disebabkan boba adalah distorsi kausalitas.',
    claimText: scenario1.aiOutputText,
    references: scenario1.preloadedReferences,
    expectedVerdict: 'PARTIALLY SUPPORTED',
    thesisQuery: 'Konsumsi minuman boba menyebabkan diabetes anak',
  });

  const pdfString = generateDirectAuditPdfString({
    studentName: 'Budi Santoso',
    studentNim: 'TI-2026-01',
    scenarioTitle: 'Uji Klaim Akademik',
    evaluation: evalSample,
  });

  assert.ok(pdfString.startsWith('%PDF-1.4'));
  assert.ok(pdfString.includes('/MediaBox [0 0 595.28 841.89]'));
  assert.ok(pdfString.includes('Kesimpulan Tesis'));
  assert.ok(pdfString.includes('Kanvas A4 Murni 595.28x841.89 pt'));
  assert.ok(pdfString.trim().endsWith('%%EOF'));
});


