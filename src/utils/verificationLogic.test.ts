import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSnippetText,
  stripInlineCitationMarkers,
  buildSearchQuery,
  getFallbackAcademicResults,
  extractClaimsFromText,
  detectGhostCitation,
  injectControlledHallucinationInText,
  validateAnalyticalJustification,
  evaluateVerdictAndCalculateVScore,
  encodeScenarioToken,
  decodeScenarioToken,
  CHALLENGE_SCENARIOS,
} from './verificationLogic';
import {
  upsertStudentScoreEntry,
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
