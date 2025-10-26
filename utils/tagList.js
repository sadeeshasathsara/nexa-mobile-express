export const availableSubjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Science", // General O/L
    "Technology",
    "Computer Science",
    "Information Technology",
    "Languages",
    "English",
    "Sinhala",
    "Tamil",
    "Commerce",
    "Accounting",
    "Business Studies",
    "Economics",
    "Arts & Humanities",
    "History",
    "Music",
    "Art",
    "Geography"
];

export const availableTags = [
    // General Levels
    "O/L",
    "A/L",
    "Beginner",
    "Intermediate",
    "Advanced",
    // Math Specific
    "Calculus",
    "Algebra",
    "Geometry",
    "Statistics",
    // Science Specific
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Waves",
    "Oscillations",
    "Cell Biology",
    "Genetics",
    // Tech Specific
    "Python",
    "JavaScript",
    "HTML",
    "CSS",
    "React",
    "Node.js",
    "MERN Stack",
    "SQL",
    "Databases",
    "Web Development",
    "Mobile Development",
    "Graphic Design",
    "Canva",
    // Commerce Specific
    "Microeconomics",
    "Macroeconomics",
    "Bookkeeping",
    "Financial Statements",
    "Marketing",
    // Language Specific
    "Grammar",
    "Literature",
    "Spoken",
    "Professional Communication",
    // Arts Specific
    "Classical Music",
    "Sri Lankan History",
    "World History"
];

// Added language list
export const availableLanguages = [
    { name: 'English', code: 'en' },
    { name: 'Sinhala', code: 'si' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Italian', code: 'it' },
    { name: 'Portuguese', code: 'pt' },
    { name: 'Chinese', code: 'zh' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Korean', code: 'ko' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Russian', code: 'ru' },
    { name: 'Tamil', code: 'ta' } // Added Tamil based on project context
];

export const validLanguageCodes = availableLanguages.map(lang => lang.code);