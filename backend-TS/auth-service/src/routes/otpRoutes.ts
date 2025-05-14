import {NextFunction, Request, Response, Router} from "express";
import {completeSignUp} from "../controllers/authController";

const router = Router();


// Verify OTP and complete sign-up
router.post('/verify', (req: Request, res: Response, next: NextFunction) => {
    completeSignUp(req, res, next);
});

export default router;
