def init_app(app):
    from superset.extensions import appbuilder
    from superset.ai_assistant.api.history import AIChatHistoryRestApi

    # ✅ Ensure correct Flask context
    with app.app_context():
        appbuilder.add_api(AIChatHistoryRestApi)

        # ✅ Ensure permission created
        appbuilder.sm.add_permission_view_menu("can_access", "AiAssistant")