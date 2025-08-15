package dto;

import org.bson.Document;
import org.bson.types.ObjectId;

public class SpendDto extends BaseDto {
    public ObjectId _id;
    public String userName;
    public String category;
    public Double amount;
    public Long   dateMillis;  // when spend happened
    public Long   createdAt;

    public SpendDto() { }

    public SpendDto(String uniqueId) { super(uniqueId); }

    @Override
    public Document toDocument() {
        return new Document()
                .append("userName", userName)
                .append("category", category)
                .append("amount", amount)
                .append("dateMillis", dateMillis)
                .append("createdAt", createdAt);
    }

    public static SpendDto fromDocument(Document d) {
        SpendDto s = new SpendDto();
        if (d.getObjectId("_id") != null) {
            s._id = d.getObjectId("_id");
            s.loadUniqueId(d);
        }
        s.userName = d.getString("userName");
        s.category = d.getString("category");
        s.amount = d.getDouble("amount");
        s.dateMillis = d.getLong("dateMillis");
        s.createdAt = d.getLong("createdAt");
        return s;
    }
}
