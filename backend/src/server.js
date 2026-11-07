import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import eventDishRoutes from './routes/eventDishRoutes.js';
import {dishRoutes,ingredientRoutes} from './routes/catalogRoutes.js';
import planningRoutes from './routes/planningRoutes.js';
import calculationRoutes from './routes/calculationRoutes.js';

dotenv.config();
const app=express();
const PORT=process.env.PORT || 5000;
app.use(cors());
app.use(express.json({limit:'100kb'}));
app.use('/api/auth',authRoutes);
app.use('/api/events',eventRoutes);
app.use('/api/events',eventDishRoutes);
app.use('/api/dishes',dishRoutes);
app.use('/api/ingredients',ingredientRoutes);
app.use('/api/planning',planningRoutes);
app.use('/api/calculate',calculationRoutes);
app.get('/',(_req,res)=>res.json({message:'Welcome to MealMate API'}));
app.get('/api/health',(_req,res)=>res.status(200).json({status:'success',message:'MealMate backend is running'}));
app.get('/api/db-health',async(_req,res)=>{
  try{await prisma.$queryRaw`SELECT 1`;res.json({status:'success',message:'PostgreSQL database connected successfully'});}
  catch(e){console.error('Database health check error',e);res.status(500).json({status:'error',message:'Database connection failed'});}
});
app.listen(PORT,()=>console.log(`MealMate server running on port ${PORT}`));
