import { Router, Request, Response, NextFunction } from 'express';
import {signUp, signIn} from '../controllers/authController';

const router = Router();

// User sign-up
router.post('/sign-up', (req: Request, res: Response, next: NextFunction) => {
    signUp(req, res, next);
});

router.post('/sign-in', (req: Request, res: Response, next: NextFunction) => {
    signIn(req, res, next);
});


export default router;

