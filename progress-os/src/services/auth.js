import { createSignal } from "solid-js";
import { auth } from "../lib/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from "firebase/auth";

export const [currentUser, setCurrentUser] = createSignal(null);
export const [isAuthenticated, setIsAuthenticated] = createSignal(false);
export const [authLoading, setAuthLoading] = createSignal(true);

onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
    setIsAuthenticated(!!user);
    setAuthLoading(false);

    if (user) {
        console.log("User OK", user);
    } else {
        console.log("NO User");
    }
});

export const authService = {
    async signUp(email, password, name = "") {
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            if (name.trim()) {
                await updateProfile(user, {
                    displayName: name.trim()
                })
            }

            await sendEmailVerification(user);

            console.log("User signed up", user.email);
            return user;
        } catch (error) {
            console.error("Sign up error", error.code);
            throw this.getErrorMessage(error);
        }
    },
    async signIn(email, password) {
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            return userCred.user;
        } catch (error) {
            console.error("Sign in error", error.code);
            throw this.getErrorMessage(error);
        }
    },
    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error", error);
            throw this.getErrorMessage(error);
        }
    },
    async passwordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Password reset error", error.code);
            throw this.getErrorMessage(error);
        }
    },
    async updateName(name) {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("User is not authenticated");
            }

            await updateProfile(user, {
                displayName: name.trim()
            });
        } catch (error) {
            console.error("Name update error", error);
            throw this.getErrorMessage(error);
        }
    },
    async verify() {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("Uswer is not authenticated");
            }
            if (user.emailVerified) {
                throw new Error("E-mail address is already verified")
            }

            await sendEmailVerification(user);
        } catch (error) {
            console.error("Verification error", error);
            throw this.getErrorMessage(error);
        }
    },
    getCurrentUser() {
        return auth.currentUser;
    },
    isUserAuthenticated() {
        return !!auth.currentUser;
    },
    isEmailVerified() {
        return auth.currentUser?.emailVerified || false;
    },
    getErrorMessage(error) {
        const errorMessages = {
            "auth/email-already-in-use": "E-mail address is already in use",
            "auth/invalid-email": "E-mail address is not valid",
            "auth/weak-password": "Password is too weak",
            "auth/user-not-found": "User not found",
            "auth/wrong-password": "Password is incorrect",
            "auth/user-disabled": "User account is disabled",
            "auth/invalid-credential": "Invalid credentials",
            "auth/too-many-requests": "Too many failed attempts",
            "auth/network-request-failed": "Network error",
            "auth/operation-not-allowed": "Operation not allowed, contact administrator"
        };
        const message = errorMessages[error.code] || "An unexpected error occurred, please contact the administrator";
        return new Error(message);
    }
};