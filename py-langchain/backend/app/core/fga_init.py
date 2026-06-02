import asyncio
import json
import os
import openfga_sdk
from openfga_sdk.client import OpenFgaClient
from openfga_sdk.credentials import Credentials, CredentialConfiguration

from app.core.config import settings


def build_openfga_client() -> OpenFgaClient:
    """Build and return an OpenFGA client using settings configuration."""
    openfga_client_config = openfga_sdk.ClientConfiguration(
        api_url=settings.FGA_API_URL,
        store_id=settings.FGA_STORE_ID,
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
    return OpenFgaClient(openfga_client_config)


async def main():
    """
    Initializes the OpenFgaClient, writes an authorization model, and configures pre-defined tuples.

    This function performs the following steps:
       1. Creates an instance of OpenFgaClient with the necessary configuration.
       2. Writes an authorization model with specified schema version and type definitions.
    """
    
    fga_client = build_openfga_client()
    
    # Define the authorization model
    body_string = "{\"schema_version\":\"1.1\",\"type_definitions\":[{\"type\":\"user\"},{\"metadata\":{\"relations\":{\"can_view\":{},\"owner\":{\"directly_related_user_types\":[{\"type\":\"user\"}]},\"viewer\":{\"directly_related_user_types\":[{\"type\":\"user\"},{\"type\":\"user\",\"wildcard\":{}}]}}},\"relations\":{\"can_view\":{\"union\":{\"child\":[{\"computedUserset\":{\"relation\":\"owner\"}},{\"computedUserset\":{\"relation\":\"viewer\"}}]}},\"owner\":{\"this\":{}},\"viewer\":{\"this\":{}}},\"type\":\"doc\"}]}"
    # Write the authorization model
    model = await fga_client.write_authorization_model(json.loads(body_string))
    
    print(f'NEW MODEL ID: {model.authorization_model_id}')
    
    # Properly close the client session
    await fga_client.close()


if __name__ == '__main__':
    asyncio.run(main())