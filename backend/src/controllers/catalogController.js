import prisma from '../db.js';
import {positiveId,validateObject,nameString,positiveInt,nonnegativeFinite,bool,sendError} from '../utils/validation.js';

const isAdmin=req=>req.user.role==='ADMIN';
const fields={
  dish:['name','category','description','isActive','recipeServings'],
  ingredient:['name','unit','isActive'],
};
const required={dish:['name','category'],ingredient:['name','unit']};
function clean(kind,body,partial=false){
  const error=validateObject(body,required[kind],fields[kind],partial);
  if(error) return {error};
  const data={};
  for(const [k,v] of Object.entries(body)){
    if(['name','category','unit'].includes(k)){
      if(!nameString(v)) return {error:`Invalid ${k}`};
      data[k]=v.trim();
    }else if(k==='description'){
      if(v!==null && (typeof v!=='string'||v.length>500)) return {error:'Invalid description'};
      data[k]=v===null?null:v.trim();
    }else if(k==='isActive'){
      if(!bool(v)) return {error:'isActive must be boolean'};
      data[k]=v;
    }else if(k==='recipeServings'){
      if(!positiveInt(v)) return {error:'recipeServings must be positive integer'};
      data[k]=v;
    }
  }
  return {data};
}
export const listCatalog = kind => async(req,res)=>{
  try{
    const where=isAdmin(req)?{}:{isActive:true};
    const records=await prisma[kind].findMany({where,orderBy:{name:'asc'}});
    return res.json({count:records.length,[kind==='dish'?'dishes':'ingredients']:records});
  }catch(e){return sendError(res,e,`List ${kind}`);}
};
export const getCatalog = kind => async(req,res)=>{
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid ID'});
  try{
    const record=await prisma[kind].findFirst({where:{id,...(isAdmin(req)?{}:{isActive:true})}});
    if(!record) return res.status(404).json({message:'Not found'});
    return res.json({[kind]:record});
  }catch(e){return sendError(res,e,`Get ${kind}`);}
};
export const createCatalog = kind => async(req,res)=>{
  const {data,error}=clean(kind,req.body);
  if(error) return res.status(400).json({message:error});
  try{return res.status(201).json({[kind]:await prisma[kind].create({data})});}
  catch(e){return sendError(res,e,`Create ${kind}`);}
};
export const updateCatalog = kind => async(req,res)=>{
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid ID'});
  const {data,error}=clean(kind,req.body,true);
  if(error) return res.status(400).json({message:error});
  try{return res.json({[kind]:await prisma[kind].update({where:{id},data})});}
  catch(e){return sendError(res,e,`Update ${kind}`);}
};
export const deleteCatalog = kind => async(req,res)=>{
  const id=positiveId(req.params.id);
  if(!id) return res.status(400).json({message:'Invalid ID'});
  // Soft delete preserves existing event selections and recipe references.
  try{await prisma[kind].update({where:{id},data:{isActive:false}});return res.json({message:`${kind} deactivated`});}
  catch(e){return sendError(res,e,`Deactivate ${kind}`);}
};

// Recipe: one dish can contain many ingredients, each used once.
export async function getRecipe(req,res){
  const dishId=positiveId(req.params.dishId);
  if(!dishId) return res.status(400).json({message:'Invalid dish ID'});
  try{
    const dish=await prisma.dish.findFirst({where:{id:dishId,...(isAdmin(req)?{}:{isActive:true})},include:{recipeIngredients:{include:{ingredient:true},orderBy:{ingredientId:'asc'}}}});
    if(!dish) return res.status(404).json({message:'Dish not found'});
    return res.json({dish});
  }catch(e){return sendError(res,e,'Get recipe');}
}
export async function setRecipe(req,res){
  const dishId=positiveId(req.params.dishId);
  if(!dishId) return res.status(400).json({message:'Invalid dish ID'});
  const body=req.body;
  if(validateObject(body,['ingredients'],['ingredients'])) return res.status(400).json({message:'Expected ingredients array'});
  if(!Array.isArray(body.ingredients)||body.ingredients.length===0||body.ingredients.length>100)
    return res.status(400).json({message:'Provide 1 to 100 ingredients'});
  const entries=body.ingredients;
  if(entries.some(e=>!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).some(k=>!['ingredientId','quantity'].includes(k))||!positiveInt(e.ingredientId)||!nonnegativeFinite(e.quantity)||e.quantity===0))
    return res.status(400).json({message:'Each ingredient needs positive ingredientId and quantity'});
  const ids=entries.map(e=>e.ingredientId);
  if(new Set(ids).size!==ids.length)return res.status(400).json({message:'Duplicate ingredient IDs'});
  try{
    const result=await prisma.$transaction(async tx=>{
      const dish=await tx.dish.findUnique({where:{id:dishId}});
      if(!dish) return {status:404,message:'Dish not found'};
      const matches=await tx.ingredient.count({where:{id:{in:ids},isActive:true}});
      if(matches!==ids.length)return {status:400,message:'One or more ingredients do not exist or are inactive'};
      await tx.recipeIngredient.deleteMany({where:{dishId}});
      await tx.recipeIngredient.createMany({data:entries.map(e=>({dishId,ingredientId:e.ingredientId,quantity:e.quantity}))});
      return {status:200,recipe:await tx.recipeIngredient.findMany({where:{dishId},include:{ingredient:true}})};
    });
    if(result.status!==200)return res.status(result.status).json({message:result.message});
    return res.json({message:'Recipe replaced',recipeServings:(await prisma.dish.findUnique({where:{id:dishId}})).recipeServings,ingredients:result.recipe});
  }catch(e){return sendError(res,e,'Set recipe');}
}
