package dto;

import org.bson.Document;

public class SavingsGoalDto extends BaseDto {
    private String userId;
    private double targetAmount;
    private long deadline;
    private double currentAmount = 0.0;

    public SavingsGoalDto() {}

    public SavingsGoalDto(String userId, double targetAmount, long deadline) {
        this.userId = userId;
        this.targetAmount = targetAmount;
        this.deadline = deadline;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public double getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(double targetAmount) {
        this.targetAmount = targetAmount;
    }

    public long getDeadline() {
        return deadline;
    }

    public void setDeadline(long deadline) {
        this.deadline = deadline;
    }

    public double getCurrentAmount() {
        return currentAmount;
    }

    public void setCurrentAmount(double currentAmount) {
        this.currentAmount = currentAmount;
    }

    @Override
    public Document toDocument() {
        return new Document("userId", userId)
                .append("targetAmount", targetAmount)
                .append("deadline", deadline)
                .append("currentAmount", currentAmount);
    }

    public static SavingsGoalDto fromDocument(Document doc) {
        var goal = new SavingsGoalDto();
        goal.setUserId(doc.getString("userId"));
        goal.setTargetAmount(doc.getDouble("targetAmount"));
        goal.setDeadline(doc.getLong("deadline"));
        goal.setCurrentAmount(doc.getDouble("currentAmount"));
        goal.loadUniqueId(doc);
        return goal;
    }
}