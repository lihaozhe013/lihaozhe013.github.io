import { useTranslation } from 'react-i18next';
import { portfolioData } from '@/data/portfolio';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <section className="contact-section contact-page" id="contact">
        <div>
          <p className="section-kicker">05 / {t('sections.contact')}</p>
          <h1 className="page-title">{t('pages.contact.title')}</h1>
          <p className="body-copy page-lede contact-lede">
            {t('pages.contact.introduction')}
          </p>
        </div>
        <div className="contact-links">
          <a className="ink-link" href={portfolioData.person.socials.email}>
            {t('contact.email')} ↗
          </a>
          <a
            className="ink-link"
            href={portfolioData.person.socials.github}
            target="_blank"
            rel="noreferrer"
          >
            {t('contact.github')} ↗
          </a>
          <a
            className="ink-link"
            href={portfolioData.person.socials.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            {t('contact.linkedin')} ↗
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>{portfolioData.person.name}</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </>
  );
}
