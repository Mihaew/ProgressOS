import { createSignal, createMemo, createEffect, Show, For } from "solid-js";
import "../styles/calendar.css";
import { db, auth } from "../lib/firebase.js";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { habits, loadHabits } from "../stores/habits.js";

const RATINGS = [
    { id: "fail", label: "Fail", emoji: "👎" },
    { id: "mid", label: "Mid", emoji: "😐" },
    { id: "win", label: "Win", emoji: "🏆" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDayRef = (uid, dateKey) =>
    doc(db, "users", uid, "dailyLogs", dateKey);

function CalendarCell({ day, dateKey, isToday, dayData, onOpen }) {
    const info = createMemo(() => dayData()[dateKey] ?? null);
    const rating = createMemo(() => info()?.rating ?? null);
    const checkedHabits = createMemo(() => habits().filter(h => info()?.habits?.[h.id]));

    return (
        <div
            class={`cal-cell${isToday ? " cal-cell--today" : ""}${rating() ? ` cal-cell--${rating()}` : ""}`}
            onClick={onOpen}
        >
            <span class="cal-cell__num">{day}</span>

            <Show when={checkedHabits().length > 0}>
                <div class="cal-cell__icons">
                    <For each={checkedHabits()}>
                        {(h) => <span class="cal-cell__icon" title={h.label}>{h.icon}</span>}
                    </For>
                </div>
            </Show>

            <Show when={rating()}>
                <span class={`cal-cell__badge cal-cell__badge--${rating()}`}>
                    {rating() === "win" ? "🏆" : rating() === "mid" ? "😐" : "👎"}
                </span>
            </Show>
        </div>
    );
}

export default function Calendar() {
    const today = new Date();

    const [viewYear, setViewYear] = createSignal(today.getFullYear());
    const [viewMonth, setViewMonth] = createSignal(today.getMonth());
    const [dayData, setDayData] = createSignal({});
    const [loading, setLoading] = createSignal(false);
    const [saving, setSaving] = createSignal(false);

    const [selectedDay, setSelectedDay] = createSignal(null);
    const [popupHabits, setPopupHabits] = createSignal({});
    const [popupRating, setPopupRating] = createSignal(null);
    const [timedMinutes, setTimedMinutes] = createSignal({});
    const [popupNotes, setPopupNotes] = createSignal("");

    const [currentUid, setCurrentUid] = createSignal(null);

    onAuthStateChanged(auth, async (user) => {
        setCurrentUid(user?.uid ?? null);
        await loadHabits(user.uid);
    });

    createEffect(async () => {
        const uid = currentUid();
        if (!uid) return;

        const year = viewYear();
        const month = viewMonth();

        const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const to = `${year}-${String(month + 1).padStart(2, "0")}-31`;

        setLoading(true);
        try {
            const q = query(
                collection(db, "users", uid, "dailyLogs"),
                where("__name__", ">=", from),
                where("__name__", "<=", to),
            );
            const snap = await getDocs(q);
            const fetched = {};
            snap.forEach(d => { fetched[d.id] = d.data(); });
            setDayData(prev => ({ ...prev, ...fetched }));
        } catch (err) {
            console.error("Firestore read failed:", err);
        } finally {
            setLoading(false);
        }
    });

    const monthName = createMemo(() =>
        new Date(viewYear(), viewMonth(), 1)
            .toLocaleString("default", { month: "long", year: "numeric" })
    );

    const calendarCells = createMemo(() => {
        const year = viewYear();
        const month = viewMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];

        for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, key: null });
        for (let d = 1; d <= daysInMonth; d++) {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({
                day: d,
                key,
                isToday: year === today.getFullYear() && month === today.getMonth() && d === today.getDate(),
            });
        }
        while (cells.length % 7 !== 0) cells.push({ day: null, key: null });
        return cells;
    });

    const prevMonth = () => {
        if (viewMonth() === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth() === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };
    const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

    const openPopup = (key) => {
        const existing = dayData()[key] || {};
        setSelectedDay(key);
        setPopupHabits({ ...(existing.habits || {}) });
        setPopupRating(existing.rating || null);
        setPopupNotes(existing.notes ?? "");

        const minutes = {};
        habits().filter(h => h.timed).forEach(h => {
            minutes[h.id] = String(existing.habits?.[`${h.id}_minutes`] ?? "");
        });
        setTimedMinutes(minutes);
    };

    const closePopup = () => setSelectedDay(null);

    const toggleHabit = (habitId) =>
        setPopupHabits(h => ({ ...h, [habitId]: !h[habitId] }));

    const savePopup = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const key = selectedDay();
        const habitData = { ...popupHabits() }; 

        habits().filter(h => h.timed).forEach(h => {   
            if (habitData[h.id]) {
                const mins = parseInt(timedMinutes()[h.id]);
                habitData[`${h.id}_minutes`] = isNaN(mins) ? 0 : mins;
            } else {
                delete habitData[h.id];
                delete habitData[`${h.id}_minutes`];
            }
        });

        const payload = {
            habits: habitData,                  
            rating: popupRating() ?? null,
            notes: popupNotes().trim(),
            updatedAt: new Date().toISOString(),
        };

        setDayData(prev => ({ ...prev, [key]: payload }));
        closePopup();

        setSaving(true);
        try {
            await setDoc(getDayRef(uid, key), payload);
        } catch (err) {
            console.error("Firestore write failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const popupDateLabel = createMemo(() => {
        const key = selectedDay();
        if (!key) return "";
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("default", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
    });

    return (
        <div class="cal-wrapper">

            <div class="cal-nav">
                <button class="cal-nav__arrow" onClick={prevMonth}>‹</button>
                <div class="cal-nav__center">
                    <h2 class="cal-nav__title">{monthName()}</h2>
                    <button class="cal-nav__today" onClick={goToday}>Today</button>
                </div>
                <button class="cal-nav__arrow" onClick={nextMonth}>›</button>
            </div>

            <Show when={loading()}>
                <div class="cal-loading">Loading…</div>
            </Show>

            <div class="cal-weekdays">
                <For each={WEEKDAYS}>{(d) => <div class="cal-weekday">{d}</div>}</For>
            </div>

            <div class="cal-grid">
                <For each={calendarCells()}>
                    {(cell) => (
                        <Show when={cell.day !== null} fallback={<div class="cal-cell cal-cell--empty" />}>
                            <CalendarCell
                                day={cell.day}
                                dateKey={cell.key}
                                isToday={cell.isToday}
                                dayData={dayData}
                                onOpen={() => openPopup(cell.key)}
                            />
                        </Show>
                    )}
                </For>
            </div>

            <Show when={selectedDay()}>
                <div class="cal-overlay" onClick={closePopup}>
                    <div class="cal-popup" onClick={e => e.stopPropagation()}>

                        <div class="cal-popup__header">
                            <div>
                                <p class="cal-popup__date">{popupDateLabel()}</p>
                                <h3 class="cal-popup__title">Daily Log</h3>
                            </div>
                            <button class="cal-popup__close" onClick={closePopup}>✕</button>
                        </div>

                        <div class="cal-popup__section">
                            <p class="cal-popup__label">Habits</p>
                            <div class="cal-habit-list">
                                <For each={habits()}>
                                    {(habit) => (
                                        <div
                                            class={`cal-habit${popupHabits()[habit.id] ? " cal-habit--on" : ""}`}
                                            onClick={() => toggleHabit(habit.id)}
                                        >
                                            <span class="cal-habit__icon">{habit.icon}</span>
                                            <span class="cal-habit__name">{habit.label}</span>
                                            <span class="cal-habit__tick">{popupHabits()[habit.id] ? "✓" : ""}</span>
                                        </div>
                                    )}
                                </For>
                            </div>

                            <Show when={habits().filter(h => h.timed).some(h => popupHabits()[h.id])}>
                                <div class="cal-timed-fields">
                                    <For each={habits().filter(h => h.timed && popupHabits()[h.id])}>
                                        {(habit) => (
                                            <div class="cal-timed-field">
                                                <label class="cal-timed-label">
                                                    {habit.icon} How long did you {habit.label.toLowerCase()}?
                                                </label>
                                                <div class="cal-timed-row">
                                                    <input
                                                        class="cal-timed-input"
                                                        type="number"
                                                        min="1"
                                                        max="999"
                                                        placeholder="45"
                                                        value={timedMinutes()[habit.id] ?? ""}
                                                        onInput={e => setTimedMinutes(prev => ({
                                                            ...prev,
                                                            [habit.id]: e.target.value
                                                        }))}
                                                    />
                                                    <span class="cal-timed-unit">minutes</span>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </Show>
                        </div>

                        <div class="cal-popup__section">
                            <p class="cal-popup__label">Rate this day</p>
                            <div class="cal-rating-row">
                                <For each={RATINGS}>
                                    {(r) => (
                                        <button
                                            class={`cal-rating-btn cal-rating-btn--${r.id}${popupRating() === r.id ? " cal-rating-btn--active" : ""}`}
                                            onClick={() => setPopupRating(prev => prev === r.id ? null : r.id)}
                                        >
                                            <span class="cal-rating-btn__emoji">{r.emoji}</span>
                                            <span class="cal-rating-btn__label">{r.label}</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </div>

                        <div class="cal-popup__section">
                            <p class="cal-popup__label">Notes</p>
                            <textarea
                                class="cal-notes-input"
                                placeholder="How did today go?"
                                rows={3}
                                value={popupNotes()}
                                onInput={e => setPopupNotes(e.target.value)}
                            />
                        </div>

                        <button class="cal-save-btn" onClick={savePopup} disabled={saving()}>
                            {saving() ? "Saving…" : "Save"}
                        </button>

                    </div>
                </div>
            </Show>

        </div>
    );
}