'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // --- Menambahkan kolom baru ---
    await queryInterface.addColumn('Transactions', 'transaction_type', {
      type: Sequelize.STRING,
      allowNull: false, // Karena ini field penting, set not null
      after: 'transaction_date' // Opsional: Atur posisi kolom
    });

    await queryInterface.addColumn('Transactions', 'total_amount', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false, // Karena ini field penting, set not null
      after: 'description' // Asumsi 'description' sudah ada, jika tidak, sesuaikan posisi
    });

    await queryInterface.addColumn('Transactions', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true, // Notes bisa null
      after: 'total_amount'
    });

    // --- Menambahkan kolom related_po_id (Foreign Key) ---
    // Pastikan tabel 'PurchaseOrders' sudah ada sebelum menambahkan FK ini
    await queryInterface.addColumn('Transactions', 'related_po_id', {
      type: Sequelize.UUID,
      allowNull: true, // Bisa null jika transaksi tidak terkait dengan PO
      references: {
        model: 'PurchaseOrders', // Nama tabel yang diacu (sesuai definisi model Sequelize Anda, biasanya plural)
        key: 'po_id', // Primary key dari tabel PurchaseOrders
      },
      onUpdate: 'CASCADE', // Jika purchase_order_id di tabel PurchaseOrders berubah, update juga di sini
      onDelete: 'SET NULL', // Jika Purchase Order dihapus, set related_po_id menjadi null
      after: 'created_by' // Atau di posisi yang Anda inginkan
    });

    // --- Menghapus kolom reference_number ---
    // Pastikan kolom ini memang ada sebelum dihapus. Jika tidak ada, baris ini akan error.
    // Jika Anda tidak yakin apakah itu ada, Anda bisa membungkusnya dalam try-catch
    // atau memeriksanya terlebih dahulu (meskipun Sequelize CLI biasanya lebih langsung)
    try {
        await queryInterface.removeColumn('Transactions', 'reference_number');
    } catch (error) {
        console.warn('Column reference_number might not exist or failed to remove:', error.message);
        // Lanjutkan saja, mungkin kolom ini sudah dihapus sebelumnya atau memang tidak ada.
    }
  },

  down: async (queryInterface, Sequelize) => {
    // --- Mengembalikan kolom reference_number ---
    await queryInterface.addColumn('Transactions', 'reference_number', {
      type: Sequelize.STRING, // Sesuaikan tipe data asli jika berbeda
      allowNull: true, // Sesuaikan allowNull asli jika berbeda
    });

    // --- Menghapus kolom yang baru ditambahkan (urutan kebalikan dari `up`) ---
    await queryInterface.removeColumn('Transactions', 'related_po_id');
    await queryInterface.removeColumn('Transactions', 'notes');
    await queryInterface.removeColumn('Transactions', 'total_amount');
    await queryInterface.removeColumn('Transactions', 'transaction_type');
  }
};