import axios from 'axios';
import { calculateDistance } from '../utils/locationUtils.js';
import dotenv from 'dotenv';

dotenv.config();
const TMAP_APP_KEY = process.env.TMAP_APP_KEY;

export const getPedestrianDirections = async (start, goal) => {
  const response = await axios.post(
    'https://apis.openapi.sk.com/tmap/routes/pedestrian',
    {
      startX: start.longitude.toString(),
      startY: start.latitude.toString(),
      endX: goal.longitude.toString(),
      endY: goal.latitude.toString(),
      startName: '출발지',
      endName: '목적지',
      format: 'json',
    },
    {
      headers: {
        appKey: TMAP_APP_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const features = response.data.features;
  const walk = [];
  const instructions = [];

  for (const feature of features) {
    const { geometry, properties } = feature;

    if (geometry.type === 'LineString') {
      geometry.coordinates.forEach(([lon, lat]) => {
        walk.push({ latitude: lat, longitude: lon });
      });
    }

    if (geometry.type === 'Point' && properties) {
      const [lon, lat] = geometry.coordinates;
      instructions.push({
        type: convertTurnTypeToType(properties.turnType),
        description: properties.description || '',
        position: { latitude: lat, longitude: lon },
        turnType: properties.turnType
      });
    }
  }

  return {
    route: {
      walk,
      subway: [],
      bus: []
    },
    instructions,
    routeType: 'pedestrian'
  };
};

export const getTransitDirections = async (start, goal) => {
  const response = await axios.post(
    'https://apis.openapi.sk.com/transit/routes',
    {
      startX: start.longitude.toString(),
      startY: start.latitude.toString(),
      endX: goal.longitude.toString(),
      endY: goal.latitude.toString(),
      count: 1,
      lang: 0,
      format: 'json'
    },
    {
      headers: {
        appKey: TMAP_APP_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  const itinerary = response.data.metaData?.plan?.itineraries?.[0];
  if (!itinerary) throw new Error('대중교통 경로 없음');

  const walk = [];
  const subway = [];
  const bus = [];
  const instructions = [];

  instructions.push({
    type: 'start',
    description: '출발지입니다.',
    position: start
  });

  for (const leg of itinerary.legs) {
    if (leg.mode === 'WALK') {
      for (const step of leg.steps) {
        if (!step.linestring) continue;
        const coords = step.linestring.split(' ').map(s => {
          const [lon, lat] = s.split(',').map(Number);
          return { latitude: lat, longitude: lon };
        });
        walk.push(...coords);
        instructions.push({
          type: 'direction',
          description: step.description,
          position: coords[0]
        });
      }
    } else if (leg.mode === 'SUBWAY' && leg.passShape) {
      const coords = leg.passShape.linestring.split(' ').map(s => {
        const [lon, lat] = s.split(',').map(Number);
        return { latitude: lat, longitude: lon };
      });
      subway.push(...coords);
      instructions.push({
        type: 'subway',
        description: `${leg.route} 지하철 탑승`,
        position: coords[0]
      });
    } else if (leg.mode === 'BUS' && leg.passShape) {
      const coords = leg.passShape.linestring.split(' ').map(s => {
        const [lon, lat] = s.split(',').map(Number);
        return { latitude: lat, longitude: lon };
      });
      bus.push(...coords);
      instructions.push({
        type: 'bus',
        description: `${leg.route} 버스 탑승`,
        position: coords[0]
      });
    }
  }

  instructions.push({
    type: 'destination',
    description: '목적지에 도착했습니다.',
    position: goal
  });

  return {
    route: { walk, subway, bus },
    instructions,
    routeType: 'transit'
  };
};

export const getCombinedDirections = async (start, goal) => {
  const distance = calculateDistance(
    start.latitude,
    start.longitude,
    goal.latitude,
    goal.longitude
  );

  if (distance <= 500) {
    return await getPedestrianDirections(start, goal);
  }

  try {
    return await getTransitDirections(start, goal);
  } catch (err) {
    console.warn('대중교통 실패 → 도보 fallback');
    return await getPedestrianDirections(start, goal);
  }
};

const convertTurnTypeToType = (turnType) => {
  switch (turnType) {
    case 200: return 'start';
    case 201: return 'destination';
    case 211: case 212: case 213: return 'crosswalk';
    case 12: return 'left';
    case 13: return 'right';
    case 11: return 'straight';
    case 125: return 'overpass';
    case 126: return 'underground';
    case 127: return 'stairs';
    case 128: return 'ramp';
    default: return 'direction';
  }
};
