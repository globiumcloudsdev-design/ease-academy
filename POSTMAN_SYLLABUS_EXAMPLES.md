# Postman Examples - Complete Syllabus Flow

## 📘 Important Concepts (Roman Urdu Explanation)

### 1. `isCompulsory` - Lazmi ya Ikhtiyari?

**`"isCompulsory": true`** = **Lazmi Subject (Compulsory)**
- Har student ko ye subject **zaroori** lena hai
- Example: English, Urdu, Math, Islamiat, Pak Studies
- Koi student isko chor nahi sakta

**`"isCompulsory": false`** = **Ikhtiyari Subject (Optional/Elective)**
- Student apni **marzi se** le sakta hai ya nahi
- Example: Computer Science, Fine Arts, Additional Mathematics
- Student choose kar sakta hai lena hai ya nahi

**Real Example:**
```json
// English - Har student ko lena LAZMI hai
{
  "gradeId": "grade9",
  "subjectId": "english",
  "isCompulsory": true  ← Zaroori subject
}

// Computer Science - Student apni marzi se le sakta hai
{
  "gradeId": "grade9",
  "subjectId": "computerScience",
  "isCompulsory": false  ← Ikhtiyari subject
}
```

---

### 2. All Streams vs Specific Stream - Sabhi ke liye ya Khaas Stream ke liye?

**`"streamId": null`** = **ALL STREAMS** (Sabhi streams ke liye)
- Ye subject **har stream** ke students ke liye hai
- Science wale bhi lein, Commerce wale bhi lein, Arts wale bhi lein
- Example: English, Urdu, Math, Islamiat - sabhi students ko chahiye

**`"streamId": "67234stream1sci456"`** = **SPECIFIC STREAM** (Sirf ek stream ke liye)
- Ye subject **sirf us specific stream** ke students ke liye hai
- Sirf Science students lein, ya sirf Commerce students lein
- Example: Physics sirf Science ke liye, Accounting sirf Commerce ke liye

**Visual Example:**

```
Grade 9 Students:
├── Science Stream (50 students)
│   ├── English (streamId: null) ← All streams = Science bhi le
│   ├── Urdu (streamId: null) ← All streams = Science bhi le
│   ├── Math (streamId: null) ← All streams = Science bhi le
│   ├── Physics (streamId: Science) ← Sirf Science ke liye
│   ├── Chemistry (streamId: Science) ← Sirf Science ke liye
│   └── Biology (streamId: Science) ← Sirf Science ke liye
│
├── Commerce Stream (30 students)
│   ├── English (streamId: null) ← All streams = Commerce bhi le
│   ├── Urdu (streamId: null) ← All streams = Commerce bhi le
│   ├── Math (streamId: null) ← All streams = Commerce bhi le
│   ├── Accounting (streamId: Commerce) ← Sirf Commerce ke liye
│   ├── Economics (streamId: Commerce) ← Sirf Commerce ke liye
│   └── Business Studies (streamId: Commerce) ← Sirf Commerce ke liye
│
└── Arts Stream (20 students)
    ├── English (streamId: null) ← All streams = Arts bhi le
    ├── Urdu (streamId: null) ← All streams = Arts bhi le
    ├── Math (streamId: null) ← All streams = Arts bhi le
    ├── History (streamId: Arts) ← Sirf Arts ke liye
    ├── Geography (streamId: Arts) ← Sirf Arts ke liye
    └── Civics (streamId: Arts) ← Sirf Arts ke liye
```

**Real Postman Examples:**

```json
// Example 1: English - Sabhi streams ke liye (All)
{
  "gradeId": "67234grade9id123456",
  "streamId": null,  ← NULL = All streams (Science, Commerce, Arts sabhi)
  "subjectId": "67234subj1eng789",
  "isCompulsory": true,
  "notes": "Common subject for ALL streams"
}
// Result: Science students bhi lein, Commerce bhi lein, Arts bhi lein

// Example 2: Physics - Sirf Science stream ke liye
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream1sci456",  ← Science stream ID = Sirf Science ke liye
  "subjectId": "67234subj6phy789",
  "isCompulsory": true,
  "notes": "Only for Science stream students"
}
// Result: SIRF Science students lein, Commerce/Arts nahi lein

// Example 3: Accounting - Sirf Commerce stream ke liye
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream2com456",  ← Commerce stream ID = Sirf Commerce ke liye
  "subjectId": "67234subj9acc789",
  "isCompulsory": true,
  "notes": "Only for Commerce stream students"
}
// Result: SIRF Commerce students lein, Science/Arts nahi lein
```

