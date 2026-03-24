"""
Configuration for the Polymarket 1-cent bot.
All values can be overridden via environment variables or .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()


# ── Wallet / auth ────────────────────────────────────────────────────────────
PRIVATE_KEY: str = os.environ["POLYMARKET_PRIVATE_KEY"]
# Set to 0 for EOA (MetaMask/hardware), 1 for Magic/email, 2 for Gnosis Safe proxy
SIGNATURE_TYPE: int = int(os.getenv("POLYMARKET_SIGNATURE_TYPE", "0"))
# Only required for signature_type=1 or 2 (proxy wallets)
FUNDER_ADDRESS: str | None = os.getenv("POLYMARKET_FUNDER_ADDRESS")

# ── API endpoints ─────────────────────────────────────────────────────────────
CLOB_URL: str = "https://clob.polymarket.com"
GAMMA_URL: str = "https://gamma-api.polymarket.com"
CHAIN_ID: int = 137  # Polygon mainnet

# ── Strategy parameters ───────────────────────────────────────────────────────
# Maximum price (in $) to consider a position "cheap"
MAX_ENTRY_PRICE: float = float(os.getenv("MAX_ENTRY_PRICE", "0.02"))

# Dollar amount to spend per position
POSITION_SIZE_USD: float = float(os.getenv("POSITION_SIZE_USD", "10.0"))

# Maximum number of open positions at once
MAX_POSITIONS: int = int(os.getenv("MAX_POSITIONS", "50"))

# Total capital cap — bot will not deploy more than this
TOTAL_BUDGET_USD: float = float(os.getenv("TOTAL_BUDGET_USD", "500.0"))

# Price at which to exit (take profit) — $1 = full resolution value
TAKE_PROFIT_PRICE: float = float(os.getenv("TAKE_PROFIT_PRICE", "0.90"))

# How often to re-scan for new opportunities (seconds)
SCAN_INTERVAL_SECONDS: int = int(os.getenv("SCAN_INTERVAL_SECONDS", "300"))

# How often to check open positions (seconds)
MONITOR_INTERVAL_SECONDS: int = int(os.getenv("MONITOR_INTERVAL_SECONDS", "60"))

# Minimum liquidity on the ask side before buying (shares)
MIN_ASK_LIQUIDITY: float = float(os.getenv("MIN_ASK_LIQUIDITY", "100.0"))

# Skip markets with fewer than this many days until expected resolution
MIN_DAYS_TO_RESOLUTION: int = int(os.getenv("MIN_DAYS_TO_RESOLUTION", "1"))
