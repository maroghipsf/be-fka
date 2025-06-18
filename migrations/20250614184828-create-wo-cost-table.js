'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WO_Costs', {
      cost_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        comment: 'Kunci primer, ID unik untuk setiap jenis biaya dalam Working Order (UUID).'
      },
      wo_id: {
        type: Sequelize.UUID, // Ubah ke UUID
        allowNull: false,
        references: {
          model: 'WOs',
          key: 'wo_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Kunci asing yang menghubungkan ke tabel WOs.'
      },
      cost_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Jenis kategori biaya (misal: Biaya Buruh, Biaya Lembur, Biaya Petugas, Bongkar Muat, Pengiriman).'
      },
      amount_subtotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Jumlah biaya sebelum pajak untuk jenis biaya ini (subtotal).'
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Persentase pajak yang dikenakan pada biaya ini (misal PPN).'
      },
      total_amount_after_tax: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        comment: 'Total jumlah biaya setelah perhitungan pajak.'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Deskripsi singkat mengenai jenis biaya ini.'
      },
      cost_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal pencatatan biaya ini.'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu record biaya ini dibuat.'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir record biaya ini diperbarui.'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WO_Costs');
  }
};