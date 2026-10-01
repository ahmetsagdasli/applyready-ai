// 404 - tanimsiz route
export function notFound(req, res, next) {
  res.status(404).json({
    status: 'error',
    message: `Not found: ${req.method} ${req.originalUrl}`,
  });
}

// Merkezi hata yakalayici
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Sunucu loglarinda detay
  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err.message);

  const body = {
    status: 'error',
    message: err.message || 'Internal server error',
  };
  // Varsa makine-okunur kod (frontend mevcut message okumayi surdurur).
  if (err.code) body.code = err.code;

  res.status(statusCode).json(body);
}
