import { Router, Request, Response, NextFunction } from 'express';
import {signUp, signIn, passwordReset, changePassword} from '../controllers/authController';

const router = Router();

// User sign-up
router.post('/sign-up', (req: Request, res: Response, next: NextFunction) => {
    signUp(req, res, next); // function-> controllers
});

router.post('/sign-in', (req: Request, res: Response, next: NextFunction) => {
    signIn(req, res, next);
});

router.post('/password-reset',passwordReset);

router.post('/change-password',changePassword);

export default router;

