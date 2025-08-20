package dto;

import org.bson.Document;

import java.time.Instant;

public class TransactionDto extends BaseDto {

    private String userId;
    private String toId; // legacy
    private Double amount;
    private TransactionType transactionType;
    private Long timestamp; // epoch millis

    // normalized fields for savings flows
    private String accountId;   // for deposit/withdraw (source account) or transfer-from account
    private String goalId;      // for deposit/withdraw (target goal) or transfer-to goal
    private String fromGoalId;  // for transfers
    private String toGoalId;    // for transfers

    // --- getters/setters ---
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getToId() { return toId; }
    public void setToId(String toId) { this.toId = toId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    public void setTimestampNow() { this.timestamp = Instant.now().toEpochMilli(); }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getGoalId() { return goalId; }
    public void setGoalId(String goalId) { this.goalId = goalId; }
    public String getFromGoalId() { return fromGoalId; }
    public void setFromGoalId(String fromGoalId) { this.fromGoalId = fromGoalId; }
    public String getToGoalId() { return toGoalId; }
    public void setToGoalId(String toGoalId) { this.toGoalId = toGoalId; }

    public Document toDocument() {
        return new Document()
                .append("userId", userId)
                .append("toId", toId)
                .append("amount", amount)
                .append("transactionType", transactionType.name())
                .append("timestamp", timestamp == null ? Instant.now().toEpochMilli() : timestamp)
                .append("accountId", accountId)
                .append("goalId", goalId)
                .append("fromGoalId", fromGoalId)
                .append("toGoalId", toGoalId);
    }

    public static TransactionDto fromDocument(Document document) {
        var t = new TransactionDto();
        t.loadUniqueId(document);
        t.userId = document.getString("userId");
        t.toId = document.getString("toId");
        t.amount = document.getDouble("amount");
        var tt = document.getString("transactionType");
        t.transactionType = tt == null ? null : TransactionType.valueOf(tt);
        t.timestamp = document.getLong("timestamp");
        t.accountId = document.getString("accountId");
        t.goalId = document.getString("goalId");
        t.fromGoalId = document.getString("fromGoalId");
        t.toGoalId = document.getString("toGoalId");
        return t;
    }
}
