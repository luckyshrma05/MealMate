import prisma from '../db.js';
import {positiveId,eventInput,sendError} from '../utils/validation.js';

const visibleTo = user => user.role === 'ADMIN' ? {} : {userId:user.id};
async function bufferSettings() {
  const rules=await prisma.planningRule.findMany({where:{name:{in:['default_buffer','max_buffer']}}});
  const settings=Object.fromEntries(rules.map(r=>[r.name,r.value]));
  return {defaultBuffer:settings.default_buffer ?? 10,maxBuffer:settings.max_buffer ?? 100};
}

export async function createEvent(req,res) {
  const {data,error}=eventInput(req.body);
  if(error) return res.status(400).json({message:error});
  try {
    const {defaultBuffer,maxBuffer}=await bufferSettings();
    const buffer=data.bufferPercent ?? defaultBuffer;
    if(buffer>maxBuffer)return res.status(400).json({message:`bufferPercent cannot exceed ${maxBuffer}`});
    const event=await prisma.event.create({data:{...data,bufferPercent:buffer,userId:req.user.id}});
    return res.status(201).json({message:'Event created',event});
  } catch(e){return sendError(res,e,'Create event');}
}
export async function getEvents(req,res) {
  try {
    const events=await prisma.event.findMany({where:visibleTo(req.user),orderBy:{eventDate:'asc'}});
    return res.json({count:events.length,events});
  }catch(e){return sendError(res,e,'List events');}
}
export async function getEventById(req,res) {
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid event ID'});
  try {
    const event=await prisma.event.findFirst({where:{id,...visibleTo(req.user)},include:{eventDishes:{include:{dish:true}}}});
    if(!event) return res.status(404).json({message:'Event not found'});
    return res.json({event});
  }catch(e){return sendError(res,e,'Get event');}
}
export async function updateEvent(req,res) {
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid event ID'});
  const {data,error}=eventInput(req.body,true);
  if(error) return res.status(400).json({message:error});
  try {
    if(data.bufferPercent!==undefined){
      const {maxBuffer}=await bufferSettings();
      if(data.bufferPercent>maxBuffer)return res.status(400).json({message:`bufferPercent cannot exceed ${maxBuffer}`});
    }
    const updated=await prisma.event.updateMany({where:{id,...visibleTo(req.user)},data});
    if(!updated.count) return res.status(404).json({message:'Event not found'});
    return res.json({message:'Event updated',event:await prisma.event.findUnique({where:{id}})});
  }catch(e){return sendError(res,e,'Update event');}
}
export async function deleteEvent(req,res) {
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid event ID'});
  try {
    const result=await prisma.$transaction(async tx=>{
      const match=await tx.event.findFirst({where:{id,...visibleTo(req.user)},select:{id:true}});
      if(!match) return false;
      await tx.eventDish.deleteMany({where:{eventId:id}});
      await tx.event.delete({where:{id}});
      return true;
    });
    if(!result) return res.status(404).json({message:'Event not found'});
    return res.json({message:'Event deleted'});
  }catch(e){return sendError(res,e,'Delete event');}
}
