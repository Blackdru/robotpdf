
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload routes
const fileUploadRoutes = require('./routes/fileUpload');
app.use('/api/files', fileUploadRoutes);

// Mock endpoints for test environment
if (process.env.NODE_ENV === 'test') {
  const mockAdvancedEndpoints = require('./routes/mockAdvancedEndpoints');
  app.use('/api/pdf/advanced', mockAdvancedEndpoints);
  console.log('🧪 Mock advanced endpoints loaded for testing');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
