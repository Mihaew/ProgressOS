import { createSignal, For, Show } from "solid-js";
import { db, auth } from "../lib/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { habits, setHabits, loadHabits, habitsLoaded } from "../stores/habits.js";
import "../styles/managehabits.css";

const EMOJI_OPTIONS = [
    "📖","🎯","🎨","🎸","🏃","🚴","🧗","🤸","🥗","💧",
    "🌅","✍️","🎹","🗣️","🌿","🧹","💊","🐾","🛏️","🎲",
    "🍳","🧘","🏊","⚽","🎭","📝","🔬","💻","🎤","🌙",
    "🧺","🪴","🤝","💰","🛠️","🎬","📷","🎻","🏇","🧩",
];

export default function ManageHabits() {
    const [uid,     setUid]     = createSignal(null);
    const [loading, setLoading] = createSignal(true);
    const [saving,  setSaving]  = createSignal(false);

    const [newLabel, setNewLabel] = createSignal("");
    const [newIcon,  setNewIcon]  = createSignal("🎯");
    const [newTimed, setNewTimed] = createSignal(false);
    const [showForm, setShowForm] = createSignal(false);

    onAuthStateChanged(auth, async (user) => {
        if (!user) { setLoading(false); return; }
        setUid(user.uid);
        await loadHabits(user.uid);
        setLoading(false);
    });

    const addHabit = async () => {
        const label = newLabel().trim();
        if (!label || !uid()) return;

        const id = `custom_${label.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;

        const payload = {
            id,
            label,
            icon:      newIcon(),
            timed:     newTimed(),
            createdAt: new Date().toISOString(),
        };

        setSaving(true);
        try {
            await addDoc(
                collection(db, "users", uid(), "habits"),
                payload,
            );
            setHabits(prev => [...prev, { ...payload, isDefault: false }]);
            resetForm();
        } catch (err) {
            console.error("Failed to add habit:", err);
        } finally {
            setSaving(false);
        }
    };

    const deleteHabit = async (habit) => {
        if (!uid() || habit.isDefault) return;
        try {
            const q    = query(collection(db, "users", uid(), "habits"));
            const snap = await getDocs(q);
            snap.forEach(async d => {
                if (d.data().id === habit.id) {
                    await deleteDoc(doc(db, "users", uid(), "habits", d.id));
                }
            });
            setHabits(prev => prev.filter(h => h.id !== habit.id));
        } catch (err) {
            console.error("Failed to delete habit:", err);
        }
    };

    const resetForm = () => {
        setNewLabel("");
        setNewIcon("🎯");
        setNewTimed(false);
        setShowForm(false);
    };

    return (
        <div class="mh-wrapper">
            <div class="mh-header">
                <div>
                    <h1 class="mh-title">My Habits</h1>
                    <p class="mh-subtitle">{habits().length} habits total</p>
                </div>
                <Show when={!showForm()}>
                    <button class="mh-add-btn" onClick={() => setShowForm(true)}>
                        + New Habit
                    </button>
                </Show>
            </div>

            <Show when={showForm()}>
                <div class="mh-form">
                    <p class="mh-form__label">Habit name</p>
                    <input
                        class="mh-form__input"
                        type="text"
                        placeholder="e.g. Reading"
                        value={newLabel()}
                        onInput={e => setNewLabel(e.target.value)}
                        maxLength={32}
                    />

                    <p class="mh-form__label">Pick an icon</p>
                    <div class="mh-emoji-grid">
                        <For each={EMOJI_OPTIONS}>
                            {(emoji) => (
                                <button
                                    class={`mh-emoji-btn${newIcon() === emoji ? " mh-emoji-btn--active" : ""}`}
                                    onClick={() => setNewIcon(emoji)}
                                >
                                    {emoji}
                                </button>
                            )}
                        </For>
                    </div>

                    <div class="mh-form__timed-row">
                        <span class="mh-form__timed-label">Track time (like Study)?</span>
                        <button
                            class={`mh-toggle${newTimed() ? " mh-toggle--on" : ""}`}
                            onClick={() => setNewTimed(v => !v)}
                        >
                            <span class="mh-toggle__knob" />
                        </button>
                    </div>

                    <div class="mh-form__preview">
                        <span class="mh-form__preview-label">Preview:</span>
                        <span class="mh-form__preview-chip">
                            {newIcon()} {newLabel() || "Habit name"}
                            <Show when={newTimed()}>
                                <span class="mh-form__timed-badge">timed</span>
                            </Show>
                        </span>
                    </div>

                    <div class="mh-form__actions">
                        <button class="mh-cancel-btn" onClick={resetForm}>Cancel</button>
                        <button
                            class="mh-save-btn"
                            onClick={addHabit}
                            disabled={saving() || !newLabel().trim()}
                        >
                            {saving() ? "Saving…" : "Add Habit"}
                        </button>
                    </div>
                </div>
            </Show>

            <Show when={loading()}>
                <p class="mh-loading">Loading habits…</p>
            </Show>

            <Show when={!loading()}>
                <div class="mh-list">
                    <For each={habits()}>
                        {(habit) => (
                            <div class={`mh-row${habit.isDefault ? " mh-row--default" : ""}`}>
                                <span class="mh-row__icon">{habit.icon}</span>
                                <span class="mh-row__label">{habit.label}</span>
                                <Show when={habit.timed}>
                                    <span class="mh-row__badge">timed</span>
                                </Show>
                                <Show when={habit.isDefault}>
                                    <span class="mh-row__default-badge">default</span>
                                </Show>
                                <Show when={!habit.isDefault}>
                                    <button
                                        class="mh-row__delete"
                                        onClick={() => deleteHabit(habit)}
                                        title="Remove habit"
                                    >
                                        ✕
                                    </button>
                                </Show>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}