**Summary Table:**

| Field | Value | Matlab | Example |
|-------|-------|--------|---------|
| `isCompulsory: true` | ✅ Lazmi | Har student ko lena ZAROORI | English, Math, Islamiat |
| `isCompulsory: false` | ⚪ Ikhtiyari | Student apni marzi se le | Computer, Fine Arts |
| `streamId: null` | 🌐 All Streams | Sabhi streams ke liye | English, Urdu, Math |
| `streamId: "sci123"` | 🔬 Science Only | Sirf Science ke liye | Physics, Chemistry |
| `streamId: "com123"` | 💼 Commerce Only | Sirf Commerce ke liye | Accounting, Economics |
| `streamId: "art123"` | 🎨 Arts Only | Sirf Arts ke liye | History, Geography |

---

## Blue Info Box Location
**File:** `src/app/(dashboard)/super-admin/academic/levels/page.js`
**Modal:** Grade-Stream-Subject Mapping Modal (Subject Mapping Tab)
**Line ~800:** Blue box with explanation about common vs stream-specific subjects

---

## Complete Flow with Postman Examples

### Step 1: Create Level (Education Level)
**Endpoint:** `POST /api/school/levels`
```json
{
  "name": "Secondary",
  "code": "SEC",
  "order": 2,
  "description": "Grades 9-10 (Matriculation)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234abc123def456789",
    "name": "Secondary",
    "code": "SEC",
    "order": 2,
    "description": "Grades 9-10 (Matriculation)"
  }
}
```

---

### Step 2: Create Grades (1-12)
**Endpoint:** `POST /api/school/grades`

**Grade 9:**
```json
{
  "name": "Grade 9",
  "gradeNumber": 9,
  "levelId": "67234abc123def456789",
  "code": "G9",
  "academicYear": "2025-2026"
}
```

**Grade 10:**
```json
{
  "name": "Grade 10",
  "gradeNumber": 10,
  "levelId": "67234abc123def456789",
  "code": "G10",
  "academicYear": "2025-2026"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234grade9id123456",
    "name": "Grade 9",
    "gradeNumber": 9,
    "levelId": "67234abc123def456789",
    "code": "G9"
  }
}
```

---

### Step 3: Create Streams
**Endpoint:** `POST /api/school/streams`

**Science Stream:**
```json
{
  "name": "Science",
  "code": "SCI",
  "description": "Science stream with Physics, Chemistry, Biology"
}
```

**Commerce Stream:**
```json
{
  "name": "Commerce",
  "code": "COM",
  "description": "Commerce stream with Accounting, Economics"
}
```

**Arts Stream:**
```json
{
  "name": "Arts",
  "code": "ART",
  "description": "Arts stream with History, Geography"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234stream1sci456",
    "name": "Science",
    "code": "SCI"
  }
}
```

---

### Step 4: Create Subjects
**Endpoint:** `POST /api/school/subjects`

**Common Subjects (All Streams):**
```json
// English
{
  "name": "English",
  "code": "ENG",
  "description": "English Language and Literature"
}

// Urdu
{
  "name": "Urdu",
  "code": "URD",
  "description": "Urdu Language and Literature"
}

// Mathematics
{
  "name": "Mathematics",
  "code": "MATH",
  "description": "Mathematics for all streams"
}

// Islamiat
{
  "name": "Islamiat",
  "code": "ISL",
  "description": "Islamic Studies"
}

// Pakistan Studies
{
  "name": "Pakistan Studies",
  "code": "PAK",
  "description": "Pakistan Studies"
}
```

**Science Stream Subjects:**
```json
// Physics
{
  "name": "Physics",
  "code": "PHY",
  "description": "Physics for Science stream"
}

// Chemistry
{
  "name": "Chemistry",
  "code": "CHEM",
  "description": "Chemistry for Science stream"
}

// Biology
{
  "name": "Biology",
  "code": "BIO",
  "description": "Biology for Science stream"
}
```

**Commerce Stream Subjects:**
```json
// Accounting
{
  "name": "Accounting",
  "code": "ACC",
  "description": "Accounting for Commerce stream"
}

// Economics
{
  "name": "Economics",
  "code": "ECO",
  "description": "Economics for Commerce stream"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234subj1eng789",
    "name": "English",
    "code": "ENG"
  }
}
```

---

