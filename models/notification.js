'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      if (models.User) {
        Notification.belongsTo(models.User, {
          foreignKey: 'user_id',
          as: 'recipient'
        });
      }
    }
  }
  Notification.init({
    notification_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk notifikasi'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    event_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Tanggal dan waktu notifikasi dibuat'
    },
    notification_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tipe notifikasi (misal: Penarikan Dana, Transfer Antar Bank, Invoice Dibayar)'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Isi pesan notifikasi'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Status apakah notifikasi sudah dibaca'
    },
    is_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Status apakah notifikasi sudah dikirim (misal: email)'
    },
    sent_at: {
      type: DataTypes.DATE,
      comment: 'Timestamp saat notifikasi dikirim'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    timestamps: false,
    underscored: true,
    comment: 'Tabel untuk menyimpan data notifikasi yang akan dikirim atau ditampilkan kepada pengguna'
  });
  return Notification;
};