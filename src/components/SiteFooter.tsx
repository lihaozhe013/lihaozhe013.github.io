import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { portfolioData } from '@/data/portfolio';

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <Link className="site-footer-name" to="/">
        {portfolioData.person.name}
      </Link>
      <a
        className="site-footer-email"
        href={portfolioData.person.socials.email}
      >
        {t('contact.email')} <span aria-hidden="true">↗</span>
      </a>
      <span className="site-footer-copyright">
        © {new Date().getFullYear()}
      </span>
    </footer>
  );
}
