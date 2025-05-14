import { Router, Request, Response } from "express";
import { User } from "../models/userModel";
import {activeUsers, io} from "../socketHandler"; // Import WebSocket instance

const router = Router();

router.post("/connect", async (req: Request, res: Response) => {
    try {
        const userId = req.headers["user-id"] as string;

        if (!userId) {
            res.status(400).json({ success: false, error: "User ID missing in headers" });
            return;
        }

        const user = await User.findOne({ email: userId }); // or `_id` if preferred
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }

        const userSocketId = activeUsers.get(user._id.toString());

        if (userSocketId) {
            // Emit to socket that the user is connected and authenticated
            io.to(userSocketId).emit("connectUser", { success: true, userId: user._id.toString() });

            res.status(200).json({
                success: true,
                message: "WebSocket user authenticated and event emitted",
            });
        } else {
            res.status(202).json({
                success: false,
                message: "User is not currently connected to WebSocket",
            });
        }

    } catch (err: any) {
        console.error("[Connect Route Error]", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export default router;
