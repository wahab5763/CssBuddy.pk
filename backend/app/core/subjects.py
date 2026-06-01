"""
Central registry of all CSS/PMS subjects.
Seeded into the `optionals` table on startup; never modified at runtime.
"""

COMPULSORY_SUBJECTS: list[str] = [
    "Essay",
    "English (Precis & Composition)",
    "General Science & Ability",
    "Current Affairs",
    "Pakistan Affairs",
    "Islamic Studies",
]

OPTIONAL_SUBJECTS: list[str] = [
    "Accountancy & Auditing",
    "Agriculture & Forestry",
    "Anthropology",
    "Applied Mathematics",
    "Arabic",
    "Balochi",
    "Botany",
    "British History",
    "Business Administration",
    "Chemistry",
    "Computer Science",
    "Constitutional Law",
    "Criminology",
    "Economics",
    "English Literature",
    "Environmental Sciences",
    "European History",
    "Gender Studies",
    "Geology",
    "Governance & Public Policies",
    "History of Pakistan & India",
    "History of USA",
    "International Law",
    "International Relations",
    "Islamic History & Culture",
    "Journalism & Mass Communication",
    "Law",
    "Mercantile Law",
    "Muslim Law & Jurisprudence",
    "Philosophy",
    "Physics",
    "Political Science",
    "Psychology",
    "Public Administration",
    "Pure Mathematics",
    "Punjabi",
    "Sindhi",
    "Sociology",
    "Statistics",
    "Town Planning & Urban Management",
    "Urdu Literature",
    "Zoology",
]

ALL_SUBJECTS: list[str] = COMPULSORY_SUBJECTS + OPTIONAL_SUBJECTS
OPTIONAL_SUBJECTS_SET: set[str] = set(OPTIONAL_SUBJECTS)
