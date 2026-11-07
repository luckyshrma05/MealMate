import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware.js';
import {createEvent,getEvents,getEventById,updateEvent,deleteEvent} from '../controllers/eventController.js';
const router=Router();
router.use(authenticate);
router.route('/').post(createEvent).get(getEvents);
router.route('/:id').get(getEventById).put(updateEvent).delete(deleteEvent);
export default router;
