import LegalPage from '../components/LegalPage.jsx';

const SECTIONS = [
  {
    heading: '1. Taraflar ve Kabul',
    body: 'ApplyReady ("Hizmet") hizmetini kullanarak bu Kullanım Koşullarını kabul etmiş olursunuz. Koşulları kabul etmiyorsanız hizmeti kullanmamalısınız.',
  },
  {
    heading: '2. Hizmetin Tanımı',
    body: 'ApplyReady; yüklediğiniz CV ve iş ilanı bilgilerine dayanarak hedefe özel CV, ön yazı ve LinkedIn profil önerileri üretir. Üretilen içerikler öneri niteliğindedir; doğruluğu ve uygunluğu kullanım öncesi sizin tarafınızdan kontrol edilmelidir.',
  },
  {
    heading: '3. Hesap ve Güvenlik',
    body: 'Hesap oluştururken doğru bilgi vermeyi ve şifrenizin gizliliğini korumayı kabul edersiniz. Hesabınız altında gerçekleşen işlemlerden siz sorumlusunuz.',
  },
  {
    heading: '4. Kullanıcı Sorumluluğu',
    body: [
      'Yüklediğiniz içeriklerin size ait olduğunu veya kullanım hakkına sahip olduğunuzu beyan edersiniz.',
      'Hizmeti hukuka aykırı, yanıltıcı veya üçüncü kişilerin haklarını ihlal eden amaçlarla kullanamazsınız.',
      'Üretilen içerikteki bilgilerin gerçeği yansıtmasından siz sorumlusunuz.',
    ],
  },
  {
    heading: '5. Abonelik ve Ödeme',
    body: 'Ücretsiz ve ücretli (Pro) planlar sunulur. Ücretli abonelikler Stripe üzerinden tahsil edilir ve plan koşullarında belirtilen kullanım limitlerine tabidir. Aboneliğinizi dilediğiniz zaman yönetebilir veya iptal edebilirsiniz.',
  },
  {
    heading: '6. Fikri Mülkiyet',
    body: 'Hizmetin arayüzü, markası ve yazılımı ApplyReady’e aittir. Sizin yüklediğiniz içerikler ve sizin için üretilen başvuru çıktıları size aittir.',
  },
  {
    heading: '7. Sorumluluğun Sınırlandırılması',
    body: 'Hizmet "olduğu gibi" sunulur. Üretilen içeriklerin bir işe alım sonucu doğuracağına dair garanti verilmez. Hizmetin kullanımından doğabilecek dolaylı zararlardan sorumlu tutulamayız.',
  },
  {
    heading: '8. Değişiklikler',
    body: 'Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler hizmet üzerinden duyurulur; güncel koşullar bu sayfada yayımlandığı andan itibaren geçerlidir.',
  },
  {
    heading: '9. İletişim',
    body: 'Sorularınız için: ahmetssagdasli@gmail.com.',
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Kullanım Koşulları"
      updatedAt="27 Haziran 2026"
      intro="Bu Kullanım Koşulları, ApplyReady hizmetini kullanımınıza ilişkin kuralları ve karşılıklı yükümlülükleri düzenler."
      sections={SECTIONS}
    />
  );
}
