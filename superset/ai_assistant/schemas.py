from marshmallow import Schema, fields


class AIChatMessageSchema(Schema):
    id = fields.Integer()
    role = fields.String()
    message_type = fields.String()
    content = fields.String()
    execution_status = fields.String(allow_none=True)
    created_at = fields.DateTime()