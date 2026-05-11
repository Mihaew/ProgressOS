import { createSignal, For, Show } from "solid-js";
import { db, auth } from "../lib/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { habits, loadHabits } from "../stores/habits.js";
import "../styles/stats.css";

const RANKS = [
    { name: "Beginner",     minXP: 0    },
    { name: "Novice",       minXP: 100  },
    { name: "Apprentice",   minXP: 250  },
    { name: "Intermediate", minXP: 500  },
    { name: "Advanced",     minXP: 1000 },
    { name: "Expert",       minXP: 2000 },
    { name: "Master",       minXP: 4000 },
    { name: "Legend",       minXP: 8000 },
];

function getRankInfo(xp) {
    let idx = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXP) { idx = i; break; }
    }
    const current    = RANKS[idx];
    const next       = RANKS[idx + 1] ?? null;
    const xpIntoRank = xp - current.minXP;
    const xpNeeded   = next ? next.minXP - current.minXP : null;
    const progress   = next ? Math.min((xpIntoRank / xpNeeded) * 100, 100) : 100;
    return { rank: current.name, isMax: !next, nextRank: next?.name ?? null, xpIntoRank, xpNeeded, progress };
}

function computeStats(logs) {
    const currentHabits = habits(); 
    const stats = {};

    currentHabits.forEach(h => {
        stats[h.id] = { timesDone: 0, totalMinutes: 0, xp: 0 };
    });

    logs.forEach(log => {
        const logHabits = log.habits || {}; 
        currentHabits.forEach(h => {
            if (!logHabits[h.id]) return;
            stats[h.id].timesDone++;
            if (h.timed) {
                const mins = logHabits[`${h.id}_minutes`] ?? 0;
                stats[h.id].totalMinutes += mins;
                stats[h.id].xp          += mins;
            } else {
                stats[h.id].xp += 10;
            }
        });
    });

    return stats;
}

export default function Stats() {
    const [stats,   setStats]   = createSignal(null);
    const [loading, setLoading] = createSignal(true);

    onAuthStateChanged(auth, async (user) => {
        if (!user) { setLoading(false); return; }

        await loadHabits(user.uid);

        try {
            const snap = await getDocs(collection(db, "users", user.uid, "dailyLogs"));
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
                <div class="stats-cards">
                    <For each={habits()}>
                        {(habit) => {
                            const s    = stats()[habit.id] ?? { timesDone: 0, totalMinutes: 0, xp: 0 };
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
                                    <div class="stats-card__bar-wrap">
                                        <div class="stats-card__bar-fill" style={{ width: `${info.progress}%` }} />
                                    </div>
                                    <div class="stats-card__xp-row">
                                        <span class="stats-card__xp-total">{s.xp} XP total</span>
                                        <span class="stats-card__xp-next">
                                            {info.isMax ? "MAX RANK" : `${info.xpIntoRank} / ${info.xpNeeded} XP → ${info.nextRank}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        }}
                    </For>
                </div>

                <p class="stats-section-label">All-time breakdown</p>
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
                            <For each={habits()}>
                                {(habit) => {
                                    const s = stats()[habit.id] ?? { timesDone: 0, totalMinutes: 0 };
                                    return (
                                        <tr>
                                            <td><span class="stats-table__icon">{habit.icon}</span>{habit.label}</td>
                                            <td>{s.timesDone}</td>
                                            <td class={habit.timed ? "" : "stats-table__dash"}>
                                                {habit.timed ? s.totalMinutes : "—"}
                                            </td>
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