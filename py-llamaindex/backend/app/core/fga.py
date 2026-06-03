import logging

from openfga_sdk import ClientConfiguration, OpenFgaClient

logger = logging.getLogger(__name__)
from openfga_sdk.credentials import Credentials, CredentialConfiguration
from openfga_sdk.client.models import ClientCheckRequest, ClientTuple, ClientWriteRequest

from app.core.config import settings


class AuthorizationManager:
    openfga_client: OpenFgaClient | None = None

    def connect(self):
        openfga_client_config = ClientConfiguration(
            api_url=settings.FGA_API_URL,
            store_id=settings.FGA_STORE_ID,
            authorization_model_id=settings.FGA_AUTHORIZATION_MODEL_ID,
            credentials=Credentials(
                method="client_credentials",
                configuration=CredentialConfiguration(
                    api_issuer=settings.FGA_API_TOKEN_ISSUER,
                    api_audience=settings.FGA_API_AUDIENCE,
                    client_id=settings.FGA_CLIENT_ID,
                    client_secret=settings.FGA_CLIENT_SECRET,
                ),
            ),
        )

        logger.info("Connecting to FGA...")
        self.openfga_client = OpenFgaClient(openfga_client_config)

    async def add_relation(
        self, user_email: str, document_id: str, relation: str = "owner"
    ):
        assert self.openfga_client is not None
        await self.openfga_client.write(
            ClientWriteRequest(
                writes=[
                    ClientTuple(
                        user=f"user:{user_email}",
                        relation=relation,
                        object=f"doc:{document_id}",
                    )
                ]
            )
        )

    async def check_relation(
        self, user_email: str, document_id: str, relation: str = "can_view"
    ) -> bool:
        assert self.openfga_client is not None
        response = await self.openfga_client.check(
            ClientCheckRequest(
                user=f"user:{user_email}",
                relation=relation,
                object=f"doc:{document_id}",
            )
        )
        return response.allowed

    async def delete_relation(
        self, user_email: str, document_id: str, relation: str = "owner"
    ):
        assert self.openfga_client is not None
        await self.openfga_client.write(
            ClientWriteRequest(
                deletes=[
                    ClientTuple(
                        user=f"user:{user_email}",
                        relation=relation,
                        object=f"doc:{document_id}",
                    )
                ]
            )
        )


authorization_manager = AuthorizationManager()
