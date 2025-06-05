'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Suppliers', {
      supplier_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'UUID unik untuk pemasok'
      },
      supplier_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nama pemasok'
      },
      address: {
        type: Sequelize.TEXT,
        comment: 'Alamat pemasok'
      },
      phone: {
        type: Sequelize.STRING(50),
        comment: 'Nomor telepon pemasok'
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        comment: 'Email pemasok'
      },
      npwp: {
        type: Sequelize.STRING(30),
        unique: true,
        comment: 'NPWP pemasok (opsional)'
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
      tableName: 'Suppliers',
      comment: 'Tabel untuk menyimpan data pemasok barang atau jasa',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Suppliers');
  }
};