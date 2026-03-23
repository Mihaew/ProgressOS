import "../styles/signup.css";
import { createSignal } from "solid-js";
import { authService } from "../services/auth.js";
import { SignInSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast";
import { useNavigate } from "@solidjs/router";

export default function PasswordReset() {

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const email = data.get("email");


        try {
            await authService.passwordReset(email);
            addToast("Password reset email sent", "info");
        } catch (error) {
            console.error(error.message);
            addToast(error.message, "warning");
        }
    }


        return (
            <div class="signup-wrapper">
                <div class="signup-card">

                    <div class="signup-card__header">
                        <h1 class="signup-card__title">Reset password</h1>
                        <p class="signup-card__sub">Please enter your email address to reset your password.</p>
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
                        </div>

                        <button class="signup-btn" type="submit">Send</button>

                    </form>

                </div>
            </div>
        );
  }
