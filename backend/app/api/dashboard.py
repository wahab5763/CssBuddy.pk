import random
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_user
from app.models.mcq import Mcq, McqSet
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

QUOTES = [
    {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
    {"text": "The harder you work for something, the greater you'll feel when you achieve it.", "author": "Unknown"},
    {"text": "Discipline is the bridge between goals and accomplishment.", "author": "Jim Rohn"},
    {"text": "Small daily improvements lead to stunning results.", "author": "Robin Sharma"},
    {"text": "An investment in knowledge pays the best interest.", "author": "Benjamin Franklin"},
    {"text": "We are what we repeatedly do. Excellence is not an act, but a habit.", "author": "Aristotle"},
    {"text": "The secret of getting ahead is getting started.", "author": "Mark Twain"},
    {"text": "Genius is 1% inspiration and 99% perspiration.", "author": "Thomas Edison"},
    {"text": "Hard choices, easy life. Easy choices, hard life.", "author": "Jerzy Gregorek"},
    {"text": "Luck is what happens when preparation meets opportunity.", "author": "Seneca"},
    {"text": "The man who moves a mountain begins by carrying away small stones.", "author": "Confucius"},
    {"text": "Done is better than perfect.", "author": "Sheryl Sandberg"},
    {"text": "What gets measured gets managed.", "author": "Peter Drucker"},
    {"text": "If you can't explain it simply, you don't understand it well enough.", "author": "Einstein"},
    {"text": "Compete with yesterday's version of you.", "author": "Unknown"},
    {"text": "Focus is the art of knowing what to ignore.", "author": "James Clear"},
    {"text": "Read, recall, review, repeat.", "author": "Study Principle"},
    {"text": "Every expert was once a beginner. Keep going!", "author": "Helen Hayes"},
    {"text": "The future depends on what you do today.", "author": "Mahatma Gandhi"},
    {"text": "Don't count the days; make the days count.", "author": "Muhammad Ali"},
]

IDIOMS = [
    {"idiom": "Burn the midnight oil",    "meaning": "Work or study late into the night."},
    {"idiom": "Hit the books",            "meaning": "Study hard."},
    {"idiom": "Cut to the chase",         "meaning": "Get to the point without delay."},
    {"idiom": "Break the ice",            "meaning": "Do something to ease tension or start a conversation."},
    {"idiom": "On the fence",             "meaning": "Undecided between two options."},
    {"idiom": "Bite the bullet",          "meaning": "Endure a painful situation with courage."},
    {"idiom": "Rule of thumb",            "meaning": "A general principle based on experience."},
    {"idiom": "Go the extra mile",        "meaning": "Make a special effort beyond what is required."},
    {"idiom": "The ball is in your court","meaning": "It is your turn to take action or decide."},
    {"idiom": "Once in a blue moon",      "meaning": "Very rarely."},
    {"idiom": "Spill the beans",          "meaning": "Reveal secret information accidentally."},
    {"idiom": "Miss the boat",            "meaning": "Miss an opportunity."},
    {"idiom": "Let the cat out of the bag","meaning": "Accidentally reveal a secret."},
    {"idiom": "In a nutshell",            "meaning": "In summary; briefly."},
    {"idiom": "Jump the gun",             "meaning": "Start something too early or prematurely."},
    {"idiom": "Under the weather",        "meaning": "Feeling ill or unwell."},
    {"idiom": "Leave no stone unturned",  "meaning": "Try every possible course of action."},
    {"idiom": "See eye to eye",           "meaning": "Agree with someone fully."},
    {"idiom": "The elephant in the room", "meaning": "An obvious issue everyone ignores."},
    {"idiom": "Weather the storm",        "meaning": "Survive a difficult period."},
    {"idiom": "Turn a blind eye",         "meaning": "Deliberately ignore something."},
    {"idiom": "Beat around the bush",     "meaning": "Avoid coming to the main point."},
    {"idiom": "Hit the nail on the head", "meaning": "Describe exactly what is causing a situation."},
    {"idiom": "Take it with a grain of salt", "meaning": "Don't believe it completely."},
    {"idiom": "Food for thought",         "meaning": "Something worth thinking about carefully."},
]

VOCAB = [
    ("Abate",        "To lessen or decrease in intensity."),
    ("Acumen",       "Keen insight; the ability to make good judgements."),
    ("Adulterate",   "To make something impure by adding inferior substances."),
    ("Alacrity",     "Brisk and cheerful readiness."),
    ("Ameliorate",   "To make something bad or unsatisfactory better."),
    ("Anomaly",      "Something that deviates from the standard or expected."),
    ("Antipathy",    "A deep-seated feeling of aversion or dislike."),
    ("Apathy",       "Lack of interest, enthusiasm, or concern."),
    ("Arcane",       "Known or understood by very few; mysterious."),
    ("Arduous",      "Involving or requiring strenuous effort; difficult."),
    ("Assuage",      "To make an unpleasant feeling less intense."),
    ("Austere",      "Severe or strict in manner; having no comforts."),
    ("Avarice",      "Extreme greed for wealth or material gain."),
    ("Banal",        "So lacking in originality as to be obvious and boring."),
    ("Bombastic",    "High-sounding but with little meaning; inflated."),
    ("Capricious",   "Given to sudden and unaccountable changes of mood."),
    ("Castigate",    "To reprimand or punish severely."),
    ("Caustic",      "Biting and sarcastic in a scathing way."),
    ("Chicanery",    "The use of trickery to achieve goals."),
    ("Cogent",       "Clear, logical, and convincing."),
    ("Convoluted",   "Extremely complex and difficult to follow."),
    ("Credulous",    "Too willing to believe things; gullible."),
    ("Deleterious",  "Causing harm or damage."),
    ("Deride",       "To express contempt for; mock."),
    ("Diffident",    "Modest or shy due to a lack of self-confidence."),
    ("Dilatory",     "Slow to act; intended to cause delay."),
    ("Disparate",    "Essentially different in kind; not allowing comparison."),
    ("Dogmatic",     "Inclined to lay down principles as incontrovertibly true."),
    ("Ebullient",    "Cheerful and full of energy."),
    ("Eclectic",     "Deriving ideas from a wide range of sources."),
    ("Effrontery",   "Insolent or impertinent behaviour; audacity."),
    ("Egregious",    "Outstandingly bad; shocking."),
    ("Enervate",     "To make someone feel drained of energy."),
    ("Ephemeral",    "Lasting for a very short time."),
    ("Equivocate",   "To use ambiguous language so as to conceal the truth."),
    ("Esoteric",     "Intended for or understood by a small number."),
    ("Exigent",      "Pressing; demanding immediate attention."),
    ("Exonerate",    "To officially absolve from blame or criminal charges."),
    ("Fervent",      "Having or displaying a passionate intensity."),
    ("Florid",       "Elaborately ornate; excessively intricate."),
    ("Garrulous",    "Excessively talkative, especially on trivial matters."),
    ("Guile",        "Sly or cunning intelligence; deceit."),
    ("Iconoclast",   "A person who attacks established beliefs or institutions."),
    ("Impetuous",    "Acting without thought; rash."),
    ("Inchoate",     "Just begun and not fully formed; undeveloped."),
    ("Inimical",     "Tending to obstruct or harm; hostile."),
    ("Insipid",      "Lacking vigour or interest; dull."),
    ("Intrepid",     "Fearless; adventurous."),
    ("Laconic",      "Using very few words."),
    ("Loquacious",   "Tending to talk a great deal; talkative."),
    ("Magnanimous",  "Generous or forgiving, especially toward a rival."),
    ("Malleable",    "Able to be shaped; easily influenced."),
    ("Meticulous",   "Showing great attention to detail; very careful."),
    ("Obdurate",     "Stubbornly refusing to change one's opinion."),
    ("Obsequious",   "Obedient or attentive to an excessive or servile degree."),
    ("Obviate",      "To remove a need or difficulty; prevent."),
    ("Ostentatious", "Characterized by vulgar or pretentious display."),
    ("Pedantic",     "Overly concerned with minor details or formalism."),
    ("Perfidious",   "Deceitful and untrustworthy; treacherous."),
    ("Perspicacious","Having a ready insight; shrewd."),
    ("Placate",      "To make someone less angry; pacify."),
    ("Pragmatic",    "Dealing with things sensibly and realistically."),
    ("Prodigal",     "Spending money or resources freely; wasteful."),
    ("Prolific",     "Producing many works, results, or offspring."),
    ("Recalcitrant", "Having an obstinately uncooperative attitude."),
    ("Reticent",     "Not revealing one's thoughts; reserved."),
    ("Sagacious",    "Having or showing keen mental discernment; wise."),
    ("Sedulous",     "Showing dedication and diligence; persevering."),
    ("Soporific",    "Tending to induce drowsiness or sleep."),
    ("Specious",     "Superficially plausible but actually wrong."),
    ("Spurious",     "Not being what it purports to be; false."),
    ("Tenuous",      "Very weak or slight; insubstantial."),
    ("Vacillate",    "To waver between different opinions or actions."),
    ("Venerate",     "Regard with great respect and reverence."),
    ("Vociferous",   "Expressing opinions loudly and forcefully."),
    ("Zealous",      "Having or showing great energy in pursuit of a cause."),
]


@router.get("/summary")
def summary(user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    today = date.today()
    exam_year = None
    streak = 0

    if user and user.profile:
        exam_year = user.profile.exam_year or today.year + 1
        streak = user.profile.streak_count

    target_year = exam_year or (today.year + 1 if today.month >= 3 else today.year)
    target_date = date(target_year, 2, 1)
    days_left = max(0, (target_date - today).days)
    q = random.choice(QUOTES)

    return {
        "days_to_exam": days_left,
        "streak": streak,
        "target_year": target_year,
        "quote": q["text"],
        "quote_author": q["author"],
    }


@router.get("/carousel")
def carousel_items():
    """Returns a shuffled mix of quotes, idioms and motivation for the hero carousel."""
    items = []
    for q in random.sample(QUOTES, min(6, len(QUOTES))):
        items.append({"type": "quote", "text": q["text"], "sub": q["author"]})
    for i in random.sample(IDIOMS, min(5, len(IDIOMS))):
        items.append({"type": "idiom", "text": i["idiom"], "sub": i["meaning"]})
    random.shuffle(items)
    return items


@router.get("/vocab")
def vocab_batch(count: int = Query(20, ge=5, le=100)):
    """Returns a random batch of GRE-level vocabulary words."""
    picks = random.sample(VOCAB, min(count, len(VOCAB)))
    return [{"word": w, "meaning": m} for w, m in picks]


@router.get("/flashcards")
def flashcards(count: int = Query(4, ge=2, le=20), db: Session = Depends(get_db)):
    """Returns random MCQ flashcards (vocab is handled client-side)."""
    mcqs = db.query(Mcq).join(McqSet).order_by(func.random()).limit(count).all()
    return [
        {
            "id": m.id,
            "question": m.question,
            "correct": m.correct,
            "option_a": m.option_a,
            "option_b": m.option_b,
            "option_c": m.option_c,
            "option_d": m.option_d,
            "subject": m.mcq_set.subject,
        }
        for m in mcqs
    ]


@router.get("/mcqs/latest")
def latest_mcqs(
    subject: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=5, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Mcq).join(McqSet)
    if subject:
        q = q.filter(McqSet.subject == subject)
    total = q.count()
    pages = max(1, -(-total // per_page))  # ceiling division
    items = q.order_by(Mcq.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": m.id,
                "question": m.question,
                "subject": m.mcq_set.subject,
                "correct": m.correct,
                "option_a": m.option_a,
                "option_b": m.option_b,
                "option_c": m.option_c,
                "option_d": m.option_d,
            }
            for m in items
        ],
        "total": total,
        "page": page,
        "pages": pages,
        "per_page": per_page,
    }


@router.get("/motivational-quote")
def motivational_quote():
    q = random.choice(QUOTES)
    return {"quote": q["text"], "author": q["author"]}
