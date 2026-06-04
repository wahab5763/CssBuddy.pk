from datetime import date, timedelta
import random
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import get_optional_user
from app.models.user import User

router = APIRouter(prefix="/studyplan", tags=["studyplan"])

# ── Static month timeline ────────────────────────────────────────────────────
MONTHLY_PLAN = [
    {"month": 1,  "label": "January",   "focus": "Foundation & Self-Assessment",    "tasks": ["Take a baseline mock test", "Build daily reading habit (Dawn editorial)", "Start English grammar review"]},
    {"month": 2,  "label": "February",  "focus": "Islamic Studies & Essay Writing", "tasks": ["Complete Islamic Studies syllabus", "Practice one essay per week", "English precis daily practice"]},
    {"month": 3,  "label": "March",     "focus": "Pakistan Affairs",                "tasks": ["Constitutional history 1947–present", "Foreign policy & CPEC", "Pakistan geography & resources"]},
    {"month": 4,  "label": "April",     "focus": "Current Affairs Intensive",       "tasks": ["Daily Dawn editorial + notes", "Monthly current affairs digest", "MCQ practice 20/day"]},
    {"month": 5,  "label": "May",       "focus": "General Science & Ability",       "tasks": ["Science fundamentals (Physics, Chemistry, Bio)", "Math & analytical reasoning", "Mental ability practice tests"]},
    {"month": 6,  "label": "June",      "focus": "Optionals — Part 1",              "tasks": ["Begin first two optional subjects", "Complete one optional fully", "Compulsory quick revision"]},
    {"month": 7,  "label": "July",      "focus": "Optionals — Part 2",              "tasks": ["Remaining optional subjects", "Past paper topic analysis", "Time-management practice"]},
    {"month": 8,  "label": "August",    "focus": "Intensive Revision",              "tasks": ["Full syllabus rapid revision", "Essay writing 2× per week", "Mock tests every weekend"]},
    {"month": 9,  "label": "September", "focus": "Past Papers Sprint",              "tasks": ["Solve last 5 years past papers", "Focus exclusively on weak areas", "Speed & accuracy drills"]},
    {"month": 10, "label": "October",   "focus": "Final Revision",                  "tasks": ["Compact notes review", "Current affairs final update", "Mental health & energy management"]},
    {"month": 11, "label": "November",  "focus": "Exam Simulation",                 "tasks": ["Full-length timed exams daily", "Stress management techniques", "Final weak-area blitz"]},
    {"month": 12, "label": "December",  "focus": "Consolidation & Rest",            "tasks": ["Light revision only", "Stay updated on breaking news", "Rest and mental wellness"]},
]

