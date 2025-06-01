import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 4000
  });
});

// 임시 사용자 등록 엔드포인트 (테스트용)
app.post('/api/users/register', (req, res) => {
  console.log('사용자 등록 요청 받음:', req.body);
  res.json({
    success: true,
    uuid: 'test-uuid-12345',
    message: '사용자 등록 완료 (테스트)'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT}`);
  console.log(`📊 헬스체크: http://144.24.74.3:${PORT}/health`);
});