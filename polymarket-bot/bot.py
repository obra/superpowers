"""
Polymarket 1-cent bot
─────────────────────
Strategy:
  • Scan prediction markets for positions priced at ≤ $0.02
  • Buy a fixed dollar amount across as many as MAX_POSITIONS positions
  • Let most expire worthless; the ones that hit return ~80–100x

Usage:
  python bot.py [--dry-run] [--scan-only]

Flags:
  --dry-run      Print what would be bought without placing orders
  --scan-only    Run one scan, print results, and exit
"""

from __future__ import annotations

import argparse
import logging
import time

import config
import monitor
import scanner
import trader
from monitor import PositionRecord

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _total_deployed() -> float:
    """Estimate total capital deployed based on registered positions."""
    return sum(
        r.entry_price * r.shares for r in monitor._positions.values()
    )


def _buy_opportunities(opportunities: list[scanner.Opportunity], dry_run: bool) -> None:
    """Filter, validate, and buy from the list of scanned opportunities."""
    balance = trader.available_balance()
    log.info("USDC balance: $%.2f", balance)

    deployed = _total_deployed()
    remaining_budget = min(config.TOTAL_BUDGET_USD - deployed, balance)

    if remaining_budget < config.POSITION_SIZE_USD:
        log.info("Budget exhausted or insufficient balance — skipping buys.")
        return

    open_token_ids = monitor.known_token_ids()
    slots_remaining = config.MAX_POSITIONS - monitor.position_count()

    bought = 0
    for opp in opportunities:
        if slots_remaining <= 0:
            log.info("MAX_POSITIONS (%d) reached.", config.MAX_POSITIONS)
            break
        if remaining_budget < config.POSITION_SIZE_USD:
            log.info("Budget cap reached ($%.2f deployed).", deployed + bought * config.POSITION_SIZE_USD)
            break
        if opp.token_id in open_token_ids:
            continue  # already holding this token
        if not opp.accepting_orders:
            log.debug("Skipping %s — not accepting orders", opp.token_id[:12])
            continue

        # Validate liquidity
        ask_price, ask_size = trader.ask_liquidity(opp.token_id)
        if ask_size < config.MIN_ASK_LIQUIDITY:
            log.debug(
                "Skipping %s — insufficient ask liquidity (%.1f < %.1f)",
                opp.token_id[:12],
                ask_size,
                config.MIN_ASK_LIQUIDITY,
            )
            continue
        if ask_price > config.MAX_ENTRY_PRICE:
            log.debug(
                "Skipping %s — live ask $%.4f > max $%.4f",
                opp.token_id[:12],
                ask_price,
                config.MAX_ENTRY_PRICE,
            )
            continue

        log.info(
            "[%s] %s | ask=$%.4f | buying $%.2f",
            "DRY RUN" if dry_run else "BUY",
            opp.question[:60],
            ask_price,
            config.POSITION_SIZE_USD,
        )

        if dry_run:
            slots_remaining -= 1
            remaining_budget -= config.POSITION_SIZE_USD
            bought += 1
            continue

        order_id = trader.buy(opp, config.POSITION_SIZE_USD)
        if order_id:
            shares_received = config.POSITION_SIZE_USD / ask_price
            monitor.register(
                PositionRecord(
                    token_id=opp.token_id,
                    question=opp.question,
                    outcome=opp.outcome,
                    entry_price=ask_price,
                    shares=shares_received,
                    order_id=order_id,
                )
            )
            slots_remaining -= 1
            remaining_budget -= config.POSITION_SIZE_USD
            bought += 1

    log.info("Bought %d new position(s) this cycle.", bought)


# ── Main loop ─────────────────────────────────────────────────────────────────


def run(dry_run: bool = False) -> None:
    log.info("=== Polymarket 1-cent bot starting ===")
    log.info(
        "Config: max_price=$%.3f  position=$%.2f  max_positions=%d  budget=$%.2f",
        config.MAX_ENTRY_PRICE,
        config.POSITION_SIZE_USD,
        config.MAX_POSITIONS,
        config.TOTAL_BUDGET_USD,
    )

    last_scan = 0.0
    last_monitor = 0.0

    while True:
        now = time.time()

        # ── Scan for new opportunities ────────────────────────────────────────
        if now - last_scan >= config.SCAN_INTERVAL_SECONDS:
            log.info("--- Scanning markets ---")
            opportunities = scanner.scan()
            log.info("Found %d cheap opportunities", len(opportunities))
            _buy_opportunities(opportunities, dry_run)
            last_scan = time.time()

        # ── Check existing positions ──────────────────────────────────────────
        if now - last_monitor >= config.MONITOR_INTERVAL_SECONDS:
            log.info("--- Checking positions ---")
            monitor.check_positions()
            log.info(monitor.summary())
            last_monitor = time.time()

        time.sleep(10)


def scan_only() -> None:
    log.info("=== Scan-only mode ===")
    opportunities = scanner.scan()
    if not opportunities:
        log.info("No cheap opportunities found right now.")
        return

    log.info("\nCheap positions (price ≤ $%.2f):", config.MAX_ENTRY_PRICE)
    log.info("%-70s  %-6s  %s", "Question", "Side", "Price")
    log.info("-" * 90)
    for opp in sorted(opportunities, key=lambda o: o.price):
        log.info(
            "%-70s  %-6s  $%.4f",
            opp.question[:70],
            opp.outcome,
            opp.price,
        )
    log.info("\nTotal: %d opportunities", len(opportunities))


# ── CLI entry point ───────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Polymarket 1-cent prediction bot")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate buys without placing real orders",
    )
    parser.add_argument(
        "--scan-only",
        action="store_true",
        help="Print cheap opportunities and exit",
    )
    args = parser.parse_args()

    if args.scan_only:
        scan_only()
    else:
        run(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
