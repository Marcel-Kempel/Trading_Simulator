package com.tradex.service;

import com.tradex.model.Quote;
import java.util.List;

public interface MarketDataService {

    List<String> getSymbols();

    Quote getQuote(String symbol);

    double peekPrice(String symbol);
}
