'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WO_Logistic_Events', {
      event_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        comment: 'Kunci primer, ID unik untuk setiap event logistik (UUID).'
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
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Jenis event logistik (misal: Loading, Dispatch, Dishub Verify, Arrival, Unloading Start, Delivered).'
      },
      event_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Tanggal dan waktu terjadinya event logistik.'
      },
      location: {
        type: Sequelize.STRING(255),
        comment: 'Lokasi geografis saat event terjadi.'
      },
      additional_notes: {
        type: Sequelize.TEXT,
        comment: 'Catatan tambahan atau detail spesifik terkait event.'
      },
      photo_url: {
        type: Sequelize.STRING(255),
        comment: 'URL atau path ke file foto terkait event.'
      },
      responsible_party_name: {
        type: Sequelize.STRING(100),
        comment: 'Nama pihak yang bertanggung jawab atau terlibat dalam event (misal: pengirim, penerima).'
      },
      signature_url: {
        type: Sequelize.STRING(255),
        comment: 'URL atau path ke file gambar tanda tangan yang terkait dengan event.'
      },
      gross_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        comment: 'Berat bruto barang dalam kilogram (khusus untuk event Bongkar Muat Pengirim).'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu record event ini dibuat.'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir record event ini diperbarui.'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WO_Logistic_Events');
  }
};