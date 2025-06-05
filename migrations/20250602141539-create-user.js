'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk pengguna'
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nama pengguna untuk login'
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Hash dari password pengguna'
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        comment: 'Email pengguna (untuk notifikasi, dll.)'
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Roles', // Nama tabel yang direferensikan
          key: 'role_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Sesuaikan dengan kebijakan Anda
        comment: 'Foreign Key ke tabel Roles'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Status aktivasi pengguna'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp pembuatan record'
      },
      last_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Timestamp terakhir update record'
      }
    }, {
      tableName: 'Users',
      comment: 'Tabel untuk menyimpan data pengguna aplikasi',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};