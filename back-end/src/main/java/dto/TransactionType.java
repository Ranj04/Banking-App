package dto;

public enum TransactionType {
    Deposit("Deposit"),
    Transfer("Transfer"),
    Withdraw("Withdraw");

    private final String stringValue;

    TransactionType(final String stringValue) {
        this.stringValue = stringValue;
    }

    @Override
    public String toString() {
        return stringValue;
    }
}
