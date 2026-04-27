import { Router, Route, Navigate } from "@solidjs/router";
import { isAuthenticated, authLoading } from "./services/auth.js";
import { Show } from "solid-js";
import Toast from "./components/Toast.jsx";
import "./styles/toast.css";


import TestHomePage from "./TestHomePage";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignOut from "./pages/SignOut.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Error from "./pages/Error.jsx";
import Calendar from "./pages/Calendar.jsx";
import Stats from "./pages/Stats.jsx";

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={TestHomePage}></Route>

      <Route path="/user">
        <Route path="/signup" component={SignUp} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signout" component={SignOut} />
        <Route path="/password-reset" component={PasswordReset} />
        <Route path="/profile" component={AuthBoundary}>
          <Route path="/" component={UserProfile} />
        </Route>
        <Route path="/calendar" component={Calendar} />
        <Route path="/stats" component={Stats} />
      </Route>

      <Route path="/error" component={Error} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}

function Layout(props) {
  return (
    <>
      <div class="pos-shell">
        <Toast />

        <header class="pos-navbar">
          <span class="pos-navbar__title">ProgressOS</span>
          <div class="pos-navbar__actions">
            <Show when={!isAuthenticated()}>
              <a href="/user/signup"><button class="pos-btn pos-btn--outline">Sign up</button></a>
              <a href="/user/signin"><button class="pos-btn pos-btn--solid">Sign in</button></a>
            </Show>

            <Show when={isAuthenticated()}>
              <a href="/user/signout"><button class="pos-btn pos-btn--solid">Sign out</button></a>
            </Show>

          </div>
        </header>

        <div class="pos-body">

          <aside class="pos-sidebar">
            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">⊞</div>
              <span class="pos-nav-item__label">Dashboa4rd</span>
            </a>

            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">✦</div>
              <span class="pos-nav-item__label">Daily Log</span>
            </a>

            <a href="/user/calendar" class="pos-nav-item">
              <div class="pos-nav-item__icon">◫</div>
              <span class="pos-nav-item__label">Calendar</span>
            </a>

            <a href="/user/stats" class="pos-nav-item">
              <div class="pos-nav-item__icon">▲</div>
              <span class="pos-nav-item__label">Stats</span>
            </a>

            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">❋</div>
              <span class="pos-nav-item__label">Achievements</span>
            </a>

            <a href="/user/profile" class="pos-nav-item">
              <div class="pos-nav-item__icon">☰</div>
              <span class="pos-nav-item__label">Profile</span>
            </a>
          </aside>

          <main class="pos-content">{props.children}</main>

        </div>
      </div>
    </>
  );
}

function NotFound() {
  return <Navigate href="/error" state={{ error: { title: "404", message: "Site not found." } }} />
}

function AuthBoundary(props) {
    return (
        <Show when={!authLoading()} fallback={
            <div class="flex justify-center items-center min-h-screen">
                <span class="loading loading-spinner loading-xl"></span>
            </div>
        }>
            {isAuthenticated() ?
                (props.children) :
                (<Navigate
                    href="/error"
                    state={{ error: { title: "401", message: "Not allowed" } }} />)}
        </Show>
    );
}