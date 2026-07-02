import requests

from flask import current_app
from requests.auth import HTTPBasicAuth

from superset.ai_assistant.dao import AIChatDAO


class AIChatService:

    @staticmethod
    def save_user_message(user_id: int, content: str):
        return AIChatDAO.create_message(
            user_id=user_id,
            role="user",
            message_type="text",
            content=content,
            execution_status="completed",
        )

    @staticmethod
    def save_assistant_message(
        user_id: int,
        content: str,
        message_type: str = "text",
        execution_status: str = "completed",
    ):
        return AIChatDAO.create_message(
            user_id=user_id,
            role="assistant",
            message_type=message_type,
            content=content,
            execution_status=execution_status,
        )

    @staticmethod
    def fetch_ai_response(
        content: str,
        request_id: str | None = None,
        user_info: dict | None = None,
    ):
        """
        Calls external AI service and always returns a
        normalized response structure.
        """

        config = current_app.config.get(
            "AI_ASSISTANT_API_CONFIG",
            {},
        )

        url = config.get(
            "URL",
            "http://localhost:5000/askai",
        )

        timeout = config.get("TIMEOUT", 45)

        username = config.get("USERNAME")
        password = config.get("PASSWORD")

        auth = (
            HTTPBasicAuth(username, password)
            if username and password
            else None
        )

        headers = {}

        if request_id:
            headers["X-Request-ID"] = request_id

        try:

            response = requests.post(
                url,
                data={"question": content},
                headers=headers,
                timeout=timeout,
                verify=False,
                auth=auth,
            )

            response.raise_for_status()

            response_json = response.json()

            return response_json

        except requests.exceptions.Timeout:
            current_app.logger.error(
                f"[AI_ASSISTANT] Timeout | request_id={request_id}"
            )

            return {
                "data": {
                    "message": [
                        {
                            "content": (
                                "⚠️ AI Assistant service timed out. "
                                "Please try again."
                            ),
                            "lang": "en",
                            "type": "text",
                        }
                    ],
                    "question": content,
                },
                "meta": {
                    "code": 504,
                    "description": "Timeout",
                    "status": 0,
                },
            }

        except requests.exceptions.RequestException as ex:
            current_app.logger.error(
                f"[AI_ASSISTANT] Request Error | "
                f"request_id={request_id} | error={str(ex)}"
            )

            return {
                "data": {
                    "message": [
                        {
                            "content": (
                                "⚠️ Failed to reach AI Assistant. "
                                "Please try again later."
                            ),
                            "lang": "en",
                            "type": "text",
                        }
                    ],
                    "question": content,
                },
                "meta": {
                    "code": 502,
                    "description": "Upstream Error",
                    "status": 0,
                },
            }

        except Exception as ex:
            current_app.logger.exception(
                f"[AI_ASSISTANT] Internal Error | "
                f"request_id={request_id}"
            )

            return {
                "data": {
                    "message": [
                        {
                            "content": (
                                "⚠️ Something went wrong. "
                                "Please try again later."
                            ),
                            "lang": "en",
                            "type": "text",
                        }
                    ],
                    "question": content,
                },
                "meta": {
                    "code": 500,
                    "description": str(ex),
                    "status": 0,
                },
            }