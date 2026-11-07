import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware.js';
import {getEventDishes,setEventDishes} from '../controllers/eventDishController.js';
const router=Router();
router.use(authenticate);
router.get('/:eventId/dishes',getEventDishes);
router.put('/:eventId/dishes',setEventDishes);
export default router;
