import Link from "next/link";
import styles from "./SiteHeader.module.css";
import { ThemeToggle } from "./ThemeToggle";
import { AuthNavItem } from "./AuthNavItem";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <svg width="24" height="24" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="18" cy="18" rx="15" ry="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="18" y1="3" x2="18" y2="33" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className={styles.wordmark}>Argument Atlas</span>
      </Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLinkActive}>
          Claims
        </Link>
        <span className={styles.navLink}>About</span>
        <ThemeToggle />
        <AuthNavItem />
      </nav>
    </header>
  );
}