### Step 5: Map Subjects to Grades (Grade-Stream-Subject)
**Endpoint:** `POST /api/school/grade-stream-subjects`

**Common Subjects for Grade 9 (No Stream = All Streams):**
```json
// English - Available for all streams
{
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "subjectId": "67234subj1eng789",
  "isCompulsory": true,
  "notes": "Common subject for all streams"
}

// Urdu - Available for all streams
{
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "subjectId": "67234subj2urd789",
  "isCompulsory": true,
  "notes": "Common subject for all streams"
}

// Mathematics - Available for all streams
{
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "subjectId": "67234subj3math789",
  "isCompulsory": true,
  "notes": "Common subject for all streams"
}

// Islamiat - Available for all streams
{
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "subjectId": "67234subj4isl789",
  "isCompulsory": true
}

// Pakistan Studies - Available for all streams
{
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "subjectId": "67234subj5pak789",
  "isCompulsory": true
}
```

**Science Stream Specific Subjects for Grade 9:**
```json
// Physics - Only for Science stream
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream1sci456",
  "subjectId": "67234subj6phy789",
  "isCompulsory": true,
  "notes": "Science stream only"
}

// Chemistry - Only for Science stream
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream1sci456",
  "subjectId": "67234subj7chem789",
  "isCompulsory": true,
  "notes": "Science stream only"
}

// Biology - Only for Science stream
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream1sci456",
  "subjectId": "67234subj8bio789",
  "isCompulsory": true,
  "notes": "Science stream only"
}
```

**Commerce Stream Specific Subjects for Grade 9:**
```json
// Accounting - Only for Commerce stream
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream2com456",
  "subjectId": "67234subj9acc789",
  "isCompulsory": true,
  "notes": "Commerce stream only"
}

// Economics - Only for Commerce stream
{
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream2com456",
  "subjectId": "67234subj10eco789",
  "isCompulsory": true,
  "notes": "Commerce stream only"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234gss1eng456",
    "gradeId": "67234grade9id123456",
    "streamId": null,
    "subjectId": "67234subj1eng789",
    "isCompulsory": true,
    "notes": "Common subject for all streams"
  }
}
```

---

### Step 6: Create Syllabus
**Endpoint:** `POST /api/super-admin/syllabus`

**Example 1: English Syllabus for Grade 9 (All Streams)**
```json
{
  "title": "English Language & Literature - Grade 9",
  "subjectId": "67234subj1eng789",
  "levelId": "67234abc123def456789",
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "academicYear": "2025-2026",
  "overview": "Comprehensive English curriculum covering grammar, composition, literature, and communication skills for Grade 9 students across all streams.",
  "learningObjectives": [
    "Develop advanced reading comprehension skills",
    "Master grammar rules and sentence structure",
    "Write essays, letters, and creative pieces",
    "Analyze poetry and prose",
    "Improve verbal communication and presentation skills"
  ],
  "learningOutcomes": [
    "Students can write coherent essays of 500+ words",
    "Students understand and apply complex grammar rules",
    "Students can analyze literary devices in poems and stories",
    "Students can deliver confident oral presentations"
  ],
  "teachingMethodology": [
    "Interactive reading sessions",
    "Grammar drills and exercises",
    "Group discussions on literature",
    "Writing workshops",
    "Oral presentations and debates"
  ],
  "chapters": [
    {
      "title": "Chapter 1: Parts of Speech",
      "topics": [
        "Nouns and Pronouns",
        "Verbs and Adverbs",
        "Adjectives and Articles",
        "Prepositions and Conjunctions"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 2: Sentence Structure",
      "topics": [
        "Simple Sentences",
        "Compound Sentences",
        "Complex Sentences",
        "Active and Passive Voice"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 3: Essay Writing",
      "topics": [
        "Descriptive Essays",
        "Narrative Essays",
        "Argumentative Essays",
        "Letter Writing"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 4: Poetry Analysis",
      "topics": [
        "Understanding Metaphors and Similes",
        "Rhyme and Rhythm",
        "Analyzing Themes",
        "Famous English Poets"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 5: Prose and Short Stories",
      "topics": [
        "Character Analysis",
        "Plot Development",
        "Setting and Mood",
        "Reading Comprehension Strategies"
      ],
      "duration": "3 weeks"
    }
  ],
  "assessmentPlan": {
    "midterm": "30%",
    "final": "40%",
    "assignments": "15%",
    "classParticipation": "10%",
    "projects": "5%"
  },
  "preparedBy": "Mr. Ahmed Khan",
  "approvedBy": "Dr. Sarah Williams"
}
```

