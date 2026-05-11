import { createSignal, createMemo, For, Show } from "solid-js";
import { db, auth } from "../lib/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/workoutlogs.css";

const newSet      = ()      => ({ reps: "", weight: "" });
const newExercise = (name = "") => ({ name, sets: [newSet()] });


function SetRow({ set, onChange, onRemove, isOnly }) {
    return (
        <div class="wl-set-row">
            <input
                class="wl-set-input"
                type="number"
                min="1"
                placeholder="Reps"
                value={set.reps}
                onInput={e => onChange({ ...set, reps: e.target.value })}
            />
            <input
                class="wl-set-input"
                type="number"
                min="0"
                placeholder="kg"
                value={set.weight}
                onInput={e => onChange({ ...set, weight: e.target.value })}
            />
            <Show when={!isOnly}>
                <button class="wl-remove-btn" onClick={onRemove} title="Remove set">✕</button>
            </Show>
        </div>
    );
}

function ExerciseBlock({ exercise, onChange, onRemove, isOnly }) {
    const updateSet = (i, updated) => {
        const sets = exercise.sets.map((s, idx) => idx === i ? updated : s);
        onChange({ ...exercise, sets });
    };
    const addSet = () => onChange({ ...exercise, sets: [...exercise.sets, newSet()] });
    const removeSet = (i) => onChange({ ...exercise, sets: exercise.sets.filter((_, idx) => idx !== i) });

    return (
        <div class="wl-exercise">
            <div class="wl-exercise__header">
                <input
                    class="wl-exercise__name"
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onInput={e => onChange({ ...exercise, name: e.target.value })}
                />
                <Show when={!isOnly}>
                    <button class="wl-remove-btn" onClick={onRemove} title="Remove exercise">✕</button>
                </Show>
            </div>

            <div class="wl-set-header">
                <span>Reps</span>
                <span>Weight (kg)</span>
            </div>

            <For each={exercise.sets}>
                {(set, i) => (
                    <SetRow
                        set={set}
                        onChange={updated => updateSet(i(), updated)}
                        onRemove={() => removeSet(i())}
                        isOnly={exercise.sets.length === 1}
                    />
                )}
            </For>

            <button class="wl-add-set-btn" onClick={addSet}>+ Add set</button>
        </div>
    );
}

