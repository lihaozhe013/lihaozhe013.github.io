import { useTranslation } from 'react-i18next';
import ProjectTrigger, { getProjectText } from '@/components/ProjectTrigger';
import SiteFooter from '@/components/SiteFooter';
import { getProjectCategoryLabel, portfolioData } from '@/data/portfolio';

export default function TimelinePage() {
  const { i18n, t } = useTranslation();

  return (
    <>
      <section className="page-intro section-block" id="timeline">
        <p className="section-kicker">02 / {t('sections.timeline')}</p>
        <h1 className="page-title">{t('pages.timeline.title')}</h1>
        <p className="body-copy page-lede">
          {t('pages.timeline.introduction')}
        </p>
      </section>

      <section className="section-block" aria-labelledby="timeline-heading">
        <div className="section-heading">
          <p className="section-kicker" id="timeline-heading">
            {t('sections.archive')}
          </p>
          <p className="section-note">
            {portfolioData.projects.length.toString().padStart(2, '0')}
          </p>
        </div>
        <div className="project-archive">
          {[...portfolioData.projects]
            .sort((a, b) =>
              a.index.localeCompare(b.index, undefined, { numeric: true }),
            )
            .map((project) => {
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
                />
              );
            })}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