**Example 2: Physics Syllabus for Grade 9 Science Stream**
```json
{
  "title": "Physics - Grade 9 (Science Stream)",
  "subjectId": "67234subj6phy789",
  "levelId": "67234abc123def456789",
  "gradeId": "67234grade9id123456",
  "streamId": "67234stream1sci456",
  "academicYear": "2025-2026",
  "overview": "Introduction to fundamental physics concepts including mechanics, energy, light, sound, and electricity for Grade 9 Science students.",
  "learningObjectives": [
    "Understand basic laws of motion and force",
    "Learn concepts of energy and its forms",
    "Study properties of light and sound waves",
    "Grasp fundamentals of electricity and circuits",
    "Develop problem-solving skills in physics"
  ],
  "learningOutcomes": [
    "Students can solve numerical problems on motion and force",
    "Students understand energy conservation principles",
    "Students can explain wave phenomena",
    "Students can design simple electrical circuits"
  ],
  "teachingMethodology": [
    "Laboratory experiments",
    "Numerical problem-solving sessions",
    "Demonstration of physics phenomena",
    "Interactive simulations",
    "Group projects and presentations"
  ],
  "chapters": [
    {
      "title": "Chapter 1: Physical Quantities and Measurement",
      "topics": [
        "SI Units",
        "Measuring Instruments",
        "Significant Figures",
        "Scientific Notation"
      ],
      "duration": "1 week"
    },
    {
      "title": "Chapter 2: Kinematics",
      "topics": [
        "Distance and Displacement",
        "Speed and Velocity",
        "Acceleration",
        "Equations of Motion"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 3: Dynamics",
      "topics": [
        "Newton's Laws of Motion",
        "Force and Mass",
        "Friction",
        "Momentum and Impulse"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 4: Energy and Work",
      "topics": [
        "Work and Power",
        "Kinetic Energy",
        "Potential Energy",
        "Conservation of Energy"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 5: Light",
      "topics": [
        "Reflection of Light",
        "Refraction of Light",
        "Lenses and Mirrors",
        "Dispersion of Light"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 6: Sound",
      "topics": [
        "Sound Waves",
        "Speed of Sound",
        "Frequency and Pitch",
        "Echoes and Reverberation"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 7: Electricity",
      "topics": [
        "Electric Current",
        "Voltage and Resistance",
        "Ohm's Law",
        "Series and Parallel Circuits"
      ],
      "duration": "3 weeks"
    }
  ],
  "assessmentPlan": {
    "midterm": "25%",
    "final": "35%",
    "practicals": "20%",
    "assignments": "10%",
    "quizzes": "10%"
  },
  "preparedBy": "Dr. Muhammad Iqbal",
  "approvedBy": "Prof. Fatima Ahmed"
}
```

**Example 3: Mathematics Syllabus for Grade 9 (All Streams)**
```json
{
  "title": "Mathematics - Grade 9 (All Streams)",
  "subjectId": "67234subj3math789",
  "levelId": "67234abc123def456789",
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "academicYear": "2025-2026",
  "overview": "Comprehensive mathematics curriculum covering algebra, geometry, trigonometry, and statistics for all Grade 9 students.",
  "learningObjectives": [
    "Master algebraic operations and equations",
    "Understand geometric theorems and constructions",
    "Learn basic trigonometry concepts",
    "Develop statistical analysis skills",
    "Enhance logical and analytical thinking"
  ],
  "learningOutcomes": [
    "Students can solve quadratic equations",
    "Students understand Pythagoras theorem and its applications",
    "Students can calculate trigonometric ratios",
    "Students can interpret statistical data"
  ],
  "teachingMethodology": [
    "Step-by-step problem solving",
    "Conceptual explanations with examples",
    "Practice worksheets",
    "Real-world applications",
    "Peer learning groups"
  ],
  "chapters": [
    {
      "title": "Chapter 1: Real Numbers",
      "topics": [
        "Number Systems",
        "Rational and Irrational Numbers",
        "Laws of Indices",
        "Surds and Rationalisation"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 2: Polynomials",
      "topics": [
        "Introduction to Polynomials",
        "Factorisation",
        "Remainder Theorem",
        "Factor Theorem"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 3: Linear Equations",
      "topics": [
        "Linear Equations in Two Variables",
        "Graphical Method",
        "Algebraic Methods",
        "Word Problems"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 4: Quadratic Equations",
      "topics": [
        "Standard Form",
        "Factorisation Method",
        "Completing the Square",
        "Quadratic Formula"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 5: Geometry - Lines and Angles",
      "topics": [
        "Basic Definitions",
        "Parallel Lines",
        "Angle Properties",
        "Theorems on Lines and Angles"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 6: Triangles",
      "topics": [
        "Congruence of Triangles",
        "Properties of Triangles",
        "Pythagoras Theorem",
        "Triangle Inequalities"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 7: Introduction to Trigonometry",
      "topics": [
        "Trigonometric Ratios",
        "Sine, Cosine, Tangent",
        "Trigonometric Identities",
        "Heights and Distances"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 8: Statistics",
      "topics": [
        "Data Collection and Organization",
        "Frequency Distribution",
        "Mean, Median, Mode",
        "Graphical Representation"
      ],
      "duration": "2 weeks"
    }
  ],
  "assessmentPlan": {
    "midterm": "30%",
    "final": "40%",
    "assignments": "15%",
    "classTests": "10%",
    "projects": "5%"
  },
  "preparedBy": "Mrs. Ayesha Malik",
  "approvedBy": "Mr. Hassan Raza"
}
```

