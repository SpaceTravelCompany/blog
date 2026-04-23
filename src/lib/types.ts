export interface Post {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt?: string;
  body?: string;
  searchText?: string;
}

export interface Heading {
  id: string;
  text: string;
  depth: number;
}
