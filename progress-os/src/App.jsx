import { Router, Route, Navigate } from "@solidjs/router";

import TestHomePage from "./TestHomePage";

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={TestHomePage}></Route>
      <Route path="*" component={NotFound} />
    </Router>
  );
}

function Layout(props) {
  return (
    <>
      <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-center">
          <a href="/" class="btn btn-ghost text-xl">Progress OS</a>
        </div>
      </div>

      <main class="min-h-[65vh] p-2">{props.children}</main>

    </>
  );
}

function NotFound() {
  return <Navigate href="/error" state={{ error: { title: "404", message: "Tražena stranica ne postoji." } }} />
}

