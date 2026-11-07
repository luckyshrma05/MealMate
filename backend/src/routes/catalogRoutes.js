import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware.js';
import {authorizeRoles} from '../middleware/roleMiddleware.js';
import {listCatalog,getCatalog,createCatalog,updateCatalog,deleteCatalog,getRecipe,setRecipe} from '../controllers/catalogController.js';
export const dishRoutes=Router();
export const ingredientRoutes=Router();
for(const [router,kind] of [[dishRoutes,'dish'],[ingredientRoutes,'ingredient']]){
  router.use(authenticate);
  router.get('/',listCatalog(kind));
  router.get('/:id',getCatalog(kind));
  router.post('/',authorizeRoles('ADMIN'),createCatalog(kind));
  router.put('/:id',authorizeRoles('ADMIN'),updateCatalog(kind));
  router.delete('/:id',authorizeRoles('ADMIN'),deleteCatalog(kind));
}
dishRoutes.get('/:dishId/recipe',getRecipe);
dishRoutes.put('/:dishId/recipe',authorizeRoles('ADMIN'),setRecipe);
