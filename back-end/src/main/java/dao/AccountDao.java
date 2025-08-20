package dao;

import com.mongodb.client.MongoCollection;
import dto.AccountDto;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class AccountDao extends BaseDao<AccountDto> {
    private static AccountDao instance;
    private AccountDao(MongoCollection<Document> coll) { super(coll); }

    public static AccountDao getInstance() {
        if (instance != null) return instance;
        instance = new AccountDao(MongoConnection.getCollection("AccountDao"));
        return instance;
    }

    public static AccountDao getInstance(MongoCollection<Document> coll) {
        instance = new AccountDao(coll);
        return instance;
    }

    @Override
    public List<AccountDto> query(Document filter) {
        return collection.find(filter)
                .into(new ArrayList<>())
                .stream()
                .map(AccountDto::fromDocument)
                .collect(Collectors.toList());
    }
}

