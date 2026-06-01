import random
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.mcq import Mcq, McqSet
from app.schemas.mcq import QuizAnswer, QuizResult, QuizSubmitResponse


def get_subjects_with_counts(db: Session) -> list[dict]:
    rows = (
        db.query(McqSet.subject, func.count(Mcq.id).label("count"))
        .join(Mcq, Mcq.set_id == McqSet.id)
        .group_by(McqSet.subject)
        .all()
    )
    return [{"subject": r.subject, "count": r.count} for r in rows]


def get_mcqs_paginated(
    db: Session, subject: Optional[str], page: int, per_page: int, search: Optional[str]
) -> tuple[list[Mcq], int]:
    q = db.query(Mcq).join(McqSet)
    if subject:
        q = q.filter(McqSet.subject == subject)
    if search:
        q = q.filter(Mcq.question.ilike(f"%{search}%"))
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def get_quiz_questions(db: Session, subject: str, count: int, mode: str) -> list[Mcq]:
    q = db.query(Mcq).join(McqSet).filter(McqSet.subject == subject)
    if mode == "random":
        q = q.order_by(func.random())
    items = q.limit(count).all()
    return items


def evaluate_quiz(mcqs: list[Mcq], answers: list[QuizAnswer]) -> QuizSubmitResponse:
    answer_map = {a.mcq_id: a.selected.upper() for a in answers}
    results = []
    correct_count = 0
    for mcq in mcqs:
        selected = answer_map.get(mcq.id, "")
        is_correct = selected == mcq.correct.upper()
        if is_correct:
            correct_count += 1
        results.append(
            QuizResult(
                mcq_id=mcq.id,
                question=mcq.question,
                option_a=mcq.option_a,
                option_b=mcq.option_b,
                option_c=mcq.option_c,
                option_d=mcq.option_d,
                selected=selected,
                correct=mcq.correct,
                is_correct=is_correct,
            )
        )
    total = len(mcqs)
    return QuizSubmitResponse(
        total=total,
        correct=correct_count,
        score_pct=round(correct_count / total * 100, 1) if total else 0,
        results=results,
    )
