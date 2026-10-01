# ApplyReady

Her is ilanina ozel basvuru paketi hazirlayan SaaS MVP. (CV + on yazi + LinkedIn profili)

ApplyReady; kullanicinin CV metnini veya PDF CV dosyasini is ilani ile birlikte analiz eder, ATS uyum skorunu hesaplar, ilana gore yeniden yazilmis CV ve on yazi uretir, LinkedIn profil iyilestirme onerileri hazirlar ve ciktilari PDF/DOCX olarak indirilebilir hale getirir. Gercek bilgilere gore, uydurmadan ve hedef ilana gore calisir.

## Ozellikler

- CV metni girisi veya PDF CV yukleme
- PDF CV metnini parse etme
- Is ilani analizi
- ATS uyum skoru ve eksik anahtar kelime analizi
- Ilana ozel CV uretimi
- On yazi uretimi
- LinkedIn profil onerileri
- PDF ve DOCX export
- Supabase Auth ile giris/kayit
- Supabase Postgres ile kayitli basvuru gecmisi
- KVKK/GDPR kapsaminda kullanici verisi indirme ve uygulama verisi/hesap silme
- Free/pro/unlimited plan altyapisi
- Aylik AI analiz kullanim limiti
- Stripe test mode checkout ve webhook altyapisi

## Teknoloji Stack

**Frontend**
- React
- Vite
- Material UI
- React Router
- Axios
- Supabase JS client

**Backend**
- Node.js
- Express
- Helmet
- CORS
- express-rate-limit
- Multer
- Zod

**AI**
- OpenAI API
- CV Parser Agent
- Job Analyzer Agent
- Match Scorer Agent
- CV Writer Agent
- Cover Letter Agent
- LinkedIn Agent

**Database/Auth**
- Supabase Auth
- Supabase Postgres
- Row Level Security politikalarini iceren SQL semasi

**Payments**
- Stripe test mode checkout
- Stripe webhook altyapisi

**Export**
- PDF export
- DOCX export

## Klasor Yapisi

```text
CV-Agent/
├── package.json
├── client/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── App.jsx
│       └── routes.jsx
└── server/
    ├── package.json
    ├── supabase/
    │   ├── schema.sql
    │   └── migrations/
    │       ├── 002_add_linkedin_profile.sql
    │       ├── 003_usage_plans.sql
    │       └── 004_billing_stripe.sql
    └── src/
        ├── agents/
        ├── config/
        ├── controllers/
        ├── llm/
        ├── middleware/
        ├── prompts/
        ├── routes/
        ├── services/
        └── index.js
```

## Environment Degiskenleri

Environment dosyalari root klasorde degil, ilgili workspace icinde tutulur.

### `server/.env`

```env
PORT=5001
CLIENT_URL=http://localhost:5173
CLIENT_APP_URL=http://localhost:5173
NODE_ENV=development

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
```

Notlar:
- `SUPABASE_JWT_SECRET` mevcut env orneginde bulunuyor, ancak auth dogrulama akisinda Supabase `auth.getUser(token)` kullaniliyor. Bu degisken mevcut kodda dogrudan kullanilmiyor; ileride manuel JWT dogrulama ihtiyaci olursa ayrilmis durumda.
- `CLIENT_URL` CORS origin icin kullanilir.
- `CLIENT_APP_URL` Stripe success/cancel ve portal donus URL'leri icin kullanilir.

### `client/.env`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Guvenlik Notlari

- `OPENAI_API_KEY` frontend'e konmaz.
- `SUPABASE_SERVICE_ROLE_KEY` frontend'e konmaz.
- `STRIPE_SECRET_KEY` frontend'e konmaz.
- Stripe live key development ortaminda kullanilmamali; local gelistirmede `sk_test_...` kullanin.
- `.env` dosyalari commit edilmemeli.

## Kurulum

1. Bagimliliklari yukleyin:

```bash
npm install
```

2. Backend env dosyasini olusturun:

```bash
cp server/.env.example server/.env
```

3. Frontend env dosyasini olusturun:

```bash
cp client/.env.example client/.env
```

4. Supabase projesi olusturun ve env degerlerini doldurun:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

5. Supabase SQL semasini veya migration dosyalarini calistirin. Detaylar icin "Supabase Kurulumu" bolumune bakin.

