import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', apiRoutes);

// Start scheduler
startScheduler();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/v1`);
});
