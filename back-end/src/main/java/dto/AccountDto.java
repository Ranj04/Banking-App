package dto;

import org.bson.Document;

public class AccountDto extends BaseDto {
    public String userName;    // owner
    public String name;        // display label
    public String type;        // "savings" | "spending"
    public Double balance;     // default 0
    public Long createdAt;     // millis
    public Boolean active;     // default true

    @Override
    public Document toDocument() {
        return new Document()
                .append("userName", userName)
                .append("name", name)
                .append("type", type)
                .append("balance", balance)
                .append("createdAt", createdAt)
                .append("active", active);
    }

    public static AccountDto fromDocument(Document d) {
        var a = new AccountDto();
        if (d.get("_id") != null) a.loadUniqueId(d);
        a.userName = d.getString("userName");
        a.name = d.getString("name");
        a.type = d.getString("type");
        a.balance = d.getDouble("balance");
        a.createdAt = d.getLong("createdAt");
        a.active = d.getBoolean("active", true);
        return a;
    }
}

