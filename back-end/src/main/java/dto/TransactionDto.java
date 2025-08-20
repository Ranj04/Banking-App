package dto;

import org.bson.Document;

import java.time.Instant;

public class TransactionDto extends BaseDto {

    private String userId;
    private String toId;
    private Double amount;
    private TransactionType transactionType;
    private Long timestamp;
    // added fields
    private String accountId;   // optional: the account this txn touches
    private String goalId;      // optional: future use

    public TransactionDto() {
        timestamp = Instant.now().toEpochMilli();
    }

    public TransactionDto(String uniqueId) {
        super(uniqueId);
        timestamp = Instant.now().toEpochMilli();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getToId() {
        return toId;
    }

    public void setToId(String toId) {
        this.toId = toId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getGoalId() { return goalId; }
    public void setGoalId(String goalId) { this.goalId = goalId; }

    public Document toDocument() {
        return new Document()
                .append("userId", userId)
                .append("toId", toId)
                .append("amount", amount)
                .append("transactionType", transactionType.toString())
                .append("timestamp", timestamp)
                .append("accountId", accountId)
                .append("goalId", goalId);
    }

    public static TransactionDto fromDocument(Document document) {
        var transaction = new TransactionDto();
        transaction.loadUniqueId(document);
        transaction.timestamp = document.getLong("timestamp");
        transaction.toId = document.getString("toId");
        transaction.amount = document.getDouble("amount");
        transaction.transactionType = TransactionType.valueOf(
                document.getString("transactionType"));
        transaction.userId = document.getString("userId");
        transaction.accountId = document.getString("accountId");
        transaction.goalId = document.getString("goalId");
        return transaction;
    }
}
