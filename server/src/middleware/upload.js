import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Dosya diske/DB'ye yazilmaz; bellekte tutulur ve istek bitince serbest birakilir.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const err = new Error('Sadece PDF dosyalari kabul edilir.');
    err.statusCode = 400;
    cb(err);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// 'cvFile' alanini tek dosya olarak isler ve multer hatalarini
// kullaniciya anlamli mesaja cevirir.
export function uploadCvFile(req, res, next) {
  upload.single('cvFile')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'error',
          message: 'Dosya boyutu 5MB sinirini asiyor.',
        });
      }
      return res.status(400).json({ status: 'error', message: err.message });
    }

    return res
      .status(err.statusCode || 400)
      .json({ status: 'error', message: err.message });
  });
}
