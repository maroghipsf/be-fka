'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      if (models.Role) {
        User.belongsTo(models.Role, {
          foreignKey: 'role_id',
          as: 'role'
        });
      }
      if (models.Transaction) {
        User.hasMany(models.Transaction, {
          foreignKey: 'created_by',
          as: 'transactions'
        });
      }
      if (models.PurchaseOrder) {
        User.hasMany(models.PurchaseOrder, {
          foreignKey: 'created_by',
          as: 'purchaseOrders'
        });
      }
      // ... dan lainnya
    }
  }
  User.init({
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'UUID unik untuk pengguna'
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nama pengguna untuk login'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hash dari password pengguna'
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      comment: 'Email pengguna (untuk notifikasi, dll.)'
    },
    role_id: { // Foreign Key, tidak perlu mendefinisikan tipe di sini jika sudah ada di associate
      type: DataTypes.UUID,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Status aktivasi pengguna'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'last_updated_at',
    underscored: true,
    comment: 'Tabel untuk menyimpan data pengguna aplikasi'
  });
  return User;
};