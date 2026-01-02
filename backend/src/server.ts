import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRoutes);

// Uruchom scheduler (co 6 godzin)
startScheduler();

app.listen(PORT, () => {
  console.log(`✅ Backend działa na http://localhost:${PORT}`);
});
