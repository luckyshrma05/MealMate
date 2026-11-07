import prisma from '../db.js';
import {positiveId,positiveInt,percent,validateObject,sendError} from '../utils/validation.js';

// Only supported global keys; event-specific buffer overrides the default.
const RULES={default_buffer:'percent',max_buffer:'percent'};
export async function getRules(_req,res){
  try{return res.json({rules:await prisma.planningRule.findMany({orderBy:{name:'asc'}}),defaults:{default_buffer:10,max_buffer:100}});}
  catch(e){return sendError(res,e,'Get rules');}
}
export async function upsertRule(req,res){
  const error=validateObject(req.body,['name','value'],['name','value']);
  if(error)return res.status(400).json({message:error});
  const {name,value}=req.body;
  if(typeof name!=='string'||!Object.hasOwn(RULES,name)||!percent(value))
    return res.status(400).json({message:'Supported rules: default_buffer and max_buffer (value 0–100)'});
  try{
    const counterpart=await prisma.planningRule.findUnique({where:{name:name==='max_buffer'?'default_buffer':'max_buffer'}});
    if(name==='max_buffer' && value<(counterpart?.value ?? 10))return res.status(400).json({message:'max_buffer cannot be smaller than default_buffer'});
    if(name==='default_buffer' && value>(counterpart?.value ?? 100))return res.status(400).json({message:'default_buffer cannot exceed max_buffer'});
    const rule=await prisma.planningRule.upsert({where:{name},create:{name,value,unit:RULES[name]},update:{value,unit:RULES[name]}});
    return res.json({rule});
  }catch(e){return sendError(res,e,'Save rule');}
}
export async function setDishServings(req,res){
  const id=positiveId(req.params.id);
  if(!id)return res.status(400).json({message:'Invalid dish ID'});
  const error=validateObject(req.body,['recipeServings'],['recipeServings']);
  if(error||!positiveInt(req.body.recipeServings))return res.status(400).json({message:'recipeServings must be a positive integer'});
  try{return res.json({dish:await prisma.dish.update({where:{id},data:{recipeServings:req.body.recipeServings}})});}
  catch(e){return sendError(res,e,'Set serving standard');}
}
