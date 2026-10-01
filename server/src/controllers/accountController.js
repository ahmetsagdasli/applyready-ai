import {
  exportAccountData,
  deleteApplicationData,
  deleteAccountData,
  deleteAuthUser,
} from '../services/accountStore.js';
import { cancelSubscriptionIfAny } from '../services/billingStore.js';

// GET /api/account/export  (auth zorunlu)
// Kullanicinin tum uygulama verisini JSON olarak doner (dosya indirme uyumlu).
export async function exportAccount(req, res, next) {
  try {
    const data = await exportAccountData({ userId: req.user.id });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="applyready-account-export.json"'
    );
    return res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/account/app-data  (auth zorunlu)
// Sadece basvuru kayitlarini siler; hesap acik kalir.
export async function deleteAppData(req, res, next) {
  try {
    const { deletedApplications } = await deleteApplicationData({
      userId: req.user.id,
    });
    return res.json({
      status: 'ok',
      message: 'Uygulama verileriniz silindi.',
      deletedApplications,
    });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/account  (auth zorunlu)
// Basvurular + profil silinir, ardindan auth kullanicisi silinmeye calisilir.
export async function deleteAccount(req, res, next) {
  try {
    // Hesap silinmeden once aktif Stripe aboneligini iptal etmeyi dene (non-fatal).
    // Stripe yapilandirilmamissa veya hata olursa silme yine de devam eder.
    try {
      await cancelSubscriptionIfAny({ userId: req.user.id });
    } catch (cancelErr) {
      console.error('[account] abonelik iptali atlandi:', cancelErr.message);
    }

    await deleteAccountData({ userId: req.user.id });

    // Auth kullanicisini silmeyi dene; bu adim basarisiz olsa bile uygulama
    // verileri zaten silinmistir. Durumu mesajda netlestir.
    try {
      await deleteAuthUser({ userId: req.user.id });
    } catch (authErr) {
      const err = new Error(
        'Uygulama verileriniz silindi, ancak hesabiniz (kimlik) silinemedi. Lutfen destek ile iletisime gecin.'
      );
      err.statusCode = 500;
      err.code = 'AUTH_USER_DELETE_FAILED';
      console.error('[account] auth user silme hatasi:', authErr.message);
      return next(err);
    }

    return res.json({
      status: 'ok',
      message: 'Hesabiniz ve uygulama verileriniz silindi.',
    });
  } catch (err) {
    return next(err);
  }
}
