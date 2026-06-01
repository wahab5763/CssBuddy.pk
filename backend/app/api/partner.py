"""
Study Partner API
─────────────────
Discovery is sorted by shared optional subjects so aspirants with common
subjects appear at the top.  Groups are virtual — a "group" is simply the
set of users who chose a particular optional.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.partner import PartnerConnection, PartnerMessage, PartnerPreference
from app.models.user import OptionalSubject, User, user_optionals
from app.schemas.common import Msg
from app.schemas.partner import ConnectRequest, PartnerPrefUpsert, SendMessageRequest

router = APIRouter(prefix="/partner", tags=["partner"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_dict(u: User, shared: list[str] | None = None) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "city": u.profile.city if u.profile else None,
        "prep_level": u.profile.prep_level if u.profile else None,
        "exam_type": u.profile.exam_type if u.profile else None,
        "exam_year": u.profile.exam_year if u.profile else None,
        "optional_subjects": [o.name for o in u.optional_subjects],
        "shared_subjects": shared or [],
        "shared_count": len(shared) if shared else 0,
    }


def _load_user(db: Session, user_id: int) -> User:
    return (
        db.query(User)
        .options(joinedload(User.optional_subjects), joinedload(User.profile))
        .filter(User.id == user_id)
        .one()
    )


# ── Preferences ────────────────────────────────────────────────────────────────

@router.get("/preferences")
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.get(PartnerPreference, user.id)
    if not pref:
        return {"user_id": user.id, "study_mode": None, "availability": None, "subjects": []}
    return {
        "user_id": pref.user_id,
        "study_mode": pref.study_mode,
        "availability": pref.availability,
        "subjects": json.loads(pref.subjects_json or "[]"),
    }


@router.put("/preferences", response_model=Msg)
def upsert_preferences(
    data: PartnerPrefUpsert,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.get(PartnerPreference, user.id)
    if not pref:
        pref = PartnerPreference(user_id=user.id)
        db.add(pref)
    pref.study_mode = data.study_mode
    pref.availability = data.availability
    pref.subjects_json = json.dumps(data.subjects)
    db.commit()
    return Msg(detail="Preferences saved")


# ── Discovery (sorted by shared subjects) ─────────────────────────────────────

@router.get("/discover")
def discover(
    optional_subject: str | None = Query(None, description="Filter by a specific optional subject"),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=4, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns users sorted by number of shared optional subjects with the
    logged-in user.  Pass optional_subject to filter to a subject group.
    """
    me = _load_user(db, user.id)
    my_subjects: set[str] = {o.name for o in me.optional_subjects}

    # IDs of users already connected or with pending requests (exclude them)
    connected_ids: set[int] = {
        row[0]
        for row in db.query(
            PartnerConnection.receiver_id if True else PartnerConnection.requester_id
        )
        .filter(
            (PartnerConnection.requester_id == user.id) | (PartnerConnection.receiver_id == user.id)
        )
        .all()
    }
    # Simpler: get all user ids involved in any connection with me
    conn_rows = db.query(PartnerConnection).filter(
        (PartnerConnection.requester_id == user.id) | (PartnerConnection.receiver_id == user.id)
    ).all()
    excluded_ids: set[int] = set()
    for c in conn_rows:
        excluded_ids.add(c.requester_id)
        excluded_ids.add(c.receiver_id)
    excluded_ids.add(user.id)

    q = (
        db.query(User)
        .options(joinedload(User.optional_subjects), joinedload(User.profile))
        .filter(User.is_active == True, User.id.notin_(excluded_ids))
    )

    if optional_subject:
        q = q.join(User.optional_subjects).filter(OptionalSubject.name == optional_subject)

    all_users = q.all()

    # Score and sort by shared subjects
    scored = []
    for u in all_users:
        their_subjects = {o.name for o in u.optional_subjects}
        shared = sorted(my_subjects & their_subjects)
        scored.append((u, shared))

    scored.sort(key=lambda x: len(x[1]), reverse=True)

    total = len(scored)
    page_slice = scored[(page - 1) * per_page : page * per_page]

    return {
        "items": [_user_dict(u, shared) for u, shared in page_slice],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


# ── Subject Groups ─────────────────────────────────────────────────────────────

@router.get("/groups")
def subject_groups(db: Session = Depends(get_db)):
    """
    Returns all optional subjects that have at least 1 member, with member count.
    This powers the "Groups" tab where users can browse by shared optional.
    """
    rows = (
        db.query(OptionalSubject.name, func.count(user_optionals.c.user_id).label("member_count"))
        .join(user_optionals, user_optionals.c.subject_id == OptionalSubject.id)
        .group_by(OptionalSubject.name)
        .order_by(func.count(user_optionals.c.user_id).desc())
        .all()
    )
    return [{"subject": r.name, "member_count": r.member_count} for r in rows]


@router.get("/groups/{subject_name}/members")
def group_members(
    subject_name: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=4, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Members of a specific optional-subject group, excluding the current user."""
    me = _load_user(db, user.id)
    my_subjects = {o.name for o in me.optional_subjects}

    users = (
        db.query(User)
        .options(joinedload(User.optional_subjects), joinedload(User.profile))
        .join(User.optional_subjects)
        .filter(OptionalSubject.name == subject_name, User.id != user.id, User.is_active == True)
        .all()
    )
    total = len(users)
    page_slice = users[(page - 1) * per_page : page * per_page]

    return {
        "subject": subject_name,
        "items": [_user_dict(u, sorted(my_subjects & {o.name for o in u.optional_subjects})) for u in page_slice],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── Connections ────────────────────────────────────────────────────────────────

@router.post("/connect/{receiver_id}", status_code=201)
def send_request(
    receiver_id: int,
    body: ConnectRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if receiver_id == user.id:
        raise HTTPException(400, "Cannot connect to yourself")
    existing = db.query(PartnerConnection).filter(
        ((PartnerConnection.requester_id == user.id) & (PartnerConnection.receiver_id == receiver_id)) |
        ((PartnerConnection.requester_id == receiver_id) & (PartnerConnection.receiver_id == user.id))
    ).first()
    if existing:
        raise HTTPException(400, f"Connection already exists (status: {existing.status})")
    conn = PartnerConnection(requester_id=user.id, receiver_id=receiver_id, icebreaker=body.icebreaker)
    db.add(conn)
    db.commit()
    return {"detail": "Request sent", "id": conn.id}


@router.post("/connect/{conn_id}/accept", response_model=Msg)
def accept_request(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.get(PartnerConnection, conn_id)
    if not conn or conn.receiver_id != user.id:
        raise HTTPException(404, "Request not found")
    if conn.status != "pending":
        raise HTTPException(400, f"Request is already {conn.status}")
    conn.status = "accepted"
    db.commit()
    return Msg(detail="Connection accepted")


@router.post("/connect/{conn_id}/reject", response_model=Msg)
def reject_request(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.get(PartnerConnection, conn_id)
    if not conn or conn.receiver_id != user.id:
        raise HTTPException(404, "Request not found")
    conn.status = "rejected"
    db.commit()
    return Msg(detail="Request rejected")


@router.delete("/connect/{conn_id}", response_model=Msg)
def cancel_request(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.get(PartnerConnection, conn_id)
    if not conn or conn.requester_id != user.id:
        raise HTTPException(404, "Request not found")
    db.delete(conn)
    db.commit()
    return Msg(detail="Request cancelled")


@router.get("/connections")
def connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conns = (
        db.query(PartnerConnection)
        .filter(
            ((PartnerConnection.requester_id == user.id) | (PartnerConnection.receiver_id == user.id)),
            PartnerConnection.status == "accepted",
        )
        .all()
    )
    me = _load_user(db, user.id)
    my_subjects = {o.name for o in me.optional_subjects}
    result = []
    for c in conns:
        partner_id = c.receiver_id if c.requester_id == user.id else c.requester_id
        partner = _load_user(db, partner_id)
        shared = sorted(my_subjects & {o.name for o in partner.optional_subjects})
        result.append({
            "id": c.id,
            "status": c.status,
            "partner": _user_dict(partner, shared),
            "created_at": c.created_at.isoformat(),
        })
    return result


@router.get("/requests/incoming")
def incoming_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reqs = (
        db.query(PartnerConnection)
        .filter(PartnerConnection.receiver_id == user.id, PartnerConnection.status == "pending")
        .all()
    )
    me = _load_user(db, user.id)
    my_subjects = {o.name for o in me.optional_subjects}
    result = []
    for r in reqs:
        requester = _load_user(db, r.requester_id)
        shared = sorted(my_subjects & {o.name for o in requester.optional_subjects})
        result.append({
            "id": r.id,
            "icebreaker": r.icebreaker,
            "requester": _user_dict(requester, shared),
            "created_at": r.created_at.isoformat(),
        })
    return result


@router.get("/requests/sent")
def sent_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reqs = (
        db.query(PartnerConnection)
        .filter(PartnerConnection.requester_id == user.id, PartnerConnection.status == "pending")
        .all()
    )
    result = []
    for r in reqs:
        receiver = _load_user(db, r.receiver_id)
        result.append({
            "id": r.id,
            "icebreaker": r.icebreaker,
            "receiver": _user_dict(receiver),
            "created_at": r.created_at.isoformat(),
        })
    return result


# ── Messages ───────────────────────────────────────────────────────────────────

@router.get("/messages/{conn_id}")
def get_messages(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.get(PartnerConnection, conn_id)
    if not conn or (conn.requester_id != user.id and conn.receiver_id != user.id):
        raise HTTPException(403, "Access denied")
    msgs = (
        db.query(PartnerMessage)
        .filter(PartnerMessage.connection_id == conn_id)
        .order_by(PartnerMessage.sent_at)
        .all()
    )
    return [
        {"id": m.id, "sender_id": m.sender_id, "content": m.content,
         "is_read": m.is_read, "sent_at": m.sent_at.isoformat()}
        for m in msgs
    ]


@router.post("/messages/{conn_id}", status_code=201)
def send_message(
    conn_id: int,
    body: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conn = db.get(PartnerConnection, conn_id)
    if not conn or conn.status != "accepted":
        raise HTTPException(403, "Not an accepted connection")
    if conn.requester_id != user.id and conn.receiver_id != user.id:
        raise HTTPException(403, "Access denied")
    msg = PartnerMessage(connection_id=conn_id, sender_id=user.id, content=body.content)
    db.add(msg)
    db.commit()
    return {"id": msg.id, "content": msg.content, "sent_at": msg.sent_at.isoformat()}


@router.patch("/messages/{conn_id}/read", response_model=Msg)
def mark_read(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(PartnerMessage).filter(
        PartnerMessage.connection_id == conn_id,
        PartnerMessage.sender_id != user.id,
        PartnerMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return Msg(detail="Marked as read")
