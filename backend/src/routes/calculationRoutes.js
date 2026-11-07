import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware.js';
import {calculateEvent} from '../controllers/calculationController.js';
const router=Router();
router.use(authenticate);
router.get('/events/:eventId/quantities',(req,res,next)=>{req.params.kind='quantities';return calculateEvent(req,res,next);});
router.get('/events/:eventId/ingredients',(req,res,next)=>{req.params.kind='ingredients';return calculateEvent(req,res,next);});
export default router;