# ── Subject topics ───────────────────────────────────────────────────────────
SUBJECT_TOPICS: dict[str, list[str]] = {
    "Essay": [
        "Essay Structure & Types", "Argument Development", "Introduction & Conclusion Writing",
        "Vocabulary Enhancement", "Grammar & Punctuation", "Critical Thinking Skills",
        "Essay Practice — Social Issues", "Essay Practice — Political Issues",
        "Essay Practice — Economic Issues", "Essay Practice — Science & Technology",
        "Time Management in Essay Writing", "Comprehensive Revision",
    ],
    "English (Precis & Composition)": [
        "Precis Writing Fundamentals", "Comprehension Skills", "Grammar Rules Revision",
        "Vocabulary Building", "Sentence Structure & Syntax", "Paragraph Writing",
        "Letter & Application Writing", "Report Writing", "Precis Practice — Dawn Editorials",
        "Error Correction Exercises", "Punctuation & Mechanics", "Final Revision",
    ],
    "General Science & Ability": [
        "Basic Mathematics & Arithmetic", "Algebra & Equations", "Geometry & Trigonometry",
        "Statistics & Probability", "Physics Fundamentals", "Chemistry Basics",
        "Biology — Human Systems", "Biology — Cell & Genetics", "Environmental Science",
        "Computer & IT Basics", "Logical Reasoning", "Quantitative Aptitude",
    ],
    "Pakistan Affairs": [
        "Historical Background 1857–1947", "Freedom Movement & Partition", "Constitutional Development",
        "Political History 1947–Present", "Foreign Policy & Relations", "Economic Development",
        "Social Issues & Challenges", "Cultural Heritage", "Geography & Natural Resources",
        "Current Affairs — National", "CPEC & Regional Dynamics", "National Security Issues",
    ],
    "Islamic Studies": [
        "Basic Beliefs (Aqeedah)", "Prophet's Life (Seerah)", "Quranic Studies",
        "Hadith Sciences", "Islamic Jurisprudence (Fiqh)", "Islamic History",
        "Contemporary Muslim Issues", "Islamic Civilization", "Comparative Religion",
        "Ethics & Morality in Islam", "Social System in Islam", "Political System in Islam",
    ],
    "Current Affairs": [
        "Pakistan Political Developments", "Economic Indicators & Budget", "Foreign Relations",
        "International Organizations (UN, OIC, SCO)", "Regional Affairs (Afghanistan, India, China)",
        "Middle East Issues", "US Foreign Policy", "Climate Change & Environment",
        "Science & Technology Updates", "Social Issues in Pakistan", "Global Security Threats", "Revision",
    ],
    "International Relations": [
        "Theories of IR — Realism & Liberalism", "Foreign Policy Analysis", "Diplomacy & Statecraft",
        "International Organizations", "Global Security Issues", "International Political Economy",
        "South Asian Regional Studies", "Conflict Resolution", "International Law Basics",
        "Pakistan's Foreign Policy", "Current Global Issues", "Research Methods in IR",
    ],
    "Political Science": [
        "Political Theory", "Comparative Politics", "Political Institutions",
        "Political Ideologies", "Public Administration Basics", "Political Economy",
        "Political Development", "Governance Systems", "Political Parties & Elections",
        "Political Sociology", "Research Methodology", "Contemporary Political Issues",
    ],
    "Sociology": [
        "Sociological Theories", "Social Structure", "Social Institutions",
        "Social Change & Development", "Social Stratification", "Culture & Personality",
        "Social Research Methods", "Urban Sociology", "Rural Sociology in Pakistan",
        "Gender Studies", "Development Sociology", "Contemporary Social Issues",
    ],
    "Economics": [
        "Microeconomic Theory", "Macroeconomic Theory", "Public Finance",
        "Money, Banking & Credit", "International Trade", "Development Economics",
        "Agricultural Economics", "Labor Economics", "Econometrics Basics",
        "Economic Planning in Pakistan", "Islamic Economics", "Current Economic Issues",
    ],
    "Public Administration": [
        "Theories of Public Administration", "Organizational Behavior", "Public Policy Analysis",
        "Financial Administration", "Personnel Administration", "Development Administration",
        "Local Government in Pakistan", "Administrative Law", "Public Sector Reforms",
        "Governance & Accountability", "Comparative Public Administration", "Current Issues",
    ],
    "Constitutional Law": [
        "Basic Concepts of Constitutional Law", "Fundamental Rights", "Principles of Policy",
        "Federal Structure of Pakistan", "Parliamentary System", "Judicial System & Courts",
        "Constitutional Amendments History", "Emergency Provisions", "Local Government",
        "Comparative Constitutional Law", "Judicial Review", "Contemporary Issues",
    ],
    "Geography": [
        "Physical Geography", "Human Geography", "Regional Geography of Pakistan",
        "Economic Geography", "Political Geography & Geopolitics", "Environmental Geography",
        "Geographic Information Systems", "Remote Sensing", "Urban & Rural Geography",
        "Climate Change Geography", "Natural Resources of Pakistan", "Geopolitics",
    ],
    "Journalism & Mass Communication": [
        "Communication Theories", "News Writing & Reporting", "Media Laws & Ethics",
        "Broadcast Journalism", "Digital Media & Social Networks", "Public Relations",
        "Advertising & Media Economics", "Media Management", "Research in Communication",
        "International Communication", "Development Communication", "Media Criticism",
    ],
}

GENERIC_TOPICS = [
    "Fundamental Concepts & Definitions", "Theoretical Framework", "Historical Development",
    "Key Principles & Doctrines", "Major Schools of Thought", "Practical Applications",
    "Current Trends & Issues", "Research Methodologies", "Critical Analysis",
    "Case Studies", "Comparative Studies", "Contemporary Challenges",
    "Problem-Solving Approach", "Advanced Concepts", "Revision & Synthesis",
]

TASK_TEMPLATES: dict[str, list[str]] = {
    "Beginner": [
        "Watch an introductory video on {topic}",
        "Read basic concepts of {topic} from textbook",
        "Solve 5 MCQs on {topic}",
        "Make bullet-point notes on {topic}",
        "List the 5 most important facts about {topic}",
    ],
    "Intermediate": [
        "Solve past-paper questions on {topic}",
        "Revise {topic} + attempt 10 MCQs",
        "Write a 200-word short note on {topic}",
        "Create a mind-map for {topic}",
        "Practice one essay on {topic}",
    ],
    "Advanced": [
        "Solve complex analytical questions on {topic}",
        "Write a detailed analytical essay on {topic}",
        "Attempt last 5 years of questions on {topic}",
        "Critically evaluate key theories of {topic}",
        "Solve a timed 1-hour test on {topic}",
    ],
}

