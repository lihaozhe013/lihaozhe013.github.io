import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import i18n from '@/i18n';
import { portfolioData } from '@/data/portfolio';

export default function Header() {
  const { t } = useTranslation();
  const locale = i18n.language.startsWith('zh') ? 'zh' : 'en';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    window.localStorage.setItem('portfolio-locale', locale);
  }, [locale]);

  const switchLocale = () => {
    void i18n.changeLanguage(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="site-header">
      <Link className="site-mark" to="/" aria-label={portfolioData.person.name}>
        {portfolioData.person.name}
      </Link>
      <nav className="site-nav" aria-label={t('nav.label')}>
        <NavLink
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          to="/timeline"
        >
          {t('nav.work')}
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          to="/about"
        >
          {t('nav.about')}
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          to="/contact"
        >
          {t('nav.contact')}
        </NavLink>
        <button
          className="language-switcher"
          type="button"
          onClick={switchLocale}
          aria-label={`${t('labels.language')}: ${locale === 'en' ? '中文' : 'English'}`}
        >
          {locale === 'en' ? '中' : 'EN'}
        </button>
      </nav>
    </header>
  );
}
