'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WOLogisticEvent extends Model {
    static associate(models) {
      WOLogisticEvent.belongsTo(models.WO, {
        foreignKey: 'wo_id',
        as: 'workingOrder'
      });
    }
  }
  WOLogisticEvent.init({
    event_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      comment: 'Kunci primer, ID unik untuk setiap event logistik (UUID).'
    },
    wo_id: {
      type: DataTypes.UUID, // Ubah ke UUID
      allowNull: false,
      comment: 'Kunci asing yang menghubungkan ke tabel WOs.'
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Jenis event logistik (misal: Loading, Dispatch, Dishub Verify, Arrival, Unloading Start, Delivered).'
    },
    event_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Tanggal dan waktu terjadinya event logistik.'
    },
    location: {
      type: DataTypes.STRING(255),
      comment: 'Lokasi geografis saat event terjadi.'
    },
    additional_notes: {
      type: DataTypes.TEXT,
      comment: 'Catatan tambahan atau detail spesifik terkait event.'
    },
    photo_url: {
      type: DataTypes.STRING(255),
      comment: 'URL atau path ke file foto terkait event.'
    },
    responsible_party_name: {
      type: DataTypes.STRING(100),
      comment: 'Nama pihak yang bertanggung jawab atau terlibat dalam event (misal: pengirim, penerima).'
    },
    signature_url: {
      type: DataTypes.STRING(255),
      comment: 'URL atau path ke file gambar tanda tangan yang terkait dengan event.'
    },
    gross_weight_kg: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Berat bruto barang dalam kilogram (khusus untuk event Bongkar Muat Pengirim).'
    },
  }, {
    sequelize,
    modelName: 'WOLogisticEvent',
    tableName: 'WO_Logistic_Events',
    timestamps: true,
    underscored: true
  });
  return WOLogisticEvent;
};