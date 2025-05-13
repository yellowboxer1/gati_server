import express from 'express';
import { handleRouteRequest } from '../controllers/routeController.js';

const router = express.Router();

router.post('/', handleRouteRequest);

export default router;