// Pure calculation functions: quantities use the ingredient's canonical unit (g, ml, etc.).
// JavaScript Float is used by existing Prisma schema; round final results for JSON display.
export function calculatePlan(event){
  if(!event||!Array.isArray(event.eventDishes))throw new Error('Event menu is missing');
  const rate=event.bufferPercent;
  if(typeof rate!=='number'||!Number.isFinite(rate)||rate<0||rate>100)throw new Error('Invalid buffer');
  const lines=[];
  const ingredients=new Map();
  for(const entry of event.eventDishes){
    const dish=entry.dish;
    if(!dish||!Number.isSafeInteger(dish.recipeServings)||dish.recipeServings<=0)
      throw new Error('Dish recipeServings is invalid');
    if(!Number.isSafeInteger(entry.plannedServings)||entry.plannedServings<=0)
      throw new Error('Invalid planned servings');
    if(!Array.isArray(dish.recipeIngredients)||dish.recipeIngredients.length===0)
      throw new Error(`Dish ${dish.name} has no recipe`);
    const finalServings=ceilServings(entry.plannedServings*(1+rate/100));
    const multiplier=finalServings/dish.recipeServings;
    const line={dishId:dish.id,dishName:dish.name,plannedServings:entry.plannedServings,bufferPercent:rate,finalServings,recipeServings:dish.recipeServings,ingredients:[]};
    for(const ri of dish.recipeIngredients){
      if(!ri.ingredient||!Number.isFinite(ri.quantity)||ri.quantity<=0)
        throw new Error(`Invalid recipe ingredient for ${dish.name}`);
      const qty=ri.quantity*multiplier;
      if(!Number.isFinite(qty))throw new Error('Calculated quantity too large');
      const {id,name,unit}=ri.ingredient;
      const prev=ingredients.get(id);
      if(prev && prev.unit!==unit)throw new Error('Ingredient unit mismatch');
      if(prev)prev.quantity+=qty;
      else ingredients.set(id,{ingredientId:id,name,unit,quantity:qty});
      line.ingredients.push({ingredientId:id,name,unit,quantity:round(qty)});
    }
    lines.push(line);
  }
  return {
    eventId:event.id,guestCount:event.guestCount,bufferPercent:rate,
    dishes:lines,
    ingredients:[...ingredients.values()].sort((a,b)=>a.ingredientId-b.ingredientId).map(x=>({...x,quantity:round(x.quantity)})),
  };
}
function round(v){return Math.round((v+Number.EPSILON)*1e6)/1e6;}

function ceilServings(v){return Math.ceil(v - Number.EPSILON*Math.max(1,Math.abs(v))*4);}
