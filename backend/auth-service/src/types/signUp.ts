import zod from 'zod';

// This regex enforces:
// - At least one uppercase letter (?=.*[A-Z])
// - At least one lowercase letter (?=.*[a-z])
// - At least one number (?=.*[0-9])
// - At least one special character (?=.*[^A-Za-z0-9])

const passwordValidation = new RegExp(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
);

export const signUpPayload = zod.object({
    name: zod
        .string()
        .min(1, { message: 'Name is required' }), // or .nonempty({ message: 'Name is required' })

    email: zod
        .string()
        .min(1, { message: 'Email is required' }), // Then checks if it's a valid email format

    password: zod
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .regex(passwordValidation, {
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }),
});