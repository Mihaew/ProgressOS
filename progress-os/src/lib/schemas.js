import { z } from "zod";

export const SignUpSchema = z.object({
    name: z.string().min(2, "Name must contain at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    passwordConfirm: z.string().min(6, "Password confirmation is required")
}).refine(data => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"]
});

export const SignInSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});