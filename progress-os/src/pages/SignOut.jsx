import { onMount } from "solid-js";
import { authService } from "../services/auth.js";
import { useNavigate } from "@solidjs/router";
import { addToast } from "../components/toast.jsx";

export default function SignOut() {
    const navigate = useNavigate();

    onMount(async () => {
        await authService.signOut();
        addToast("You have been signed out.", "info");
        navigate("/user/signin");
    });
}