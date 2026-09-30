import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectDialog from '@/components/ProjectDialog';
import {
  getProjectMarkdownPreview,
  resolveProjectImage,
} from '@/data/projectMarkdown';
import type { ProjectMeta } from '@/types/content';

export function getProjectText(
  project: ProjectMeta,
  translate: (key: string) => string,
) {
  return {
    title: translate(`projects.${project.id}.title`),
    description: translate(`projects.${project.id}.description`),
  };
}

interface ProjectTriggerProps {
  project: ProjectMeta;
  title: string;
  description: string;
  categoryLabel: string;
  technologiesLabel: string;
  closeLabel: string;
  variant?: 'lead' | 'secondary' | 'archive';
}

export default function ProjectTrigger({
  project,
  title,
  description,
  categoryLabel,
  technologiesLabel,
  closeLabel,
  variant = 'archive',
}: ProjectTriggerProps) {
  const { t } = useTranslation();
  const markdownPreview = project.markdown
    ? getProjectMarkdownPreview(project.markdown)
    : undefined;
  const translatedHighlights = project.markdown
    ? t(`projects.${project.id}.fullProjectHighlights`, {
        returnObjects: true,
      })
    : undefined;
  const highlights = Array.isArray(translatedHighlights)
    ? translatedHighlights.filter(
        (highlight): highlight is string => typeof highlight === 'string',
      )
    : undefined;
  const fullProjectPreview =
    markdownPreview && highlights && highlights.length > 0
      ? { ...markdownPreview, highlights }
      : undefined;
  const previewLabel = t('actions.previewProject');
  const detailHref = project.markdown ? `/projects/${project.id}` : undefined;
  const detailLink = detailHref ? (
    <Link className="project-detail-link" to={detailHref}>
      {t('actions.readDetails')} <span aria-hidden="true">↗</span>
    </Link>
  ) : null;
  const coverSrc =
    project.markdown && project.cover
      ? resolveProjectImage(project.markdown, project.cover)
      : undefined;

  const trigger =
    variant === 'lead' ? (
      <button className="project-spotlight-trigger" type="button">
        <span className="project-cover-wrap">
          {coverSrc ? (
            <img
              className="project-cover-image"
              src={coverSrc}
              alt={t(`projects.${project.id}.coverAlt`)}
              loading="lazy"
            />
          ) : null}
          <span className="project-cover-index">{project.index}</span>
        </span>
        <span className="project-spotlight-copy">
          <span className="project-spotlight-meta">
            {project.index} / {categoryLabel}
          </span>
          <span className="project-spotlight-title">{title}</span>
          <span className="body-copy project-spotlight-description">
            {description}
          </span>
          <span className="project-preview-cue">
            {previewLabel} <span aria-hidden="true">+</span>
          </span>
        </span>
      </button>
    ) : variant === 'secondary' ? (
      <button className="project-secondary-trigger" type="button">
        <span className="project-secondary-meta">
          <span>{project.index}</span>
          <span>{categoryLabel}</span>
        </span>
        <span className="project-secondary-title">{title}</span>
        <span className="body-copy project-secondary-description">
          {description}
        </span>
        <span className="project-preview-cue">
          {previewLabel} <span aria-hidden="true">+</span>
        </span>
      </button>
    ) : (
      <button className="project-row" type="button">
        <span className="project-index">{project.index}</span>
        <span className="project-row-category">{categoryLabel}</span>
        <span className="project-row-title-group">
          <span className="project-row-title">{title}</span>
          {project.markdown ? (
            <span className="project-full-project-mark">
              {t('labels.fullProject')}
            </span>
          ) : null}
        </span>
        <span className="project-action">
          {previewLabel} <span aria-hidden="true">+</span>
        </span>
      </button>
    );

  return (
    <article className={`project-entry project-entry--${variant}`}>
      <ProjectDialog
        project={project}
        title={title}
        description={description}
        categoryLabel={categoryLabel}
        technologiesLabel={technologiesLabel}
        closeLabel={closeLabel}
        trigger={trigger}
        actionLabel={`${previewLabel}: ${title}`}
        detailHref={detailHref}
        detailLabel={detailHref ? t('actions.exploreFullProject') : undefined}
        fullProjectPreview={fullProjectPreview}
      />
      {detailLink}
    </article>
  );
}