function WorkoutCard({ log, onDelete }) {
    const [expanded, setExpanded] = createSignal(false);

    const totalSets   = createMemo(() => log.exercises.reduce((a, e) => a + e.sets.length, 0));
    const totalVolume = createMemo(() =>
        log.exercises.reduce((a, e) =>
            a + e.sets.reduce((b, s) => b + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0)
        , 0)
    );

    return (
        <div class="wl-card">
            <div class="wl-card__top" onClick={() => setExpanded(v => !v)}>
                <div>
                    <p class="wl-card__name">{log.name || "Unnamed workout"}</p>
                    <p class="wl-card__date">{log.date}</p>
                </div>
                <div class="wl-card__meta">
                    <span class="wl-card__pill">{log.exercises.length} exercises</span>
                    <span class="wl-card__pill">{totalSets()} sets</span>
                    <span class="wl-card__pill">{totalVolume().toLocaleString()} kg vol</span>
                    <span class="wl-card__chevron">{expanded() ? "▲" : "▼"}</span>
                </div>
            </div>

            <Show when={expanded()}>
                <div class="wl-card__body">
                    <For each={log.exercises}>
                        {(ex) => (
                            <div class="wl-card__exercise">
                                <p class="wl-card__ex-name">{ex.name}</p>
                                <div class="wl-card__sets">
                                    <div class="wl-card__set-header">
                                        <span>Set</span>
                                        <span>Reps</span>
                                        <span>Weight</span>
                                        <span>Volume</span>
                                    </div>
                                    <For each={ex.sets}>
                                        {(set, i) => (
                                            <div class="wl-card__set-row">
                                                <span class="wl-card__set-num">{i() + 1}</span>
                                                <span>{set.reps}</span>
                                                <span>{set.weight} kg</span>
                                                <span>{((parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0)).toLocaleString()} kg</span>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>

                    <button class="wl-delete-btn" onClick={() => onDelete(log.id)}>
                        🗑 Delete workout
                    </button>
                </div>
            </Show>
        </div>
    );
}

export default function WorkoutLogs() {
    const today = new Date().toISOString().split("T")[0];

    const [uid,      setUid]      = createSignal(null);
    const [logs,     setLogs]     = createSignal([]);
    const [loading,  setLoading]  = createSignal(true);
    const [saving,   setSaving]   = createSignal(false);
    const [showForm, setShowForm] = createSignal(false);

    const [workoutName, setWorkoutName] = createSignal("");
    const [workoutDate, setWorkoutDate] = createSignal(today);
    const [exercises,   setExercises]   = createSignal([newExercise()]);

    onAuthStateChanged(auth, async (user) => {
        if (!user) { setLoading(false); return; }
        setUid(user.uid);
        await fetchLogs(user.uid);
        setLoading(false);
    });

    const fetchLogs = async (userId) => {
        try {
            const q    = query(
                collection(db, "users", userId, "workoutLogs"),
                orderBy("date", "desc"),
            );
            const snap = await getDocs(q);
            const data = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() }));
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };

    const saveWorkout = async () => {
        const userId = uid();
        if (!userId) return;

        const cleaned = exercises()
            .filter(e => e.name.trim() !== "")
            .map(e => ({
                name: e.name.trim(),
                sets: e.sets
                    .filter(s => s.reps !== "" || s.weight !== "")
                    .map(s => ({
                        reps:   parseFloat(s.reps)   || 0,
                        weight: parseFloat(s.weight) || 0,
                    })),
            }))
            .filter(e => e.sets.length > 0);

        if (cleaned.length === 0) return;

        const payload = {
            name:      workoutName().trim() || "Workout",
            date:      workoutDate(),
            exercises: cleaned,
            createdAt: new Date().toISOString(),
        };

        setSaving(true);
        try {
            const ref = await addDoc(
                collection(db, "users", userId, "workoutLogs"),
                payload,
            );
            setLogs(prev => [{ id: ref.id, ...payload }, ...prev]);
            resetForm();
        } catch (err) {
            console.error("Failed to save workout:", err);
        } finally {
            setSaving(false);
        }
    };

    const deleteLog = async (logId) => {
        const userId = uid();
        if (!userId) return;
        try {
            await deleteDoc(doc(db, "users", userId, "workoutLogs", logId));
            setLogs(prev => prev.filter(l => l.id !== logId));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const resetForm = () => {
        setWorkoutName("");
        setWorkoutDate(today);
        setExercises([newExercise()]);
        setShowForm(false);
    };

    const updateExercise = (i, updated) =>
        setExercises(prev => prev.map((e, idx) => idx === i ? updated : e));

    const addExercise = () =>
        setExercises(prev => [...prev, newExercise()]);

    const removeExercise = (i) =>
        setExercises(prev => prev.filter((_, idx) => idx !== i));

    return (
        <div class="wl-wrapper">
            <div class="wl-header">
                <div>
                    <h1 class="wl-title">Workout Logs</h1>
                    <p class="wl-subtitle">{logs().length} sessions logged</p>
                </div>
                <Show when={!showForm()}>
                    <button class="wl-new-btn" onClick={() => setShowForm(true)}>
                        + New Workout
                    </button>
                </Show>
            </div>

            <Show when={showForm()}>
                <div class="wl-form">
                    <div class="wl-form__top">
                        <input
                            class="wl-form__name"
                            type="text"
                            placeholder="Workout name (e.g. Push Day)"
                            value={workoutName()}
                            onInput={e => setWorkoutName(e.target.value)}
                        />
                        <input
                            class="wl-form__date"
                            type="date"
                            value={workoutDate()}
                            onInput={e => setWorkoutDate(e.target.value)}
                        />
                    </div>

                    <For each={exercises()}>
                        {(exercise, i) => (
                            <ExerciseBlock
                                exercise={exercise}
                                onChange={updated => updateExercise(i(), updated)}
                                onRemove={() => removeExercise(i())}
                                isOnly={exercises().length === 1}
                            />
                        )}
                    </For>

                    <button class="wl-add-exercise-btn" onClick={addExercise}>
                        + Add exercise
                    </button>

                    <div class="wl-form__actions">
                        <button class="wl-cancel-btn" onClick={resetForm}>Cancel</button>
                        <button class="wl-save-btn" onClick={saveWorkout} disabled={saving()}>
                            {saving() ? "Saving…" : "Save Workout"}
                        </button>
                    </div>
                </div>
            </Show>

            <Show when={loading()}>
                <p class="wl-loading">Loading workouts…</p>
            </Show>

            <Show when={!loading() && logs().length === 0 && !showForm()}>
                <div class="wl-empty">
                    <p class="wl-empty__icon">🏋️</p>
                    <p class="wl-empty__text">No workouts logged yet.</p>
                    <p class="wl-empty__sub">Hit the button above to log your first session.</p>
                </div>
            </Show>

            <div class="wl-list">
                <For each={logs()}>
                    {(log) => <WorkoutCard log={log} onDelete={deleteLog} />}
                </For>
            </div>
        </div>
    );
}