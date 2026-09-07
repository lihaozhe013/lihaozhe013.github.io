import { useTranslation } from 'react-i18next';
import avatarImage from '@/assets/photo.jpg';
import ProjectTrigger, { getProjectText } from '@/components/ProjectTrigger';
import { getProjectCategoryLabel, portfolioData } from '@/data/portfolio';
import type { PortfolioData } from '@/types/content';

const content: PortfolioData = portfolioData;

export default function Portfolio() {
  const { i18n, t } = useTranslation();
  const featuredProjects = content.projects
    .filter((project) => project.featured)
    .sort((a, b) =>
      a.index.localeCompare(b.index, undefined, { numeric: true }),
    );

  return (
    <>
      <section className="hero-section" id="index">
        <div className="hero-copy">
          <p className="section-kicker">{t('hero.eyebrow')}</p>
          <h1 className="display-title">{content.person.name}</h1>
          <p className="hero-headline">{t('hero.headline')}</p>
          <p className="body-copy hero-introduction">
            {t('hero.introduction')}
          </p>
          <div className="hero-actions">
            <a className="ink-link" href="#works">
              {t('actions.selectedWorks')} <span aria-hidden="true">↓</span>
            </a>
            <a className="ink-link" href={content.person.socials.email}>
              {t('actions.email')} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <figure className="portrait-figure">
          <img src={avatarImage} alt={content.person.name} />
          <figcaption>
            <span>{t('hero.availability')}</span>
            <span>{t('hero.portraitCaption')}</span>
          </figcaption>
        </figure>
      </section>

      <section className="section-block" id="works">
        <div className="section-heading">
          <p className="section-kicker">01 / {t('sections.selectedWorks')}</p>
          <p className="section-note">{t('labels.featured')}</p>
        </div>
        <div className="featured-grid">
          {featuredProjects.map((project) => {
            const text = getProjectText(project, t);
            return (
              <ProjectTrigger
                key={project.id}
                project={project}
                title={text.title}
                description={text.description}
                categoryLabel={getProjectCategoryLabel(
                  project.category,
                  i18n.language,
                )}
                technologiesLabel={t('labels.technologies')}
                closeLabel={t('actions.close')}
                featured
              />
            );
          })}
        </div>
      </section>

      <footer className="site-footer">
        <span>{content.person.name}</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </>
  );
}
