import { getCombinedDirections } from '../services/tmapService.js';

export const handleRouteRequest = async (req, res) => {
  const { start, goal } = req.body;

  if (!start || !goal) {
    return res.status(400).json({ error: '출발지 또는 목적지 좌표가 없습니다.' });
  }

  try {
    const result = await getCombinedDirections(start, goal);
    return res.json(result);
  } catch (err) {
    console.error('경로 처리 실패:', err);
    return res.status(500).json({ error: '서버 내부 오류: 경로 계산 실패' });
  }
};