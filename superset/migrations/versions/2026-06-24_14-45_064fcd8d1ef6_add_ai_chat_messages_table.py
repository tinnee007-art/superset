# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""add_ai_chat_messages_table

Revision ID: 064fcd8d1ef6
Revises: 4b2a8c9d3e1f
Create Date: 2026-06-24 14:45:22.720330

"""

# revision identifiers, used by Alembic.
revision = '064fcd8d1ef6'
down_revision = '4b2a8c9d3e1f'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        "ai_chat_messages",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "message_type",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "execution_status",
            sa.String(length=20),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["ab_user.id"],
        ),
    )

    op.create_index(
        "ix_ai_chat_messages_user_id",
        "ai_chat_messages",
        ["user_id"],
    )

    op.create_index(
        "ix_ai_chat_messages_created_at",
        "ai_chat_messages",
        ["created_at"],
    )


def downgrade():
    op.drop_index(
        "ix_ai_chat_messages_created_at",
        table_name="ai_chat_messages",
    )

    op.drop_index(
        "ix_ai_chat_messages_user_id",
        table_name="ai_chat_messages",
    )

    op.drop_table("ai_chat_messages")