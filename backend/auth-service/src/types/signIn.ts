// types/signIn.ts
import { z } from "zod";

export const signInPayload = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: "Password is required" })
});
