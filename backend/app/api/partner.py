"""
Study Partner API
─────────────────
Discovery is sorted by shared optional subjects so aspirants with common
subjects appear at the top.  Groups are virtual — a "group" is simply the
set of users who chose a particular optional.
Real-time 1-on-1 messaging is handled via WebSocket at /messages/{conn_id}/ws.
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import SessionLocal, get_db
from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.models.partner import PartnerConnection, PartnerMessage, PartnerPreference
from app.models.user import OptionalSubject, User, user_optionals
from app.schemas.common import Msg
from app.schemas.partner import ConnectRequest, PartnerPrefUpsert, SendMessageRequest

router = APIRouter(prefix="/partner", tags=["partner"])


# ── Real-time conversation manager ─────────────────────────────────────────────

class ConversationManager:
    """Manages WebSocket connections for 1-on-1 chats, keyed by connection_id."""

    def __init__(self) -> None:
        self.rooms: dict[int, list[WebSocket]] = {}

    async def connect(self, conn_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(conn_id, []).append(ws)

    def disconnect(self, conn_id: int, ws: WebSocket) -> None:
        room = self.rooms.get(conn_id, [])
        if ws in room:
            room.remove(ws)

    async def send_all(self, conn_id: int, payload: dict) -> None:
        """Broadcast to both sides of the conversation."""
        dead: list[WebSocket] = []
        for ws in list(self.rooms.get(conn_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(conn_id, ws)

    async def send_others(self, conn_id: int, payload: dict, exclude: WebSocket) -> None:
        """Broadcast only to the other participant (for typing indicator)."""
        for ws in list(self.rooms.get(conn_id, [])):
            if ws is not exclude:
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(conn_id, ws)


conv_manager = ConversationManager()


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

def _msg_dict(m: PartnerMessage) -> dict:
    return {
        "id": m.id,
        "connection_id": m.connection_id,
        "sender_id": m.sender_id,
        "sender_name": m.sender.name if m.sender else "Deleted User",
        "content": m.content,
        "is_read": m.is_read,
        "sent_at": m.sent_at.isoformat(),
    }


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
    return [_msg_dict(m) for m in msgs]


@router.post("/messages/{conn_id}", status_code=201)
async def send_message(
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
    db.refresh(msg)
    out = _msg_dict(msg)
    # Broadcast to any WebSocket clients in this conversation
    await conv_manager.send_all(conn_id, {"type": "message", **out})
    return out


@router.patch("/messages/{conn_id}/read", response_model=Msg)
def mark_read(conn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(PartnerMessage).filter(
        PartnerMessage.connection_id == conn_id,
        PartnerMessage.sender_id != user.id,
        PartnerMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return Msg(detail="Marked as read")


# ── WebSocket — real-time 1-on-1 chat ─────────────────────────────────────────

@router.websocket("/messages/{conn_id}/ws")
async def chat_ws(conn_id: int, websocket: WebSocket, token: Optional[str] = None):
    # Authenticate via query-param token (browsers can't set WS headers)
    if not token:
        await websocket.close(code=4001)
        return
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload["sub"])

    db_check = SessionLocal()
    try:
        conn = db_check.get(PartnerConnection, conn_id)
        if not conn or conn.status != "accepted":
            await websocket.close(code=4003)
            return
        if conn.requester_id != user_id and conn.receiver_id != user_id:
            await websocket.close(code=4003)
            return
        user_obj = db_check.get(User, user_id)
        user_name = user_obj.name if user_obj else "User"
    finally:
        db_check.close()

    await conv_manager.connect(conn_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "typing":
                # Send typing indicator only to the OTHER participant
                await conv_manager.send_others(conn_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "user_name": user_name,
                }, exclude=websocket)
            else:
                content = str(data.get("content", "")).strip()
                if not content:
                    continue
                # Persist in a fresh session
                db2 = SessionLocal()
                try:
                    msg = PartnerMessage(connection_id=conn_id, sender_id=user_id, content=content)
                    db2.add(msg)
                    db2.commit()
                    db2.refresh(msg)
                    out = {
                        "id": msg.id,
                        "connection_id": conn_id,
                        "sender_id": user_id,
                        "sender_name": user_name,
                        "content": msg.content,
                        "is_read": False,
                        "sent_at": msg.sent_at.isoformat(),
                    }
                finally:
                    db2.close()
                # Echo to both sides so sender sees confirmation too
                await conv_manager.send_all(conn_id, {"type": "message", **out})

    except WebSocketDisconnect:
        conv_manager.disconnect(conn_id, websocket)
    except Exception:
        conv_manager.disconnect(conn_id, websocket)