6. Stripe test mode icin product, recurring price ve webhook ayarlarini yapin. Detaylar icin "Stripe Test Mode Kurulumu" bolumune bakin.

7. OpenAI API key'i `server/.env` icine yazin:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

8. Uygulamayi baslatin:

```bash
npm run dev
```

## Supabase Kurulumu

### Yeni Kurulum

Yeni bir Supabase projesinde `server/supabase/schema.sql` dosyasini Supabase SQL Editor icinde calistirin.

Bu dosya baslangic semasini kurar:

- `profiles`
- `applications`
- `user_plans`
- `usage_logs`
- RLS politikalari
- Yeni kullanici icin profil ve free plan olusturan trigger

### Mevcut DB Guncelleme

Mevcut bir DB'yi guncelliyorsaniz migration dosyalarini su sirayla calistirin:

1. `server/supabase/migrations/002_add_linkedin_profile.sql`
2. `server/supabase/migrations/003_usage_plans.sql`
3. `server/supabase/migrations/004_billing_stripe.sql`

Bu projede baslangic semasi `schema.sql` ile tutuluyor; sonraki degisiklikler `migrations/` altinda `002+` olarak ilerliyor. Bu nedenle ayri bir `001` migration dosyasi yok.

## Stripe Test Mode Kurulumu

1. Stripe Dashboard'da test mode'u acin.
2. Bir test product olusturun.
3. Monthly recurring price olusturun.
4. Price ID degerini `server/.env` icine yazin:

```env
STRIPE_PRO_PRICE_ID=price_...
```

5. Stripe secret key'i test key olarak ayarlayin:

```env
STRIPE_SECRET_KEY=sk_test_...
```

6. Local webhook dinleyicisini baslatin:

```bash
stripe listen --forward-to localhost:5001/api/billing/webhook
```

7. Komutun verdigi webhook secret degerini `server/.env` icine yazin:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

8. Test checkout icin Stripe test kartini kullanabilirsiniz:

```text
4242 4242 4242 4242
```

## Calistirma

Root klasorde:

```bash
npm install
npm run dev
```

Varsayilan adresler:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5001/api/health

Backend portunu `server/.env` icindeki `PORT` ile degistirirseniz, `client/vite.config.js` proxy hedefini de guncelleyin.

## Onemli Backend Endpointleri

### Health

- `GET /api/health`

### Applications

- `POST /api/applications/analyze`
- `POST /api/applications/demo-analyze` deprecated, geriye uyumluluk icin calisir
- `GET /api/applications`
- `GET /api/applications/:id`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

### Export

- `POST /api/export/cv/pdf`
- `POST /api/export/cv/docx`
- `POST /api/export/cover-letter/pdf`
- `POST /api/export/cover-letter/docx`

### Account

- `GET /api/account/export`
- `DELETE /api/account/app-data`
- `DELETE /api/account`

### Usage

- `GET /api/usage/summary`

### Billing

- `POST /api/billing/create-checkout-session`
- `GET /api/billing/me`

### Webhook

- `POST /api/billing/webhook`

### Admin (AI Observability)

- `GET /api/admin/ai-usage` — LLM cagri telemetry ozeti (token/maliyet/latency, ajan bazli kirilim). Sadece `ADMIN_EMAILS` listesindeki kullanicilar erisebilir.

## Plan ve Kullanim Limiti

- `free`: 3 AI analiz/ay
- `pro`: 100 AI analiz/ay
- `unlimited`: sinirsiz/dev kullanim

Sadece AI analiz akisi kullanim sayar. PDF/DOCX export kullanim limitinden dusmez.

Giris yapmayan kullanicilar analiz sonucu alabilir, ancak sonuc kaydedilmez ve sayfa yenilenince kaybolabilir. Gecersiz veya eksik auth token ile korumali endpointler kullanilamaz.

## Gelistirme Notlari

- Frontend `/api` isteklerini Vite proxy ile backend'e yonlendirir.
- Stripe webhook route'u raw body gerektirdigi icin global `express.json()` middleware'inden once baglanir.
- Backend Supabase service role key ile DB islemi yapar; frontend dogrudan service role key kullanmaz.
- Auth olan analizlerde sonuc Supabase'e kaydedilir ve kullanim kaydi olusturulur.
- Export endpointleri AI cagirmadan, gelen metin iceriginden dosya uretir.

