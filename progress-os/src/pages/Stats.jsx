import { createSignal, createMemo, For, Show } from "solid-js";
import { db, auth } from "../lib/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/stats.css";

const HABITS = [
    { id: "workout", label: "Workout", icon: "💪", timed: false },
    { id: "cold_shower", label: "Cold Shower", icon: "🚿", timed: false },
    { id: "meditate", label: "Meditate", icon: "🧘", timed: false },
    { id: "study", label: "Study", icon: "📚", timed: true },
];

const RANKS = [
    { name: "Beginner", minXP: 0 },
    { name: "Novice", minXP: 100 },
    { name: "Apprentice", minXP: 250 },
    { name: "Intermediate", minXP: 500 },
    { name: "Advanced", minXP: 1000 },
    { name: "Expert", minXP: 2000 },
    { name: "Master", minXP: 4000 },
    { name: "Legend", minXP: 8000 },
];

// Given total XP, return everything needed to render the card
function getRankInfo(xp) {
    let idx = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXP) { idx = i; break; }
    }
    const current = RANKS[idx];
    const next = RANKS[idx + 1] ?? null;
    const xpIntoRank = xp - current.minXP;
    const xpNeeded = next ? next.minXP - current.minXP : null;
    const progress = next ? Math.min((xpIntoRank / xpNeeded) * 100, 100) : 100;
    return {
        rank: current.name,
        isMax: !next,
        nextRank: next?.name ?? null,
        xpIntoRank,
        xpNeeded,
        progress,
    };
}

// Compute per-habit stats from all fetched logs
function computeStats(logs) {
    const stats = {};

    HABITS.forEach(h => {
        stats[h.id] = { timesDone: 0, totalMinutes: 0, xp: 0 };
    });

    logs.forEach(log => {
        const habits = log.habits || {};
        HABITS.forEach(h => {
            if (!habits[h.id]) return;
            stats[h.id].timesDone++;
            if (h.timed) {
                const mins = habits[`${h.id}_minutes`] ?? 0;
                stats[h.id].totalMinutes += mins;
                stats[h.id].xp += mins; // 1 XP per minute
            } else {
                stats[h.id].xp += 10; // 10 XP per completion
            }
        });
    });

    return stats;
}

export default function Stats() {
    const [stats, setStats] = createSignal(null);
    const [loading, setLoading] = createSignal(true);

    // Wait for auth, then fetch ALL daily logs
    onAuthStateChanged(auth, async (user) => {
        if (!user) { setLoading(false); return; }

        try {
            const snap = await getDocs(
                collection(db, "users", user.uid, "dailyLogs")
            );
            const logs = [];
            snap.forEach(d => logs.push(d.data()));
            setStats(computeStats(logs));
        } catch (err) {
            console.error("Failed to load stats:", err);
        } finally {
            setLoading(false);
        }
    });

    return (
        <div class="stats-wrapper">
            <h1 class="stats-title">Stats</h1>

            <Show when={loading()}>
                <p class="stats-loading">Loading your stats…</p>
            </Show>

            <Show when={!loading() && stats()}>
                {/* ── Habit cards ── */}
                <div class="stats-cards">
                    <For each={HABITS}>
                        {(habit) => {
                            const s = stats()[habit.id];
                            const info = getRankInfo(s.xp);
                            return (
                                <div class="stats-card">
                                    <div class="stats-card__header">
                                        <span class="stats-card__icon">{habit.icon}</span>
                                        <div>
                                            <p class="stats-card__name">{habit.label}</p>
                                            <p class="stats-card__rank">{info.rank}</p>
                                        </div>
                                    </div>

                                    {/* XP bar */}
                                    <div class="stats-card__bar-wrap">
                                        <div
                                            class="stats-card__bar-fill"
                                            style={{ width: `${info.progress}%` }}
                                        />
                                    </div>

                                    {/* XP numbers */}
                                    <div class="stats-card__xp-row">
                                        <span class="stats-card__xp-total">
                                            {s.xp} XP total
                                        </span>
                                        <span class="stats-card__xp-next">
                                            {info.isMax
                                                ? "MAX RANK"
                                                : `${info.xpIntoRank} / ${info.xpNeeded} XP → ${info.nextRank}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        }}
                    </For>
                </div>

                {/* ── Summary table ── */}

                <p class="stats-section-label">All-time breakdown</p>
                <div class="stats-table-wrap"></div>
                <div class="stats-table-wrap">
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Habit</th>
                                <th>Times Done</th>
                                <th>Total Minutes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={HABITS}>
                                {(habit) => {
                                    const s = stats()[habit.id];
                                    return (
                                        <tr>
                                            <td>
                                                <span class="stats-table__icon">{habit.icon}</span>
                                                {habit.label}
                                            </td>
                                            <td>{s.timesDone}</td>
                                            <td class={habit.timed ? "" : "stats-table__dash"}>{habit.timed ? s.totalMinutes : "—"}</td>
                                        </tr>
                                    );
                                }}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Show>
        </div>
    );
}