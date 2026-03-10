import { Link } from 'react-router-dom';
import Footer from './Footer';
import Logo from './logo/Logo';
import Button from './Button';
import Typography from './Typography';

const Homepage = () => {
  return (
    <div className="full-screen-container-center onboarding-screen">
      <section className="homepage-card glass-card onboarding-shell splash-home animate__animated animate__fadeIn">
        <header className="splash-home__header">
          <div className="splash-home__logo">
            <Logo big />
          </div>
        </header>

        <main className="splash-home__body">
          <div className="splash-home__copy">
            <Typography
              variant="h1"
              className="splash-home__title"
              align="center"
            >
              Secure your Mina wallet.
              <br />
              Start with a cleaner flow.
            </Typography>
            <Typography
              variant="body"
              className="splash-home__description"
              align="center"
            >
              Create a new wallet, import an existing one, or connect Ledger from a single
              onboarding path.
            </Typography>
          </div>

          <div className="splash-home__actions">
            <div className="splash-home__cta-wrap">
              <Button
                className="splash-home__cta"
                text="Start onboarding"
                link="/login-selection"
                style="primary"
              />
            </div>
            <Link
              to="/login"
              className="splash-home__link"
            >
              I already have a recovery phrase or private key
            </Link>
          </div>
        </main>

        <footer className="footer-container splash-home__footer">
          <Footer />
        </footer>
      </section>
    </div>
  );
};

export default Homepage;
