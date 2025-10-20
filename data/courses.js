const courses = [
    {
        title: "G.C.E. A/L Combined Mathematics: Calculus Fundamentals",
        description: "Master the core concepts of differentiation and integration required for the A/L Combined Mathematics syllabus. Includes past paper question walkthroughs.",
        category: "Mathematics",
        difficulty: "Advanced",
        durationWeeks: 16,
        imageUrl: "https://placehold.co/600x400/7c3aed/ffffff?text=Calculus"
    },
    {
        title: "Introduction to Python Programming",
        description: "A beginner-friendly course to learn Python from scratch. Covers variables, data structures, loops, and functions with practical examples.",
        category: "Technology",
        difficulty: "Beginner",
        durationWeeks: 8,
        imageUrl: "https://placehold.co/600x400/2563eb/ffffff?text=Python"
    },
    {
        title: "G.C.E. O/L Science: Essential Concepts",
        description: "Covering key topics from the O/L Science syllabus, including Biology, Chemistry, and Physics. This course is designed to build a strong foundation for the exam.",
        category: "Science",
        difficulty: "Intermediate",
        durationWeeks: 12,
        imageUrl: "https://placehold.co/600x400/16a34a/ffffff?text=Science"
    },
    {
        title: "English for Professional Communication",
        description: "Enhance your business English skills. This course focuses on email etiquette, presentation skills, and professional vocabulary.",
        category: "Languages",
        difficulty: "Intermediate",
        durationWeeks: 6,
        imageUrl: "https://placehold.co/600x400/c2410c/ffffff?text=English"
    },
    {
        title: "Fundamentals of Web Development (HTML, CSS, JS)",
        description: "Learn to build modern, responsive websites using the three core technologies of the web: HTML5, CSS3, and JavaScript.",
        category: "Technology",
        difficulty: "Intermediate",
        durationWeeks: 10,
        imageUrl: "https://placehold.co/600x400/2563eb/ffffff?text=Web+Dev"
    },
    {
        title: "G.C.E. A/L Physics: Waves and Oscillations",
        description: "A deep dive into the mechanics of waves and oscillations, a critical component of the A/L Physics curriculum. Includes lab simulation concepts.",
        category: "Science",
        difficulty: "Advanced",
        durationWeeks: 8,
        imageUrl: "https://placehold.co/600x400/16a34a/ffffff?text=Physics"
    },
    {
        title: "Principles of Accounting",
        description: "An introductory course for A/L Commerce stream students, covering the basics of bookkeeping, financial statements, and double-entry principles.",
        category: "Commerce",
        difficulty: "Intermediate",
        durationWeeks: 12,
        imageUrl: "https://placehold.co/600x400/eab308/000000?text=Accounting"
    },
    {
        title: "Sinhala Language and Grammar",
        description: "A comprehensive course on Sinhala grammar (Vyakarana) and literature, aimed at improving writing skills for O/L and A/L students.",
        category: "Languages",
        difficulty: "Intermediate",
        durationWeeks: 10,
        imageUrl: "https://placehold.co/600x400/c2410c/ffffff?text=Sinhala"
    },
    {
        title: "G.C.E. A/L Chemistry: Organic Chemistry Basics",
        description: "Understand the fundamentals of organic chemistry, including nomenclature, functional groups, and reaction mechanisms as per the local syllabus.",
        category: "Science",
        difficulty: "Advanced",
        durationWeeks: 14,
        imageUrl: "https://placehold.co/600x400/16a34a/ffffff?text=Chemistry"
    },
    {
        title: "Graphic Design with Canva",
        description: "Learn to create stunning graphics for social media, presentations, and posters using the free and powerful tool, Canva. No prior experience needed.",
        category: "Technology",
        difficulty: "Beginner",
        durationWeeks: 4,
        imageUrl: "https://placehold.co/600x400/2563eb/ffffff?text=Canva"
    },
    {
        title: "Microeconomics for A/L Students",
        description: "Explore the principles of supply and demand, market structures, and consumer theory. This course is aligned with the A/L Economics syllabus.",
        category: "Commerce",
        difficulty: "Advanced",
        durationWeeks: 12,
        imageUrl: "https://placehold.co/600x400/eab308/000000?text=Economics"
    },
    {
        title: "G.C.E. A/L Biology: Cell Biology",
        description: "An in-depth study of the cell, its structures, and functions. This course is essential for students in the A/L Bio Science stream.",
        category: "Science",
        difficulty: "Advanced",
        durationWeeks: 10,
        imageUrl: "https://placehold.co/600x400/16a34a/ffffff?text=Biology"
    },
    {
        title: "Spoken Tamil for Beginners",
        description: "A practical course designed to teach conversational Tamil for everyday use, focusing on pronunciation and basic sentence structures.",
        category: "Languages",
        difficulty: "Beginner",
        durationWeeks: 8,
        imageUrl: "https://placehold.co/600x400/c2410c/ffffff?text=Tamil"
    },
    {
        title: "Full-Stack Web Development with MERN",
        description: "Build complete web applications using the MERN stack (MongoDB, Express.js, React, Node.js). Prior knowledge of JavaScript is required.",
        category: "Technology",
        difficulty: "Advanced",
        durationWeeks: 20,
        imageUrl: "https://placehold.co/600x400/2563eb/ffffff?text=MERN+Stack"
    },
    {
        title: "Sri Lankan History: Ancient Kingdoms",
        description: "Explore the rich history of Sri Lanka, covering the Anuradhapura Kingdom, colonial periods, and the path to independence.",
        category: "Arts & Humanities",
        difficulty: "Intermediate",
        durationWeeks: 8,
        imageUrl: "https://placehold.co/600x400/dc2626/ffffff?text=History"
    },
    {
        title: "G.C.E. O/L Mathematics: Geometry",
        description: "Focus on mastering the theorems and problems related to geometry in the O/L Mathematics syllabus, a common area of difficulty for students.",
        category: "Mathematics",
        difficulty: "Intermediate",
        durationWeeks: 8,
        imageUrl: "https://placehold.co/600x400/7c3aed/ffffff?text=Geometry"
    },
    {
        title: "Introduction to Databases with SQL",
        description: "Learn the fundamentals of relational databases and how to manage and query data using the standard language, SQL.",
        category: "Technology",
        difficulty: "Intermediate",
        durationWeeks: 6,
        imageUrl: "https://placehold.co/600x400/2563eb/ffffff?text=SQL"
    },
    {
        title: "Business Studies for G.C.E. A/L",
        description: "Covering the essentials of business management, marketing, and finance as required for the A/L Commerce stream.",
        category: "Commerce",
        difficulty: "Intermediate",
        durationWeeks: 12,
        imageUrl: "https://placehold.co/600x400/eab308/000000?text=Business"
    },
    {
        title: "Introduction to Western Classical Music",
        description: "A beginner's journey through the eras of classical music, from Bach to Beethoven, exploring key composers and their works.",
        category: "Arts & Humanities",
        difficulty: "Beginner",
        durationWeeks: 6,
        imageUrl: "https://placehold.co/600x400/dc2626/ffffff?text=Music"
    },
    {
        title: "Advanced English Literature for A/L",
        description: "An analysis of the prescribed texts and poems for the A/L English Literature syllabus, focusing on themes, character, and literary devices.",
        category: "Languages",
        difficulty: "Advanced",
        durationWeeks: 16,
        imageUrl: "https://placehold.co/600x400/c2410c/ffffff?text=Literature"
    }
];

export default courses;
