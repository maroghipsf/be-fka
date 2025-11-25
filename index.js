require('dotenv').config(); 
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');

// Import routes
const warehouseRoutes = require('./routes/warehouseRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const itemRoutes = require('./routes/itemRoutes');
const accountRoutes = require('./routes/accountRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const poRoutes = require('./routes/poRoutes');
const interestConfigurationRoutes = require('./routes/interestConfigurationRoutes');
const taxConfigurationRoutes = require('./routes/taxConfigurationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const woLogisticEventRoutes = require('./routes/woLogisticEventRoutes');

app.use(express.json());
app.use(cors());

// --- MENGGUNAKAN ROUTES ---
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/interest-configs', interestConfigurationRoutes);
app.use('/api/tax-configurations', taxConfigurationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/working-orders', workOrderRoutes);
app.use('/api/wo-logistic-events', woLogisticEventRoutes);

app.get('/', (req, res) => {
  res.send('Finance App is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});