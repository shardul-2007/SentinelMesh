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
        "http://127.0.0.1:3001",
        "https://sentinelmesh-five.vercel.app",
        "https://sentinelmesh.vercel.app"
    ]
    ADMIN_API_KEY: str = "sentinel-admin-dev-key-phase1"
    JWT_SECRET: str = "sentinelmesh-jwt-secret-phase3-buildathon"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    EXECUTION_MODE: str = "SIMULATED"

    # MST Blockchain Integration (Official MST Testnet & Mainnet Specs)
    MST_TESTNET_RPC_URL: str = "https://testnetrpc.mstblockchain.com"
    MST_TESTNET_CHAIN_ID: int = 91562037
    MST_TESTNET_EXPLORER_URL: str = "https://testnet.mstscan.com"
    MST_TESTNET_TOKEN: str = "tMSTC"
    MST_TESTNET_FAUCET_URL: str = "https://faucet.mstblockchain.com"

    MST_MAINNET_RPC_URL: str = "https://mariorpc.mstblockchain.com/"
    MST_MAINNET_CHAIN_ID: int = 4646
    MST_MAINNET_EXPLORER_URL: str = "https://mstscan.com"
    MST_MAINNET_TOKEN: str = "MSTC"

    # Active Blockchain Anchoring Configuration
    BLOCKCHAIN_NETWORK_KEY: str = "mstTestnet"  # mstTestnet | mstMainnet | localhost
    BLOCKCHAIN_RPC_URL: str = "https://testnetrpc.mstblockchain.com"
    BLOCKCHAIN_CHAIN_ID: int = 91562037
    BLOCKCHAIN_CONTRACT_ADDRESS: str = ""
    BLOCKCHAIN_SIGNER_KEY: str = ""
    BLOCKCHAIN_NETWORK_NAME: str = "MST Testnet"

    # PayPal Developer Sandbox Configuration
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"

    # AI Model Integration (Gemini / LLM)
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
