import DarkModeToggle from './DarkModeToggle';

/**
 * Fixed bottom-right theme control — present on every route (public + authenticated).
 */
export default function GlobalFloatingThemeToggle() {
  return <DarkModeToggle floating className="shadow-md" />;
}
