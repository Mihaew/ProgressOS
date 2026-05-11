import { createSignal, createMemo, For, Show } from "solid-js";
import { db, auth } from "../lib/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/achievements.css";

const ACHIEVEMENTS = [
    {
        id: "study_first",
        category: "study",
        icon: "📖",
        name: "First Page",
        desc: "Study for the first time",
        check: s => s.studyDays >= 1,
        progress: s => ({ current: s.studyDays, target: 1 }),
    },
    {
        id: "study_30min",
        category: "study",
        icon: "📚",
        name: "Warming Up",
        desc: "Study 30 minutes in a single day",
        check: s => s.maxStudyMinutesInDay >= 30,
        progress: s => ({ current: Math.min(s.maxStudyMinutesInDay, 30), target: 30 }),
    },
    {
        id: "study_60min",
        category: "study",
        icon: "📚",
        name: "Deep Focus",
        desc: "Study 60 minutes in a single day",
        check: s => s.maxStudyMinutesInDay >= 60,
        progress: s => ({ current: Math.min(s.maxStudyMinutesInDay, 60), target: 60 }),
    },
    {
        id: "study_120min",
        category: "study",
        icon: "🧠",
        name: "Scholar",
        desc: "Study 120 minutes in a single day",
        check: s => s.maxStudyMinutesInDay >= 120,
        progress: s => ({ current: Math.min(s.maxStudyMinutesInDay, 120), target: 120 }),
    },
    {
        id: "study_240min",
        category: "study",
        icon: "🧠",
        name: "Obsessed",
        desc: "Study 240 minutes in a single day",
        check: s => s.maxStudyMinutesInDay >= 240,
        progress: s => ({ current: Math.min(s.maxStudyMinutesInDay, 240), target: 240 }),
    },
    {
        id: "study_500total",
        category: "study",
        icon: "📜",
        name: "500 Club",
        desc: "Study 500 total minutes",
        check: s => s.totalStudyMinutes >= 500,
        progress: s => ({ current: Math.min(s.totalStudyMinutes, 500), target: 500 }),
    },
    {
        id: "study_1000total",
        category: "study",
        icon: "📜",
        name: "Knowledge Seeker",
        desc: "Study 1,000 total minutes",
        check: s => s.totalStudyMinutes >= 1000,
        progress: s => ({ current: Math.min(s.totalStudyMinutes, 1000), target: 1000 }),
    },
    {
        id: "study_5000total",
        category: "study",
        icon: "🎓",
        name: "Grand Scholar",
        desc: "Study 5,000 total minutes",
        check: s => s.totalStudyMinutes >= 5000,
        progress: s => ({ current: Math.min(s.totalStudyMinutes, 5000), target: 5000 }),
    },
    {
        id: "study_10000total",
        category: "study",
        icon: "🎓",
        name: "Master of the Mind",
        desc: "Study 10,000 total minutes",
        check: s => s.totalStudyMinutes >= 10000,
        progress: s => ({ current: Math.min(s.totalStudyMinutes, 10000), target: 10000 }),
    },
    {
        id: "study_days_7",
        category: "study",
        icon: "📅",
        name: "Week of Wisdom",
        desc: "Study on 7 different days",
        check: s => s.studyDays >= 7,
        progress: s => ({ current: Math.min(s.studyDays, 7), target: 7 }),
    },
    {
        id: "study_days_30",
        category: "study",
        icon: "📅",
        name: "Monthly Grind",
        desc: "Study on 30 different days",
        check: s => s.studyDays >= 30,
        progress: s => ({ current: Math.min(s.studyDays, 30), target: 30 }),
    },
    {
        id: "workout_first",
        category: "workout",
        icon: "💪",
        name: "First Rep",
        desc: "Log a workout for the first time",
        check: s => s.workoutDays >= 1,
        progress: s => ({ current: s.workoutDays, target: 1 }),
    },
    {
        id: "workout_10",
        category: "workout",
        icon: "💪",
        name: "Getting Consistent",
        desc: "Work out 10 times",
        check: s => s.workoutDays >= 10,
        progress: s => ({ current: Math.min(s.workoutDays, 10), target: 10 }),
    },
    {
        id: "workout_25",
        category: "workout",
        icon: "🏅",
        name: "Quarter Century",
        desc: "Work out 25 times",
        check: s => s.workoutDays >= 25,
        progress: s => ({ current: Math.min(s.workoutDays, 25), target: 25 }),
    },
    {
        id: "workout_50",
        category: "workout",
        icon: "🏅",
        name: "Iron Will",
        desc: "Work out 50 times",
        check: s => s.workoutDays >= 50,
        progress: s => ({ current: Math.min(s.workoutDays, 50), target: 50 }),
    },
    {
        id: "workout_100",
        category: "workout",
        icon: "🔱",
        name: "Centurion",
        desc: "Work out 100 times",
        check: s => s.workoutDays >= 100,
        progress: s => ({ current: Math.min(s.workoutDays, 100), target: 100 }),
    },
    {
        id: "cold_first",
        category: "cold",
        icon: "🚿",
        name: "Ice Breaker",
        desc: "Take your first cold shower",
        check: s => s.coldDays >= 1,
        progress: s => ({ current: s.coldDays, target: 1 }),
    },
    {
        id: "cold_10",
        category: "cold",
        icon: "🧊",
        name: "Cold Blooded",
        desc: "Take 10 cold showers",
        check: s => s.coldDays >= 10,
        progress: s => ({ current: Math.min(s.coldDays, 10), target: 10 }),
    },
    {
        id: "cold_30",
        category: "cold",
        icon: "🧊",
        name: "Frost",
        desc: "Take 30 cold showers",
        check: s => s.coldDays >= 30,
        progress: s => ({ current: Math.min(s.coldDays, 30), target: 30 }),
    },
    {
        id: "cold_100",
        category: "cold",
        icon: "❄️",
        name: "The Iceman",
        desc: "Take 100 cold showers",
        check: s => s.coldDays >= 100,
        progress: s => ({ current: Math.min(s.coldDays, 100), target: 100 }),
    },
    {
        id: "meditate_first",
        category: "meditate",
        icon: "🧘",
        name: "Still Mind",
        desc: "Meditate for the first time",
        check: s => s.meditateDays >= 1,
        progress: s => ({ current: s.meditateDays, target: 1 }),
    },
    {
        id: "meditate_10",
        category: "meditate",
        icon: "🧘",
        name: "Inner Peace",
        desc: "Meditate 10 times",
        check: s => s.meditateDays >= 10,
        progress: s => ({ current: Math.min(s.meditateDays, 10), target: 10 }),
    },
    {
        id: "meditate_30",
        category: "meditate",
        icon: "☯️",
        name: "Zen Mode",
        desc: "Meditate 30 times",
        check: s => s.meditateDays >= 30,
        progress: s => ({ current: Math.min(s.meditateDays, 30), target: 30 }),
    },
    {
        id: "meditate_100",
        category: "meditate",
        icon: "☯️",
        name: "Enlightened",
        desc: "Meditate 100 times",
        check: s => s.meditateDays >= 100,
        progress: s => ({ current: Math.min(s.meditateDays, 100), target: 100 }),
    },
    {
        id: "win_first",
        category: "ratings",
        icon: "🏆",
        name: "Winner",
        desc: "Rate a day as a Win",
        check: s => s.winDays >= 1,
        progress: s => ({ current: s.winDays, target: 1 }),
    },
    {
        id: "win_10",
        category: "ratings",
        icon: "🏆",
        name: "On a Roll",
        desc: "Rate 10 days as a Win",
        check: s => s.winDays >= 10,
        progress: s => ({ current: Math.min(s.winDays, 10), target: 10 }),
    },
    {
        id: "win_30",
        category: "ratings",
        icon: "👑",
        name: "Dominant",
        desc: "Rate 30 days as a Win",
        check: s => s.winDays >= 30,
        progress: s => ({ current: Math.min(s.winDays, 30), target: 30 }),
    },
    {
        id: "win_100",
        category: "ratings",
        icon: "👑",
        name: "Untouchable",
        desc: "Rate 100 days as a Win",
        check: s => s.winDays >= 100,
        progress: s => ({ current: Math.min(s.winDays, 100), target: 100 }),
    },
    {
        id: "no_fail_30",
        category: "ratings",
        icon: "🛡️",
        name: "No Excuses",
        desc: "Log 30 days with zero Fails",
        check: s => s.loggedDays >= 30 && s.failDays === 0,
        progress: s => ({ current: s.failDays === 0 ? Math.min(s.loggedDays, 30) : 0, target: 30 }),
    },
    {
        id: "streak_3",
        category: "streak",
        icon: "🔥",
        name: "Spark",
        desc: "Log habits 3 days in a row",
        check: s => s.longestStreak >= 3,
        progress: s => ({ current: Math.min(s.longestStreak, 3), target: 3 }),
    },
    {
        id: "streak_7",
        category: "streak",
        icon: "🔥",
        name: "Week Warrior",
        desc: "Log habits 7 days in a row",
        check: s => s.longestStreak >= 7,
        progress: s => ({ current: Math.min(s.longestStreak, 7), target: 7 }),
    },
    {
        id: "streak_14",
        category: "streak",
        icon: "🌋",
        name: "Fortnight Force",
        desc: "Log habits 14 days in a row",
        check: s => s.longestStreak >= 14,
        progress: s => ({ current: Math.min(s.longestStreak, 14), target: 14 }),
    },
    {
        id: "streak_30",
        category: "streak",
        icon: "🌋",
        name: "Unstoppable",
        desc: "Log habits 30 days in a row",
        check: s => s.longestStreak >= 30,
        progress: s => ({ current: Math.min(s.longestStreak, 30), target: 30 }),
    },
    {
        id: "streak_60",
        category: "streak",
        icon: "💎",
        name: "Diamond Discipline",
        desc: "Log habits 60 days in a row",
        check: s => s.longestStreak >= 60,
        progress: s => ({ current: Math.min(s.longestStreak, 60), target: 60 }),
    },
    {
        id: "streak_100",
        category: "streak",
        icon: "💎",
        name: "Centurion Streak",
        desc: "Log habits 100 days in a row",
        check: s => s.longestStreak >= 100,
        progress: s => ({ current: Math.min(s.longestStreak, 100), target: 100 }),
    },
    {
        id: "wlog_first",
        category: "wlog",
        icon: "🏋️",
        name: "First Session",
        desc: "Log your first workout session",
        check: s => s.workoutSessions >= 1,
        progress: s => ({ current: s.workoutSessions, target: 1 }),
    },
    {
        id: "wlog_10",
        category: "wlog",
        icon: "🏋️",
        name: "Regular",
        desc: "Log 10 workout sessions",
        check: s => s.workoutSessions >= 10,
        progress: s => ({ current: Math.min(s.workoutSessions, 10), target: 10 }),
    },
    {
        id: "wlog_50",
        category: "wlog",
        icon: "⚡",
        name: "Gym Rat",
        desc: "Log 50 workout sessions",
        check: s => s.workoutSessions >= 50,
        progress: s => ({ current: Math.min(s.workoutSessions, 50), target: 50 }),
    },
    {
        id: "wlog_100",
        category: "wlog",
        icon: "⚡",
        name: "Veteran",
        desc: "Log 100 workout sessions",
        check: s => s.workoutSessions >= 100,
        progress: s => ({ current: Math.min(s.workoutSessions, 100), target: 100 }),
    },
    {
        id: "wlog_vol_1000",
        category: "wlog",
        icon: "📦",
        name: "One Ton",
        desc: "Lift 1,000 kg total volume",
        check: s => s.totalVolume >= 1000,
        progress: s => ({ current: Math.min(s.totalVolume, 1000), target: 1000 }),
    },
    {
        id: "wlog_vol_10000",
        category: "wlog",
        icon: "📦",
        name: "Ten Tons",
        desc: "Lift 10,000 kg total volume",
        check: s => s.totalVolume >= 10000,
        progress: s => ({ current: Math.min(s.totalVolume, 10000), target: 10000 }),
    },
    {
        id: "wlog_vol_100000",
        category: "wlog",
        icon: "🚂",
        name: "Freight Train",
        desc: "Lift 100,000 kg total volume",
        check: s => s.totalVolume >= 100000,
        progress: s => ({ current: Math.min(s.totalVolume, 100000), target: 100000 }),
    },
    {
        id: "wlog_sets_100",
        category: "wlog",
        icon: "🔢",
        name: "Set Machine",
        desc: "Complete 100 total sets",
        check: s => s.totalSets >= 100,
        progress: s => ({ current: Math.min(s.totalSets, 100), target: 100 }),
    },
    {
        id: "wlog_sets_500",
        category: "wlog",
        icon: "🔢",
        name: "Volume King",
        desc: "Complete 500 total sets",
        check: s => s.totalSets >= 500,
        progress: s => ({ current: Math.min(s.totalSets, 500), target: 500 }),
    },
    {
        id: "all_habits_once",
        category: "special",
        icon: "⭐",
        name: "Full House",
        desc: "Complete all habits in a single day",
        check: s => s.perfectDays >= 1,
        progress: s => ({ current: s.perfectDays, target: 1 }),
    },
    {
        id: "all_habits_7",
        category: "special",
        icon: "🌟",
        name: "Perfect Week",
        desc: "Complete all habits 7 different days",
        check: s => s.perfectDays >= 7,
        progress: s => ({ current: Math.min(s.perfectDays, 7), target: 7 }),
    },
    {
        id: "all_habits_30",
        category: "special",
        icon: "🌟",
        name: "Perfect Month",
        desc: "Complete all habits 30 different days",
        check: s => s.perfectDays >= 30,
        progress: s => ({ current: Math.min(s.perfectDays, 30), target: 30 }),
    },
    {
        id: "logged_7",
        category: "special",
        icon: "📋",
        name: "Getting Started",
        desc: "Log any habit on 7 different days",
        check: s => s.loggedDays >= 7,
        progress: s => ({ current: Math.min(s.loggedDays, 7), target: 7 }),
    },
    {
        id: "logged_30",
        category: "special",
        icon: "📋",
        name: "Committed",
        desc: "Log any habit on 30 different days",
        check: s => s.loggedDays >= 30,
        progress: s => ({ current: Math.min(s.loggedDays, 30), target: 30 }),
    },
    {
        id: "logged_100",
        category: "special",
        icon: "🗓️",
        name: "100 Days Strong",
        desc: "Log any habit on 100 different days",
        check: s => s.loggedDays >= 100,
        progress: s => ({ current: Math.min(s.loggedDays, 100), target: 100 }),
    },
];

