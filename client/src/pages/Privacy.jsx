import LegalPage from '../components/LegalPage.jsx';

const SECTIONS = [
  {
    heading: '1. Veri Sorumlusu',
    body: 'ApplyReady ("Hizmet"), aşağıda belirtilen kişisel verileri bu Gizlilik Politikası kapsamında işler. Sorularınız için ahmetssagdasli@gmail.com adresinden veya WhatsApp (+90 541 862 9323) üzerinden bize ulaşabilirsiniz.',
  },
  {
    heading: '2. İşlenen Veriler',
    body: [
      'Hesap bilgileri: e-posta adresiniz ve şifreniz (şifreler tarafımızca okunamaz biçimde, kimlik doğrulama sağlayıcımız aracılığıyla saklanır).',
      'Başvuru içerikleri: yüklediğiniz CV metni/dosyaları, iş ilanı metinleri, hedef pozisyon ve oluşturulan CV, ön yazı ve LinkedIn önerileri.',
      'Kullanım verileri: hazırladığınız başvuru sayısı ve plan/abonelik durumunuz.',
      'Ödeme verileri: ödemeler Stripe üzerinden alınır; kart bilgileriniz tarafımızca görülmez veya saklanmaz.',
    ],
  },
  {
    heading: '3. İşleme Amaçları',
    body: 'Verileriniz; hizmeti sunmak (CV/ön yazı/LinkedIn içeriği üretmek), başvurularınızı kaydedip yönetmenizi sağlamak, abonelik ve kullanım limitlerini işletmek, güvenliği sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.',
  },
  {
    heading: '4. Yapay Zeka İşleme',
    body: 'CV ve içerik üretimi için metinleriniz yapay zeka servis sağlayıcılarına iletilebilir. Bu içerikler yalnızca sizin talebinizi yerine getirmek için kullanılır.',
  },
  {
    heading: '5. Saklama ve Silme',
    body: 'Başvurularınız siz silene veya hesabınız kapatılana kadar saklanır. Dashboard üzerinden istediğiniz başvuruyu silebilirsiniz. Hesabınızın tamamen silinmesini talep etmek için bizimle iletişime geçebilirsiniz.',
  },
  {
    heading: '6. Üçüncü Taraf Hizmetler',
    body: 'Hizmetin çalışması için kimlik doğrulama (Supabase), ödeme (Stripe) ve yapay zeka sağlayıcıları gibi üçüncü taraf hizmetler kullanılır. Bu sağlayıcılar kendi gizlilik politikalarına tabidir.',
  },
  {
    heading: '7. Haklarınız',
    body: 'Kişisel verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için ahmetssagdasli@gmail.com adresine yazabilirsiniz.',
  },
  {
    heading: '8. İletişim',
    body: 'Bu politikayla ilgili her türlü soru için: ahmetssagdasli@gmail.com.',
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      updatedAt="27 Haziran 2026"
      intro="Bu Gizlilik Politikası, ApplyReady'i kullandığınızda hangi kişisel verilerin işlendiğini, hangi amaçlarla kullanıldığını ve haklarınızı açıklar."
      sections={SECTIONS}
    />
  );
}
