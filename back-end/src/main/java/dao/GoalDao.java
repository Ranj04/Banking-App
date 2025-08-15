package dao;

import com.mongodb.client.MongoCollection;
import dto.GoalDto;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class GoalDao extends BaseDao<GoalDto> {
    private static GoalDao instance;

    private GoalDao(MongoCollection<Document> collection) { super(collection); }

    public static GoalDao getInstance() {
        if (instance == null) {
            instance = new GoalDao(MongoConnection.getCollection("Goals"));
        }
        return instance;
    }

    @Override
    public List<GoalDto> query(Document filter) {
        return collection.find(filter)
                .into(new ArrayList<>())
                .stream()
                .map(GoalDto::fromDocument)
                .collect(Collectors.toList());
    }

    public GoalDto byIdForUser(ObjectId id, String user) {
        Document filter = new Document("_id", id).append("userName", user);
        Document doc = collection.find(filter).first();
        return doc == null ? null : GoalDto.fromDocument(doc);
    }

    public void replace(ObjectId id, GoalDto goal) {
        collection.replaceOne(new Document("_id", id), goal.toDocument());
    }

    public GoalDto delete(Document filter) {
        Document doc = collection.find(filter).first();
        if (doc == null) return null;
        collection.deleteOne(filter);
        return GoalDto.fromDocument(doc);
    }
}
