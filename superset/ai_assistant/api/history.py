from flask import request, current_app
from flask_appbuilder.security.decorators import protect
from flask_appbuilder.api import expose
from datetime import datetime
import time
import json

from superset.views.base_api import BaseSupersetApi
from superset.ai_assistant.dao import AIChatDAO
from superset.ai_assistant.service import AIChatService

# 🎯 SINGLE CONTROL POINT FOR PERSISTENCE CONFIGURATION
def is_persistence_enabled() -> bool:
    """
    Centralized check for chat history persistence config flag.
    Change the second parameter (False) to True if you want it enabled by default.
    """
    return current_app.config.get("ENABLE_AI_CHAT_PERSISTENCE", True)


class AIChatHistoryRestApi(BaseSupersetApi):
    resource_name = "ai/chat"
    class_permission_name = "Api"
    method_permission_name = {
        "history": "access",
        "send": "access",
    }

    # GET /api/v1/ai/chat/history
    @expose("/history", methods=("GET",))
    # @protect()
    def history(self):
        from flask_login import current_user
        user_id = current_user.id

        if not user_id:
            return self.response(401, message="Unauthorized")

        # Clean read using our central control point
        if not is_persistence_enabled():
            return self.response(200, result=[])

        AIChatDAO.cleanup_old_messages(user_id, days_threshold=1)

        messages = AIChatDAO.get_user_messages(user_id)

        return self.response(
            200,
            result=[
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "message_type": m.message_type,
                    "execution_status": m.execution_status,
                    "created_at": m.created_at.isoformat(),
                }
                for m in messages
            ],
        )

    # POST /api/v1/ai/chat/send
    @expose("/send", methods=("POST",))
    # @protect()
    def send(self):
        from flask_login import current_user
        user_id = current_user.id

        if not user_id:
            return self.response(401, message="Unauthorized")

        body = request.json or {}
        content = body.get("content")

        if not content:
            return self.response(400, message="content is required")

        # Clean write condition using our central control point
        if is_persistence_enabled():
            AIChatService.save_user_message(user_id, content)

        # Call external API
        external_json = AIChatService.fetch_ai_response(content)

        if not external_json:
            return self.response(
                500,
                result={
                    "id": int(time.time() * 1000),
                    "role": "assistant",
                    "content": "⚠️ Failed to fetch AI response.",
                    "message_type": "error",
                    "execution_status": "failed",
                    "created_at": datetime.utcnow().isoformat(),
                },
            )

        ai_content = json.dumps(external_json)
        msg_id = int(time.time() * 1000)

        # Clean write condition using our central control point
        if is_persistence_enabled():
            ai_message = AIChatService.save_assistant_message(
                user_id,
                content=str(ai_content),
            )
            msg_id = ai_message.id 

        return self.response(
            200,
            result={
                "id": msg_id,
                "role": "assistant",
                "content": ai_content,
                "message_type": "text",
                "execution_status": "completed",
                "created_at": datetime.utcnow().isoformat(),
            },
        )