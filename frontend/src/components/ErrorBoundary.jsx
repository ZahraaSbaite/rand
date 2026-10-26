import { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Shows a way out instead of an empty page when something on a page throws.
 * Keyed on the route in App, so moving to another page tries again.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = String(error?.message || error);
    // Translation tools and some extensions rewrite the page's text, which React can't recover from.
    const rewrittenPage = /removeChild|insertBefore|not a child of this node/i.test(message);

    return (
      <main className="error-boundary" role="alert">
        <h1>Something went wrong on this page</h1>
        <p>
          {rewrittenPage
            ? "This usually happens when the browser is translating the page or an extension is changing it. Try turning off translation for this site, then reload."
            : "Reloading the page usually fixes it. Your cart is saved."}
        </p>
        <div className="error-boundary__actions">
          <button type="button" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a href="/">Go to the home page</a>
        </div>
        <details>
          <summary>Technical details</summary>
          <code>{message}</code>
        </details>
      </main>
    );
  }
}
