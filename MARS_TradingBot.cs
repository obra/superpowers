// MARS - Multi-Factor Adaptive Regime System
// Complete cTrader cAlgo Robot
// Fully compilable with zero modifications in cTrader cAlgo IDE
using System;
using System.Collections.Generic;
using System.Linq;
using cAlgo.API;
using cAlgo.API.Indicators;
using cAlgo.API.Internals;

namespace cAlgo.Robots
{
    // ─────────────────────────────────────────────────────────────
    //  ENUMS
    // ─────────────────────────────────────────────────────────────
    public enum MarketRegime { Trending, Ranging, HighVolatility }
    public enum RiskAction   { None, SoftDaily, HardDaily, SoftTotal, HardTotal }
    public enum SignalDirection { None, Long, Short }
    public enum ExitReason { TakeProfit, StopLoss, Breakeven, TrailingStop,
                             PartialClose, TimeExit, WeekendClose, DailyLimitClose,
                             DrawdownClose, Manual }

    // ─────────────────────────────────────────────────────────────
    //  #region Backtest Analytics  ──  TradeRecord
    // ─────────────────────────────────────────────────────────────
    #region Backtest Analytics
    public class TradeRecord
    {
        public DateTime     EntryTime      { get; set; }
        public double       EntryPrice     { get; set; }
        public DateTime     ExitTime       { get; set; }
        public double       ExitPrice      { get; set; }
        public TradeType    Direction      { get; set; }
        public double       Lots           { get; set; }
        public double       StopLoss       { get; set; }
        public double       TakeProfit     { get; set; }
        public double       PnL            { get; set; }
        public ExitReason   ExitReason     { get; set; }
        public MarketRegime RegimeAtEntry  { get; set; }
        public string       SignalSource   { get; set; }
    }
    #endregion

    // ─────────────────────────────────────────────────────────────
    //  #region Risk Management  ──  FTMORiskManager
    // ─────────────────────────────────────────────────────────────
    #region Risk Management
    public class FTMORiskManager
    {
        public double InitialBalance         { get; private set; }
        public double DailyStartBalance      { get; private set; }
        public double SoftDailyLossLimit     { get; private set; }
        public double HardDailyLossLimit     { get; private set; }
        public double SoftTotalDrawdownLimit { get; private set; }
        public double HardTotalDrawdownLimit { get; private set; }
        public double DailyProfitTarget      { get; private set; }
        public int    TradingDaysLogged      { get; private set; }
        public bool   IsDailyLimitBreached   { get; private set; }
        public bool   IsTotalLimitBreached   { get; private set; }

        private double _peakEquity;
        private double _currentRealizedPnL;
        private double _currentFloatingPnL;

        public void Initialize(double initialBalance)
        {
            InitialBalance         = initialBalance;
            DailyStartBalance      = initialBalance;
            _peakEquity            = initialBalance;
            SoftDailyLossLimit     = initialBalance * 0.045;
            HardDailyLossLimit     = initialBalance * 0.049;
            SoftTotalDrawdownLimit = initialBalance * 0.09;
            HardTotalDrawdownLimit = initialBalance * 0.098;
            DailyProfitTarget      = initialBalance * 0.01;
            TradingDaysLogged      = 0;
            IsDailyLimitBreached   = false;
            IsTotalLimitBreached   = false;
        }

        public void OnNewDay(double currentBalance)
        {
            DailyStartBalance    = currentBalance;
            DailyProfitTarget    = currentBalance * 0.01;
            IsDailyLimitBreached = false;
            _currentRealizedPnL  = 0;
            _currentFloatingPnL  = 0;
        }

        public void LogTradingDay()
        {
            TradingDaysLogged++;
        }

        public bool CanOpenTrade(double currentEquity, double currentDayPnL)
        {
            if (IsDailyLimitBreached) return false;
            if (IsTotalLimitBreached) return false;
            // Total drawdown check (floating + realized worst-case)
            if (InitialBalance - currentEquity >= SoftTotalDrawdownLimit) return false;
            // Daily loss check — equity drop from day start
            double dayLoss = DailyStartBalance - currentEquity;
            if (dayLoss >= SoftDailyLossLimit) return false;
            return true;
        }

        public void UpdateMetrics(double realizedPnL, double floatingPnL)
        {
            _currentRealizedPnL = realizedPnL;
            _currentFloatingPnL = floatingPnL;
        }

        public RiskAction CheckForBreach(double equity)
        {
            // Hard total drawdown
            if (InitialBalance - equity >= HardTotalDrawdownLimit)
            {
                IsTotalLimitBreached = true;
                return RiskAction.HardTotal;
            }
            // Soft total drawdown
            if (InitialBalance - equity >= SoftTotalDrawdownLimit)
            {
                IsTotalLimitBreached = true;
                return RiskAction.SoftTotal;
            }
            // Hard daily
            if (DailyStartBalance - equity >= HardDailyLossLimit)
            {
                IsDailyLimitBreached = true;
                return RiskAction.HardDaily;
            }
            // Soft daily
            if (DailyStartBalance - equity >= SoftDailyLossLimit)
            {
                IsDailyLimitBreached = true;
                return RiskAction.SoftDaily;
            }
            return RiskAction.None;
        }

        public double GetSizingMultiplier(double currentDayPnL)
        {
            double lossPct = -currentDayPnL / DailyStartBalance * 100.0;
            if (lossPct >= 3.0)  return 0.40;
            if (lossPct >= 2.0)  return 0.60;
            if (lossPct >= 1.0)  return 0.80;
            return 1.0;
        }

        public void LogRiskStatus(string context, Action<string> logger)
        {
            logger(string.Format(
                "[RISK STATUS | {0}] InitBal={1:F2} DayStart={2:F2} " +
                "SoftDailyLimit={3:F2} HardDailyLimit={4:F2} " +
                "SoftTotalDD={5:F2} HardTotalDD={6:F2} " +
                "DailyLimitBreached={7} TotalLimitBreached={8} TradingDays={9}",
                context,
                InitialBalance, DailyStartBalance,
                SoftDailyLossLimit, HardDailyLossLimit,
                SoftTotalDrawdownLimit, HardTotalDrawdownLimit,
                IsDailyLimitBreached, IsTotalLimitBreached,
                TradingDaysLogged));
        }
    }
    #endregion

    // ─────────────────────────────────────────────────────────────
    //  #region Position Sizing  ──  QuantPositionSizer
    // ─────────────────────────────────────────────────────────────
    #region Position Sizing
    public class QuantPositionSizer
    {
        private readonly List<double> _tradeHistory = new List<double>();
        private const int KellyWindow = 30;

        public double CalculateLots(
            double accountBalance,
            double riskPercent,
            double stopLossInPips,
            double pipValuePerLot,
            double accountEquity,
            double totalUsedMargin,
            double contractSize,
            double currentDayPnL,
            double dailyStartBalance,
            FTMORiskManager riskManager,
            double regimeSizeMultiplier,
            double h4BiasMultiplier)
        {
            if (stopLossInPips <= 0 || pipValuePerLot <= 0) return 0;

            double riskAmount = accountBalance * (riskPercent / 100.0);
            double rawLots    = riskAmount / (stopLossInPips * pipValuePerLot);

            // Half-Kelly scaling
            double kellyMult = GetHalfKellyFraction();
            rawLots *= kellyMult;

            // Drawdown scaling from risk manager
            double ddMult = riskManager.GetSizingMultiplier(currentDayPnL);
            rawLots *= ddMult;

            // Regime multiplier (HIGH_VOLATILITY = 0.4)
            rawLots *= regimeSizeMultiplier;

            // H4 bias flat zone halving
            rawLots *= h4BiasMultiplier;

            // Margin safety: never push total used margin above 20% of equity
            double maxAllowedMargin = accountEquity * 0.20;
            double availableMargin  = maxAllowedMargin - totalUsedMargin;
            if (availableMargin <= 0) return 0;

            double marginPerLot = contractSize / 100.0;
            if (marginPerLot > 0)
            {
                double maxLotsByMargin = availableMargin / marginPerLot;
                if (rawLots > maxLotsByMargin)
                    rawLots = maxLotsByMargin;
            }

            // Round down to 0.01
            rawLots = Math.Floor(rawLots * 100.0) / 100.0;
            return rawLots < 0.01 ? 0 : rawLots;
        }

