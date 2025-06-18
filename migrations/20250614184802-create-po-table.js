'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('POs', {
      po_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // Menggunakan UUID v4 sebagai default
        comment: 'Kunci primer, ID unik untuk setiap Purchase Order (UUID).'
      },
      status_po: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Creation',
        comment: 'Status Purchase Order (misal: Creation, Release, Completed).'
      },
      project: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nama proyek terkait Purchase Order ini.'
      },
      sdip_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Nomor SDIP terkait Purchase Order ini.'
      },
      party_ton: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Jumlah party yang seharus nya di kirim'
      },
      po_date: {
        type: Sequelize.DATEONLY, // Hanya tanggal, tanpa waktu
        allowNull: false,
        comment: 'Tanggal Purchase Order dibuat.'
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'Keterangan tambahan atau deskripsi Purchase Order.'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu record Purchase Order ini dibuat.'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir record Purchase Order ini diperbarui.'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('POs');
  }
};