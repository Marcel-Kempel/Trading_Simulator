package com.tradex;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TradingSimulatorApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String accountId;

    @BeforeEach
    void setUp() throws Exception {
        MvcResult result = mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"initialCapital\": 100000}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        accountId = json.get("id").asText();
    }

    // ─── Health ──────────────────────────────────────────

    @Test
    void healthCheckReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // ─── Symbols ─────────────────────────────────────────

    @Test
    void getSymbolsReturnsArray() throws Exception {
        mockMvc.perform(get("/symbols"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").isString());
    }

    // ─── Accounts ────────────────────────────────────────

    @Test
    void createAccountReturnsId() throws Exception {
        mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"initialCapital\": 50000}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString());
    }

    @Test
    void createAccountRejectsBadCapital() throws Exception {
        mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"initialCapital\": -500}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAccountReturnsDetails() throws Exception {
        mockMvc.perform(get("/accounts/" + accountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cashBalance").value(100000))
                .andExpect(jsonPath("$.equity").value(100000));
    }

    @Test
    void getUnknownAccountReturns404() throws Exception {
        mockMvc.perform(get("/accounts/nonexistent"))
                .andExpect(status().isNotFound());
    }

    // ─── Quotes ──────────────────────────────────────────

    @Test
    void getQuoteReturnsValidQuote() throws Exception {
        mockMvc.perform(get("/quotes").param("symbol", "AAPL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.bid").isNumber())
                .andExpect(jsonPath("$.ask").isNumber());
    }

    @Test
    void getQuoteMissingSymbolReturns400() throws Exception {
        mockMvc.perform(get("/quotes"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getQuoteUnknownSymbolReturns404() throws Exception {
        mockMvc.perform(get("/quotes").param("symbol", "FAKE"))
                .andExpect(status().isNotFound());
    }

    // ─── Orders / Trading ────────────────────────────────

    @Test
    void buyOrderGetsFilled() throws Exception {
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"AAPL\",\"side\":\"BUY\",\"quantity\":10}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("FILLED"))
                .andExpect(jsonPath("$.fill.quantity").value(10));
    }

    @Test
    void sellWithoutPositionIsRejected() throws Exception {
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"AAPL\",\"side\":\"SELL\",\"quantity\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void unknownSymbolOrderIsRejected() throws Exception {
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"FAKE\",\"side\":\"BUY\",\"quantity\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void fullBuySellCycleWorks() throws Exception {
        // Buy
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"MSFT\",\"side\":\"BUY\",\"quantity\":5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("FILLED"));

        // Check position exists
        mockMvc.perform(get("/accounts/" + accountId + "/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("MSFT"))
                .andExpect(jsonPath("$[0].quantity").value(5));

        // Sell
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"MSFT\",\"side\":\"SELL\",\"quantity\":5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("FILLED"));

        // Position should be gone
        mockMvc.perform(get("/accounts/" + accountId + "/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        // Should have 2 fills
        mockMvc.perform(get("/accounts/" + accountId + "/fills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getOrdersReturnsHistory() throws Exception {
        // Place an order first
        mockMvc.perform(post("/accounts/" + accountId + "/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"GOOGL\",\"side\":\"BUY\",\"quantity\":3}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/accounts/" + accountId + "/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Filter by status
        mockMvc.perform(get("/accounts/" + accountId + "/orders").param("status", "FILLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("FILLED"));
    }
}
