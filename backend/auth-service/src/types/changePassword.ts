import z from "zod";

export const changePasswordPayload = z.object({
    email: z.string().email(),
    password: z.string().min(6, { message: "Password too short" }),
    otp: z.string().min(1, { message: "OTP is required" })
});
