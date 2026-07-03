from superset import db
from superset.ai_assistant.models import AIChatMessage
from datetime import datetime, timedelta


class AIChatDAO:
    @staticmethod
    def create_message(
        user_id: int,
        role: str,
        message_type: str,
        content: str,
        execution_status: str | None = None,
        request_id: str | None = None
    ) -> AIChatMessage:

        message = AIChatMessage(
            user_id=user_id,
            role=role,
            message_type=message_type,
            content=content,
            execution_status=execution_status or "completed",
            request_id=request_id
        )

        db.session.add(message)
        db.session.commit()

        return message

    @staticmethod
    def get_user_messages(user_id: int):
        return (
            db.session.query(AIChatMessage)
            .filter(AIChatMessage.user_id == user_id)
            .order_by(AIChatMessage.created_at.asc(), AIChatMessage.id.asc())
            .all()
        )

    @staticmethod
    def cleanup_old_messages(user_id: int, days_threshold: int = 7):
        """Automatically deletes chat messages older than the specified threshold days."""
        try:
            # Calculate the cutoff timestamp
            cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
            
            # Delete records older than the cutoff
            db.session.query(AIChatMessage).filter(
                AIChatMessage.user_id == user_id,
                AIChatMessage.created_at < cutoff_date
            ).delete()
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[AI DATABASE ERROR] Failed to clean history: {str(e)}")