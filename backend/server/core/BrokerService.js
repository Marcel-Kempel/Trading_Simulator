import { createSeededRng } from "../utils/rng.js";

const ORDER_STATUS = {
  OPEN: "OPEN",
  FILLED: "FILLED",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
};

const VALID_TYPES = new Set(["MARKET", "LIMIT", "STOP", "STOP_LIMIT"]);
const VALID_SIDES = new Set(["BUY", "SELL", "SELL_SHORT", "BUY_TO_COVER"]);
const VALID_TIFS = new Set(["DAY", "GTC", "IOC"]);

function sleep(ms) {
  if (!ms || ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundMoney(value) {
  return Number(value.toFixed(6));
}

function nextBusinessDay(date, addDays) {
  const next = new Date(date.getTime());
  let remaining = addDays;
  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return next;
}

function toIsoDate(value) {
  return value.toISOString().slice(0, 10);
}

function isMarketOpen(config, now = new Date()) {
  if (!config.enforceMarketHours) {
    return true;
  }
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return false;
  }
  const openMinutes = config.marketOpenHour * 60 + config.marketOpenMinute;
  const closeMinutes = config.marketCloseHour * 60 + config.marketCloseMinute;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

function normalizeOrderInput(input) {
  const type = String(input.type || "").toUpperCase();
  const side = String(input.side || "").toUpperCase();
  const tif = String(input.tif || "DAY").toUpperCase();
  const quantity = Number(input.quantity);
  const limitPrice = input.limitPrice == null ? null : Number(input.limitPrice);
  const stopPrice = input.stopPrice == null ? null : Number(input.stopPrice);

  return { type, side, tif, quantity, limitPrice, stopPrice, symbol: String(input.symbol || "").toUpperCase() };
}

function calcFees(config, notional) {
  const rateFee = notional * (config.feeRateBps / 10000);
  return roundMoney(config.commissionPerTrade + rateFee);
}

function calcSlippageBps(config, rng, quantity, volatilityProxy) {
  const random = rng();
  const sizeTerm = Math.log10(1 + quantity) * config.sizeImpactBps;
  const volTerm = volatilityProxy * 10000 * 0.05;
  return config.baseSlippageBps + sizeTerm + volTerm + random * config.randomSlippageBps;
}

function applyPriceImpact(basePrice, isBuy, slippageBps) {
  const direction = isBuy ? 1 : -1;
  const impacted = basePrice * (1 + (direction * slippageBps) / 10000);
  return roundMoney(impacted);
}

function sideIsBuy(side) {
  return side === "BUY" || side === "BUY_TO_COVER";
}

function updateSignedPosition(existing, deltaQty, fillPrice) {
  const currentQty = existing?.quantity ?? 0;
  const currentAvg = existing?.avgPrice ?? fillPrice;
  const nextQty = currentQty + deltaQty;

  if (currentQty === 0 || Math.sign(currentQty) === Math.sign(deltaQty)) {
    const newQty = currentQty + deltaQty;
    const weighted = (Math.abs(currentQty) * currentAvg + Math.abs(deltaQty) * fillPrice) / Math.abs(newQty);
    return { quantity: roundMoney(newQty), avgPrice: roundMoney(weighted) };
  }

  if (nextQty === 0) {
    return { quantity: 0, avgPrice: 0 };
  }

  if (Math.sign(currentQty) === Math.sign(nextQty)) {
    return { quantity: roundMoney(nextQty), avgPrice: roundMoney(currentAvg) };
  }

  return { quantity: roundMoney(nextQty), avgPrice: roundMoney(fillPrice) };
}

function validateOrderByType(order) {
  if (!VALID_TYPES.has(order.type)) {
    return "unsupported order type";
  }
  if (!VALID_SIDES.has(order.side)) {
    return "unsupported side";
  }
  if (!VALID_TIFS.has(order.tif)) {
    return "unsupported tif";
  }
  if (!(order.quantity > 0)) {
    return "invalid quantity";
  }
  if (order.type === "LIMIT" && !(order.limitPrice > 0)) {
    return "invalid limit price";
  }
  if (order.type === "STOP" && !(order.stopPrice > 0)) {
    return "invalid stop price";
  }
  if (order.type === "STOP_LIMIT" && (!(order.stopPrice > 0) || !(order.limitPrice > 0))) {
    return "invalid stop/limit prices";
  }
  if (order.type === "MARKET" && order.tif === "GTC") {
    return "unsupported order type/tif combination";
  }
  return null;
}

export function calculateMarginRequirements(config, longValue, shortValue) {
  return {
    initialRequired: config.initialMarginLong * longValue + config.initialMarginShort * shortValue,
    maintenanceRequired: config.maintenanceMarginLong * longValue + config.maintenanceMarginShort * shortValue,
  };
}

export function calculatePositionPnl(position, quoteMid) {
  if (!position || position.quantity === 0) {
    return { marketValue: 0, unrealizedPnl: 0 };
  }
  const marketValue = quoteMid * position.quantity;
  const pnl = position.quantity > 0
    ? (quoteMid - position.avgPrice) * position.quantity
    : (position.avgPrice - quoteMid) * Math.abs(position.quantity);
  return { marketValue: roundMoney(marketValue), unrealizedPnl: roundMoney(pnl) };
}

export class BrokerService {
  constructor({ marketDataService, config }) {
    this.marketDataService = marketDataService;
    this.config = config;
    this.rng = createSeededRng(config.seed);
    this.accounts = new Map();
  }

  createAccount(initialCapital = 100000) {
    const accountId = `ACC-${Date.now()}-${Math.floor(this.rng() * 10000)}`;
    const now = new Date();
    const account = {
      id: accountId,
      createdAt: now.toISOString(),
      settledCash: roundMoney(initialCapital),
      unsettledCash: 0,
      reservedCash: 0,
      feesDue: 0,
      positions: {},
      orders: [],
      fills: [],
      pendingSettlements: [],
      lastBorrowFeeDate: toIsoDate(now),
    };
    this.accounts.set(accountId, account);
    return account;
  }

  async getAccount(accountId) {
    const account = this.#requireAccount(accountId);
    await this.#refreshAccount(account);
    return this.#toAccountView(account);
  }

  async getPositions(accountId) {
    const account = this.#requireAccount(accountId);
    await this.#refreshAccount(account);

    const result = [];
    for (const position of Object.values(account.positions)) {
      const quote = await this.marketDataService.peekQuote(position.symbol);
      const { marketValue, unrealizedPnl } = calculatePositionPnl(position, quote.mid);
      result.push({
        symbol: position.symbol,
        quantity: position.quantity,
        avgPrice: position.avgPrice,
        mid: quote.mid,
        marketValue,
        unrealizedPnl,
      });
    }
    return result;
  }

  async getOrders(accountId, status) {
    const account = this.#requireAccount(accountId);
    await this.#refreshAccount(account);
    if (!status) {
      return account.orders;
    }
    return account.orders.filter((order) => order.status === status.toUpperCase());
  }

  async getFills(accountId) {
    const account = this.#requireAccount(accountId);
    await this.#refreshAccount(account);
    return account.fills;
  }

  async getQuote(symbol) {
    return this.marketDataService.getQuote(symbol.toUpperCase());
  }

  async placeOrder(accountId, rawOrder) {
    const account = this.#requireAccount(accountId);
    await this.#refreshAccount(account);

    const order = normalizeOrderInput(rawOrder);
    const bypassMarginCheck = rawOrder._bypassMarginCheck === true;
    const baseOrder = {
      id: `ORD-${Date.now()}-${Math.floor(this.rng() * 10000)}`,
      accountId: account.id,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      tif: order.tif,
      quantity: order.quantity,
      limitPrice: order.limitPrice,
      stopPrice: order.stopPrice,
      status: ORDER_STATUS.OPEN,
      reason: null,
      createdAt: new Date().toISOString(),
      filledAt: null,
      fillPrice: null,
      fees: 0,
    };

    const validationError = validateOrderByType(order);
    if (validationError) {
      return this.#rejectOrder(account, baseOrder, validationError);
    }
    if (!isMarketOpen(this.config, new Date())) {
      return this.#rejectOrder(account, baseOrder, "market closed");
    }

    let quote;
    try {
      quote = await this.marketDataService.getQuote(order.symbol);
    } catch {
      return this.#rejectOrder(account, baseOrder, "unknown symbol");
    }

    if (!bypassMarginCheck && this.#hasMaintenanceDeficiency(await this.#computeMetrics(account))) {
      return this.#rejectOrder(account, baseOrder, "margin deficiency: account below maintenance");
    }

    const triggerState = this.#evaluateTrigger(order, quote);
    if (triggerState === "PENDING_TRIGGER") {
      account.orders.unshift(baseOrder);
      return baseOrder;
    }
    if (triggerState === "PENDING_LIMIT") {
      account.orders.unshift(baseOrder);
      return baseOrder;
    }

    await sleep(this.config.executionDelayMs);
    const executionQuote = await this.marketDataService.getQuote(order.symbol);
    const effectiveType = triggerState === "TRIGGERED_TO_MARKET" ? "MARKET" : (triggerState === "TRIGGERED_TO_LIMIT" ? "LIMIT" : order.type);
    const fillCheck = this.#evaluateFillCondition(effectiveType, order, executionQuote);
    if (!fillCheck.fillable) {
      account.orders.unshift(baseOrder);
      return baseOrder;
    }

    const isBuy = sideIsBuy(order.side);
    const basePrice = isBuy ? executionQuote.ask : executionQuote.bid;
    const slippageBps = calcSlippageBps(this.config, this.rng, order.quantity, executionQuote.volatilityProxy);
    const fillPrice = applyPriceImpact(basePrice, isBuy, slippageBps);
    const notional = roundMoney(fillPrice * order.quantity);
    const fees = calcFees(this.config, notional);

    if (!bypassMarginCheck) {
      const simulation = await this.#simulatePostTrade(account, order, fillPrice, notional, fees);
      if (!simulation.ok) {
        return this.#rejectOrder(account, baseOrder, simulation.reason);
      }
    }

    this.#applyTrade(account, order, fillPrice, notional, fees);

    const filledOrder = {
      ...baseOrder,
      status: ORDER_STATUS.FILLED,
      filledAt: new Date().toISOString(),
      fillPrice,
      fees,
      triggerState,
      effectiveType,
    };
    account.orders.unshift(filledOrder);
    account.fills.unshift({
      id: `FIL-${Date.now()}-${Math.floor(this.rng() * 10000)}`,
      orderId: filledOrder.id,
      accountId: account.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: fillPrice,
      notional,
      fees,
      timestamp: new Date().toISOString(),
    });

    await this.#refreshAccount(account);
    return filledOrder;
  }

  async #simulatePostTrade(account, order, fillPrice, notional, fees) {
    const draft = structuredClone(account);
    this.#applyTrade(draft, order, fillPrice, notional, fees);
    const metrics = await this.#computeMetrics(draft);

    if (this.#availableCash(draft) < 0) {
      return { ok: false, reason: "insufficient available buying power / margin" };
    }
    if (metrics.equity < metrics.initialRequired) {
      return { ok: false, reason: "insufficient available buying power / margin" };
    }
    return { ok: true };
  }

  #applyTrade(account, order, fillPrice, notional, fees) {
    const isBuy = sideIsBuy(order.side);
    const deltaQty = isBuy ? order.quantity : -order.quantity;

    const current = account.positions[order.symbol] || { symbol: order.symbol, quantity: 0, avgPrice: 0 };
    const updated = updateSignedPosition(current, deltaQty, fillPrice);
    if (updated.quantity === 0) {
      delete account.positions[order.symbol];
    } else {
      account.positions[order.symbol] = { symbol: order.symbol, quantity: updated.quantity, avgPrice: updated.avgPrice };
    }

    const now = new Date();
    const settleAt = nextBusinessDay(now, this.config.settlementDaysEquities).toISOString();
    if (isBuy) {
      account.reservedCash = roundMoney(account.reservedCash + notional);
      account.pendingSettlements.push({ amount: notional, direction: "DEBIT", settleAt, symbol: order.symbol });
    } else {
      account.unsettledCash = roundMoney(account.unsettledCash + notional);
      account.pendingSettlements.push({ amount: notional, direction: "CREDIT", settleAt, symbol: order.symbol });
    }
    account.feesDue = roundMoney(account.feesDue + fees);
  }

  #evaluateTrigger(order, quote) {
    if (order.type === "MARKET" || order.type === "LIMIT") {
      return "NOT_REQUIRED";
    }
    const isBuy = sideIsBuy(order.side);
    const triggered = isBuy ? quote.mid >= order.stopPrice : quote.mid <= order.stopPrice;
    if (!triggered) {
      return "PENDING_TRIGGER";
    }
    return order.type === "STOP" ? "TRIGGERED_TO_MARKET" : "TRIGGERED_TO_LIMIT";
  }

  #evaluateFillCondition(effectiveType, order, quote) {
    if (effectiveType === "MARKET") {
      return { fillable: true };
    }
    const isBuy = sideIsBuy(order.side);
    if (isBuy) {
      return { fillable: quote.ask <= order.limitPrice };
    }
    return { fillable: quote.bid >= order.limitPrice };
  }

  #rejectOrder(account, baseOrder, reason) {
    const order = { ...baseOrder, status: ORDER_STATUS.REJECTED, reason };
    account.orders.unshift(order);
    return order;
  }

  #availableCash(account) {
    return roundMoney(account.settledCash - account.reservedCash - account.feesDue);
  }

  async #computeMetrics(account) {
    let longValue = 0;
    let shortValue = 0;
    let marketValue = 0;

    for (const position of Object.values(account.positions)) {
      const quote = await this.marketDataService.peekQuote(position.symbol);
      const posValue = position.quantity * quote.mid;
      marketValue += posValue;
      if (position.quantity > 0) {
        longValue += position.quantity * quote.mid;
      } else if (position.quantity < 0) {
        shortValue += Math.abs(position.quantity) * quote.mid;
      }
    }

    const { initialRequired, maintenanceRequired } = calculateMarginRequirements(this.config, longValue, shortValue);
    const cash = account.settledCash + account.unsettledCash;
    const equity = roundMoney(cash + marketValue - account.feesDue);
    return {
      longValue: roundMoney(longValue),
      shortValue: roundMoney(shortValue),
      marketValue: roundMoney(marketValue),
      equity,
      initialRequired: roundMoney(initialRequired),
      maintenanceRequired: roundMoney(maintenanceRequired),
      marginExcess: roundMoney(equity - maintenanceRequired),
      availableCash: this.#availableCash(account),
    };
  }

  #hasMaintenanceDeficiency(metrics) {
    return metrics.equity < metrics.maintenanceRequired;
  }

  async #refreshAccount(account) {
    this.#settleDueEntries(account);
    await this.#applyBorrowFeesIfNeeded(account);

    if (this.config.forceLiquidationEnabled) {
      const metrics = await this.#computeMetrics(account);
      if (this.#hasMaintenanceDeficiency(metrics)) {
        await this.#forceLiquidateLargestPosition(account);
      }
    }
  }

  #settleDueEntries(account) {
    const now = new Date();
    const due = [];
    const pending = [];

    for (const entry of account.pendingSettlements) {
      if (new Date(entry.settleAt) <= now) {
        due.push(entry);
      } else {
        pending.push(entry);
      }
    }
    account.pendingSettlements = pending;

    for (const entry of due) {
      if (entry.direction === "DEBIT") {
        account.settledCash = roundMoney(account.settledCash - entry.amount);
        account.reservedCash = roundMoney(Math.max(0, account.reservedCash - entry.amount));
      } else {
        account.settledCash = roundMoney(account.settledCash + entry.amount);
        account.unsettledCash = roundMoney(account.unsettledCash - entry.amount);
      }
    }

    if (account.feesDue > 0) {
      account.settledCash = roundMoney(account.settledCash - account.feesDue);
      account.feesDue = 0;
    }
  }

  async #applyBorrowFeesIfNeeded(account) {
    const today = toIsoDate(new Date());
    if (account.lastBorrowFeeDate === today) {
      return;
    }

    const from = new Date(account.lastBorrowFeeDate);
    const to = new Date(today);
    let days = 0;
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      days += 1;
    }
    if (days <= 0) {
      account.lastBorrowFeeDate = today;
      return;
    }

    let shortValue = 0;
    for (const position of Object.values(account.positions)) {
      if (position.quantity >= 0) {
        continue;
      }
      const quote = await this.marketDataService.peekQuote(position.symbol);
      shortValue += Math.abs(position.quantity) * quote.mid;
    }
    const borrowFee = roundMoney(shortValue * this.config.shortBorrowDailyRate * days);
    if (borrowFee > 0) {
      account.feesDue = roundMoney(account.feesDue + borrowFee);
    }
    account.lastBorrowFeeDate = today;
  }

  async #forceLiquidateLargestPosition(account) {
    const positions = Object.values(account.positions);
    if (positions.length === 0) {
      return;
    }

    const withValue = [];
    for (const position of positions) {
      const quote = await this.marketDataService.peekQuote(position.symbol);
      withValue.push({ position, absValue: Math.abs(position.quantity * quote.mid) });
    }
    withValue.sort((a, b) => b.absValue - a.absValue);
    const target = withValue[0].position;
    const side = target.quantity > 0 ? "SELL" : "BUY_TO_COVER";

    const forced = await this.placeOrder(account.id, {
      symbol: target.symbol,
      type: "MARKET",
      side,
      quantity: Math.abs(target.quantity),
      tif: "IOC",
      _bypassMarginCheck: true,
    });

    if (forced.status === ORDER_STATUS.REJECTED) {
      const marker = {
        id: `ORD-${Date.now()}-MARGINCALL`,
        accountId: account.id,
        symbol: target.symbol,
        type: "MARKET",
        side,
        tif: "IOC",
        quantity: Math.abs(target.quantity),
        status: ORDER_STATUS.REJECTED,
        reason: "margin_call_forced_liquidation_failed",
        createdAt: new Date().toISOString(),
      };
      account.orders.unshift(marker);
    }
  }

  async #toAccountView(account) {
    const metrics = await this.#computeMetrics(account);
    return {
      id: account.id,
      createdAt: account.createdAt,
      balances: {
        settledCash: roundMoney(account.settledCash),
        unsettledCash: roundMoney(account.unsettledCash),
        availableCash: roundMoney(metrics.availableCash),
        reservedCash: roundMoney(account.reservedCash),
      },
      equity: metrics.equity,
      margin: {
        longValue: metrics.longValue,
        shortValue: metrics.shortValue,
        initialRequired: metrics.initialRequired,
        maintenanceRequired: metrics.maintenanceRequired,
        marginExcess: metrics.marginExcess,
      },
      feesDue: roundMoney(account.feesDue),
      openPositions: Object.keys(account.positions).length,
      openOrders: account.orders.filter((order) => order.status === ORDER_STATUS.OPEN).length,
    };
  }

  #requireAccount(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`account_not_found:${accountId}`);
    }
    return account;
  }
}