**Example 4: Islamiat Syllabus for Grade 9 (All Streams)**
```json
{
  "title": "Islamiat - Grade 9 (All Streams)",
  "subjectId": "67234subj4isl789",
  "levelId": "67234abc123def456789",
  "gradeId": "67234grade9id123456",
  "streamId": null,
  "academicYear": "2025-2026",
  "overview": "Islamic Studies curriculum covering Quranic knowledge, Hadith, Seerat, and Islamic teachings for Grade 9 students.",
  "learningObjectives": [
    "Understand and memorize selected Quranic verses",
    "Learn important Hadith with meanings",
    "Study the life of Prophet Muhammad (PBUH)",
    "Understand Islamic beliefs and practices",
    "Apply Islamic teachings in daily life"
  ],
  "learningOutcomes": [
    "Students can recite selected Surahs with Tajweed",
    "Students understand the meanings of important Ahadith",
    "Students can explain major events from Seerat",
    "Students demonstrate Islamic values in behavior"
  ],
  "teachingMethodology": [
    "Quran recitation with Tajweed",
    "Translation and Tafseer explanations",
    "Hadith study and discussion",
    "Storytelling from Seerat",
    "Practical application of Islamic teachings"
  ],
  "chapters": [
    {
      "title": "Chapter 1: Selected Surahs",
      "topics": [
        "Surah Al-Hujurat (Translation & Tafseer)",
        "Surah Al-Mulk (Translation & Tafseer)",
        "Tajweed Rules",
        "Memorization Techniques"
      ],
      "duration": "4 weeks"
    },
    {
      "title": "Chapter 2: Hadith",
      "topics": [
        "Importance of Hadith",
        "Selected Ahadith on Ethics",
        "Ahadith on Social Life",
        "Chain of Narration"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 3: Seerat-un-Nabi (PBUH)",
      "topics": [
        "Life in Makkah",
        "Migration to Madinah",
        "Important Battles",
        "Treaties and Conquests"
      ],
      "duration": "4 weeks"
    },
    {
      "title": "Chapter 4: Islamic Beliefs (Aqaid)",
      "topics": [
        "Tawheed (Oneness of Allah)",
        "Risalat (Prophethood)",
        "Akhirat (Life After Death)",
        "Books of Allah"
      ],
      "duration": "2 weeks"
    },
    {
      "title": "Chapter 5: Islamic Practices (Ibadat)",
      "topics": [
        "Five Pillars of Islam",
        "Prayer and its Importance",
        "Fasting and Ramadan",
        "Zakat and Charity"
      ],
      "duration": "3 weeks"
    },
    {
      "title": "Chapter 6: Islamic Ethics and Morals",
      "topics": [
        "Honesty and Truthfulness",
        "Respect for Parents",
        "Rights of Neighbors",
        "Social Responsibilities"
      ],
      "duration": "2 weeks"
    }
  ],
  "assessmentPlan": {
    "midterm": "25%",
    "final": "35%",
    "quranRecitation": "20%",
    "assignments": "10%",
    "behavior": "10%"
  },
  "preparedBy": "Qari Abdul Rahman",
  "approvedBy": "Mufti Muhammad Usman"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67234syl1eng456",
    "title": "English Language & Literature - Grade 9",
    "subjectId": {
      "_id": "67234subj1eng789",
      "name": "English"
    },
    "gradeId": {
      "_id": "67234grade9id123456",
      "name": "Grade 9"
    },
    "streamId": null,
    "academicYear": "2025-2026",
    "overview": "Comprehensive English curriculum...",
    "chapters": [...],
    "assessmentPlan": {...},
    "preparedBy": "Mr. Ahmed Khan",
    "approvedBy": "Dr. Sarah Williams"
  }
}
```

