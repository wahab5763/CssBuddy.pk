from typing import Optional
from pydantic import BaseModel


class McqOut(BaseModel):
    id: int
    set_id: int
    question: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct: str

    model_config = {"from_attributes": True}


class McqSetOut(BaseModel):
    id: int
    subject: str
    mcq_count: int = 0

    model_config = {"from_attributes": True}


class QuizAnswer(BaseModel):
    mcq_id: int
    selected: str


class QuizSubmitRequest(BaseModel):
    answers: list[QuizAnswer]


class QuizResult(BaseModel):
    mcq_id: int
    question: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    selected: str
    correct: str
    is_correct: bool


class QuizSubmitResponse(BaseModel):
    total: int
    correct: int
    score_pct: float
    results: list[QuizResult]
