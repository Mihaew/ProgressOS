import { Router, Route, Navigate } from "@solidjs/router";
import { isAuthenticated, authLoading } from "./services/auth.js";
import { Show } from "solid-js";
import Toast from "./components/toast.jsx";
import "./styles/toast.css";


import TestHomePage from "./TestHomePage";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignOut from "./pages/SignOut.jsx";

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={TestHomePage}></Route>

      <Route path="/user">
        <Route path="/signup" component={SignUp} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signout" component={SignOut} />
      </Route>

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

            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">◫</div>
              <span class="pos-nav-item__label">Calendar</span>
            </a>

            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">▲</div>
              <span class="pos-nav-item__label">Stats</span>
            </a>

            <a href="#" class="pos-nav-item">
              <div class="pos-nav-item__icon">❋</div>
              <span class="pos-nav-item__label">Achievements</span>
            </a>
          </aside>

          <main class="pos-content">{props.children}</main>

        </div>
      </div>
    </>
  );
}

function NotFound() {
  return <Navigate href="/error" state={{ error: { title: "404", message: "Tražena stranica ne postoji." } }} />
}

