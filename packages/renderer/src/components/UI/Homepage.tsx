import {Link, useNavigate} from 'react-router-dom';
import Footer from './Footer';
import Logo from './logo/Logo';
import Button from './Button';
import Typography from './Typography';

const Homepage = () => {
  const navigate = useNavigate();

  const startOnboarding = () => {
    if (!document.startViewTransition) {
      navigate('/login-selection');
      return;
    }

    document.startViewTransition(() => {
      navigate('/login-selection');
    });
  };

  const goToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!document.startViewTransition) {
      navigate('/login');
      return;
    }

    document.startViewTransition(() => {
      navigate('/login');
    });
  };

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
              className="splash-home__title font-mada"
              align="center"
            >
              Your Mina wallet,
              <br />
              simplified.
            </Typography>
          </div>

          <div className="splash-home__actions">
            <div className="splash-home__cta-wrap">
              <Button
                className="splash-home__cta"
                text="Get started"
                onClick={startOnboarding}
                style="primary"
              />
            </div>
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