const CATEGORIES = [
    { id: "all",      label: "All"          },
    { id: "study",    label: "📚 Study"     },
    { id: "workout",  label: "💪 Workout"   },
    { id: "cold",     label: "🚿 Cold"      },
    { id: "meditate", label: "🧘 Meditate"  },
    { id: "ratings",  label: "🏆 Ratings"   },
    { id: "streak",   label: "🔥 Streaks"   },
    { id: "wlog",     label: "🏋️ Sessions"  },
    { id: "special",  label: "⭐ Special"   },
];

const ALL_HABITS = ["workout", "cold_shower", "meditate", "study"];

function computeStats(dailyLogs, workoutLogs) {
    let totalStudyMinutes    = 0;
    let maxStudyMinutesInDay = 0;
    let studyDays            = 0;
    let workoutDays          = 0;
    let coldDays             = 0;
    let meditateDays         = 0;
    let winDays              = 0;
    let failDays             = 0;
    let loggedDays           = 0;
    let perfectDays          = 0;

    const sortedDateKeys = Object.keys(dailyLogs).sort();

    sortedDateKeys.forEach(key => {
        const log    = dailyLogs[key];
        const habits = log.habits || {};

        const hasAny = ALL_HABITS.some(h => habits[h]);
        if (!hasAny && !log.rating) return;

        loggedDays++;

        if (habits.study) {
            const mins = habits.study_minutes || 0;
            totalStudyMinutes    += mins;
            maxStudyMinutesInDay  = Math.max(maxStudyMinutesInDay, mins);
            studyDays++;
        }
        if (habits.workout)     workoutDays++;
        if (habits.cold_shower) coldDays++;
        if (habits.meditate)    meditateDays++;
        if (log.rating === "win")  winDays++;
        if (log.rating === "fail") failDays++;

        const allDone = ALL_HABITS.every(h => habits[h]);
        if (allDone) perfectDays++;
    });

    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate      = null;

    sortedDateKeys.forEach(key => {
        const log    = dailyLogs[key];
        const habits = log.habits || {};
        const hasAny = ALL_HABITS.some(h => habits[h]) || log.rating;
        if (!hasAny) return;

        const curr = new Date(key);
        if (prevDate) {
            const diff = (curr - prevDate) / 86400000;
            if (diff === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        prevDate = curr;
    });
    longestStreak = Math.max(longestStreak, currentStreak);

    let workoutSessions = workoutLogs.length;
    let totalVolume     = 0;
    let totalSets       = 0;

    workoutLogs.forEach(log => {
        (log.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(set => {
                totalSets++;
                totalVolume += (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0);
            });
        });
    });

    return {
        totalStudyMinutes,
        maxStudyMinutesInDay,
        studyDays,
        workoutDays,
        coldDays,
        meditateDays,
        winDays,
        failDays,
        loggedDays,
        perfectDays,
        longestStreak,
        workoutSessions,
        totalVolume,
        totalSets,
    };
}

function AchievementCard({ achievement, stats }) {
    const done     = createMemo(() => achievement.check(stats));
    const prog     = createMemo(() => achievement.progress(stats));
    const pct      = createMemo(() =>
        Math.min(100, Math.round((prog().current / prog().target) * 100))
    );

    return (
        <div class={`ach-card${done() ? " ach-card--done" : ""}`}>
            <div class="ach-card__icon-wrap">
                <span class="ach-card__icon">{achievement.icon}</span>
                <Show when={done()}>
                    <span class="ach-card__check">✓</span>
                </Show>
            </div>
            <div class="ach-card__body">
                <p class="ach-card__name">{achievement.name}</p>
                <p class="ach-card__desc">{achievement.desc}</p>
                <div class="ach-card__bar-wrap">
                    <div
                        class="ach-card__bar-fill"
                        style={{ width: `${pct()}%` }}
                    />
                </div>
                <p class="ach-card__progress">
                    {prog().current.toLocaleString()} / {prog().target.toLocaleString()}
                </p>
            </div>
        </div>
    );
}

export default function Achievements() {
    const [stats,    setStats]    = createSignal(null);
    const [loading,  setLoading]  = createSignal(true);
    const [category, setCategory] = createSignal("all");
    const [showDone, setShowDone] = createSignal(true);

    onAuthStateChanged(auth, async (user) => {
        if (!user) { setLoading(false); return; }

        try {
            const [dailySnap, workoutSnap] = await Promise.all([
                getDocs(collection(db, "users", user.uid, "dailyLogs")),
                getDocs(collection(db, "users", user.uid, "workoutLogs")),
            ]);

            const dailyLogs   = {};
            const workoutLogs = [];
            dailySnap.forEach(d   => { dailyLogs[d.id] = d.data(); });
            workoutSnap.forEach(d => workoutLogs.push(d.data()));

            setStats(computeStats(dailyLogs, workoutLogs));
        } catch (err) {
            console.error("Failed to load achievements:", err);
        } finally {
            setLoading(false);
        }
    });

    const filtered = createMemo(() => {
        if (!stats()) return [];
        return ACHIEVEMENTS.filter(a => {
            const catOk  = category() === "all" || a.category === category();
            const doneOk = showDone() || !a.check(stats());
            return catOk && doneOk;
        });
    });

    const doneCount = createMemo(() =>
        stats() ? ACHIEVEMENTS.filter(a => a.check(stats())).length : 0
    );

    return (
        <div class="ach-wrapper">

            <div class="ach-header">
                <div>
                    <h1 class="ach-title">Achievements</h1>
                    <Show when={stats()}>
                        <p class="ach-subtitle">
                            {doneCount()} / {ACHIEVEMENTS.length} unlocked
                        </p>
                    </Show>
                </div>
                <Show when={stats()}>
                    <div class="ach-header__right">
                        <div class="ach-master-bar-wrap" title={`${doneCount()} / ${ACHIEVEMENTS.length}`}>
                            <div
                                class="ach-master-bar-fill"
                                style={{ width: `${Math.round((doneCount() / ACHIEVEMENTS.length) * 100)}%` }}
                            />
                        </div>
                        <span class="ach-master-pct">
                            {Math.round((doneCount() / ACHIEVEMENTS.length) * 100)}%
                        </span>
                    </div>
                </Show>
            </div>

            <div class="ach-filters">
                <div class="ach-cats">
                    <For each={CATEGORIES}>
                        {(cat) => (
                            <button
                                class={`ach-cat-btn${category() === cat.id ? " ach-cat-btn--active" : ""}`}
                                onClick={() => setCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        )}
                    </For>
                </div>
                <button
                    class={`ach-toggle-btn${!showDone() ? " ach-toggle-btn--active" : ""}`}
                    onClick={() => setShowDone(v => !v)}
                >
                    {showDone() ? "Hide completed" : "Show completed"}
                </button>
            </div>

            <Show when={loading()}>
                <p class="ach-loading">Loading achievements…</p>
            </Show>

            <Show when={!loading() && stats()}>
                <div class="ach-grid">
                    <For each={filtered()}>
                        {(a) => <AchievementCard achievement={a} stats={stats()} />}
                    </For>
                </div>
                <Show when={filtered().length === 0}>
                    <p class="ach-empty">No achievements to show here.</p>
                </Show>
            </Show>

        </div>
    );
}