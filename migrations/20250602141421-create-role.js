'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Roles', {
      role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk peran pengguna'
      },
      role_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Nama peran (misal: Admin, Manajer Keuangan, Staf PO)'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi peran'
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
      tableName: 'Roles',
      comment: 'Tabel untuk mendefinisikan peran pengguna dan hak akses',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Roles');
  }
};