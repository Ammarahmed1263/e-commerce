import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import validate from '../middlewares/validateMiddleware.js';
import { searchValidation, suggestionsValidation } from '../validators/searchValidation.js';

const router = Router();

router.get('/', validate(searchValidation), searchController.search);
router.get('/suggestions', validate(suggestionsValidation), searchController.getSuggestions);

export default router;
