export function generateStandaloneSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI LITERACY LAB — VERIFICATION-FIRST MODEL</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #020617; color: #f8fafc; }
  </style>
</head>
<body class="min-h-screen bg-[#020617] text-slate-100 p-8">
  <div class="max-w-4xl mx-auto bg-[#0b1120] border border-[#1e293b] rounded-2xl p-8 space-y-4">
    <h1 class="text-2xl font-extrabold text-white">AI LITERACY LAB — VERIFICATION-FIRST MODEL</h1>
    <p class="text-sm text-slate-300">Inisiatif Asta Cita Nusantara Poin 4: Penguatan SDM, Sains &amp; Teknologi melalui Siklus LEARN, CHALLENGE, dan VERIFY (Rubrik 4×25 Poin).</p>
  </div>
</body>
</html>`;
}
