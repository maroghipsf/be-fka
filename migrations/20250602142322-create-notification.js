'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notifications', {
      notification_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk notifikasi'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika user dihapus, notifikasinya juga bisa dihapus
        comment: 'Foreign Key ke User penerima notifikasi'
      },
      event_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Tanggal dan waktu notifikasi dibuat'
      },
      notification_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Tipe notifikasi (misal: Penarikan Dana, Transfer Antar Bank, Invoice Dibayar)'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Isi pesan notifikasi'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Status apakah notifikasi sudah dibaca'
      },
      is_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Status apakah notifikasi sudah dikirim (misal: email)'
      },
      sent_at: {
        type: Sequelize.DATE,
        comment: 'Timestamp saat notifikasi dikirim'
      }
      // Tidak ada created_at/last_updated_at tambahan karena event_time sudah cukup
    }, {
      tableName: 'Notifications',
      comment: 'Tabel untuk menyimpan data notifikasi yang akan dikirim atau ditampilkan kepada pengguna',
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Notifications');
  }
};