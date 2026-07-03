from alembic import op
import sqlalchemy as sa

revision = "cb85c625dd40"
down_revision = "064fcd8d1ef6"

branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "ai_chat_messages",
        sa.Column(
            "request_id",
            sa.String(length=64),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column(
        "ai_chat_messages",
        "request_id",
    )