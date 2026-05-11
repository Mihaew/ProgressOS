import { authService, isAuthenticated } from "../services/auth";
import "../styles/userprofile.css"
import { createSignal, createEffect, Show } from "solid-js";
import { addToast } from "../components/Toast";
import { updateProfile } from "firebase/auth";

export default function UserProfile() {
    const [user, setUser] = createSignal(null);
    const [role, setRole] = createSignal("user");

    const [editingName, setEditingName] = createSignal(false);
    const [avatarHover, setAvatarHover] = createSignal(false);
    const [newDisplayName, setNewDisplayName] = createSignal("");

    createEffect(async () => {
        if(!isAuthenticated()) return;
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        await user().getIdToken(true);
        const role = await authService.getUserRole(user());
        setRole(role);
    });

    const handleChangeName = async () => {
        if (!newDisplayName().trim()) return;

        try {
            await updateProfile(authService.getCurrentUser(), { displayName: newDisplayName() });
            setUser({ ...user(), displayName: newDisplayName() });
            setEditingName(false);
            setNewDisplayName("");
        } catch (error) {
            console.error(error.message);
            addToast("Error updating name", "error");
        }
    }

    return (
        <div class="profile-wrapper">

            <div class="profile-hero">
                <div
                    class="profile-avatar"
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                >
                    <div class="profile-avatar__img">
                        <span class="profile-avatar__initials">👤</span>
                    </div>
                    {avatarHover() && (
                        <div class="profile-avatar__overlay">
                            <span class="profile-avatar__overlay-icon">📷</span>
                            <span class="profile-avatar__overlay-text">Change photo</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" class="profile-avatar__input" />
                </div>

                <div class="profile-hero__info">
                    {!editingName() ? (
                        <div class="profile-hero__name-row">
                            <h1 class="profile-hero__name">{user()?.displayName}</h1>
                            <button class="profile-icon-btn" title="Edit name" onClick={() => {setNewDisplayName(user()?.displayName); setEditingName(true)}}>✏️</button>
                        </div>
                    ) : (
                        <div class="profile-hero__name-edit">
                            <input class="profile-input" type="text" placeholder="Your name" value={newDisplayName()} onInput={(e) => setNewDisplayName(e.target.value)} />
                            <button class="profile-icon-btn" title="Save" onClick={handleChangeName}>✔</button>
                            <button class="profile-icon-btn profile-icon-btn--cancel" title="Cancel" onClick={() => setEditingName(false)}>✕</button>
                        </div>
                    )}
                    <p class="profile-hero__email">{user()?.email}</p>
                    <div class="profile-hero__badge">Level 0</div>

                    <Show when={role() === "admin"}>
                        <div class="profile-hero__badge">Admin</div>
                    </Show>

                </div>
            </div>

            <div class="profile-grid">


                <div class="profile-card">
                    <h2 class="profile-card__title">Account</h2>

                    <div class="profile-card__row">
                        <span class="profile-card__row-label">Display name</span>
                        <span class="profile-card__row-value">{user()?.displayName}</span>
                    </div>
                    <div class="profile-card__row">
                        <span class="profile-card__row-label">E-mail</span>
                        <span class="profile-card__row-value">{user()?.email}</span>
                    </div>
                    <div class="profile-card__row">
                        <span class="profile-card__row-label">Member since</span>
                        <span class="profile-card__row-value">{user()?.metadata.creationTime}</span>
                    </div>

                    <div class="profile-card__actions">
                        <a class="profile-btn profile-btn--ghost" href="/user/password-reset">Reset password</a>
                    </div>
                </div>


                <div class="profile-card">
                    <h2 class="profile-card__title">Stats</h2>

                    <div class="profile-stat-list">
                        <div class="profile-stat">
                            <span class="profile-stat__value">0</span>
                            <span class="profile-stat__label">Daily logs</span>
                        </div>
                        <div class="profile-stat">
                            <span class="profile-stat__value">0</span>
                            <span class="profile-stat__label">Achievements</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}