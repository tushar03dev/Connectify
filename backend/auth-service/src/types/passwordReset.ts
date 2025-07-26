import zod from "zod";

export const emailOnlyPayload = zod.object({
    email: zod.string().email({ message: "Invalid email" })
});