"""
AskAI Flask View (Proxy Layer with Validation, Logging & Latency Tracking)
This endpoint acts as a secure proxy between the Superset frontend
and the downstream AskAI service.
It performs request validation, forwards payloads to an external AI
service, and ensures consistent error handling and observability.
Features:
- Accepts chat requests with optional file uploads
- Validates inputs (question, file type, size, count)
- Enforces security constraints for uploaded files
- Forwards request to configured AskAI backend service
- Supports optional HTTP Basic Authentication
- Tracks request latency (end-to-end proxy duration)
- Provides structured logging for success and failure cases
- Handles upstream timeouts and network failures gracefully
- Ensures consistent JSON responses for frontend rendering
Observability:
- Logs request lifecycle with request_id (X-Request-ID header)
- Logs validation failures with reason codes
- Logs upstream errors, timeouts, and response parsing issues
- Logs total response latency in milliseconds
Route:
POST /askai/chat/
"""
import time
import requests
import traceback
from requests.auth import HTTPBasicAuth
from flask import jsonify, request, current_app
from flask_appbuilder import BaseView, expose
from flask_login import login_required
class AskAIView(BaseView):
    route_base = "/askai"
    def validate_request(self, question, files):
        MAX_FILES = 5
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        ALLOWED_TYPES = {"image/png", "image/jpeg", "application/pdf"}
        if not question:
            return {
                "ok": False,
                "status": 400,
                "response": {
                    "type": "error",
                    "error": {
                        "code": "INVALID_REQUEST",
                        "message": "Question is required"
                    }
                }
            }
        if len(files) > MAX_FILES:
            return {
                "ok": False,
                "status": 400,
                "response": {
                    "type": "error",
                    "error": {
                        "code": "FILE_LIMIT_EXCEEDED",
                        "message": f"Maximum {MAX_FILES} files allowed"
                    }
                }
            }
        for f in files:
            if not f or not f.filename:
                return {
                    "ok": False,
                    "status": 400,
                    "response": {
                        "type": "error",
                        "error": {
                            "code": "INVALID_FILE",
                            "message": "Invalid file detected"
                        }
                    }
                }
            if f.content_type not in ALLOWED_TYPES:
                return {
                    "ok": False,
                    "status": 400,
                    "response": {
                        "type": "error",
                        "error": {
                            "code": "UNSUPPORTED_FILE_TYPE",
                            "message": f"Unsupported file type: {f.filename}"
                        }
                    }
                }
            f.stream.seek(0, 2)
            size = f.stream.tell()
            f.stream.seek(0)
            if size > MAX_FILE_SIZE:
                return {
                    "ok": False,
                    "status": 400,
                    "response": {
                        "type": "error",
                        "error": {
                            "code": "FILE_TOO_LARGE",
                            "message": f"{f.filename} exceeds 5MB limit"
                        }
                    }
                }
        return {"ok": True}
    @expose("/chat/", methods=["POST"])
    @login_required
    def chat(self):
        log = current_app.logger
        creds = current_app.config.get("ASK_AI_CREDS", {})
        proxy_url = creds.get("url", "http://127.0.0.1:5000/askai")
        timeout = creds.get("timeout", 30)
        username = creds.get("username")
        password = creds.get("password")
        auth = HTTPBasicAuth(username, password) if username and password else None
        request_id = request.headers.get("X-Request-ID", "unknown")
        try:
            question = request.form.get("question", "").strip()
            files = request.files.getlist("files")
            log.info(f"[ASKAI] request received id={request_id}")
            validation = self.validate_request(question, files)
            if not validation["ok"]:
                log.warning(f"[ASKAI] validation failed id={request_id}")
                return jsonify(validation["response"]), validation["status"]
            data = {"question": question}
            files_payload = [
                ("files", (f.filename, f.stream, f.content_type))
                for f in files
            ]
            start_time = time.time()
            log.info(f"[ASKAI] forwarding request id={request_id} → {proxy_url}")
            response = requests.post(
                proxy_url,
                data=data,
                files=files_payload,
                timeout=timeout,
                auth=auth
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            try:
                backend_response = response.json()
            except Exception:
                log.error(f"[ASKAI] invalid JSON id={request_id}")
                backend_response = {
                    "type": "error",
                    "error": {
                        "code": "INVALID_BACKEND_RESPONSE",
                        "message": "Backend did not return valid JSON"
                    }
                }
            log.info(
                f"[ASKAI] response success id={request_id} "
                f"status={response.status_code} "
                f"latency_ms={duration_ms}"
            )
            return jsonify(backend_response), response.status_code
        except requests.exceptions.Timeout:
            duration_ms = round((time.time() - start_time) * 1000, 2) if 'start_time' in locals() else -1
            log.error(
                f"[ASKAI] TIMEOUT id={request_id} latency_ms={duration_ms}"
            )
            return jsonify({
                "type": "error",
                "error": {
                    "code": "TIMEOUT",
                    "message": "AskAI service timed out. Please try again."
                }
            }), 504
        except requests.exceptions.RequestException as e:
            duration_ms = round((time.time() - start_time) * 1000, 2) if 'start_time' in locals() else -1
            log.error(
                f"[ASKAI] UPSTREAM_ERROR id={request_id} "
                f"latency_ms={duration_ms} error={str(e)}"
            )
            return jsonify({
                "type": "error",
                "error": {
                    "code": "UPSTREAM_ERROR",
                    "message": "Failed to reach AskAI service"
                }
            }), 502
        except Exception:
            duration_ms = round((time.time() - start_time) * 1000, 2) if 'start_time' in locals() else -1
            log.exception(
                f"[ASKAI] INTERNAL_ERROR id={request_id} latency_ms={duration_ms}"
            )
            return jsonify({
                "type": "error",
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Something went wrong. Please try again later."
                }
            }), 500