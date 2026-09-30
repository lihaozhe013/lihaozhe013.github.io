import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ProjectTrigger, { getProjectText } from '@/components/ProjectTrigger';
import SiteFooter from '@/components/SiteFooter';
import InkCanvas from '@/components/InkCanvas';
import inkStudyImage from '@/assets/editorial-ink-study.png';
import { getProjectCategoryLabel, portfolioData } from '@/data/portfolio';

export default function Portfolio() {
  const { i18n, t } = useTranslation();
  const featuredProjects = portfolioData.projects
    .filter((project) => project.featured)
    .sort((a, b) =>
      a.index.localeCompare(b.index, undefined, { numeric: true }),
    );
  const leadProject = featuredProjects[0];
  const supportingProjects = featuredProjects.slice(1, 3);
  const [givenName, familyName] = portfolioData.person.name.split(' ');

  return (
    <>
      <section
        className="hero-section editorial-cover"
        id="cover"
        aria-labelledby="hero-title"
      >
        <div className="hero-copy">
          <p className="section-kicker">{t('hero.eyebrow')}</p>
          <h1 className="display-title" id="hero-title">
            <span>{givenName}</span>
            <em>{familyName}.</em>
          </h1>
          <p className="hero-headline">{t('hero.headline')}</p>
          <p className="body-copy hero-introduction">
            {t('hero.introduction')}
          </p>
          <div className="hero-actions">
            <a className="ink-link" href="#works">
              {t('actions.selectedWorks')} <span aria-hidden="true">↓</span>
            </a>
            <a className="ink-link" href={portfolioData.person.socials.email}>
              {t('actions.email')} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <figure className="hero-artwork">
          <InkCanvas
            backgroundSrc={inkStudyImage}
            backgroundAlt={t('hero.artCaption')}
          />
          <figcaption>{t('hero.artCaption')}</figcaption>
        </figure>
        <span className="cover-index" aria-hidden="true">
          {t('hero.coverIndex')}
        </span>
      </section>

      <section className="section-block selected-works" id="works">
        <div className="section-heading">
          <p className="section-kicker">
            {t('sections.homeWorksIndex')} / {t('sections.selectedWorks')}
          </p>
          <Link className="ink-link section-index-link" to="/timeline">
            {t('nav.work')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="featured-layout">
          {leadProject ? (
            <ProjectTrigger
              project={leadProject}
              title={getProjectText(leadProject, t).title}
              description={getProjectText(leadProject, t).description}
              categoryLabel={getProjectCategoryLabel(
                leadProject.category,
                i18n.language,
              )}
              technologiesLabel={t('labels.technologies')}
              closeLabel={t('actions.close')}
              variant="lead"
            />
          ) : null}
          <div className="featured-supporting">
            {supportingProjects.map((project) => {
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
                  variant="secondary"
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-about section-block">
        <div className="section-heading">
          <p className="section-kicker">
            {t('sections.homeAboutIndex')} / {t('sections.about')}
          </p>
          <Link className="ink-link" to="/about">
            {t('nav.about')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <p className="home-about-copy">{t('pages.about.introduction')}</p>
      </section>

      <SiteFooter />
    </>
  );
}
