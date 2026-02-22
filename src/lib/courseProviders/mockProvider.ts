import type { CourseSearchProvider, ExternalCourseDetails } from "@/lib/courseProviders/types";

const MOCK_COURSES: ExternalCourseDetails[] = [
  {
    id: "mock-pebble-blue",
    name: "Pebble Dunes",
    tee: "Blue",
    holes: 18,
    course_rating: 72.4,
    slope_rating: 138,
    par: 72,
  },
  {
    id: "mock-canyon-white",
    name: "Canyon Ridge",
    tee: "White",
    holes: 18,
    course_rating: 69.8,
    slope_rating: 125,
    par: 71,
  },
  {
    id: "mock-lakeside-gold",
    name: "Lakeside Links",
    tee: "Gold",
    holes: 9,
    course_rating: 35.2,
    slope_rating: 118,
    par: 36,
  },
  {
    id: "mock-maple-red",
    name: "Maple Grove",
    tee: "Red",
    holes: 18,
    course_rating: 67.1,
    slope_rating: 116,
    par: 70,
  },
];

export const mockCourseProvider: CourseSearchProvider = {
  async searchCourses(query: string) {
    const q = query.toLowerCase();
    return MOCK_COURSES.filter((course) => course.name.toLowerCase().includes(q)).map(
      (course) => ({
        id: course.id,
        name: course.name,
        tee: course.tee,
        location: "Mock Dataset",
      }),
    );
  },
  async getCourseDetails(resultId: string) {
    return MOCK_COURSES.find((course) => course.id === resultId) ?? null;
  },
};
