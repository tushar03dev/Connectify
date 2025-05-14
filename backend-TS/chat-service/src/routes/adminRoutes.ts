import Router from 'express';
import {addAdmin, addUser, removeAdmin, removeUser} from "../controllers/roomController";
import {checkAdmin} from "../middleware/adminCheck";

const router = Router();

router.post('/remove-user',checkAdmin,removeUser);
router.post('/add-user',checkAdmin,addUser);
router.post('/remove-admin',checkAdmin,removeAdmin);
router.post('/add-admin',checkAdmin,addAdmin);

export default router;