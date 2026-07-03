API Endpoint Specification
URL: /askai

Method: POST

Content-Type: multipart/form-data

=======================================

Curl:
curl -X POST http://localhost:5000/askai \
  -F "question=Give me a small sql example"

=======================================

Case: I

{
  "meta": {
    "code": 0,
    "status": 1,
    "description": "Success"
  },
  "data": {
    "question": "Give me a small sql example",
    "message": [
      {
        "type": "code",
        "content": "SELECT\n  uuid,\n  created_on,\n  changed_on,\n  id,\n  theme_name,\n  json_data,\n  is_system,\n  created_by_fk,\n  changed_by_fk,\n  is_system_default,\n  is_system_dark\nFROM public.themes\nLIMIT 100 ",
        "lang": "sql"
      }
    ]
  }
}

-----------------------------------------

Case: II

{
  "meta": {
    "code": 0,
    "status": 1,
    "description": "Success"
  },
  "data": {
    "question": "Run a combination check",
    "message": [
      {
        "type": "text",
        "content": "Here is the sales analysis query you requested:",
        "lang": "en"
      }
      {
        "type": "code",
        "content": "SELECT\n  uuid,\n  created_on,\n  ... FROM public.themes\nLIMIT 100 ",
        "lang": "sql"
      },
      {
        "type": "text",
        "content": "Let me know if you need this filtered further.",
        "lang": "en"
      }
    ]
  }
}


-----------------------------------------