CSS_SUBJECTS = [
    "Essay", "English (Precis & Composition)", "General Science & Ability",
    "Pakistan Affairs", "Islamic Studies", "Current Affairs",
    "International Relations", "Political Science", "Sociology", "Economics",
    "Public Administration", "Constitutional Law", "Geography",
    "Journalism & Mass Communication",
]


def _get_topics(subject: str) -> list[str]:
    if subject in SUBJECT_TOPICS:
        return SUBJECT_TOPICS[subject]
    return [f"{t} in {subject}" for t in GENERIC_TOPICS]


def _make_tasks(topic: str, proficiency: str, count: int = 2) -> str:
    templates = TASK_TEMPLATES.get(proficiency, TASK_TEMPLATES["Intermediate"])
    chosen = random.sample(templates, min(count, len(templates)))
    return " | ".join(t.format(topic=topic) for t in chosen)


# ── Plan generator ───────────────────────────────────────────────────────────
class PlanRequest(BaseModel):
    exam_date: date
    proficiency: str = "Intermediate"
    subjects: list[str]
    weak_subject: Optional[str] = None
    hours_per_day: int = 5


@router.post("/generate")
def generate_plan(data: PlanRequest, user: User | None = Depends(get_optional_user)):
    today = date.today()
    if data.exam_date <= today:
        return {"error": "Exam date must be in the future", "days": []}

    total_days = (data.exam_date - today).days
    subjects = [s for s in data.subjects if s]
    if not subjects:
        return {"error": "Select at least one subject", "days": []}

    # Build weighted subject rotation (weak subject gets 1.5× frequency)
    weighted: list[str] = []
    for s in subjects:
        weight = 3 if s == data.weak_subject else 2
        weighted.extend([s] * weight)

    # Reserve last 10% for revision (min 3 days)
    revision_days = max(3, total_days // 10)
    study_days = total_days - revision_days

    # Build a rotation queue
    rotation: list[str] = []
    while len(rotation) < study_days:
        batch = weighted[:]
        random.shuffle(batch)
        rotation.extend(batch)
    rotation = rotation[:study_days]

    # Track topic pointer per subject
    topic_ptr: dict[str, int] = {s: 0 for s in subjects}
    all_topics: dict[str, list[str]] = {s: _get_topics(s) for s in subjects}

    days_output: list[dict] = []
    current = today

    for day_num, subject in enumerate(rotation, start=1):
        topics_for_subject = all_topics[subject]
        ptr = topic_ptr[subject]

        # Pick 1 or 2 topics per day
        remaining = len(topics_for_subject) - ptr
        count = min(2 if remaining > 4 else 1, remaining) if remaining > 0 else 0

        if count > 0:
            day_topics = topics_for_subject[ptr: ptr + count]
            topic_ptr[subject] += count
        else:
            day_topics = ["Comprehensive Revision"]

        hours = data.hours_per_day
        tasks = _make_tasks(day_topics[0], data.proficiency)

        days_output.append({
            "day":     day_num,
            "date":    current.isoformat(),
            "subject": subject,
            "topic":   " + ".join(day_topics),
            "hours":   hours,
            "tasks":   tasks,
            "done":    False,
        })
        current += timedelta(days=1)

    # Add revision days at the end
    for i in range(revision_days):
        days_output.append({
            "day":     study_days + i + 1,
            "date":    current.isoformat(),
            "subject": "Revision",
            "topic":   "Comprehensive Revision — All Subjects",
            "hours":   data.hours_per_day,
            "tasks":   "Review compact notes | Solve past papers | Timed mock test",
            "done":    False,
        })
        current += timedelta(days=1)

    total_hours = sum(d["hours"] for d in days_output)
    topic_count = len({d["topic"] for d in days_output if d["subject"] != "Revision"})

    return {
        "days":        days_output,
        "stats": {
            "total_days":   len(days_output),
            "total_hours":  total_hours,
            "topic_count":  topic_count,
            "exam_date":    data.exam_date.isoformat(),
            "subjects":     subjects,
        },
    }


@router.get("/subjects")
def all_subjects():
    return CSS_SUBJECTS


@router.get("/calendar")
def calendar():
    return MONTHLY_PLAN


@router.get("/milestones")
def milestones():
    return [
        {"subject": s, "milestones": [
            "Complete syllabus reading",
            "Summarize key concepts",
            "Solve MCQs & practice Qs",
            "Attempt past-year questions",
            "Full revision & mock test",
        ]}
        for s in ["Essay", "English (Precis & Composition)", "General Science & Ability",
                  "Pakistan Affairs", "Islamic Studies", "Current Affairs"]
    ]
