const responseHandler = require('../utils/responseHandler');
const { WOLogisticEvent, WO, sequelize } = require('../models');

/**
 * GET /wo-logistic-events?wo_id=xxx
 * Ambil semua logistic events berdasarkan wo_id (query)
 */
exports.getLogisticEvents = async (req, res) => {
  try {
    const { wo_id } = req.query;

    if (!wo_id) {
      return responseHandler(res, 400, "error", "Parameter wo_id wajib diisi.", null, {
        fields: ["wo_id"],
      });
    }

    const events = await WOLogisticEvent.findAll({
      where: { wo_id },
      order: [["event_timestamp", "ASC"]],
    });

    return responseHandler(res, 200, "success", "Data logistic event berhasil ditemukan.", events);

  } catch (error) {
    console.error("Error fetching logistic events:", error);
    return responseHandler(res, 500, "error",
      "Terjadi kesalahan server saat mengambil data logistic events.",
      null,
      error.message
    );
  }
};


/**
 * GET /wo-logistic-events/:event_id
 * Detail 1 event berdasarkan event_id
 */
exports.getLogisticEventById = async (req, res) => {
  try {
    const { event_id } = req.params;

    const event = await WOLogisticEvent.findByPk(event_id);

    if (!event) {
      return responseHandler(res, 404, "fail", `Event logistic dengan ID ${event_id} tidak ditemukan.`);
    }

    return responseHandler(res, 200, "success", "Detail logistic event ditemukan.", event);

  } catch (error) {
    console.error("Error fetching logistic event by ID:", error);
    return responseHandler(res, 500, "error",
      "Terjadi kesalahan server saat mengambil detail event.",
      null,
      error.message
    );
  }
};


/**
 * POST /wo-logistic-events
 * Tambah logistic event baru
 */
exports.createLogisticEvent = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      wo_id,
      event_type,
      event_timestamp,
      location,
      additional_notes,
      photo_url,
      responsible_party_name,
      signature_url,
      gross_weight_kg
    } = req.body;

    // Validasi minimal
    if (!wo_id || !event_type || !event_timestamp) {
      await transaction.rollback();
      return responseHandler(res, 400, "error",
        "wo_id, event_type, dan event_timestamp wajib diisi.",
        null,
        { fields: ["wo_id", "event_type", "event_timestamp"] }
      );
    }

    // Pastikan Work Order ada
    const wo = await WO.findByPk(wo_id, { transaction });
    if (!wo) {
      await transaction.rollback();
      return responseHandler(res, 404, "fail",
        `Work Order dengan ID ${wo_id} tidak ditemukan.`, null,
        { fields: ["wo_id"] }
      );
    }

    // Buat event logistic
    const newEvent = await WOLogisticEvent.create(
      {
        wo_id,
        event_type,
        event_timestamp,
        location,
        additional_notes,
        photo_url,
        responsible_party_name,
        signature_url,
        gross_weight_kg
      },
      { transaction }
    );

    await transaction.commit();

    return responseHandler(res, 201, "success", "Event logistic berhasil ditambahkan.", newEvent);

  } catch (error) {
    await transaction.rollback();
    console.error("Error creating logistic event:", error);
    return responseHandler(res, 500, "error",
      "Terjadi kesalahan server saat menambahkan logistic event.",
      null,
      error.message
    );
  }
};


/**
 * PUT /wo-logistic-events/:event_id
 * Update logistic event
 */
exports.updateLogisticEvent = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { event_id } = req.params;

    const event = await WOLogisticEvent.findByPk(event_id, { transaction });
    if (!event) {
      await transaction.rollback();
      return responseHandler(res, 404, "fail",
        `Event logistic dengan ID ${event_id} tidak ditemukan.`
      );
    }

    await event.update(req.body, { transaction });

    await transaction.commit();

    return responseHandler(res, 200, "success", "Event logistic berhasil diperbarui.", event);

  } catch (error) {
    await transaction.rollback();
    console.error("Error updating logistic event:", error);
    return responseHandler(res, 500, "error",
      "Terjadi kesalahan server saat memperbarui event.",
      null,
      error.message
    );
  }
};


/**
 * DELETE /wo-logistic-events/:event_id
 */
exports.deleteLogisticEvent = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { event_id } = req.params;

    const event = await WOLogisticEvent.findByPk(event_id, { transaction });
    if (!event) {
      await transaction.rollback();
      return responseHandler(res, 404, "fail",
        `Event logistic dengan ID ${event_id} tidak ditemukan.`
      );
    }

    await event.destroy({ transaction });
    await transaction.commit();

    return responseHandler(res, 200, "success", "Event logistic berhasil dihapus.");

  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting logistic event:", error);
    return responseHandler(res, 500, "error",
      "Terjadi kesalahan server saat menghapus event.",
      null,
      error.message
    );
  }
};
