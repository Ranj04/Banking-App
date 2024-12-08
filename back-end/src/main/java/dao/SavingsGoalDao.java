package dao;

import com.mongodb.client.MongoCollection;
import dto.SavingsGoalDto;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class SavingsGoalDao extends BaseDao<SavingsGoalDto> {
    private static SavingsGoalDao instance;

    private SavingsGoalDao(MongoCollection<Document> collection) {
        super(collection);
    }

    public static SavingsGoalDao getInstance() {
        if (instance != null) return instance;
        instance = new SavingsGoalDao(MongoConnection.getCollection("SavingsGoals"));
        return instance;
    }

    public List<SavingsGoalDto> query(Document filter) {
        return collection.find(filter)
                .into(new ArrayList<>())
                .stream()
                .map(SavingsGoalDto::fromDocument)
                .collect(Collectors.toList());
    }
}