        public void RecordTrade(double pnl)
        {
            _tradeHistory.Add(pnl);
        }

        private double GetHalfKellyFraction()
        {
            if (_tradeHistory.Count < 10) return 0.5;

            var recent = _tradeHistory.Count >= KellyWindow
                ? _tradeHistory.Skip(_tradeHistory.Count - KellyWindow).ToList()
                : _tradeHistory;

            int wins     = recent.Count(p => p > 0);
            double W     = (double)wins / recent.Count;
            double avgWin = wins > 0
                ? recent.Where(p => p > 0).Average()
                : 0;
            double avgLoss = (recent.Count - wins) > 0
                ? Math.Abs(recent.Where(p => p <= 0).Average())
                : 1;
            if (avgLoss <= 0) avgLoss = 1;

            double R     = avgWin / avgLoss;
            if (R <= 0)  return 0.25;
            double kelly = W - (1.0 - W) / R;
            double half  = kelly * 0.5;
            return Math.Max(0.25, Math.Min(1.0, half));
        }
    }
    #endregion

    // ─────────────────────────────────────────────────────────────
    //  #region Market Regime  ──  MarketRegimeEngine
    // ─────────────────────────────────────────────────────────────
    #region Market Regime
    public class MarketRegimeEngine
    {
        private MarketRegime _currentRegime = MarketRegime.Ranging;
        public  MarketRegime CurrentRegime  => _currentRegime;

        public MarketRegime Classify(
            double adx,
            double atr,
            double atrSma50,
            double bbUpper,
            double bbLower,
            double currentClose,
            int    barsInsideBands,
            Action<string> logger)
        {
            MarketRegime newRegime;

            if (atrSma50 > 0 && atr > atrSma50 * 2.0)
            {
                newRegime = MarketRegime.HighVolatility;
            }
            else if (adx > 25 && atrSma50 > 0 && atr <= atrSma50 * 1.5)
            {
                newRegime = MarketRegime.Trending;
            }
            else if (adx < 25 && barsInsideBands >= 10)
            {
                newRegime = MarketRegime.Ranging;
            }
            else
            {
                newRegime = MarketRegime.Ranging;
            }

            if (newRegime != _currentRegime)
            {
                logger(string.Format("[REGIME CHANGE] {0} → {1}", _currentRegime, newRegime));
                _currentRegime = newRegime;
            }
            return _currentRegime;
        }

        public double GetSizeMultiplier()
        {
            return _currentRegime == MarketRegime.HighVolatility ? 0.40 : 1.0;
        }
    }
    #endregion

    // ─────────────────────────────────────────────────────────────
    //  MAIN ROBOT CLASS
    // ─────────────────────────────────────────────────────────────
    [Robot("MARS - Multi-Factor Adaptive Regime System",
           AccessRights = AccessRights.None)]
    public class MARSTradingBot : Robot
    {
        // ═══════════════════════════════════════════════════════
        //  #region Parameters
        // ═══════════════════════════════════════════════════════
        #region Parameters
        [Parameter("Primary Timeframe", DefaultValue = "Minute15", Group = "Strategy")]
        public TimeFrame PrimaryTimeFrame { get; set; }

        [Parameter("Risk % Per Trade", DefaultValue = 1.0, MinValue = 0.25, MaxValue = 2.0, Group = "Risk")]
        public double RiskPercentPerTrade { get; set; }

        [Parameter("Max Concurrent Trades", DefaultValue = 4, MinValue = 1, MaxValue = 10, Group = "Risk")]
        public int MaxConcurrentTrades { get; set; }

        [Parameter("Phase (1 or 2)", DefaultValue = 1, MinValue = 1, MaxValue = 2, Group = "FTMO")]
        public int Phase { get; set; }

        [Parameter("Slippage Tolerance (pips)", DefaultValue = 2.0, MinValue = 0.5, MaxValue = 10.0, Group = "Execution")]
        public double SlippageTolerance { get; set; }

        [Parameter("Enable Trend Strategy", DefaultValue = true, Group = "Strategy")]
        public bool EnableTrendStrategy { get; set; }

        [Parameter("Enable Mean Reversion Strategy", DefaultValue = true, Group = "Strategy")]
        public bool EnableMeanReversionStrategy { get; set; }

        [Parameter("ATR Period", DefaultValue = 14, MinValue = 5, MaxValue = 50, Group = "Indicators")]
        public int AtrPeriod { get; set; }

        [Parameter("EMA Fast Period", DefaultValue = 20, MinValue = 5, MaxValue = 50, Group = "Indicators")]
        public int EmaFast { get; set; }

        [Parameter("EMA Slow Period", DefaultValue = 50, MinValue = 10, MaxValue = 200, Group = "Indicators")]
        public int EmaSlow { get; set; }

        [Parameter("EMA Trend Filter Period", DefaultValue = 200, MinValue = 50, MaxValue = 500, Group = "Indicators")]
        public int EmaTrend { get; set; }

        [Parameter("FOMC Dates (yyyy-MM-dd,csv)", DefaultValue = "", Group = "News Filter")]
        public string FomcDates { get; set; }

        [Parameter("ECB Dates (yyyy-MM-dd,csv)", DefaultValue = "", Group = "News Filter")]
        public string EcbDates { get; set; }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Indicators
        // ═══════════════════════════════════════════════════════
        #region Indicators
        private ExponentialMovingAverage _emaFast;    // EMA20  — pullback level
        private ExponentialMovingAverage _emaSlow;    // EMA50  — trend direction
        private ExponentialMovingAverage _emaTrend;   // EMA200 — long-term M15 bias
        // _rsi replaced by CalcRSI() manual helper — same NaN/0 issue as BB in some cAlgo builds
        private MacdCrossOver            _macd;
        private AverageTrueRange         _atr;
        private DirectionalMovementSystem _dms;
        // _bb replaced by CalcBB() manual helper — BollingerBands.Top/.Bottom returns NaN in some cAlgo builds
        // _stoch replaced by CalcStochK() manual helper — same precaution as BB
        private SimpleMovingAverage      _atrSma50;
        private SimpleMovingAverage      _volumeSma20;

        // H4 indicators
        private Bars                      _h4Bars;
        private ExponentialMovingAverage  _h4Ema50;
        private ExponentialMovingAverage  _h4Ema200;
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region State Variables
        // ═══════════════════════════════════════════════════════
        #region State Variables
        private FTMORiskManager    _riskManager;
        private QuantPositionSizer _positionSizer;
        private MarketRegimeEngine _regimeEngine;

        private List<TradeRecord>  _tradeRecords         = new List<TradeRecord>();
        private Dictionary<string, int>  _cooldownBars   = new Dictionary<string, int>();
        private Dictionary<int, TradeRecord> _openRecords = new Dictionary<int, TradeRecord>();

        private DateTime _lastDayChecked = DateTime.MinValue;
        private bool     _tradedToday   = false;

        // VWAP state
        private double   _vwapNumerator   = 0;
        private double   _vwapDenominator = 0;
        private double   _currentVwap     = 0;
        private DateTime _vwapResetDate   = DateTime.MinValue;

