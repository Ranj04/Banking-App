package dao;

import com.mongodb.client.model.Filters;
import dto.SpendDto;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class SpendDao extends BaseDao<SpendDto> {
    private static SpendDao instance;
    private SpendDao() { super(MongoConnection.getCollection("Spends")); }
    public static SpendDao getInstance() { return instance == null ? (instance = new SpendDao()) : instance; }

    @Override
    public List<SpendDto> query(Document filter) {
        return collection.find(filter)
                .into(new ArrayList<>())
                .stream()
                .map(SpendDto::fromDocument)
                .collect(Collectors.toList());
    }

    public List<SpendDto> findForUserCategoryWindow(String user, String category, long start, long end) {
        Bson f = Filters.and(
                Filters.eq("userName", user),
                Filters.eq("category", category),
                Filters.gte("dateMillis", start),
                Filters.lt("dateMillis", end)
        );
        return collection.find(f)
                .into(new ArrayList<>())
                .stream()
                .map(SpendDto::fromDocument)
                .collect(Collectors.toList());
    }
}
