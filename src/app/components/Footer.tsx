import { Link } from "react-router-dom";
import { Wordmark } from "./Header";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <Wordmark />
            <p className="footer-tagline">
              Check domains, USPTO trademarks, and social handles — everywhere, at once.
            </p>
          </div>
          <div>
            <p className="footer-col-title">Navigate</p>
            <ul className="footer-links">
              <li>
                <Link to="/">Check a name</Link>
              </li>
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="footer-col-title">Contact</p>
            <ul className="footer-links">
              <li>
                <a href="mailto:contact@calyvent.com?subject=NameClear%20Inquiry">
                  contact@calyvent.com
                </a>
              </li>
              <li>
                <a href="/llms.txt">llms.txt</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NameClear</span>
          <span>RDAP · USPTO · SOCIAL</span>
          <span>EST. 2026</span>
        </div>
        <p className="disclaimer" style={{ marginTop: 28 }}>
          NameClear is an automated screening tool, not a law firm and not legal advice. Domain and
          social availability reflects live registry and platform state and can change at any time.
          Trademark findings are a starting point for your own review — always consult a licensed
          trademark attorney before filing or using a mark.
        </p>
      </div>
    </footer>
  );
}
