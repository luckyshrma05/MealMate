import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePlan} from '../src/services/calculationService.js';
import {eventInput,positiveId} from '../src/utils/validation.js';
const ingredient=(id,name,unit,quantity)=>({quantity,ingredient:{id,name,unit}});
const event={id:1,guestCount:200,bufferPercent:10,eventDishes:[
  {plannedServings:200,dish:{id:1,name:'Paneer Curry',recipeServings:10,recipeIngredients:[ingredient(1,'Paneer','g',1000),ingredient(2,'Oil','ml',100)]}},
  {plannedServings:100,dish:{id:2,name:'Rice',recipeServings:10,recipeIngredients:[ingredient(3,'Rice','g',800),ingredient(2,'Oil','ml',40)]}},
]};
test('applies buffer and aggregates repeat ingredients',()=>{
  const result=calculatePlan(event);
  assert.equal(result.dishes[0].finalServings,220);
  assert.equal(result.dishes[1].finalServings,110);
  assert.deepEqual(result.ingredients,[
    {ingredientId:1,name:'Paneer',unit:'g',quantity:22000},
    {ingredientId:2,name:'Oil',unit:'ml',quantity:2640},
    {ingredientId:3,name:'Rice',unit:'g',quantity:8800},
  ]);
});
test('missing recipe fails',()=>{
  assert.throws(()=>calculatePlan({...event,eventDishes:[{plannedServings:5,dish:{id:5,name:'No Recipe',recipeServings:10,recipeIngredients:[]}}]}),/no recipe/);
});
test('buffer is rounded up to whole servings',()=>{
  const e={...event,bufferPercent:5,eventDishes:[{plannedServings:3,dish:{id:1,name:'Sample',recipeServings:10,recipeIngredients:[ingredient(1,'Beans','g',100)]}}]};
  assert.equal(calculatePlan(e).dishes[0].finalServings,4);
});
test('invalid values are rejected',()=>{
  assert.equal(positiveId('0'),null);
  assert.equal(positiveId('42'),42);
  assert.equal(eventInput({name:'X',eventType:'Wedding',eventDate:'2026-02-30',guestCount:1}).error,'eventDate must be a valid YYYY-MM-DD date');
  assert.equal(eventInput({name:'X',eventType:'Wedding',eventDate:'2026-12-15',guestCount:5,userId:999}).error,'Unknown or forbidden field');
});
