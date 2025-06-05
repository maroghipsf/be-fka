'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      if (models.User) {
        AuditLog.belongsTo(models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }
    }
  }
  AuditLog.init({
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk log audit'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    event_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Menggunakan DataTypes.NOW untuk default timestamp
      comment: 'Tanggal dan waktu kejadian'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tindakan yang dilakukan (misal: CREATE, UPDATE, DELETE, TRANSFER)'
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama tabel yang terpengaruh'
    },
    record_id: {
      type: DataTypes.UUID,
      comment: 'ID dari record yang terpengaruh'
    },
    old_value: {
      type: DataTypes.JSON,
      comment: 'Data sebelum perubahan (format JSON)'
    },
    new_value: {
      type: DataTypes.JSON,
      comment: 'Data setelah perubahan (format JSON)'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      comment: 'Alamat IP pengguna (opsional)'
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'AuditLogs',
    timestamps: false, // Hanya ada event_time
    underscored: true,
    comment: 'Tabel untuk mencatat setiap aktivitas penting pengguna demi auditabilitas'
  });
  return AuditLog;
};