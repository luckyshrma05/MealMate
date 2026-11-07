import prisma from '../db.js';
import {positiveId,sendError} from '../utils/validation.js';
import {calculatePlan} from '../services/calculationService.js';

export async function calculateEvent(req,res){
  const eventId=positiveId(req.params.eventId);
  if(!eventId)return res.status(400).json({message:'Invalid event ID'});
  try{
    const event=await prisma.event.findFirst({
      where:{id:eventId,...(req.user.role==='ADMIN'?{}:{userId:req.user.id})},
      include:{eventDishes:{include:{dish:{include:{recipeIngredients:{include:{ingredient:true}}}}}}},
    });
    if(!event)return res.status(404).json({message:'Event not found'});
    if(!event.eventDishes.length)return res.status(422).json({message:'Select dishes before calculating'});
    try{
      const result=calculatePlan(event);
      if(req.params.kind==='quantities')return res.json({eventId:result.eventId,guestCount:result.guestCount,bufferPercent:result.bufferPercent,dishes:result.dishes});
      return res.json({eventId:result.eventId,guestCount:result.guestCount,bufferPercent:result.bufferPercent,ingredients:result.ingredients});
    }catch(err){return res.status(422).json({message:err.message});}
  }catch(e){return sendError(res,e,'Calculate event');}
}
