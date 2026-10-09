import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Start every new page at the top. Back/forward (POP) is left alone so the
// browser can return you to where you were.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, navigationType]);

  return null;
}
