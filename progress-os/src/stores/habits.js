import { createSignal } from "solid-js";
import { db } from "../lib/firebase.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const DEFAULT_HABITS = [
    { id: "workout",     label: "Workout",    icon: "💪", timed: false, isDefault: true },
    { id: "cold_shower", label: "Cold Shower", icon: "🚿", timed: false, isDefault: true },
    { id: "meditate",    label: "Meditate",    icon: "🧘", timed: false, isDefault: true },
    { id: "study",       label: "Study",       icon: "📚", timed: true,  isDefault: true },
];

export const [habits, setHabits] = createSignal(DEFAULT_HABITS);
export const [habitsLoaded, setHabitsLoaded] = createSignal(false);

export async function loadHabits(uid) {
    if (habitsLoaded()) return;
    try {
        const q    = query(
            collection(db, "users", uid, "habits"),
            orderBy("createdAt", "asc"),
        );
        const snap = await getDocs(q);
        const custom = [];
        snap.forEach(d => custom.push({ id: d.id, ...d.data(), isDefault: false }));
        setHabits([...DEFAULT_HABITS, ...custom]);
        setHabitsLoaded(true);
    } catch (err) {
        console.error("Failed to load habits:", err);
    }
}