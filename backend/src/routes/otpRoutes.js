import {completeSignUp} from '../controllers/authController.js';
import {Router} from "express";

const router = Router();

// User sign-up
router.post('/verify', (req ,res) => {
    completeSignUp(req, res);
});

export default router;

