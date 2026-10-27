from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "LOCAL DEVELOPMENT"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    DATABASE_URL: str = "sqlite:///./sentinelmesh.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    ADMIN_API_KEY: str = "sentinel-admin-dev-key-phase1"
    JWT_SECRET: str = "sentinelmesh-jwt-secret-phase3-buildathon"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    EXECUTION_MODE: str = "SIMULATED"

    # Blockchain Anchoring Configuration (Phase 2)
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    BLOCKCHAIN_CHAIN_ID: int = 31337
    BLOCKCHAIN_CONTRACT_ADDRESS: str = ""
    BLOCKCHAIN_SIGNER_KEY: str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    BLOCKCHAIN_NETWORK_NAME: str = "Hardhat Local EVM"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
