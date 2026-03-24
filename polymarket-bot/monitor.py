"""
Position monitor — watches open positions and triggers sells when the price
crosses the take-profit threshold.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import requests

import config
import trader

log = logging.getLogger(__name__)


@dataclass
class PositionRecord:
    token_id: str
    question: str
    outcome: str
    entry_price: float
    shares: float
    order_id: str
    sell_order_id: str | None = None


# In-memory position registry (token_id → record).
# In production you'd persist this to SQLite or a JSON file.
_positions: dict[str, PositionRecord] = {}


def register(record: PositionRecord) -> None:
    _positions[record.token_id] = record
    log.info(
        "Registered position: %s [%s] | %.1f shares @ $%.4f",
        record.question[:60],
        record.outcome,
        record.shares,
        record.entry_price,
    )


def known_token_ids() -> set[str]:
    return set(_positions.keys())


def position_count() -> int:
    return len(_positions)


def _midpoint(token_id: str) -> float | None:
    """Fetch current midpoint price for a token from the CLOB."""
    try:
        resp = requests.get(
            f"{config.CLOB_URL}/midpoint",
            params={"token_id": token_id},
            timeout=10,
        )
        resp.raise_for_status()
        return float(resp.json().get("mid", 0))
    except Exception as exc:
        log.warning("Midpoint fetch failed for %s: %s", token_id, exc)
        return None


def check_positions() -> None:
    """
    Iterate all tracked positions.
    - If the current midpoint has crossed TAKE_PROFIT_PRICE, place a limit sell.
    - If the position is already resolved (price ~1.0 or 0.0), log it.
    """
    if not _positions:
        return

    resolved: list[str] = []

    for token_id, rec in list(_positions.items()):
        if rec.sell_order_id:
            # Sell already placed; skip until filled or expired.
            continue

        price = _midpoint(token_id)
        if price is None:
            continue

        log.debug("Position %s | current price=%.4f", token_id[:12], price)

        if price >= config.TAKE_PROFIT_PRICE:
            log.info(
                "Take-profit triggered: %s [%s] | price=%.4f",
                rec.question[:60],
                rec.outcome,
                price,
            )
            sell_id = trader.sell_limit(token_id, rec.shares, price=config.TAKE_PROFIT_PRICE)
            if sell_id:
                rec.sell_order_id = sell_id

        elif price <= 0.001:
            # Market resolved against us — position expired worthless.
            log.info(
                "Position expired worthless: %s [%s]",
                rec.question[:60],
                rec.outcome,
            )
            resolved.append(token_id)

        elif price >= 0.999:
            # Resolved in our favour but no order placed yet (e.g. bot restarted).
            log.info(
                "Position resolved YES: %s [%s] | redeem via Polymarket UI",
                rec.question[:60],
                rec.outcome,
            )
            resolved.append(token_id)

    for token_id in resolved:
        _positions.pop(token_id, None)


def summary() -> str:
    if not _positions:
        return "No open positions."
    lines = [f"Open positions ({len(_positions)}):"]
    for rec in _positions.values():
        lines.append(
            f"  {rec.question[:55]:<55} | {rec.outcome:<4} | "
            f"{rec.shares:.1f} shares @ ${rec.entry_price:.4f}"
        )
    return "\n".join(lines)