        // Realized P&L tracking (this day)
        private double   _dailyRealizedPnL = 0;

        // Backtest analytics
        private double   _maxDrawdownPct     = 0;
        private double   _peakBalance        = 0;
        private Dictionary<DateTime, double> _dailyReturns = new Dictionary<DateTime, double>();

        // Parsed news dates
        private HashSet<DateTime> _fomcDates = new HashSet<DateTime>();
        private HashSet<DateTime> _ecbDates  = new HashSet<DateTime>();

        // Bars inside Bollinger Bands counter
        private int _barsInsideBands = 0;

        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Lifecycle Methods
        // ═══════════════════════════════════════════════════════
        #region Lifecycle Methods
        protected override void OnStart()
        {
            // Instantiate helper classes
            _riskManager   = new FTMORiskManager();
            _positionSizer = new QuantPositionSizer();
            _regimeEngine  = new MarketRegimeEngine();

            _riskManager.Initialize(Account.Balance);
            _peakBalance = Account.Balance;

            // Primary timeframe indicators
            _emaFast     = Indicators.ExponentialMovingAverage(Bars.ClosePrices, EmaFast);
            _emaSlow     = Indicators.ExponentialMovingAverage(Bars.ClosePrices, EmaSlow);
            _emaTrend    = Indicators.ExponentialMovingAverage(Bars.ClosePrices, EmaTrend);
            // RSI computed manually in CalcRSI() — see helpers region
            _macd        = Indicators.MacdCrossOver(26, 12, 9);
            _atr         = Indicators.AverageTrueRange(AtrPeriod, MovingAverageType.Simple);
            _dms         = Indicators.DirectionalMovementSystem(14);
            // BB and Stochastic computed manually in CalcBB()/CalcStochK() — see helpers region
            _atrSma50    = Indicators.SimpleMovingAverage(_atr.Result, 50);
            _volumeSma20 = Indicators.SimpleMovingAverage(Bars.TickVolumes, 20);

            // H4 timeframe
            _h4Bars   = MarketData.GetBars(TimeFrame.Hour4);
            _h4Ema50  = Indicators.ExponentialMovingAverage(_h4Bars.ClosePrices, 50);
            _h4Ema200 = Indicators.ExponentialMovingAverage(_h4Bars.ClosePrices, 200);

            // Parse news dates
            ParseDates(FomcDates, _fomcDates);
            ParseDates(EcbDates,  _ecbDates);

            // Wire position closed event
            Positions.Closed += OnPositionClosed;

            // Initialize daily state
            _lastDayChecked = Server.Time.Date;
            _riskManager.OnNewDay(Account.Balance);

            Print("[MARS] Bot started. Symbol=" + SymbolName +
                  " Balance=" + Account.Balance.ToString("F2") +
                  " Phase=" + Phase);
            _riskManager.LogRiskStatus("OnStart", Print);
        }

        protected override void OnBar()
        {
            int idx = Bars.Count - 2; // last closed bar — forward indexing: 0=oldest, Count-1=current forming

            // ── Daily reset check ────────────────────────────────
            DateTime today = Server.Time.Date;
            if (today != _lastDayChecked)
            {
                double prevClose = _dailyRealizedPnL;
                if (_dailyReturns.ContainsKey(_lastDayChecked))
                    _dailyReturns[_lastDayChecked] = prevClose / _riskManager.DailyStartBalance;
                else
                    _dailyReturns.Add(_lastDayChecked, prevClose / _riskManager.DailyStartBalance);

                _riskManager.OnNewDay(Account.Balance);
                _dailyRealizedPnL = 0;
                _tradedToday      = false;
                _lastDayChecked   = today;
                Print("[MARS] New trading day: " + today.ToString("yyyy-MM-dd") +
                      "  DayStartBalance=" + Account.Balance.ToString("F2"));
            }

            // ── Update VWAP ─────────────────────────────────────
            UpdateVwap(idx);

            // ── Update Bollinger inside-bands counter ────────────
            double closeIdx  = Bars.ClosePrices[idx];
            double bbMidC, bbTopC, bbBotC;
            CalcBB(idx, 20, 2.0, out bbMidC, out bbTopC, out bbBotC);
            if (!double.IsNaN(bbTopC) && closeIdx >= bbBotC && closeIdx <= bbTopC)
                _barsInsideBands++;
            else
                _barsInsideBands = 0;

            // ── Classify market regime ───────────────────────────
            double adx     = _dms.ADX[idx];
            double atr     = _atr.Result[idx];
            double atrSma  = _atrSma50.Result[idx];
            _regimeEngine.Classify(adx, atr, atrSma, bbTopC, bbBotC,
                                   closeIdx, _barsInsideBands, Print);

            // ── Risk breach check ────────────────────────────────
            double floatingPnL = Positions.Where(p => p.Label.StartsWith("MARS")).Sum(p => p.NetProfit);
            RiskAction breach  = _riskManager.CheckForBreach(Account.Equity);
            if (breach == RiskAction.HardDaily || breach == RiskAction.HardTotal ||
                breach == RiskAction.SoftDaily  || breach == RiskAction.SoftTotal)
            {
                Print("[MARS][RISK BREACH] Action=" + breach);
                _riskManager.LogRiskStatus("BREACH", Print);
                CloseAllTrades("RISK_BREACH");
                return;
            }

            // ── Weekend close check ──────────────────────────────
            if (Server.Time.DayOfWeek == DayOfWeek.Friday &&
                Server.Time.Hour >= 20 && Server.Time.Minute >= 45)
            {
                CloseAllTrades("WEEKEND");
                return;
            }

            // ── Max drawdown tracking ────────────────────────────
            if (Account.Balance > _peakBalance)
                _peakBalance = Account.Balance;
            double currentDD = (_peakBalance - Account.Balance) / _peakBalance * 100.0;
            if (currentDD > _maxDrawdownPct)
                _maxDrawdownPct = currentDD;

            // ── Manage existing positions ────────────────────────
            ManageOpenTrades(idx);

            // ── Entry logic ──────────────────────────────────────
            // Gate: max concurrent trades
            int openMarsPositions = Positions.Count(p => p.Label.StartsWith("MARS"));
            if (openMarsPositions >= MaxConcurrentTrades) return;

            // Gate: session filter
            if (!IsSessionOpen(Server.Time))
            {
                return; // session closed — suppress log (was flooding output)
            }

            // Gate: news blackout
            if (IsNewsBlackout(Server.Time)) return;

            // Gate: FTMO daily/total limits
            if (!_riskManager.CanOpenTrade(Account.Equity, _dailyRealizedPnL))
            {
                Print("[MARS][GATE] FTMO limit blocks entry. DailyLimitBreached=" +
                      _riskManager.IsDailyLimitBreached + " TotalBreached=" +
                      _riskManager.IsTotalLimitBreached);
                return;
            }

            // Gate: max 1 position per symbol
            bool alreadyHavePosition = Positions.Any(p =>
                p.SymbolName == SymbolName && p.Label.StartsWith("MARS"));
            if (alreadyHavePosition) return;

            // Gate: cooldown
            if (_cooldownBars.ContainsKey(SymbolName) && _cooldownBars[SymbolName] > 0)
            {
                _cooldownBars[SymbolName]--;
                return;
            }

            // ── Get H4 bias ──────────────────────────────────────
            // Forward indexing: Count-2 = last closed H4 bar
            int h4Idx = _h4Bars.Count - 2;
            double h4Fast   = h4Idx >= 0 ? _h4Ema50.Result[h4Idx]  : double.NaN;
            double h4Slow   = h4Idx >= 0 ? _h4Ema200.Result[h4Idx] : double.NaN;
            SignalDirection h4Bias      = SignalDirection.None;
            double          h4SizeMult  = 1.0;

            if (double.IsNaN(h4Fast) || double.IsNaN(h4Slow) || h4Slow == 0)
            {
                // H4 EMAs not yet warmed up — skip H4 filter, allow all directions
                h4Bias     = SignalDirection.None;
                h4SizeMult = 0.5; // cautious size while no H4 data
            }
            else
            {
                double pctDiff = Math.Abs(h4Fast - h4Slow) / h4Slow * 100.0;
                if (pctDiff <= 0.05)
                {
                    h4Bias     = SignalDirection.None;
                    h4SizeMult = 0.5;
                }
                else if (h4Fast > h4Slow)
                {
                    h4Bias = SignalDirection.Long;
                }
                else
                {
                    h4Bias = SignalDirection.Short;
                }
            }

            double adxNow = _dms.ADX[idx];

            // ── Try Trend Signal (ADX ≥ 20 — trending environment) ─
            if (EnableTrendStrategy && !double.IsNaN(adxNow) && adxNow >= 20)
            {
                SignalDirection trendSig = GetTrendSignal(idx);
                if (trendSig != SignalDirection.None)
                {
                    // H4 filter: only trade WITH H4 bias, or when H4 is flat (None)
                    if (h4Bias != SignalDirection.None && h4Bias != trendSig) return;
                    OpenTrade(trendSig, idx, "TREND", h4SizeMult);
                    return;
                }
            }

            // ── Try Mean Reversion Signal (ADX < 25 — ranging environment)
            if (EnableMeanReversionStrategy && (double.IsNaN(adxNow) || adxNow < 25))
            {
                SignalDirection mrSig = GetMeanReversionSignal(idx);
                if (mrSig != SignalDirection.None)
                {
                    // H4 filter for MR: allow trades AGAINST H4 bias (that's the point of MR)
                    // but not if H4 bias is strongly confirmed (large EMA separation)
                    if (h4Bias != SignalDirection.None && h4SizeMult < 0.8 && h4Bias != mrSig) return;
                    OpenTrade(mrSig, idx, "MEANREV", h4SizeMult);
                }
            }
        }

