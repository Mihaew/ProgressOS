import "../styles/signup.css";
import { createSignal } from "solid-js";
import { authService } from "../services/auth.js";
import { SignUpSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast";
import { useNavigate } from "@solidjs/router";

export default function SignUp() {
    const [validation, setValidation] = createSignal({});
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        setValidation({});
        e.preventDefault();
        const data = new FormData(e.target);
        const name = data.get("name");
        const email = data.get("email");
        const password = data.get("password");
        const passwordConfirm = data.get("passwordConfirm");
        const formData = {
            name, email, password, passwordConfirm
        };

        try {
            const validated = SignUpSchema.parse(formData);
            await authService.signUp(validated.email, validated.password, validated.name);
            addToast("Registration successful", "success");
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
                addToast(error.message, "error");
            }
        }
    };




    return (
        <div class="signup-wrapper">
            <div class="signup-card">

                <div class="signup-card__header">
                    <h1 class="signup-card__title">Create account</h1>
                    <p class="signup-card__sub">Start tracking your progress today.</p>
                </div>

                <form class="signup-form" onSubmit={handleSubmit}>

                    <div class="form-field">
                        <label class="form-label" for="name">Name</label>
                        <input
                            class="form-input"
                            id="name" 
                            name="name"
                            type="text"
                            placeholder="Your name"
                        />
                        {validation().name && <span class="form-error">{validation().name}</span>}
                    </div>

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

                    <div class="form-field">
                        <label class="form-label" for="passwordConfirm">Confirm password</label>
                        <input
                            class="form-input"
                            id="passwordConfirm" 
                            name="passwordConfirm"
                            type="password"
                            placeholder="••••••••"
                        />
                        {validation().passwordConfirm && <span class="form-error">{validation().passwordConfirm}</span>}
                    </div>

                    <button class="signup-btn" type="submit">Create account</button>

                </form>

                <p class="signup-card__footer">
                    Already have an account? <a class="signup-card__link" href="/user/signin">Sign in</a>
                </p>

            </div>
        </div>
    );
}