---

## Testing the Complete Flow

### 1. Get Filtered Subjects (Used by Syllabus Form)
**Endpoint:** `GET /api/school/grade-stream-subjects?gradeId=67234grade9id123456`

**Response:** Returns all subjects mapped to Grade 9 (common + all stream-specific)
```json
{
  "success": true,
  "data": [
    {
      "_id": "67234gss1eng456",
      "gradeId": "67234grade9id123456",
      "streamId": null,
      "subjectId": {
        "_id": "67234subj1eng789",
        "name": "English"
      },
      "isCompulsory": true
    },
    {
      "_id": "67234gss6phy456",
      "gradeId": "67234grade9id123456",
      "streamId": {
        "_id": "67234stream1sci456",
        "name": "Science"
      },
      "subjectId": {
        "_id": "67234subj6phy789",
        "name": "Physics"
      },
      "isCompulsory": true
    }
  ]
}
```

### 2. Get Filtered Subjects by Grade + Stream
**Endpoint:** `GET /api/school/grade-stream-subjects?gradeId=67234grade9id123456&streamId=67234stream1sci456`

**Response:** Returns common subjects (streamId=null) + Science stream subjects
```json
{
  "success": true,
  "data": [
    {
      "subjectId": { "name": "English" },
      "streamId": null
    },
    {
      "subjectId": { "name": "Urdu" },
      "streamId": null
    },
    {
      "subjectId": { "name": "Mathematics" },
      "streamId": null
    },
    {
      "subjectId": { "name": "Physics" },
      "streamId": { "name": "Science" }
    },
    {
      "subjectId": { "name": "Chemistry" },
      "streamId": { "name": "Science" }
    }
  ]
}
```

### 3. Get All Syllabuses
**Endpoint:** `GET /api/super-admin/syllabus`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67234syl1eng456",
      "title": "English Language & Literature - Grade 9",
      "subjectId": {
        "_id": "67234subj1eng789",
        "name": "English"
      },
      "gradeId": {
        "_id": "67234grade9id123456",
        "name": "Grade 9",
        "gradeNumber": 9
      },
      "streamId": null,
      "academicYear": "2025-2026",
      "overview": "Comprehensive English curriculum...",
      "chapters": [...]
    },
    {
      "_id": "67234syl2phy456",
      "title": "Physics - Grade 9 (Science Stream)",
      "subjectId": {
        "name": "Physics"
      },
      "gradeId": {
        "name": "Grade 9",
        "gradeNumber": 9
      },
      "streamId": {
        "name": "Science"
      },
      "academicYear": "2025-2026"
    }
  ]
}
```

---

## Summary

### Blue Info Box Location:
- **File:** `levels/page.js` (line ~800)
- **Tab:** Subject Mapping (4th tab)
- **Modal:** Add/Edit Subject Mapping
- **Purpose:** Explains common subjects (no stream) vs stream-specific subjects

### Complete Data Flow:
1. **Level** → Secondary (Grades 9-10)
2. **Grades** → Grade 9, Grade 10 (dropdown 1-12)
3. **Streams** → Science, Commerce, Arts
4. **Subjects** → English, Math, Physics, etc.
5. **Grade-Stream-Subject Mapping:**
   - Common: Grade 9 → English (no stream) = All streams
   - Specific: Grade 9 → Physics (Science) = Science only
6. **Syllabus:**
   - English syllabus → Grade 9, no stream (all students)
   - Physics syllabus → Grade 9, Science stream (science students only)

### Key Points:
- ✅ Stream is **optional** in Grade-Stream-Subject mapping
- ✅ `streamId: null` = Subject available for **all streams** in that grade
- ✅ `streamId: "67234..."` = Subject only for **that specific stream**
- ✅ Syllabus automatically filters subjects based on selected grade+stream
- ✅ Grade numbers are **fixed dropdown (1-12)** for consistency