        protected override void OnTick()
        {
            // Tick-level risk: check for hard breach and close immediately
            RiskAction action = _riskManager.CheckForBreach(Account.Equity);
            if (action == RiskAction.HardDaily || action == RiskAction.HardTotal)
            {
                CloseAllTrades("HARD_BREACH_TICK");
            }
        }

        protected override void OnStop()
        {
            PrintBacktestReport();
        }

        private void OnPositionClosed(PositionClosedEventArgs args)
        {
            var pos = args.Position;
            if (!pos.Label.StartsWith("MARS")) return;

            double pnl = pos.NetProfit;
            _dailyRealizedPnL += pnl;
            _positionSizer.RecordTrade(pnl);

            // Update trade record
            if (_openRecords.ContainsKey(pos.Id))
            {
                var rec       = _openRecords[pos.Id];
                rec.ExitTime  = Server.Time;
                // Reconstruct exit price from PnL: PnL = pipProfit * PipValue * Lots
                // ExitPrice ≈ EntryPrice ± (pnl / (VolumeInUnits * Symbol.PipValue / Symbol.PipSize))
                double lots       = pos.VolumeInUnits / Symbol.LotSize;
                double pipProfit  = lots > 0 && Symbol.PipValue > 0
                    ? pnl / (Symbol.PipValue * lots)
                    : 0;
                double priceDelta = pipProfit * Symbol.PipSize;
                rec.ExitPrice = pos.TradeType == TradeType.Buy
                    ? pos.EntryPrice + priceDelta
                    : pos.EntryPrice - priceDelta;
                rec.PnL       = pnl;
                _tradeRecords.Add(rec);
                _openRecords.Remove(pos.Id);
            }

            // Set cooldown if it was a loss
            if (pnl < 0)
            {
                _cooldownBars[SymbolName] = 3;
            }

            Print(string.Format("[MARS][CLOSED] {0} PnL={1:F2} DailyPnL={2:F2}",
                pos.Label, pnl, _dailyRealizedPnL));
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Strategy Logic
        // ═══════════════════════════════════════════════════════
        #region Strategy Logic

        // ──────────────────────────────────────────────────────────────
        //  TREND STRATEGY: EMA Pullback
        //
        //  Logic (LONG):
        //    1. EMA20 > EMA50   → uptrend on M15
        //    2. Close > EMA200  → long-term M15 bias bullish
        //    3. ADX ≥ 20        → market is actually trending
        //    4. Bar low ≤ EMA20 + 0.4×ATR AND close > EMA20
        //         → price dipped to / through EMA20 then closed above (pullback bounce)
        //    5. RSI 38–65       → momentum healthy, not already overbought
        //    6. Current bar bullish close (close > open) — confirming bar
        //    7. Previous close > EMA50 — trend still intact one bar ago
        //  SL → EMA50 − 0.6×ATR  (below trend anchor)
        //  TP → 2.5× SL distance (minimum; ManageOpenTrades handles trailing)
        // ──────────────────────────────────────────────────────────────
        private SignalDirection GetTrendSignal(int idx)
        {
            if (idx < 5) return SignalDirection.None;

            double emaF  = _emaFast.Result[idx];          // EMA20
            double emaS  = _emaSlow.Result[idx];          // EMA50
            double emaT  = _emaTrend.Result[idx];         // EMA200
            double emaF1 = _emaFast.Result[idx - 1];
            double emaS1 = _emaSlow.Result[idx - 1];
            double adx   = _dms.ADX[idx];
            double atr   = _atr.Result[idx];
            double close = Bars.ClosePrices[idx];
            double open  = Bars.OpenPrices[idx];
            double low   = Bars.LowPrices[idx];
            double high  = Bars.HighPrices[idx];
            double rsi   = CalcRSI(idx, 14);

            if (double.IsNaN(emaF) || double.IsNaN(emaS)) return SignalDirection.None;
            if (double.IsNaN(rsi))                         return SignalDirection.None;
            if (double.IsNaN(adx) || adx < 20)            return SignalDirection.None;
            if (atr <= 0)                                  return SignalDirection.None;

            // ── LONG ────────────────────────────────────────────────
            bool longTrend    = emaF  > emaS;                     // EMA20 > EMA50
            bool longBias     = double.IsNaN(emaT) || close > emaT; // price above EMA200 (skip if not warmed)
            bool longPullback = low <= emaF + atr * 0.4 &&        // bar dipped to EMA20 zone
                                close > emaF;                      // but closed above it
            bool longRSI      = rsi >= 38 && rsi <= 65;
            bool longCandle   = close > open;                      // bullish confirming bar
            bool longIntact   = Bars.ClosePrices[idx - 1] > emaS1; // prev close above EMA50

            if (longTrend && longBias && longPullback && longRSI && longCandle && longIntact)
            {
                return SignalDirection.Long;
            }

            // ── SHORT ────────────────────────────────────────────────
            bool shortTrend    = emaF  < emaS;
            bool shortBias     = double.IsNaN(emaT) || close < emaT;
            bool shortPullback = high >= emaF - atr * 0.4 &&
                                 close < emaF;
            bool shortRSI      = rsi >= 35 && rsi <= 62;
            bool shortCandle   = close < open;
            bool shortIntact   = Bars.ClosePrices[idx - 1] < emaS1;

            if (shortTrend && shortBias && shortPullback && shortRSI && shortCandle && shortIntact)
            {
                return SignalDirection.Short;
            }

            return SignalDirection.None;
        }

        // ──────────────────────────────────────────────────────────────
        //  MEAN REVERSION STRATEGY: Bollinger Band Extreme + Confirmation
        //
        //  Logic (LONG):
        //    1. ADX < 25        → ranging / low-trend environment
        //    2. Close ≤ BB lower band (20, 2.0 std)
        //    3. RSI < 38        → genuinely oversold
        //    4. Stoch %K(14) < 28 → stochastic confirms oversold
        //    5. Current bar is bullish (close > open) → reversal candle
        //    6. At least one of the previous 5 bars was INSIDE the bands
        //         → rules out free-falling price (falling-knife filter)
        //    7. BB width / midprice > 0.0008 → bands not compressed (< 8 pips)
        //         which would make fills random
        //  SL → close − 1.2×ATR
        //  TP → BB midline (ManageOpenTrades trails after)
        // ──────────────────────────────────────────────────────────────
        private SignalDirection GetMeanReversionSignal(int idx)
        {
            if (idx < 21) return SignalDirection.None;

            double adx = _dms.ADX[idx];
            if (!double.IsNaN(adx) && adx >= 25) return SignalDirection.None; // only in ranging

            double close = Bars.ClosePrices[idx];
            double open  = Bars.OpenPrices[idx];
            double bbMid, bbTop, bbBot;
            CalcBB(idx, 20, 2.0, out bbMid, out bbTop, out bbBot);
            double rsi    = CalcRSI(idx, 14);
            double stochK = CalcStochK(idx, 14);
            double atr    = _atr.Result[idx];

            if (double.IsNaN(bbTop) || double.IsNaN(bbBot)) return SignalDirection.None;
            if (double.IsNaN(rsi))                           return SignalDirection.None;
            if (bbMid <= 0)                                  return SignalDirection.None;

            // Skip if bands are too compressed (< ~8 pips on EURUSD)
            double bbWidth = (bbTop - bbBot) / bbMid;
            if (bbWidth < 0.0008) return SignalDirection.None;

            // Falling-knife / rocket-launch filter:
            // at least one of the 5 preceding bars must have closed inside the bands
            bool wasInsideBands = false;
            for (int i = idx - 1; i >= Math.Max(0, idx - 5); i--)
            {
                double bM, bT, bB;
                CalcBB(i, 20, 2.0, out bM, out bT, out bB);
                if (!double.IsNaN(bT) && Bars.ClosePrices[i] >= bB && Bars.ClosePrices[i] <= bT)
                {
                    wasInsideBands = true;
                    break;
                }
            }
            if (!wasInsideBands) return SignalDirection.None;

            // ── LONG: price at/below lower BB, oversold, reversal candle ──
            bool longBB     = close <= bbBot + atr * 0.1;   // at or just below lower band
            bool longRsi    = rsi < 38;
            bool longStoch  = double.IsNaN(stochK) || stochK < 28;
            bool longCandle = close > open;                  // bullish confirming bar

            if (longBB && longRsi && longStoch && longCandle)
            {
                Print(string.Format("[MARS][MR-LONG] {0} close={1:F5} bbBot={2:F5} RSI={3:F1} Stoch={4:F1}",
                    Server.Time.ToString("yyyy-MM-dd HH:mm"), close, bbBot, rsi, stochK));
                return SignalDirection.Long;
            }

            // ── SHORT: price at/above upper BB, overbought, reversal candle ──
            bool shortBB     = close >= bbTop - atr * 0.1;
            bool shortRsi    = rsi > 62;
            bool shortStoch  = double.IsNaN(stochK) || stochK > 72;
            bool shortCandle = close < open;                 // bearish confirming bar

            if (shortBB && shortRsi && shortStoch && shortCandle)
            {
                Print(string.Format("[MARS][MR-SHORT] {0} close={1:F5} bbTop={2:F5} RSI={3:F1} Stoch={4:F1}",
                    Server.Time.ToString("yyyy-MM-dd HH:mm"), close, bbTop, rsi, stochK));
                return SignalDirection.Short;
            }

            return SignalDirection.None;
        }

        /// <summary>
        /// Manual RSI — replaces built-in indicator which returns 0.0 (not NaN, so bypasses NaN check)
        /// in some cAlgo builds, permanently blocking trend entries. Uses Wilder smoothing.
        /// </summary>
        private double CalcRSI(int idx, int period)
        {
            // Forward indexing: older bars are at LOWER indices. Need period bars before idx.
            if (idx < period + 1) return double.NaN;
            double avgGain = 0, avgLoss = 0;
            // Scan from idx backward (idx = newest, idx-period = oldest of window)
            // change = close[i] - close[i-1] = newer minus older (positive = up move)
            for (int i = idx; i > idx - period; i--)
            {
                double change = Bars.ClosePrices[i] - Bars.ClosePrices[i - 1];
                if (change > 0) avgGain += change;
                else            avgLoss -= change;
            }
            avgGain /= period;
            avgLoss /= period;
            if (avgLoss == 0) return 100.0;
            double rs = avgGain / avgLoss;
            return 100.0 - 100.0 / (1.0 + rs);
        }

        /// <summary>
        /// Manual Bollinger Bands — replaces built-in indicator which returns NaN in some cAlgo builds.
        /// Indexes are cAlgo convention: 0 = current bar, 1 = last closed bar.
        /// </summary>
        private void CalcBB(int idx, int period, double stdDevMult,
                            out double mid, out double upper, out double lower)
        {
            mid   = double.NaN;
            upper = double.NaN;
            lower = double.NaN;
            // Forward indexing: older bars are at LOWER indices. Need period-1 bars before idx.
            if (idx < period - 1) return;
            double sum = 0;
            for (int i = idx; i > idx - period; i--)
                sum += Bars.ClosePrices[i];
            mid = sum / period;
            double sumSq = 0;
            for (int i = idx; i > idx - period; i--)
            {
                double d = Bars.ClosePrices[i] - mid;
                sumSq += d * d;
            }
            double sd = Math.Sqrt(sumSq / period);
            upper = mid + stdDevMult * sd;
            lower = mid - stdDevMult * sd;
        }

        /// <summary>
        /// Manual fast Stochastic %K — replaces built-in indicator as precaution.
        /// Returns value 0-100, or NaN if not enough bars.
        /// </summary>
        private double CalcStochK(int idx, int kPeriod)
        {
            // Forward indexing: older bars at LOWER indices. Need kPeriod-1 bars before idx.
            if (idx < kPeriod - 1) return double.NaN;
            double highN = double.MinValue;
            double lowN  = double.MaxValue;
            for (int i = idx; i > idx - kPeriod; i--)
            {
                if (Bars.HighPrices[i] > highN) highN = Bars.HighPrices[i];
                if (Bars.LowPrices[i]  < lowN)  lowN  = Bars.LowPrices[i];
            }
            double range = highN - lowN;
            if (range <= 0) return 50.0;
            return (Bars.ClosePrices[idx] - lowN) / range * 100.0;
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Trade Execution
        // ═══════════════════════════════════════════════════════
        #region Trade Execution

        private void OpenTrade(SignalDirection direction, int idx,
                                string signalSource, double h4SizeMult)
        {
            double atr = _atr.Result[idx];
            if (atr <= 0) return;

            double entryPrice = direction == SignalDirection.Long ? Symbol.Ask : Symbol.Bid;

            double slDistance;
            double tpDistance;

            if (signalSource == "TREND")
            {
                // Trend pullback: SL below/above EMA50 structural level
                double emaS = _emaSlow.Result[idx];
                if (double.IsNaN(emaS)) emaS = entryPrice; // fallback
                slDistance = direction == SignalDirection.Long
                    ? entryPrice - (emaS - atr * 0.6)     // entry to (EMA50 - 0.6 ATR)
                    : (emaS + atr * 0.6) - entryPrice;
                slDistance = Math.Abs(slDistance);
                tpDistance = slDistance * 2.5;             // 2.5:1 RR minimum
            }
            else // MEANREV
            {
                // Mean reversion: SL just beyond the band extreme
                slDistance = atr * 1.2;
                // TP = distance to BB mid from entry (at minimum 1.5:1 RR)
                double bbMid, bbTop, bbBot;
                CalcBB(idx, 20, 2.0, out bbMid, out bbTop, out bbBot);
                if (!double.IsNaN(bbMid) && bbMid > 0)
                {
                    double distToMid = Math.Abs(entryPrice - bbMid);
                    tpDistance = Math.Max(distToMid, slDistance * 1.5);
                }
                else
                {
                    tpDistance = slDistance * 1.5;
                }
            }

            // Enforce minimum stop distance
            double minStop = GetMinStopDistance();
            if (slDistance < minStop)
                slDistance = minStop;

            // Enforce minimum 1.5:1 RR
            if (tpDistance < slDistance * 1.5)
            {
                Print("[MARS] Skipping trade — TP < 1.5:1 RR. ATR=" + atr.ToString("F5"));
                return;
            }

            double slPips = slDistance / Symbol.PipSize;
            double tpPips = tpDistance / Symbol.PipSize;

            // Calculate lot size
            double regimeMult = _regimeEngine.GetSizeMultiplier();
            double lots = _positionSizer.CalculateLots(
                Account.Balance,
                RiskPercentPerTrade,
                slPips,
                Symbol.PipValue,
                Account.Equity,
                GetTotalUsedMargin(),
                Symbol.LotSize,
                _dailyRealizedPnL,
                _riskManager.DailyStartBalance,
                _riskManager,
                regimeMult,
                h4SizeMult);

            if (lots < 0.01)
            {
                Print("[MARS] Lot size too small, skipping trade.");
                return;
            }

            double volumeInUnits = Symbol.QuantityToVolumeInUnits(lots);
            volumeInUnits = Math.Max(Symbol.VolumeInUnitsMin,
                Math.Round(volumeInUnits / Symbol.VolumeInUnitsStep) * Symbol.VolumeInUnitsStep);

            TradeType tradeType = direction == SignalDirection.Long
                ? TradeType.Buy : TradeType.Sell;

            string label = "MARS_" + signalSource + "_" + Server.Time.ToString("HHmmss");

            var result = ExecuteMarketOrder(
                tradeType,
                SymbolName,
                volumeInUnits,
                label,
                slPips,
                tpPips,
                signalSource,
                false);

            if (!result.IsSuccessful)
            {
                Print("[MARS][EXEC ERROR] " + result.Error + " Label=" + label);
                return;
            }

            // Log trading day
            if (!_tradedToday)
            {
                _tradedToday = true;
                _riskManager.LogTradingDay();
                Print("[MARS] Trading day logged. Total days=" + _riskManager.TradingDaysLogged);
            }

            // Create open trade record
            var rec = new TradeRecord
            {
                EntryTime    = Server.Time,
                EntryPrice   = result.Position.EntryPrice,
                Direction    = tradeType,
                Lots         = lots,
                StopLoss     = result.Position.StopLoss ?? 0,
                TakeProfit   = result.Position.TakeProfit ?? 0,
                RegimeAtEntry = _regimeEngine.CurrentRegime,
                SignalSource = signalSource
            };
            _openRecords[result.Position.Id] = rec;

            Print(string.Format(
                "[MARS][OPEN] {0} {1} Lots={2:F2} Entry={3:F5} SL={4:F5} TP={5:F5} Regime={6}",
                label, tradeType, lots,
                result.Position.EntryPrice,
                result.Position.StopLoss, result.Position.TakeProfit,
                _regimeEngine.CurrentRegime));
        }

        private void ManageOpenTrades(int idx)
        {
            double atr = _atr.Result[idx];
            if (atr <= 0) return;

            foreach (var pos in Positions.ToArray())
            {
                if (!pos.Label.StartsWith("MARS") || pos.SymbolName != SymbolName)
                    continue;

                double unrealized = pos.NetProfit;
                double openTime   = (Server.Time - pos.EntryTime).TotalHours;
                double atrInPrice = atr;

                // ── Time exits ────────────────────────────────
                if (openTime > 36)
                {
                    UpdateExitReason(pos.Id, ExitReason.TimeExit);
                    ClosePosition(pos);
                    Print("[MARS][TIME EXIT >36h] " + pos.Label);
                    continue;
                }
                if (openTime > 20 && unrealized > 0)
                {
                    UpdateExitReason(pos.Id, ExitReason.TimeExit);
                    ClosePosition(pos);
                    Print("[MARS][TIME EXIT >20h IN PROFIT] " + pos.Label);
                    continue;
                }

                // ── Friday EOD close ──────────────────────────
                if (Server.Time.DayOfWeek == DayOfWeek.Friday &&
                    Server.Time.Hour == 20 && Server.Time.Minute >= 45)
                {
                    UpdateExitReason(pos.Id, ExitReason.WeekendClose);
                    ClosePosition(pos);
                    continue;
                }

                double currentPrice = pos.TradeType == TradeType.Buy ? Symbol.Bid : Symbol.Ask;
                double entryPrice   = pos.EntryPrice;
                double pipSize      = Symbol.PipSize;

                // Calculate profit in price terms
                double profitInPrice = pos.TradeType == TradeType.Buy
                    ? currentPrice - entryPrice
                    : entryPrice - currentPrice;

                // ── Partial close at 1.5× ATR ────────────────
                bool alreadyPartial = pos.Comment != null && pos.Comment.Contains("PARTIAL");
                if (!alreadyPartial && profitInPrice >= atrInPrice * 1.5)
                {
                    double halfVolume = Math.Floor(pos.VolumeInUnits * 0.5 / Symbol.VolumeInUnitsStep)
                                       * Symbol.VolumeInUnitsStep;
                    if (halfVolume >= Symbol.VolumeInUnitsMin)
                    {
                        ClosePosition(pos, halfVolume);
                        Print("[MARS][PARTIAL CLOSE 50%] " + pos.Label);
                        // After partial, modify to mark as partially closed
                        // (position object may be stale; the remainder continues)
                        continue;
                    }
                }

                // ── Breakeven at 1.0× ATR ────────────────────
                double newSl     = pos.StopLoss ?? 0;
                bool   modified  = false;

                if (profitInPrice >= atrInPrice * 1.0)
                {
                    double breakEvenSl = pos.TradeType == TradeType.Buy
                        ? entryPrice + pipSize         // entry + 1 pip
                        : entryPrice - pipSize;        // entry - 1 pip

                    if (pos.TradeType == TradeType.Buy  && (newSl < breakEvenSl))
                    {
                        newSl    = breakEvenSl;
                        modified = true;
                    }
                    else if (pos.TradeType == TradeType.Sell && (newSl == 0 || newSl > breakEvenSl))
                    {
                        newSl    = breakEvenSl;
                        modified = true;
                    }
                }

                // ── Trailing stop at 2.0× ATR ────────────────
                if (profitInPrice >= atrInPrice * 2.0)
                {
                    double trailSl = pos.TradeType == TradeType.Buy
                        ? currentPrice - atrInPrice * 1.2
                        : currentPrice + atrInPrice * 1.2;

                    if (pos.TradeType == TradeType.Buy  && trailSl > newSl)
                    {
                        newSl    = trailSl;
                        modified = true;
                    }
                    else if (pos.TradeType == TradeType.Sell && (newSl == 0 || trailSl < newSl))
                    {
                        newSl    = trailSl;
                        modified = true;
                    }
                }

                if (modified && newSl != 0)
                {
                    double tp = pos.TakeProfit ?? 0;
                    double tpVal = tp > 0 ? tp : 0;
                    ModifyPosition(pos, newSl, tpVal > 0 ? tpVal : (double?)null,
                                   ProtectionType.Absolute);
                }
            }
        }

        private void CloseAllTrades(string reason)
        {
            foreach (var pos in Positions.ToArray())
            {
                if (pos.Label.StartsWith("MARS"))
                {
                    UpdateExitReason(pos.Id, reason == "WEEKEND"
                        ? ExitReason.WeekendClose : ExitReason.DrawdownClose);
                    ClosePosition(pos);
                    Print("[MARS][CLOSE ALL] Reason=" + reason + " Pos=" + pos.Label);
                }
            }
            foreach (var order in PendingOrders.ToArray())
            {
                if (order.Label != null && order.Label.StartsWith("MARS"))
                    CancelPendingOrder(order);
            }
        }

        private void UpdateExitReason(int positionId, ExitReason reason)
        {
            if (_openRecords.ContainsKey(positionId))
                _openRecords[positionId].ExitReason = reason;
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Candle Patterns
        // ═══════════════════════════════════════════════════════
        #region Candle Patterns

        private bool IsBullishEngulfing(int idx)
        {
            if (idx < 1) return false; // need previous bar
            double prevOpen  = Bars.OpenPrices[idx - 1];  // older bar = lower index in forward indexing
            double prevClose = Bars.ClosePrices[idx - 1];
            double currOpen  = Bars.OpenPrices[idx];
            double currClose = Bars.ClosePrices[idx];
            // Previous bar is bearish, current bar is bullish and engulfs previous
            return prevClose < prevOpen &&
                   currClose > currOpen &&
                   currOpen  <= prevClose &&
                   currClose >= prevOpen;
        }

        private bool IsBearishEngulfing(int idx)
        {
            if (idx < 1) return false; // need previous bar
            double prevOpen  = Bars.OpenPrices[idx - 1];
            double prevClose = Bars.ClosePrices[idx - 1];
            double currOpen  = Bars.OpenPrices[idx];
            double currClose = Bars.ClosePrices[idx];
            // Previous bar is bullish, current bar is bearish and engulfs previous
            return prevClose > prevOpen &&
                   currClose < currOpen &&
                   currOpen  >= prevClose &&
                   currClose <= prevOpen;
        }

        private bool IsHammer(int idx)
        {
            double open  = Bars.OpenPrices[idx];
            double close = Bars.ClosePrices[idx];
            double high  = Bars.HighPrices[idx];
            double low   = Bars.LowPrices[idx];
            double range = high - low;
            if (range <= 0) return false;
            double body        = Math.Abs(close - open);
            double lowerWick   = Math.Min(open, close) - low;
            double upperWick   = high - Math.Max(open, close);
            // Body < 30% of range, lower wick >= 2x body, small upper wick
            return body < range * 0.30 &&
                   lowerWick >= body * 2.0 &&
                   upperWick <= body * 1.5;
        }

        private bool IsShootingStar(int idx)
        {
            double open  = Bars.OpenPrices[idx];
            double close = Bars.ClosePrices[idx];
            double high  = Bars.HighPrices[idx];
            double low   = Bars.LowPrices[idx];
            double range = high - low;
            if (range <= 0) return false;
            double body      = Math.Abs(close - open);
            double upperWick = high - Math.Max(open, close);
            double lowerWick = Math.Min(open, close) - low;
            // Body < 30% of range, upper wick >= 2x body, small lower wick
            return body < range * 0.30 &&
                   upperWick >= body * 2.0 &&
                   lowerWick <= body * 1.5;
        }

        private bool IsBullishPinBar(int idx)
        {
            double open  = Bars.OpenPrices[idx];
            double close = Bars.ClosePrices[idx];
            double high  = Bars.HighPrices[idx];
            double low   = Bars.LowPrices[idx];
            double range = high - low;
            if (range <= 0) return false;
            // Close within top 25% of range and long lower wick
            double closeFromLow  = close - low;
            bool   closesHighInRange = closeFromLow >= range * 0.75;
            double lowerWick     = Math.Min(open, close) - low;
            return closesHighInRange && lowerWick >= range * 0.5;
        }

        private bool IsBearishPinBar(int idx)
        {
            double open  = Bars.OpenPrices[idx];
            double close = Bars.ClosePrices[idx];
            double high  = Bars.HighPrices[idx];
            double low   = Bars.LowPrices[idx];
            double range = high - low;
            if (range <= 0) return false;
            // Close within bottom 25% of range and long upper wick
            double closeFromLow  = close - low;
            bool   closesLowInRange = closeFromLow <= range * 0.25;
            double upperWick     = high - Math.Max(open, close);
            return closesLowInRange && upperWick >= range * 0.5;
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Session & News Filters
        // ═══════════════════════════════════════════════════════
        #region Session & News Filters

        private bool IsSessionOpen(DateTime utcTime)
        {
            int hour    = utcTime.Hour;
            int minute  = utcTime.Minute;
            double hhmm = hour + minute / 60.0;

            // London: 07:15 – 11:45 UTC
            bool london = hhmm >= 7.25 && hhmm <= 11.75;
            // New York: 13:15 – 16:45 UTC
            bool newYork = hhmm >= 13.25 && hhmm <= 16.75;
            // Asian: 01:00 – 04:00 UTC  (USDJPY, XAUUSD only)
            bool asian  = hhmm >= 1.0 && hhmm <= 4.0;

            if (london || newYork) return true;

            if (asian)
            {
                return SymbolName.Contains("JPY") || SymbolName.Contains("XAU") ||
                       SymbolName == "USDJPY"      || SymbolName == "XAUUSD";
            }
            return false;
        }

        private bool IsNewsBlackout(DateTime utcTime)
        {
            // FOMC full-day blackout
            if (_fomcDates.Contains(utcTime.Date)) return true;

            // ECB: 2 hours around 12:15 UTC on ECB days
            if (_ecbDates.Contains(utcTime.Date))
            {
                double hhmm = utcTime.Hour + utcTime.Minute / 60.0;
                if (hhmm >= 10.25 && hhmm <= 14.25) return true; // 10:15 – 14:15
            }

            // US NFP: first Friday of month, 13:30 UTC ± (30 before, 45 after)
            if (utcTime.DayOfWeek == DayOfWeek.Friday && IsFirstFridayOfMonth(utcTime))
            {
                double hhmm = utcTime.Hour + utcTime.Minute / 60.0;
                if (hhmm >= 13.0 && hhmm <= 14.75) return true; // 13:00 – 14:45
            }

            // US CPI: 2nd or 3rd Wednesday of month, 13:30 UTC ± (20 before, 30 after)
            if (utcTime.DayOfWeek == DayOfWeek.Wednesday && IsSecondOrThirdWednesdayOfMonth(utcTime))
            {
                double hhmm = utcTime.Hour + utcTime.Minute / 60.0;
                if (hhmm >= 13.1667 && hhmm <= 14.0) return true; // 13:10 – 14:00
            }

            return false;
        }

        private bool IsFirstFridayOfMonth(DateTime date)
        {
            // It's the first Friday if day-of-month <= 7
            return date.Day <= 7;
        }

        private bool IsSecondOrThirdWednesdayOfMonth(DateTime date)
        {
            int wedCount = 0;
            for (int d = 1; d <= date.Day; d++)
            {
                var dt = new DateTime(date.Year, date.Month, d);
                if (dt.DayOfWeek == DayOfWeek.Wednesday)
                    wedCount++;
            }
            return wedCount == 2 || wedCount == 3;
        }

        private void ParseDates(string csv, HashSet<DateTime> set)
        {
            if (string.IsNullOrWhiteSpace(csv)) return;
            foreach (var part in csv.Split(','))
            {
                var s = part.Trim();
                if (DateTime.TryParse(s, out DateTime dt))
                    set.Add(dt.Date);
            }
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Utilities
        // ═══════════════════════════════════════════════════════
        #region Utilities

        private void UpdateVwap(int idx)
        {
            var barDate = Bars.OpenTimes[idx].Date;
            if (barDate != _vwapResetDate)
            {
                // New day — rebuild VWAP from first bar of today
                _vwapNumerator   = 0;
                _vwapDenominator = 0;
                _vwapResetDate   = barDate;

                // Accumulate all bars from today
                for (int i = Bars.Count - 1; i >= 1; i--)
                {
                    if (Bars.OpenTimes[i].Date != barDate) continue;
                    double tp  = (Bars.HighPrices[i] + Bars.LowPrices[i] + Bars.ClosePrices[i]) / 3.0;
                    double vol = Bars.TickVolumes[i];
                    _vwapNumerator   += tp * vol;
                    _vwapDenominator += vol;
                }
            }
            else
            {
                // Add this bar's contribution
                double tp  = (Bars.HighPrices[idx] + Bars.LowPrices[idx] + Bars.ClosePrices[idx]) / 3.0;
                double vol = Bars.TickVolumes[idx];
                _vwapNumerator   += tp * vol;
                _vwapDenominator += vol;
            }
            _currentVwap = _vwapDenominator > 0
                ? _vwapNumerator / _vwapDenominator
                : Bars.ClosePrices[idx];
        }

        private double GetMinStopDistance()
        {
            switch (SymbolName)
            {
                case "EURUSD": return 10 * Symbol.PipSize;
                case "GBPUSD": return 12 * Symbol.PipSize;
                case "USDJPY": return 10 * Symbol.PipSize;
                case "XAUUSD": return 150 * Symbol.PipSize;
                case "US30":   return 50  * Symbol.PipSize;
                case "NAS100": return 80  * Symbol.PipSize;
                default:       return 10  * Symbol.PipSize;
            }
        }

        private double GetTotalUsedMargin()
        {
            double total = 0;
            foreach (var pos in Positions)
            {
                // Approximate margin: (volume in units / leverage = 100) per position
                // VolumeInUnits / 100 gives the base currency margin at 1:100 leverage
                total += pos.VolumeInUnits / 100.0;
            }
            return total;
        }
        #endregion

        // ═══════════════════════════════════════════════════════
        //  #region Backtest Analytics — PrintBacktestReport
        // ═══════════════════════════════════════════════════════
        #region Backtest Analytics

        private void PrintBacktestReport()
        {
            Print("═══════════════════════════════════════════════════════");
            Print("  MARS BACKTEST REPORT");
            Print("═══════════════════════════════════════════════════════");

            int    totalTrades = _tradeRecords.Count;
            if (totalTrades == 0)
            {
                Print("No completed trades recorded.");
                return;
            }

            int    wins      = _tradeRecords.Count(r => r.PnL > 0);
            int    losses    = totalTrades - wins;
            double winRate   = (double)wins / totalTrades * 100.0;
            double avgWin    = wins   > 0 ? _tradeRecords.Where(r => r.PnL > 0).Average(r => r.PnL) : 0;
            double avgLoss   = losses > 0 ? _tradeRecords.Where(r => r.PnL <= 0).Average(r => r.PnL) : 0;
            double grossPnl  = _tradeRecords.Sum(r => r.PnL);
            double grossWins = _tradeRecords.Where(r => r.PnL > 0).Sum(r => r.PnL);
            double grossLoss = Math.Abs(_tradeRecords.Where(r => r.PnL <= 0).Sum(r => r.PnL));
            double pfactor   = grossLoss > 0 ? grossWins / grossLoss : double.PositiveInfinity;

            double totalReturnPct = grossPnl / _riskManager.InitialBalance * 100.0;

            // Sharpe Ratio (annualized)
            double sharpe = 0;
            if (_dailyReturns.Count > 1)
            {
                double[] returns = _dailyReturns.Values.ToArray();
                double mean      = returns.Average();
                double variance  = returns.Select(r => (r - mean) * (r - mean)).Average();
                double stdDev    = Math.Sqrt(variance);
                sharpe = stdDev > 0 ? (mean / stdDev) * Math.Sqrt(252) : 0;
            }

            // Calmar Ratio
            double calmar = _maxDrawdownPct > 0 ? totalReturnPct / _maxDrawdownPct : 0;

            // Best / Worst day
            DateTime bestDay   = DateTime.MinValue;
            DateTime worstDay  = DateTime.MinValue;
            double   bestDayPnL  = double.MinValue;
            double   worstDayPnL = double.MaxValue;

            // Group trades by day
            var byDay = _tradeRecords.GroupBy(r => r.ExitTime.Date);
            foreach (var grp in byDay)
            {
                double dayPnL = grp.Sum(r => r.PnL);
                if (dayPnL > bestDayPnL)  { bestDayPnL  = dayPnL;  bestDay  = grp.Key; }
                if (dayPnL < worstDayPnL) { worstDayPnL = dayPnL;  worstDay = grp.Key; }
            }

            // FTMO compliance check
            bool ftmoCompliant = !_riskManager.IsTotalLimitBreached &&
                                  _maxDrawdownPct < 10.0 &&
                                  totalReturnPct  >= 0;

            Print(string.Format("  Total Trades       : {0}", totalTrades));
            Print(string.Format("  Win Rate           : {0:F2}%  ({1}W / {2}L)", winRate, wins, losses));
            Print(string.Format("  Average Win        : ${0:F2}", avgWin));
            Print(string.Format("  Average Loss       : ${0:F2}", avgLoss));
            Print(string.Format("  Profit Factor      : {0:F3}", pfactor));
            Print(string.Format("  Max Drawdown       : {0:F2}%", _maxDrawdownPct));
            Print(string.Format("  Total Return       : {0:F2}%  (${1:F2})", totalReturnPct, grossPnl));
            Print(string.Format("  Sharpe Ratio       : {0:F3}  (annualized)", sharpe));
            Print(string.Format("  Calmar Ratio       : {0:F3}", calmar));
            Print(string.Format("  Best Day           : {0:yyyy-MM-dd}  +${1:F2}", bestDay, bestDayPnL));
            Print(string.Format("  Worst Day          : {0:yyyy-MM-dd}  ${1:F2}", worstDay, worstDayPnL));
            Print(string.Format("  Trading Days Logged: {0}", _riskManager.TradingDaysLogged));
            Print(string.Format("  FTMO Rules Respected: {0}", ftmoCompliant ? "YES" : "NO — BREACH DETECTED"));
            Print("═══════════════════════════════════════════════════════");

            // Per-trade log
            Print("--- TRADE LOG ---");
            foreach (var r in _tradeRecords)
            {
                Print(string.Format(
                    "  [{0}] {1} {2} Lots={3:F2} Entry={4:F5} Exit={5:F5} PnL={6:F2} " +
                    "Exit={7} Regime={8} Src={9}",
                    r.EntryTime.ToString("yyyy-MM-dd HH:mm"),
                    r.Direction, r.SignalSource, r.Lots,
                    r.EntryPrice, r.ExitPrice, r.PnL,
                    r.ExitReason, r.RegimeAtEntry, r.SignalSource));
            }
        }
        #endregion

    } // end class MARSTradingBot
} // end namespace cAlgo.Robots
