package dto;

import org.bson.types.ObjectId;
import java.util.ArrayList;
import java.util.List;

public class GoalDto {
    public ObjectId _id;
    public String userName;        // owner
    public String type;            // "savings" | "spending"
    public String name;
    public Double targetAmount;    // savings target or spending limit
    public String category;        // only for spending goals (e.g., "Food")
    public Long  dueDateMillis;    // optional for savings
    public Long  createdAt;
    public Boolean active = true;
    public List<Contribution> contributions = new ArrayList<>(); // for savings

    public static class Contribution {
        public Double amount;
        public Long   dateMillis;
        public String note;
    }
}
