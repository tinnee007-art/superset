import requests

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
    def save_assistant_message(user_id: int, content: str):
        return AIChatDAO.create_message(
            user_id=user_id,
            role="assistant",
            message_type="text",
            content=content,
            execution_status="completed",
        )

    # ✅ ✅ ✅ FINAL: CALL EXTERNAL API DIRECTLY (NO INTERNAL HTTP CALL)
    @staticmethod
    def fetch_ai_response(content: str):
        try:
            response = requests.post(
                "http://localhost:5000/askai",   # ✅ your external Flask API
                data={"question": content},
                timeout=45,                     # ✅ handle delay
            )

            response.raise_for_status()

            return response.json()

        except requests.exceptions.Timeout:
            print("[AI ERROR] Request timed out")
            return None

        except requests.exceptions.RequestException as e:
            print("[AI ERROR] Request failed:", str(e))
            return None

        except Exception as e:
            print("[AI ERROR] Unexpected error:", str(e))
            return None