## AI Guvenilirlik & Gozlemlenebilirlik

Agent pipeline'inin (CV Parser -> Job Analyzer -> Match Scorer -> CV Writer ->
Cover Letter -> LinkedIn -> Gap Interview) uzerine asagidaki katmanlar eklendi:

- **Telemetry / maliyet-token takibi** (`server/src/llm/telemetry.js`,
  `llm/pricing.js`): her LLM cagrisi (token sayisi, tahmini USD maliyet,
  latency, basari/hata) yapilandirilmis log olarak yazilir ve
  `GET /api/admin/ai-usage` uzerinden ajan bazli ozetlenir.
- **Retry/backoff**: 429/5xx gibi gecici hatalarda us katlamali backoff ile
  otomatik retry (`llm/providers/openai.js`); 4xx hatalarinda retry yapilmaz.
- **Coklu saglayici soyutlamasi**: `llm/index.js` bir provider registry'dir;
  yeni bir LLM saglayicisi (`LLM_PROVIDER` env degiskeni) eklemek icin ajan
  kodlarina dokunmaya gerek yoktur.
- **Yapisal cikti dogrulama**: her ajanin JSON ciktisi Zod semasina
  (`agents/schemas.js`) karsi dogrulanir; uyumsuzluk akisi kirmaz ama
  loglanir — modelin semaya ne siklikla sadik kaldigi olculebilir.
- **Semantic halusinasyon kontrolu**: mevcut substring tabanli kontrole
  (`services/quality/antiHallucinationCheck.js`) ek olarak, esanlamli/kisaltma
  (orn. "JS" ~ "JavaScript") durumlarini embedding cosine similarity ile
  degerlendiren bir katman eklendi (`llm/embeddings.js`); sadece gercek
  supheli adaylar icin tetiklenir (gereksiz API maliyeti yok).
- **Prompt injection savunmasi** (`utils/promptSafety.js`): kullanici
  tarafindan saglanan serbest metin (CV, is ilani, gap cevaplari) rastgele
  nonce'li sinir token'lariyla sarilir ve acikca "veri, talimat degil" olarak
  isaretlenir; bilinen saldiri kaliplari ayrica loglanir.
- **Token-seviyesinde streaming**: CV Writer adiminda `generateRawStream`
  ile gercek token akisi SSE `token` event'i olarak UI'a iletilebilir
  (`?stream=1` ile; bozuk JSON gelirse sessizce non-streaming fallback).
- **Eval harness** (`server/evals/`): golden dataset (2 fixture: temiz
  eslesen TR vaka + bilerek eksik beceri iceren EN vaka) uzerinde tum
  pipeline'i gercek API cagrilariyla kosar; yapisal gecerlilik +
  deterministik halusinasyon/known-gap kontrolu + LLM-as-judge faithfulness
  skoru + onceki baseline'a gore regresyon karsilastirmasi yapar.
  `npm run eval` (baseline'i günceller: `npm run eval -- --update-baseline`).
  NOT: gercek OpenAI cagrisi yapar, kucuk bir maliyeti vardir.

## Bilinen Eksikler / Sonraki Isler

- Multer 2.x gecisi yapilacak.
- UI metinleri duzeltilecek.
- Bundle lazy loading yapilacak.
- Production security checklist hazirlanacak.
- Stripe Customer Portal eklenebilir.
- PayTR ayrica degerlendirilebilir.
- RAG / embedding-tabanli retrieval: bu urun icin dogal bir "bilgi tabani"
  olmadigindan (her analiz kendi CV+ilan ciftine ozel) kapsam disi
  birakildi; embedding kullanimi su an SADECE semantic halusinasyon
  kontrolunde (yukarida) var.
- Telemetry su an bellek-ici (process restart'ta sifirlanir); kalici/dagitik
  bir gozlemlenebilirlik ihtiyaci dogarsa Supabase tablosuna veya
  Langfuse/Helicone gibi bir araca tasinabilir — entegrasyon noktasi
  `llm/telemetry.js`'teki `recordLlmCall` fonksiyonudur.
