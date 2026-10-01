import LegalPage from '../components/LegalPage.jsx';

const SECTIONS = [
  {
    heading: '1. Veri Sorumlusunun Kimliği',
    body: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verileriniz, veri sorumlusu sıfatıyla ApplyReady tarafından işlenmektedir. İletişim: ahmetssagdasli@gmail.com.',
  },
  {
    heading: '2. İşlenen Kişisel Veriler',
    body: [
      'Kimlik ve iletişim: e-posta adresi.',
      'Özgeçmiş içeriği: CV metni/dosyaları, iş ilanı metinleri, hedef pozisyon bilgisi ve üretilen başvuru içerikleri.',
      'İşlem güvenliği ve kullanım: hesap aktivitesi, başvuru sayısı ve abonelik durumu.',
    ],
  },
  {
    heading: '3. İşleme Amaçları',
    body: 'Kişisel verileriniz; hizmetin sunulması, başvuru içeriklerinin üretilmesi ve saklanması, sözleşmenin (abonelik) ifası, kullanım limitlerinin işletilmesi, bilgi güvenliğinin sağlanması ve hukuki yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.',
  },
  {
    heading: '4. Hukuki Sebepler',
    body: 'Verileriniz; bir sözleşmenin kurulması veya ifası için gerekli olması, hukuki yükümlülüğün yerine getirilmesi, meşru menfaat ve gerektiğinde açık rızanız hukuki sebeplerine dayanılarak işlenir (KVKK m. 5).',
  },
  {
    heading: '5. Aktarım',
    body: 'Kişisel verileriniz; kimlik doğrulama, ödeme altyapısı ve yapay zeka içerik üretimi hizmetleri için yurt içinde ve/veya yurt dışında bulunan hizmet sağlayıcılarına, yalnızca hizmetin sunulması amacıyla ve gerekli güvenlik tedbirleri alınarak aktarılabilir.',
  },
  {
    heading: '6. İlgili Kişinin Hakları (KVKK m. 11)',
    body: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını öğrenme, düzeltilmesini/silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.',
  },
  {
    heading: '7. Başvuru Yöntemi',
    body: 'KVKK kapsamındaki taleplerinizi ahmetssagdasli@gmail.com adresine ileterek kullanabilirsiniz. Talepleriniz en kısa sürede ve en geç 30 gün içinde sonuçlandırılır.',
  },
];

export default function Kvkk() {
  return (
    <LegalPage
      title="KVKK Aydınlatma Metni"
      updatedAt="27 Haziran 2026"
      intro="6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verilerinizin işlenmesine ilişkin olarak sizi bilgilendirmek amacıyla hazırlanmıştır."
      sections={SECTIONS}
    />
  );
}
