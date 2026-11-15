"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function select(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <span className={styles.toggle} role="group" aria-label="Theme">
      <button
        type="button"
        className={`${styles.option} ${theme === "light" ? styles.optionActive : ""}`}
        onClick={() => select("light")}
        aria-pressed={theme === "light"}
      >
        LIGHT
      </button>
      <button
        type="button"
        className={`${styles.option} ${theme === "dark" ? styles.optionActive : ""}`}
        onClick={() => select("dark")}
        aria-pressed={theme === "dark"}
      >
        DARK
      </button>
    </span>
  );
}
