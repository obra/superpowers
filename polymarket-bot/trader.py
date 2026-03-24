"""
Trader — authenticates with the Polymarket CLOB and places / cancels orders.
"""

from __future__ import annotations

import logging
from typing import Any

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import MarketOrderArgs, OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL

import config
from scanner import Opportunity

log = logging.getLogger(__name__)


def _build_client() -> ClobClient:
    kwargs: dict[str, Any] = {
        "key": config.PRIVATE_KEY,
        "chain_id": config.CHAIN_ID,
        "signature_type": config.SIGNATURE_TYPE,
    }
    if config.FUNDER_ADDRESS:
        kwargs["funder"] = config.FUNDER_ADDRESS

    client = ClobClient(config.CLOB_URL, **kwargs)
    client.set_api_creds(client.create_or_derive_api_creds())
    return client


# Module-level singleton — created once on first use.
_client: ClobClient | None = None


def get_client() -> ClobClient:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


# ── Balance ───────────────────────────────────────────────────────────────────


def available_balance() -> float:
    """Return USDC balance available for trading."""
    client = get_client()
    try:
        data = client.get_balance_allowance()
        # balance is returned as a string in USDC (6 decimals already converted)
        return float(data.get("balance", 0))
    except Exception as exc:
        log.error("Failed to fetch balance: %s", exc)
        return 0.0


# ── Order book check ──────────────────────────────────────────────────────────


def ask_liquidity(token_id: str) -> tuple[float, float]:
    """
    Return (best_ask_price, ask_size) for a token.
    Returns (1.0, 0.0) on error so the position is skipped.
    """
    client = get_client()
    try:
        book = client.get_order_book(token_id)
        asks = book.asks  # list of {price, size}
        if not asks:
            return 1.0, 0.0
        best = min(asks, key=lambda x: float(x.price))
        return float(best.price), float(best.size)
    except Exception as exc:
        log.warning("Order book fetch failed for %s: %s", token_id, exc)
        return 1.0, 0.0


# ── Buying ────────────────────────────────────────────────────────────────────


def buy(opportunity: Opportunity, usd_amount: float) -> str | None:
    """
    Place a FOK market buy order.

    Returns the order ID string on success, None on failure.
    FOK = Fill-Or-Kill: buys at market using `usd_amount` dollars.
    """
    client = get_client()
    try:
        order_args = MarketOrderArgs(
            token_id=opportunity.token_id,
            amount=usd_amount,  # dollars to spend
        )
        signed = client.create_market_order(order_args)
        resp = client.post_order(signed, OrderType.FOK)
        order_id = resp.get("orderID") or resp.get("id")
        if order_id:
            log.info(
                "Bought %s | token=%s | $%.2f | order=%s",
                opportunity.question[:60],
                opportunity.token_id[:12],
                usd_amount,
                order_id,
            )
        else:
            log.warning("Order response missing ID: %s", resp)
        return order_id
    except Exception as exc:
        log.error("Buy failed for token %s: %s", opportunity.token_id, exc)
        return None


# ── Selling ───────────────────────────────────────────────────────────────────


def sell_limit(token_id: str, size: float, price: float = 0.95) -> str | None:
    """
    Place a GTC limit sell order at `price`.

    `size` is the number of shares to sell (outcome tokens held).
    """
    client = get_client()
    try:
        order_args = OrderArgs(
            token_id=token_id,
            price=price,
            size=size,
            side=SELL,
        )
        signed = client.create_order(order_args)
        resp = client.post_order(signed, OrderType.GTC)
        order_id = resp.get("orderID") or resp.get("id")
        log.info(
            "Sell limit placed | token=%s | size=%.1f @ $%.2f | order=%s",
            token_id[:12],
            size,
            price,
            order_id,
        )
        return order_id
    except Exception as exc:
        log.error("Sell failed for token %s: %s", token_id, exc)
        return None


# ── Positions ─────────────────────────────────────────────────────────────────


def open_positions() -> list[dict]:
    """Return all positions with a non-zero balance."""
    client = get_client()
    try:
        positions = client.get_positions()
        return [p for p in (positions or []) if float(p.get("size", 0)) > 0]
    except Exception as exc:
        log.error("Failed to fetch positions: %s", exc)
        return []
