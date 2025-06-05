'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AuditLogs', {
      log_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk log audit'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Jangan hapus user jika ada log auditnya
        comment: 'Foreign Key ke User yang melakukan aksi'
      },
      event_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Tanggal dan waktu kejadian'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Tindakan yang dilakukan (misal: CREATE, UPDATE, DELETE, TRANSFER)'
      },
      table_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nama tabel yang terpengaruh'
      },
      record_id: {
        type: Sequelize.UUID,
        comment: 'ID dari record yang terpengaruh'
      },
      old_value: {
        type: Sequelize.JSON,
        comment: 'Data sebelum perubahan (format JSON)'
      },
      new_value: {
        type: Sequelize.JSON,
        comment: 'Data setelah perubahan (format JSON)'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        comment: 'Alamat IP pengguna (opsional)'
      }
      // Tidak ada created_at/last_updated_at karena event_time sudah cukup
    }, {
      tableName: 'AuditLogs',
      comment: 'Tabel untuk mencatat setiap aktivitas penting pengguna demi auditabilitas',
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AuditLogs');
  }
};