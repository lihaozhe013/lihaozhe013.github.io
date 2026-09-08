import portfolioConfig from '@/data/portfolio.json';

export type ProjectCategory = keyof typeof portfolioConfig.projectCategories;
export type ProjectCategoryLabels =
  (typeof portfolioConfig.projectCategories)[ProjectCategory];

export type ProjectLinkType = 'github' | 'external';

export interface ProjectLink {
  label: string;
  href: string;
  type: ProjectLinkType;
}

export interface ProjectMeta {
  id: string;
  index: string;
  category: ProjectCategory;
  featured: boolean;
  markdown?: string;
  year?: string;
  technologies: string[];
  links: ProjectLink[];
}

export interface SkillGroup {
  id: string;
  items: string[];
}

export interface PortfolioData {
  person: {
    name: string;
    resume: {
      chinese: string;
      english: string;
    };
    socials: {
      github: string;
      linkedin: string;
      email: string;
    };
  };
  projectCategories: Record<ProjectCategory, ProjectCategoryLabels>;
  skills: SkillGroup[];
  projects: ProjectMeta[];
  education: {
    coursework: string[];
  };
}
