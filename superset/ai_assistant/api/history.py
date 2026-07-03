from flask import request, current_app
from flask_appbuilder.security.decorators import protect
from flask_appbuilder.api import expose
from datetime import datetime
import time
import json

from flask_login import login_required

from superset.views.base_api import BaseSupersetApi
from superset.ai_assistant.dao import AIChatDAO
from superset.ai_assistant.service import AIChatService

# 🎯 SINGLE CONTROL POINT FOR PERSISTENCE CONFIGURATION
def is_persistence_enabled() -> bool:
    """
    Centralized check for chat history persistence config flag.
    Change the second parameter (False) to True if you want it enabled by default.
    """
    return current_app.config.get("ENABLE_AI_CHAT_PERSISTENCE", False)


class AIChatHistoryRestApi(BaseSupersetApi):
    resource_name = "ai/chat"
    class_permission_name = "Api"
    method_permission_name = {
        "history": "access",
        "send": "access",
    }

    # GET /api/v1/ai/chat/history
    @expose("/history", methods=("GET",))
    @login_required
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
    @login_required
    # @protect()
    def send(self):
        from flask_login import current_user
        user_id = current_user.id

        if not user_id:
            return self.response(401, message="Unauthorized")

        body = request.json or {}
        content = body.get("content")
        request_id = body.get("request_id")
        user_info = body.get("user", {})

        if not content:
            return self.response(400, message="content is required")

        # 1. Always save the user's input
        if is_persistence_enabled():
            AIChatService.save_user_message(user_id, content)

        # 2. Global Fail-Safe Wrapper
        try:
            # Call external API
            external_json = AIChatService.fetch_ai_response(content, request_id=request_id, user_info=user_info)

            ai_content = json.dumps(external_json)
            msg_id = int(time.time() * 1000)

            meta = external_json.get("meta", {})
            success = meta.get("status") == 1
            message_type = "text" if success else "error"
            execution_status = (
                "completed"
                if success
                else "failed"
            )

            if is_persistence_enabled():
                ai_message = AIChatService.save_assistant_message(
                    user_id,
                    content=ai_content,
                    message_type= message_type,
                    execution_status= execution_status
                )
                msg_id = ai_message.id

            return self.response(
                200,
                result={
                    "id": msg_id,
                    "role": "assistant",
                    "content": ai_content,
                    "message_type": message_type,
                    "execution_status": execution_status,
                    "created_at": datetime.utcnow().isoformat(),
                },
            )

        except Exception as e:
            # This block catches EVERYTHING (Parsing errors, DB errors, API timeouts)
            print(f"[AI CRITICAL ERROR] {str(e)}")
            
            error_msg = "⚠️ Internal AI service error. Please try again."
            msg_id = int(time.time() * 1000)

            if is_persistence_enabled():
                saved_err = AIChatService.save_assistant_message(
                    user_id,
                    content=error_msg,
                    message_type="error",
                    execution_status="failed"
                )
                msg_id = saved_err.id

            # Return 200 so the UI displays the error instead of a broken request
            return self.response(
                200,
                result={
                    "id": msg_id,
                    "role": "assistant",
                    "content": error_msg,
                    "message_type": "error",
                    "execution_status": "failed",
                    "created_at": datetime.utcnow().isoformat(),
                },
            )