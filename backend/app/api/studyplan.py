from fastapi import APIRouter

router = APIRouter(prefix="/studyplan", tags=["studyplan"])

SUBJECTS = [
    "Essay", "English (Precis & Composition)", "General Science & Ability",
    "Current Affairs", "Pakistan Affairs", "Islamic Studies",
]

MONTHLY_PLAN = [
    {"month": 1, "label": "January", "focus": "Foundation & Assessment", "tasks": ["Take mock test to assess baseline", "Build daily reading habit", "Start English grammar review"]},
    {"month": 2, "label": "February", "focus": "Islamic Studies & English", "tasks": ["Complete Islamic Studies syllabus", "Practice essay writing weekly", "English precis practice"]},
    {"month": 3, "label": "March", "focus": "Pakistan Affairs", "tasks": ["Study constitutional history", "Foreign policy & CPEC", "Pakistan history 1947-present"]},
    {"month": 4, "label": "April", "focus": "Current Affairs", "tasks": ["Daily Dawn editorial reading", "Monthly current affairs digest", "Practice MCQs daily"]},
    {"month": 5, "label": "May", "focus": "General Science & Ability", "tasks": ["Science fundamentals", "Math & analytical reasoning", "Mental ability practice tests"]},
    {"month": 6, "label": "June", "focus": "Optionals — Part 1", "tasks": ["Begin first two optional subjects", "Complete one optional fully", "Revision of compulsories"]},
    {"month": 7, "label": "July", "focus": "Optionals — Part 2", "tasks": ["Continue remaining optionals", "Past paper analysis", "Time management practice"]},
    {"month": 8, "label": "August", "focus": "Intensive Revision", "tasks": ["Full syllabus revision", "Essay writing 2x per week", "Mock tests every weekend"]},
    {"month": 9, "label": "September", "focus": "Past Papers Sprint", "tasks": ["Solve 5 years of past papers", "Focus on weak areas", "Speed & accuracy drills"]},
    {"month": 10, "label": "October", "focus": "Final Revision", "tasks": ["Compact notes review", "Current affairs update", "Mental preparation"]},
    {"month": 11, "label": "November", "focus": "Exam Simulation", "tasks": ["Full-length timed exams", "Stress management", "Final weak area focus"]},
    {"month": 12, "label": "December", "focus": "Consolidation", "tasks": ["Light revision only", "Stay updated on news", "Rest & mental wellness"]},
]


@router.get("/calendar")
def calendar():
    return MONTHLY_PLAN


@router.get("/milestones")
def milestones():
    return [
        {
            "subject": s,
            "milestones": [
                "Complete syllabus reading",
                "Summarize key concepts",
                "Solve MCQs",
                "Attempt past questions",
                "Full revision",
            ],
        }
        for s in SUBJECTS
    ]
