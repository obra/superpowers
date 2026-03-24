"""
Market scanner — finds cheap prediction market positions via the Gamma API.

The Gamma API includes `outcomePrices` and `clobTokenIds` for every market,
letting us filter for positions near $0.01 without touching the CLOB.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterator

import requests

import config

log = logging.getLogger(__name__)


@dataclass
class Opportunity:
    question: str
    token_id: str
    outcome: str       # "Yes" / "No" / outcome label
    price: float       # Current best ask price in $
    market_id: str     # Gamma market slug / id
    end_date: datetime | None
    accepting_orders: bool


def _parse_end_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _days_until(dt: datetime | None) -> float:
    if dt is None:
        return float("inf")
    delta = dt - datetime.now(tz=timezone.utc)
    return delta.total_seconds() / 86400


def _fetch_page(offset: int, limit: int = 100) -> list[dict]:
    try:
        resp = requests.get(
            f"{config.GAMMA_URL}/markets",
            params={
                "closed": False,
                "active": True,
                "limit": limit,
                "offset": offset,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        log.warning("Gamma API error at offset=%d: %s", offset, exc)
        return []


def _parse_list_field(raw: str | list) -> list[str]:
    """Handle both JSON arrays and the stringified-array Gamma sometimes returns."""
    if isinstance(raw, list):
        return [str(x).strip().strip('"') for x in raw]
    # e.g. '["abc", "def"]' or '[abc, def]'
    return [x.strip().strip('"') for x in raw.strip("[]").split(",") if x.strip()]


def scan() -> list[Opportunity]:
    """
    Return all open positions whose current price is ≤ MAX_ENTRY_PRICE,
    that have sufficient time remaining and are accepting orders.
    """
    opportunities: list[Opportunity] = []
    offset = 0
    limit = 100

    while True:
        page = _fetch_page(offset, limit)
        if not page:
            break

        for market in page:
            raw_prices = market.get("outcomePrices")
            raw_token_ids = market.get("clobTokenIds")
            raw_outcomes = market.get("outcomes")

            if not raw_prices or not raw_token_ids:
                continue

            prices = _parse_list_field(raw_prices)
            token_ids = _parse_list_field(raw_token_ids)
            outcomes = _parse_list_field(raw_outcomes) if raw_outcomes else []

            end_date = _parse_end_date(market.get("endDate"))
            accepting = market.get("acceptingOrders", False)
            market_id = market.get("id", "")
            question = market.get("question", "")

            for i, (price_str, token_id) in enumerate(zip(prices, token_ids)):
                try:
                    price = float(price_str)
                except ValueError:
                    continue

                if price > config.MAX_ENTRY_PRICE:
                    continue
                if price <= 0:
                    continue
                if _days_until(end_date) < config.MIN_DAYS_TO_RESOLUTION:
                    continue

                outcome_label = outcomes[i] if i < len(outcomes) else f"outcome_{i}"

                opportunities.append(
                    Opportunity(
                        question=question,
                        token_id=token_id,
                        outcome=outcome_label,
                        price=price,
                        market_id=market_id,
                        end_date=end_date,
                        accepting_orders=accepting,
                    )
                )

        if len(page) < limit:
            break
        offset += limit

    log.info("Scan complete: %d cheap opportunities found", len(opportunities))
    return opportunities
