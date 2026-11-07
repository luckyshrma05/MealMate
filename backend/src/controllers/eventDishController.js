import prisma from '../db.js';
import {positiveId,positiveInt,validateObject,sendError} from '../utils/validation.js';
const access=user=>user.role==='ADMIN'?{}:{userId:user.id};
export async function getEventDishes(req,res){
  const eventId=positiveId(req.params.eventId);
  if(!eventId)return res.status(400).json({message:'Invalid event ID'});
  try{
    const event=await prisma.event.findFirst({where:{id:eventId,...access(req.user)},include:{eventDishes:{include:{dish:true}}}});
    if(!event)return res.status(404).json({message:'Event not found'});
    return res.json({eventId,guestCount:event.guestCount,bufferPercent:event.bufferPercent,dishes:event.eventDishes});
  }catch(e){return sendError(res,e,'Get event menu');}
}
export async function setEventDishes(req,res){
  const eventId=positiveId(req.params.eventId);
  if(!eventId)return res.status(400).json({message:'Invalid event ID'});
  const err=validateObject(req.body,['dishes'],['dishes']);
  if(err||!Array.isArray(req.body.dishes)||req.body.dishes.length>100)
    return res.status(400).json({message:'Provide dishes array (max 100, empty allowed to clear menu)'});
  const dishes=req.body.dishes;
  if(dishes.some(d=>!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['dishId','plannedServings'].includes(k))||!positiveInt(d.dishId)||!positiveInt(d.plannedServings)))
    return res.status(400).json({message:'Each dish needs positive dishId and plannedServings'});
  const ids=dishes.map(d=>d.dishId);
  if(new Set(ids).size!==ids.length)return res.status(400).json({message:'Duplicate dish IDs'});
  try{
    const result=await prisma.$transaction(async tx=>{
      const event=await tx.event.findFirst({where:{id:eventId,...access(req.user)},select:{id:true}});
      if(!event)return {status:404,message:'Event not found'};
      const active=await tx.dish.count({where:{id:{in:ids},isActive:true}});
      if(active!==ids.length)return {status:400,message:'At least one dish does not exist or is inactive'};
      await tx.eventDish.deleteMany({where:{eventId}});
      if(dishes.length)await tx.eventDish.createMany({data:dishes.map(d=>({...d,eventId}))});
      return {status:200,dishes:await tx.eventDish.findMany({where:{eventId},include:{dish:true}})};
    });
    if(result.status!==200)return res.status(result.status).json({message:result.message});
    return res.json({message:'Event menu saved',eventId,dishes:result.dishes});
  }catch(e){return sendError(res,e,'Set event menu');}
}
