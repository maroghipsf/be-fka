const responseHandler = require('../utils/responseHandler');
const { AuditLog, User } = require('../models'); // Pastikan path ini benar

// --- FUNGSI UNTUK MENDAPATKAN SEMUA LOG AUDIT ---
exports.getAllAuditLogs = async (req, res) => {
  try {
    // Implementasi filter, pagination, sorting akan ditambahkan di sini jika diperlukan
    const { page = 1, limit = 10, userId, action, tableName, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (userId) whereClause.user_id = userId;
    if (action) whereClause.action = action;
    if (tableName) whereClause.table_name = tableName;
    if (startDate || endDate) {
      whereClause.event_time = {};
      if (startDate) whereClause.event_time[Op.gte] = new Date(startDate);
      if (endDate) whereClause.event_time[Op.lte] = new Date(endDate);
    }

    const { count, rows: auditLogs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user', // Sesuai dengan alias di model AuditLog
          attributes: ['user_id', 'username', 'email'], // Ambil data user yang relevan
        },
      ],
      order: [['event_time', 'DESC']], // Urutkan dari yang terbaru
      limit: parseInt(limit),
      offset: offset,
    });

    if (!auditLogs || auditLogs.length === 0) {
      return responseHandler(res, 404, 'fail', 'Tidak ada riwayat audit ditemukan.');
    }

    const meta = {
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    };

    return responseHandler(res, 200, 'success', 'Riwayat audit berhasil ditemukan.', auditLogs, null, meta);
  } catch (error) {
    console.error('Error fetching all audit logs:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil riwayat audit.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENDAPATKAN LOG AUDIT BERDASARKAN ID ---
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'username', 'email'],
        },
      ],
    });

    if (!auditLog) {
      return responseHandler(res, 404, 'fail', `Log Audit dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Log Audit berhasil ditemukan.', auditLog);
  } catch (error) {
    console.error('Error fetching audit log by ID:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat mengambil log audit.', null, error.message);
  }
};

// --- FUNGSI UNTUK MENGHAPUS LOG AUDIT (opsional, dengan hak akses sangat terbatas) ---
// Biasanya ini hanya untuk maintenance atau kebijakan penyimpanan data
exports.deleteAuditLog = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await AuditLog.destroy({
      where: { log_id: id },
    });

    if (deletedRows === 0) {
      return responseHandler(res, 404, 'fail', `Log Audit dengan ID ${id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, 'success', 'Log Audit berhasil dihapus.');
  } catch (error) {
    console.error('Error deleting audit log:', error);
    return responseHandler(res, 500, 'error', 'Terjadi kesalahan server saat menghapus log audit.', null, error.message);
  }
};