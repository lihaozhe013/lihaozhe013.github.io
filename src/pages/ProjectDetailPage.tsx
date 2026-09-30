import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getProjectMarkdown,
  resolveProjectImage,
} from '@/data/projectMarkdown';
import { getProjectCategoryLabel, portfolioData } from '@/data/portfolio';
import { getProjectText } from '@/components/ProjectTrigger';
import MarkdownCodeBlock from '@/components/MarkdownCodeBlock';
import MermaidDiagram from '@/components/MermaidDiagram';
import SiteFooter from '@/components/SiteFooter';
import type { ProjectMeta } from '@/types/content';
import remarkGfm from 'remark-gfm';
import remarkHtmlComments from '@/plugins/remarkHtmlComments';

function getMermaidSource(children: ReactNode): string | undefined {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    return undefined;
  }

  const className = children.props.className;

  if (!className?.split(/\s+/).includes('language-mermaid')) {
    return undefined;
  }

  return Children.toArray(children.props.children).join('');
}

function createMarkdownComponents(project: ProjectMeta): Components {
  return {
    img: ({ src, alt, ...props }) => (
      <img
        {...props}
        src={
          project.markdown && src
            ? (resolveProjectImage(project.markdown, src) ?? src)
            : src
        }
        alt={alt ?? ''}
        loading="lazy"
      />
    ),
    pre: ({ children }) => {
      const mermaidSource = getMermaidSource(children);

      if (mermaidSource !== undefined) {
        return <MermaidDiagram source={mermaidSource} />;
      }

      return <MarkdownCodeBlock>{children}</MarkdownCodeBlock>;
    },
  };
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { i18n, t } = useTranslation();
  const project = portfolioData.projects.find(
    (candidate) => candidate.id === projectId,
  );

  if (!project?.markdown) {
    return <Navigate to="/timeline" replace />;
  }

  const markdown = getProjectMarkdown(project.markdown);

  if (!markdown) {
    return <Navigate to="/timeline" replace />;
  }

  const { title, description } = getProjectText(project, t);
  const categoryLabel = getProjectCategoryLabel(
    project.category,
    i18n.language,
  );

  return (
    <>
      <section className="project-detail-page section-block">
        <div className="project-detail-navigation">
          <Link className="ink-link" to="/timeline">
            <span aria-hidden="true">←</span> {t('actions.backToProjects')}
          </Link>
        </div>

        <header className="project-detail-header">
          <p className="section-kicker">
            {project.index} / {categoryLabel}
          </p>
          <h1 className="page-title">{title}</h1>
          <p className="body-copy page-lede">{description}</p>
          <div className="project-detail-meta">
            <div>
              <p className="section-kicker">{t('labels.technologies')}</p>
              <ul
                className="technology-list"
                aria-label={t('labels.technologies')}
              >
                {project.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </div>
            {project.links.length > 0 ? (
              <div className="project-detail-links">
                {project.links.map((link) => (
                  <a
                    className="ink-link"
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <article className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkHtmlComments]}
            components={createMarkdownComponents(project)}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </section>

      <SiteFooter />
    </>
  );
}
