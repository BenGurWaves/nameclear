import { Link, NavLink } from "react-router-dom";

export function Wordmark() {
  return (
    <Link to="/" className="wordmark">
      <span className="wordmark-mark">N</span>
      <span>
        NAMECLEAR<sup>®</sup>
      </span>
    </Link>
  );
}

const LINKS = [
  { to: "/", label: "Check" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="header">
      <div className="page header-inner">
        <Wordmark />
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className="nav-link"
              children={l.label}
            />
          ))}
          <span className="nav-est">EST. 2026</span>
        </nav>
      </div>
    </header>
  );
}
