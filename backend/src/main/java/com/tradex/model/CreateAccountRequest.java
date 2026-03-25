package com.tradex.model;

public class CreateAccountRequest {

    private Double initialCapital;

    public CreateAccountRequest() {}

    public Double getInitialCapital() {
        return initialCapital != null ? initialCapital : 100000.0;
    }

    public void setInitialCapital(Double initialCapital) {
        this.initialCapital = initialCapital;
    }
}
