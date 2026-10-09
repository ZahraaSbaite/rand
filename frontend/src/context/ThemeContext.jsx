import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "strand_theme";

// Light unless the visitor has picked dark with the toggle.
function getInitialTheme() {
    try {
        if (localStorage.getItem(STORAGE_KEY) === "dark") return "dark";
    } catch {
        // ignore
    }
    return "light";
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // Only an explicit choice is remembered, so the default stays light.
    const toggleTheme = () =>
        setTheme((t) => {
            const next = t === "dark" ? "light" : "dark";
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                // ignore
            }
            return next;
        });

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider");
    return context;
}
