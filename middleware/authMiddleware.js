const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler'); // Untuk format respons standar

// Load environment variables (pastikan ini di app.js)
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware untuk memverifikasi JWT
exports.authenticateToken = (req, res, next) => {
  // Ambil token dari header Authorization
  // Biasanya formatnya: "Bearer TOKEN_ANDA"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Ambil bagian TOKEN_ANDA

  if (token == null) {
    // Jika tidak ada token
    return responseHandler(res, 401, 'fail', 'Akses ditolak: Tidak ada token autentikasi disediakan.', null, {
        message: 'No authentication token provided'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Jika token tidak valid (misal: kadaluarsa, salah secret)
      console.error('JWT verification error:', err.message);
      return responseHandler(res, 403, 'fail', 'Token autentikasi tidak valid atau kadaluarsa.', null, {
          message: 'Invalid or expired token',
          error: err.message
      });
    }

    // Jika token valid, simpan payload user di objek request
    // Ini akan membuat user.id dan user.role tersedia di controller berikutnya
    req.user = user;
    next(); // Lanjutkan ke middleware/controller berikutnya
  });
};

// Middleware untuk otorisasi berdasarkan peran (contoh)
// exports.authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.role) {
//       return responseHandler(res, 403, 'fail', 'Akses ditolak: Informasi peran pengguna tidak tersedia.', null, {
//           message: 'User role information missing'
//       });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return responseHandler(res, 403, 'fail', `Akses ditolak: Peran Anda (${req.user.role}) tidak memiliki izin untuk tindakan ini.`, null, {
//           message: 'Insufficient permissions'
//       });
//     }
//     next();
//   };
// };