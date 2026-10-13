import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// A reload starts at the top of the page, instead of the browser putting you
// back where you were (or jumping to a #section left in the address).
// Back/forward keep restoring your place.
const navigation = performance.getEntriesByType?.("navigation")[0];
if (navigation?.type === "reload") {
  history.scrollRestoration = "manual";
  if (location.hash) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }
  window.scrollTo(0, 0);
  window.addEventListener(
    "load",
    () => {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        history.scrollRestoration = "auto";
      });
    },
    { once: true }
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
