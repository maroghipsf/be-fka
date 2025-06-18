'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WO_Cost_Details', {
      detail_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        comment: 'Kunci primer, ID unik untuk setiap detail sub-biaya (UUID).'
      },
      cost_id: {
        type: Sequelize.UUID, // Ubah ke UUID
        allowNull: false,
        references: {
          model: 'WO_Costs', // Nama tabel yang direferensikan
          key: 'cost_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Kunci asing yang menghubungkan ke tabel WO_Costs.'
      },
      detail_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nama detail sub-biaya (misal: Tarif, Jumlah, KGS).'
      },
      detail_value: {
        type: Sequelize.DECIMAL(18, 4), // Menggunakan presisi lebih tinggi
        allowNull: false,
        comment: 'Nilai numerik dari detail sub-biaya.'
      },
      unit: {
        type: Sequelize.STRING(50),
        comment: 'Satuan dari nilai detail (misal: IDR, Unit, Kg).'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu record detail biaya ini dibuat.'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir record detail biaya ini diperbarui.'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WO_Cost_Details');
  }
};