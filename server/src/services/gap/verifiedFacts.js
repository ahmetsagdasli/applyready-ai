// Gorev 1 — Onaylanmis gap bullet'larini ajan prompt'larina enjekte etmek icin
// ortak metin blogu uretir. Bu bullet'lar kullanicinin GERCEKTEN onayladigi,
// gap-interview'den gelen DOGRULANMIS bilgilerdir; ajanlar bunlari kullanabilir.

export function formatVerifiedFactsBlock(verifiedFacts) {
  if (!Array.isArray(verifiedFacts) || verifiedFacts.length === 0) return '';
  return (
    '\n--- DOGRULANMIS EK BILGILER (kullanici gap-interview\'de onayladi; ' +
    'bunlar GERCEKTIR ve kullanilabilir, uydurma degildir) ---\n' +
    JSON.stringify(verifiedFacts)
  );
}
