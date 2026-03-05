package com.tradex.service;

import com.tradex.config.BrokerConfig;
import com.tradex.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class BrokerService {

    private final BrokerConfig config;
    private MarketDataService marketDataService;
    private final Map<String, Account> accounts = new ConcurrentHashMap<>();
    private final Random random = new Random(1337);

    public BrokerService(BrokerConfig config) {
        this.config = config;
    }

    @PostConstruct
    public void init() {
        this.marketDataService = new ReplayMarketDataService(config.getBaseSpreadBps());
    }

    // ─── Symbols ─────────────────────────────────────────

    public List<String> getSymbols() {
        return marketDataService.getSymbols();
    }

    // ─── Accounts ────────────────────────────────────────

    public Map<String, String> createAccount(double initialCapital) {
        if (!Double.isFinite(initialCapital) || initialCapital <= 0) {
            throw new IllegalArgumentException("invalid initialCapital");
        }
        String id = UUID.randomUUID().toString();
        Account account = new Account(id, initialCapital, Instant.now().toString());
        accounts.put(id, account);
        return Map.of("id", id);
    }

    public AccountSummary getAccount(String id) {
        Account acct = requireAccount(id);
        List<Position> positions = enrichPositions(acct);

        double unrealizedPnl = positions.stream().mapToDouble(Position::getUnrealizedPnl).sum();
        double realizedPnl = acct.getFills().stream().mapToDouble(Fill::getRealizedPnl).sum();
        double totalFees = acct.getFills().stream().mapToDouble(f -> f.getCommission() + f.getFee()).sum();
        double equity = acct.getCashBalance() + positions.stream().mapToDouble(Position::getMarketValue).sum();

        AccountSummary summary = new AccountSummary();
        summary.setId(acct.getId());
        summary.setInitialCapital(acct.getInitialCapital());
        summary.setCashBalance(round2(acct.getCashBalance()));
        summary.setEquity(round2(equity));
        summary.setUnrealizedPnl(round2(unrealizedPnl));
        summary.setRealizedPnl(round2(realizedPnl));
        summary.setTotalFees(round2(totalFees));
        summary.setPositionCount((int) positions.stream().filter(p -> p.getQuantity() != 0).count());
        summary.setCreatedAt(acct.getCreatedAt());
        return summary;
    }

    // ─── Positions ───────────────────────────────────────

    public List<Position> getPositions(String id) {
        Account acct = requireAccount(id);
        return enrichPositions(acct);
    }

    private List<Position> enrichPositions(Account acct) {
        // Group position entries by symbol
        Map<String, int[]> qtyMap = new HashMap<>();
        Map<String, double[]> costMap = new HashMap<>();

        for (Account.PositionEntry pe : acct.getPositions()) {
            qtyMap.computeIfAbsent(pe.getSymbol(), k -> new int[]{0})[0] += pe.getQuantity();
            costMap.computeIfAbsent(pe.getSymbol(), k -> new double[]{0})[0] += pe.getQuantity() * pe.getAvgPrice();
        }

        List<Position> results = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : qtyMap.entrySet()) {
            String symbol = entry.getKey();
            int qty = entry.getValue()[0];
            if (qty == 0) continue;

            double totalCost = costMap.get(symbol)[0];
            double avgPrice = totalCost / qty;
            double currentPrice;
            try {
                currentPrice = marketDataService.peekPrice(symbol);
            } catch (Exception e) {
                currentPrice = avgPrice;
            }

            double marketValue = qty * currentPrice;
            double unrealizedPnl = (currentPrice - avgPrice) * qty;

            Position pos = new Position();
            pos.setSymbol(symbol);
            pos.setQuantity(qty);
            pos.setAvgPrice(round4(avgPrice));
            pos.setCurrentPrice(round4(currentPrice));
            pos.setMarketValue(round2(marketValue));
            pos.setUnrealizedPnl(round2(unrealizedPnl));
            pos.setSide(qty > 0 ? "LONG" : "SHORT");
            results.add(pos);
        }
        return results;
    }

    // ─── Orders ──────────────────────────────────────────

    public Order placeOrder(String accountId, OrderRequest req) {
        Account acct = requireAccount(accountId);

        Order order = new Order();
        order.setId(UUID.randomUUID().toString());
        order.setAccountId(accountId);
        order.setSymbol(req.getSymbol() != null ? req.getSymbol().toUpperCase() : "");
        order.setSide(req.getSide() != null ? req.getSide().toUpperCase() : "");
        order.setQuantity(req.getQuantity() != null ? req.getQuantity() : 0);
        order.setType("MARKET");
        order.setStatus("PENDING");
        order.setCreatedAt(Instant.now().toString());

        // Validate
        String reject = validateOrder(order);
        if (reject != null) {
            order.setStatus("REJECTED");
            order.setRejectReason(reject);
            acct.getOrders().add(order);
            return order;
        }

        // Execute
        executeMarketOrder(acct, order);
        acct.getOrders().add(order);
        return order;
    }

    public List<Order> getOrders(String accountId, String statusFilter) {
        Account acct = requireAccount(accountId);
        if (statusFilter != null && !statusFilter.isBlank()) {
            String upper = statusFilter.toUpperCase();
            return acct.getOrders().stream()
                    .filter(o -> upper.equals(o.getStatus()))
                    .collect(Collectors.toList());
        }
        return new ArrayList<>(acct.getOrders());
    }

    // ─── Fills ───────────────────────────────────────────

    public List<Fill> getFills(String accountId) {
        Account acct = requireAccount(accountId);
        return new ArrayList<>(acct.getFills());
    }

    // ─── Quotes ──────────────────────────────────────────

    public Quote getQuote(String symbol) {
        return marketDataService.getQuote(symbol);
    }

    // ─── Private helpers ─────────────────────────────────

    private Account requireAccount(String id) {
        Account acct = accounts.get(id);
        if (acct == null) {
            throw new AccountNotFoundException("account_not_found: " + id);
        }
        return acct;
    }

    private String validateOrder(Order order) {
        if (order.getSymbol() == null || order.getSymbol().isBlank()) return "symbol is required";
        if (!"BUY".equals(order.getSide()) && !"SELL".equals(order.getSide())) return "side must be BUY or SELL";
        if (order.getQuantity() <= 0) return "quantity must be a positive number";
        return null;
    }

    private void executeMarketOrder(Account acct, Order order) {
        String symbol = order.getSymbol();
        String side = order.getSide();
        int quantity = order.getQuantity();

        // Get quote
        Quote quote;
        try {
            quote = marketDataService.getQuote(symbol);
        } catch (Exception e) {
            order.setStatus("REJECTED");
            order.setRejectReason("unknown symbol: " + symbol);
            return;
        }

        // Fill price = ask (buy) or bid (sell) + slippage
        double basePrice = "BUY".equals(side) ? quote.getAsk() : quote.getBid();
        double slippageBps = config.getBaseSlippageBps()
                + random.nextDouble() * config.getRandomSlippageBps()
                + quantity * config.getSizeImpactBps();
        double slippageMult = "BUY".equals(side)
                ? 1.0 + slippageBps / 10000.0
                : 1.0 - slippageBps / 10000.0;
        double fillPrice = round4(basePrice * slippageMult);

        double grossAmount = fillPrice * quantity;
        double commission = config.getCommissionPerTrade();
        double fee = round4(grossAmount * (config.getFeeRateBps() / 10000.0));

        // Check funds for buy
        if ("BUY".equals(side)) {
            double totalCost = grossAmount + commission + fee;
            if (totalCost > acct.getCashBalance()) {
                order.setStatus("REJECTED");
                order.setRejectReason(String.format("insufficient funds: need $%.2f, have $%.2f",
                        totalCost, acct.getCashBalance()));
                return;
            }
        }

        // Check position for sell
        if ("SELL".equals(side)) {
            int currentQty = acct.getPositionQty(symbol);
            if (currentQty < quantity) {
                order.setStatus("REJECTED");
                order.setRejectReason(String.format("insufficient position: have %d shares, trying to sell %d",
                        currentQty, quantity));
                return;
            }
        }

        // Realized P&L for sells
        double realizedPnl = 0;
        if ("SELL".equals(side)) {
            double avgCost = acct.getAvgCostBasis(symbol);
            realizedPnl = round2((fillPrice - avgCost) * quantity);
        }

        // Create fill
        Fill fill = new Fill();
        fill.setId(UUID.randomUUID().toString());
        fill.setOrderId(order.getId());
        fill.setSymbol(symbol);
        fill.setSide(side);
        fill.setQuantity(quantity);
        fill.setFillPrice(fillPrice);
        fill.setGrossAmount(round2(grossAmount));
        fill.setCommission(commission);
        fill.setFee(fee);
        fill.setRealizedPnl("SELL".equals(side) ? realizedPnl : 0);
        fill.setFilledAt(Instant.now().toString());

        // Update cash
        if ("BUY".equals(side)) {
            acct.setCashBalance(round2(acct.getCashBalance() - grossAmount - commission - fee));
        } else {
            acct.setCashBalance(round2(acct.getCashBalance() + grossAmount - commission - fee));
        }

        // Update position
        acct.updatePosition(symbol, side, quantity, fillPrice);

        acct.getFills().add(fill);
        order.setStatus("FILLED");
        order.setFill(fill);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    // Custom exception for 404
    public static class AccountNotFoundException extends RuntimeException {
        public AccountNotFoundException(String message) {
            super(message);
        }
    }
}
