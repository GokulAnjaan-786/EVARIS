/**
 * EVARIS Central Subjects & Lesson Configuration.
 * 
 * Defines standard universal subjects, initial example selections,
 * topics, and mappings to available demo lessons.
 */

export interface DemoLessonMapping {
  lessonId: string;
  lessonTitle: string;
  topicTitle: string;
  description: string;
  durationSeconds: number;
  totalSteps: number;
}

export interface SubjectDefinition {
  id: string;
  name: string;
  category: "STEM" | "Languages" | "Humanities" | "Commerce" | "Custom";
  iconName?: string;
  topics: string[];
  demoLesson?: DemoLessonMapping;
  isCustom?: boolean;
}

/**
 * The 14 Standard Selectable Subjects required by the product vision.
 */
export const STANDARD_SUBJECTS: SubjectDefinition[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    category: "STEM",
    topics: ["Quadratic Functions & Parabola", "Calculus & Derivatives", "Coordinate Geometry", "Linear Algebra"],
    demoLesson: {
      lessonId: "math_quadratic",
      lessonTitle: "Quadratic Functions & Parabola Vertex",
      topicTitle: "Quadratic Functions & Parabola",
      description: "Visualizes the standard parabola f(x) = x² - 4x + 3, derives vertex minimum, and computes roots.",
      durationSeconds: 35,
      totalSteps: 4,
    },
  },
  {
    id: "computer_science",
    name: "Computer Science",
    category: "STEM",
    topics: ["Binary Search Algorithm", "Sorting & Divide-and-Conquer", "Data Structures & Trees", "System Architecture"],
    demoLesson: {
      lessonId: "cs_binary_search",
      lessonTitle: "Binary Search Algorithm & Divide-and-Conquer",
      topicTitle: "Binary Search Algorithm",
      description: "Demonstrates algorithmic divide-and-conquer logic, branch evaluation, and logarithmic efficiency.",
      durationSeconds: 30,
      totalSteps: 3,
    },
  },
  {
    id: "biology",
    name: "Biology",
    category: "STEM",
    topics: ["Cell Structure & Organelles", "Photosynthesis & Light Reactions", "Genetics & DNA", "Human Physiology"],
    demoLesson: {
      lessonId: "bio_photosynthesis",
      lessonTitle: "Chloroplast & Photosynthetic Light Reactions",
      topicTitle: "Photosynthesis & Light Reactions",
      description: "Visualizes chloroplast double-membrane schematics, thylakoid granum stacks, and stroma fluid reactions.",
      durationSeconds: 32,
      totalSteps: 3,
    },
  },
  {
    id: "science",
    name: "Science",
    category: "STEM",
    topics: ["Plant Cell Anatomy & Photosynthesis", "Scientific Method", "Atomic Structure", "Ecosystem Cycles"],
    demoLesson: {
      lessonId: "bio_photosynthesis",
      lessonTitle: "Chloroplast & Photosynthetic Light Reactions",
      topicTitle: "Plant Cell Anatomy & Photosynthesis",
      description: "Interdisciplinary science overview featuring plant cell chloroplast and energy transformation.",
      durationSeconds: 32,
      totalSteps: 3,
    },
  },
  {
    id: "physics",
    name: "Physics",
    category: "STEM",
    topics: ["Kinematics & Motion Curves", "Newton's Laws & Force Vectors", "Electromagnetism", "Optics & Light Wave Propagation"],
    demoLesson: undefined,
  },
  {
    id: "chemistry",
    name: "Chemistry",
    category: "STEM",
    topics: ["Periodic Trends", "Chemical Bonding & Molecular Orbitals", "Reaction Kinetics", "Thermodynamics"],
    demoLesson: undefined,
  },
  {
    id: "english",
    name: "English",
    category: "Languages",
    topics: ["Grammar & Sentence Structures", "Rhetorical Devices", "Poetry Analysis", "Narrative Timelines & Story Arcs"],
    demoLesson: undefined,
  },
  {
    id: "tamil",
    name: "Tamil",
    category: "Languages",
    topics: ["இலக்கணம் (Grammar)", "இலக்கியம் (Classical Literature)", "கவிதை அமைப்பு (Poetic Form)", "சொல் கட்டமைப்பு (Morphology)"],
    demoLesson: undefined,
  },
  {
    id: "hindi",
    name: "Hindi",
    category: "Languages",
    topics: ["व्याकरण (Grammar)", "वाक्य विन्यास (Syntax)", "साहित्य विधाएं (Literary Forms)", "शब्दावली (Vocabulary)"],
    demoLesson: undefined,
  },
  {
    id: "social_science",
    name: "Social Science",
    category: "Humanities",
    topics: ["Democratic Institutions", "Civic Rights & Governance", "Socio-Economic Development", "Global Organizations"],
    demoLesson: undefined,
  },
  {
    id: "history",
    name: "History",
    category: "Humanities",
    topics: ["Ancient Civilizations", "Industrial Revolution Timeline", "World Wars & Global Treaties", "Post-Colonial Eras"],
    demoLesson: undefined,
  },
  {
    id: "geography",
    name: "Geography",
    category: "Humanities",
    topics: ["Plate Tectonics & Continental Drift", "Climate Zones & Monsoons", "Topographic Maps", "Urban Settlement Patterns"],
    demoLesson: undefined,
  },
  {
    id: "economics",
    name: "Economics",
    category: "Commerce",
    topics: ["Supply & Demand Curves", "Fiscal & Monetary Policy", "Inflation & Market Equilibrium", "Macroeconomic Models"],
    demoLesson: undefined,
  },
  {
    id: "commerce",
    name: "Commerce",
    category: "Commerce",
    topics: ["Double-Entry Bookkeeping", "Financial Statements & Balance Sheets", "Business Process Workflows", "Trade & Logistics"],
    demoLesson: undefined,
  },
];

/**
 * Initial example selections as mandated in the specification:
 * Mathematics, English, Science, Physics, Biology.
 * These can be freely modified, deselected, or extended by the teacher.
 */
export const INITIAL_SELECTED_SUBJECTS: string[] = [
  "Mathematics",
  "English",
  "Science",
  "Physics",
  "Biology",
];

/**
 * Helper to retrieve a subject definition by name (case-insensitive).
 */
export function findSubjectByName(
  name?: string | null,
  customSubjects: SubjectDefinition[] = []
): SubjectDefinition | undefined {
  if (!name || typeof name !== "string") return undefined;
  const normalized = name.trim().toLowerCase();
  const all = [...STANDARD_SUBJECTS, ...customSubjects];
  return all.find((s) => s.name.toLowerCase() === normalized);
}
