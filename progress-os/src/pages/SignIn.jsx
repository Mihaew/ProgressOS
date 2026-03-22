import "../styles/signup.css";
import { createSignal } from "solid-js";
import { authService } from "../services/auth.js";
import { SignInSchema } from "../lib/schemas.js";
import { addToast } from "../components/toast.jsx";
import { useNavigate } from "@solidjs/router";

export default function SignIn() {
    const [validation, setValidation] = createSignal({});
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        setValidation({});
        e.preventDefault();
        const data = new FormData(e.target);
        const email = data.get("email");
        const password = data.get("password");
        const formData = {
            email, password
        };

        try {
            const validated = SignInSchema.parse(formData);
            await authService.signIn(validated.email, validated.password);
            addToast("Sign in successful", "success");
            navigate("/");
        } catch (error) {
            if (error.name === "ZodError") {
                const validationErrors = {};
                error.issues.forEach(e => {
                    validationErrors[e.path[0]] = e.message;
                });
                setValidation(validationErrors);
                addToast(error.issues[0].message, "warning");
            } else {
                console.error(error.message);
                addToast(error.message, "warning");
            }
        }
    };




    return (
        <div class="signup-wrapper">
            <div class="signup-card">

                <div class="signup-card__header">
                    <h1 class="signup-card__title">Sign in</h1>
                    <p class="signup-card__sub">Welcome back! Please enter your details.</p>
                </div>

                <form class="signup-form" onSubmit={handleSubmit}>

                    <div class="form-field">
                        <label class="form-label" for="email">E-mail address</label>
                        <input
                            class="form-input"
                            id="email" 
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                        />
                        {validation().email && <span class="form-error">{validation().email}</span>}
                    </div>

                    <div class="form-field">
                        <label class="form-label" for="password">Password</label>
                        <input
                            class="form-input"
                            id="password" 
                            name="password"
                            type="password"
                            placeholder="••••••••"
                        />
                        {validation().password && <span class="form-error">{validation().password}</span>}
                    </div>

                    <button class="signup-btn" type="submit">Sign in</button>

                </form>

                <p class="signup-card__footer">
                    Don't have an account? <a class="signup-card__link" href="/user/signup">Sign up</a>
                </p>

            </div>
        </div>
    );
}