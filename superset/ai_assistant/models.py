from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from superset.extensions import db


class AIChatMessage(db.Model):
    __tablename__ = "ai_chat_messages"

    # ✅ FIX: Use Integer (not BigInteger)
    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    # ✅ Keep simple (no FK)
    user_id = Column(Integer, nullable=False)

    role = Column(
        String(20),
        nullable=False,
    )

    message_type = Column(
        String(20),
        nullable=False,
    )

    content = Column(
        Text,              # ✅ good for large AI responses
        nullable=False,
    )

    execution_status = Column(
        String(20),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )