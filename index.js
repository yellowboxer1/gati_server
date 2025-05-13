import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routeRouter from './routes/route.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/route', routeRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT}`);
  });