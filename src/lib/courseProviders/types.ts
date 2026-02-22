export type ExternalCourseSearchResult = {
  id: string;
  name: string;
  location?: string;
  tee?: string;
};

export type ExternalCourseDetails = {
  id: string;
  name: string;
  tee: string;
  holes: 9 | 18;
  course_rating: number;
  slope_rating: number;
  par: number;
};

export interface CourseSearchProvider {
  searchCourses(query: string): Promise<ExternalCourseSearchResult[]>;
  getCourseDetails(resultId: string): Promise<ExternalCourseDetails | null>;
}
