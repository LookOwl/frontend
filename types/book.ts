export interface Book {
  id: number;
  title: string;
  isbn: string;
  description: string;
  editorial: string;
  publicationDate: string;
  coverUrl: string;
  language: string;
  authors: string[];
  categories: string[];
  pageCount: number;
}
