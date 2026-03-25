package com.tradex.controller;

import com.tradex.model.*;
import com.tradex.service.BrokerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class AccountController {

    private final BrokerService brokerService;

    public AccountController(BrokerService brokerService) {
        this.brokerService = brokerService;
    }

    @PostMapping("/accounts")
    public ResponseEntity<Map<String, String>> createAccount(@RequestBody(required = false) CreateAccountRequest request) {
        double capital = (request != null) ? request.getInitialCapital() : 100000;
        try {
            Map<String, String> result = brokerService.createAccount(capital);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{id}")
    public ResponseEntity<?> getAccount(@PathVariable String id) {
        try {
            AccountSummary summary = brokerService.getAccount(id);
            return ResponseEntity.ok(summary);
        } catch (BrokerService.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{id}/positions")
    public ResponseEntity<?> getPositions(@PathVariable String id) {
        try {
            List<Position> positions = brokerService.getPositions(id);
            return ResponseEntity.ok(positions);
        } catch (BrokerService.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{id}/orders")
    public ResponseEntity<?> placeOrder(@PathVariable String id, @RequestBody OrderRequest request) {
        try {
            Order order = brokerService.placeOrder(id, request);
            HttpStatus status = "REJECTED".equals(order.getStatus()) ? HttpStatus.BAD_REQUEST : HttpStatus.CREATED;
            return ResponseEntity.status(status).body(order);
        } catch (BrokerService.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{id}/orders")
    public ResponseEntity<?> getOrders(@PathVariable String id,
                                       @RequestParam(required = false) String status) {
        try {
            List<Order> orders = brokerService.getOrders(id, status);
            return ResponseEntity.ok(orders);
        } catch (BrokerService.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{id}/fills")
    public ResponseEntity<?> getFills(@PathVariable String id) {
        try {
            List<Fill> fills = brokerService.getFills(id);
            return ResponseEntity.ok(fills);
        } catch (BrokerService.AccountNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
