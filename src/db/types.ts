export interface LanguageContent {
  locale: string;
  content: string;
}

export interface ProjectConfig {
  pageSize: "A4" | "A5" | "Letter";
  margins: { top: number; bottom: number; left: number; right: number };
  lineSpacing: number;
  fonts: {
    title: { family: string; size: number; bold: boolean };
    subtitle: { family: string; size: number; bold: boolean };
    body: { family: string; size: number; bold: boolean };
    quotation: { family: string; size: number; italic: boolean };
  };
  chapterTitleFormat: "chapter_num_title" | "title_only";
}

export interface Project {
  _id: string;
  type: "project";
  title: string;
  author: string;
  description: string;
  config: ProjectConfig;
  chapterOrder: string[];
  createdAt: string;
  updatedAt: string;
  _rev?: string;
}

export type ChapterType =
  | "regular"
  | "introduction"
  | "about_author"
  | "epigraph"
  | "foreword"
  | "appendix"
  | "moodboard";

export interface Chapter {
  _id: string;
  type: "chapter";
  projectId: string;
  title: string;
  chapterType: ChapterType;
  sectionOrder: string[];
  languages: LanguageContent[];
  createdAt: string;
  updatedAt: string;
  _rev?: string;
}

export interface Section {
  _id: string;
  type: "section";
  chapterId: string;
  title: string;
  languages: LanguageContent[];
  createdAt: string;
  updatedAt: string;
  _rev?: string;
}

export const SUPPORTED_LOCALES = [
  { code: "en", label: "EN" },
  { code: "pt-BR", label: "PT-BR" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
];

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  pageSize: "A4",
  margins: { top: 25, bottom: 25, left: 30, right: 20 },
  lineSpacing: 1.5,
  fonts: {
    title: { family: "Georgia", size: 24, bold: true },
    subtitle: { family: "Georgia", size: 18, bold: false },
    body: { family: "Georgia", size: 12, bold: false },
    quotation: { family: "Georgia", size: 11, italic: true },
  },
  chapterTitleFormat: "chapter_num_title",
};
