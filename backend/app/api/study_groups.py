from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.deps import get_admin_user, get_current_user
from app.core.security import decode_access_token
from app.models.study_group import GroupMember, GroupMessage, StudyGroup
from app.models.user import User

router = APIRouter(prefix="/groups", tags=["study_groups"])


# ── WebSocket connection manager ──────────────────────────────────────────────

class GroupManager:
    def __init__(self) -> None:
        self.rooms: dict[int, list[WebSocket]] = {}

    async def connect(self, group_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(group_id, []).append(ws)

    def disconnect(self, group_id: int, ws: WebSocket) -> None:
        room = self.rooms.get(group_id, [])
        if ws in room:
            room.remove(ws)

    async def broadcast(self, group_id: int, payload: dict) -> None:
        room = self.rooms.get(group_id, [])
        dead: list[WebSocket] = []
        for ws in list(room):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(group_id, ws)


manager = GroupManager()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _msg_out(msg: GroupMessage) -> dict:
    sender_name = msg.sender.name if msg.sender else "Deleted User"
    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "sender_id": msg.sender_id,
        "sender_name": sender_name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
    }


def _is_member(db: Session, group_id: int, user_id: int) -> bool:
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first() is not None


def _save_message(group_id: int, sender_id: int, content: str) -> dict:
    """Open a fresh DB session, save a message, return _msg_out dict, close session."""
    db2 = SessionLocal()
    try:
        msg = GroupMessage(group_id=group_id, sender_id=sender_id, content=content)
        db2.add(msg)
        db2.commit()
        db2.refresh(msg)
        # eager-load sender before closing
        _ = msg.sender.name if msg.sender else None
        return _msg_out(msg)
    finally:
        db2.close()


# ── Group membership sync (called from auth.py after optionals update) ────────

def sync_group_memberships(db: Session, user: User) -> None:
    """
    Ensure the user is a member of exactly the study groups that match their
    current optional subjects. Creates StudyGroup rows as needed.
    """
    subject_names: list[str] = [opt.name for opt in user.optional_subjects]

    # Ensure a StudyGroup row exists for every subject
    for name in subject_names:
        group = db.query(StudyGroup).filter(StudyGroup.subject_name == name).first()
        if not group:
            group = StudyGroup(
                subject_name=name,
                display_name=f"{name} — Study Group",
            )
            db.add(group)
    db.flush()

    # Collect the group ids that correspond to user's subjects
    wanted_groups = (
        db.query(StudyGroup)
        .filter(StudyGroup.subject_name.in_(subject_names))
        .all()
    )
    wanted_ids = {g.id for g in wanted_groups}

    # Remove memberships the user no longer needs
    existing_memberships = (
        db.query(GroupMember)
        .filter(GroupMember.user_id == user.id)
        .all()
    )
    for m in existing_memberships:
        if m.group_id not in wanted_ids:
            db.delete(m)

    # Add missing memberships
    existing_group_ids = {m.group_id for m in existing_memberships}
    for group_id in wanted_ids:
        if group_id not in existing_group_ids:
            db.add(GroupMember(group_id=group_id, user_id=user.id))

    db.commit()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    content: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/my")
def my_groups(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all groups the current user belongs to, sorted by last activity."""
    memberships = (
        db.query(GroupMember)
        .filter(GroupMember.user_id == user.id)
        .all()
    )
    group_ids = [m.group_id for m in memberships]
    groups = (
        db.query(StudyGroup)
        .filter(StudyGroup.id.in_(group_ids))
        .all()
    )

    result = []
    for g in groups:
        member_count = (
            db.query(func.count(GroupMember.id))
            .filter(GroupMember.group_id == g.id)
            .scalar()
        )
        last_msg_obj = (
            db.query(GroupMessage)
            .filter(GroupMessage.group_id == g.id)
            .order_by(desc(GroupMessage.created_at))
            .first()
        )
        last_message = _msg_out(last_msg_obj) if last_msg_obj else None
        result.append({
            "id": g.id,
            "subject_name": g.subject_name,
            "display_name": g.display_name,
            "member_count": member_count,
            "last_message": last_message,
        })

    # Sort by last message time descending (groups with no messages last)
    result.sort(
        key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "",
        reverse=True,
    )
    return result


@router.get("/{group_id}/messages")
def get_messages(
    group_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_member(db, group_id, user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    cutoff = datetime.utcnow() - timedelta(days=7)
    messages = (
        db.query(GroupMessage)
        .filter(
            GroupMessage.group_id == group_id,
            GroupMessage.created_at >= cutoff,
        )
        .order_by(GroupMessage.created_at)
        .limit(200)
        .all()
    )
    return [_msg_out(m) for m in messages]


@router.get("/{group_id}/members")
def get_members(
    group_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_member(db, group_id, user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    memberships = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id)
        .all()
    )
    result = []
    for m in memberships:
        u = m.user
        result.append({
            "id": u.id,
            "name": u.name,
            "city": u.profile.city if u.profile else None,
            "prep_level": u.profile.prep_level if u.profile else None,
            "exam_year": u.profile.exam_year if u.profile else None,
        })
    return result


@router.post("/{group_id}/messages")
async def send_message(
    group_id: int,
    body: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_member(db, group_id, user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    msg_dict = _save_message(group_id, user.id, content)
    await manager.broadcast(group_id, {"type": "message", **msg_dict})
    return msg_dict


@router.delete("/admin/purge")
def purge_old_messages(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=7)
    deleted = (
        db.query(GroupMessage)
        .filter(GroupMessage.created_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted": deleted}


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/{group_id}/ws")
async def group_ws(
    group_id: int,
    websocket: WebSocket,
    token: Optional[str] = None,
):
    # Authenticate via query param token
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload["sub"])
    user_name = payload.get("email", "Unknown")

    # Check membership using a short-lived session
    db_check = SessionLocal()
    try:
        user_obj = db_check.get(User, user_id)
        if not user_obj or not user_obj.is_active:
            await websocket.close(code=4001)
            return
        user_name = user_obj.name
        if not _is_member(db_check, group_id, user_id):
            await websocket.close(code=4003)
            return
    finally:
        db_check.close()

    await manager.connect(group_id, websocket)

    # Notify presence join
    await manager.broadcast(group_id, {
        "type": "presence",
        "event": "join",
        "user_id": user_id,
        "user_name": user_name,
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "typing":
                # Broadcast typing indicator to others (don't save)
                await manager.broadcast(group_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "user_name": user_name,
                })
            else:
                # Default: treat as a chat message
                content = str(data.get("content", "")).strip()
                if not content:
                    continue
                # Save in a fresh session to avoid long-lived connection issues
                msg_dict = _save_message(group_id, user_id, content)
                await manager.broadcast(group_id, {"type": "message", **msg_dict})

    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
        await manager.broadcast(group_id, {
            "type": "presence",
            "event": "leave",
            "user_id": user_id,
            "user_name": user_name,
        })
    except Exception:
        manager.disconnect(group_id, websocket)


# ── Background cleanup task (called from lifespan) ────────────────────────────

async def _periodic_purge() -> None:
    """Delete messages older than 7 days, running every hour."""
    while True:
        await asyncio.sleep(3600)
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(days=7)
            db.query(GroupMessage).filter(GroupMessage.created_at < cutoff).delete(
                synchronize_session=False
            )
            db.commit()
        except Exception:
            pass
        finally:
            db.close()
