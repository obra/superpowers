# Polymarket 1-cent bot

Buys prediction market positions priced near $0.01 and sells them when they
approach $1. Most positions expire worthless; the few that resolve correctly
return ~80–100x.

## How the math works

| Scenario | Result |
|---|---|
| 50 positions × $10 = $500 deployed | |
| 47 expire at $0 | −$470 |
| 3 resolve YES at ~$1 | +$3,000 |
| **Net** | **+$2,530** |

The edge comes from markets mispricing unlikely-but-not-impossible events.

## Quick start

```bash
# 1. Install dependencies (Python 3.9+)
pip install -r requirements.txt

# 2. Configure your wallet
cp .env.example .env
# Edit .env — at minimum set POLYMARKET_PRIVATE_KEY

# 3. Preview what it would buy (no orders placed)
python bot.py --dry-run

# 4. Scan and print cheap opportunities, then exit
python bot.py --scan-only

# 5. Run the live bot
python bot.py
```

## EOA wallet setup (MetaMask / hardware wallet)

If `POLYMARKET_SIGNATURE_TYPE=0`, you must approve allowances for the CLOB
exchange contracts once before your first trade. The easiest way is to place
one order manually through the Polymarket website, which triggers the approval
transactions automatically.

## Files

| File | Purpose |
|---|---|
| `bot.py` | Entry point — main loop |
| `scanner.py` | Gamma API scan for cheap positions |
| `trader.py` | CLOB auth, buying, selling |
| `monitor.py` | Track open positions, trigger sells |
| `config.py` | All settings (env-overridable) |

## Risk warning

Prediction markets are speculative. Most positions bought at $0.01 **will**
expire worthless. Only deploy capital you can afford to lose entirely.
This is not financial advice.
