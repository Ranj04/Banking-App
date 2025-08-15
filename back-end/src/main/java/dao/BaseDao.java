package dao;

import com.mongodb.client.MongoCollection;
import dto.BaseDto;
import java.util.List;
import org.bson.Document;

public abstract class BaseDao<T extends BaseDto> {

    protected MongoCollection<Document> collection;

    protected BaseDao(MongoCollection<Document> collection) {
        this.collection = collection;
    }

    public abstract List<T> query(Document filter);

    public void put(T dto) {
        if (dto.getUniqueId() == null) {
            collection.insertOne(dto.toDocument());
        } else {
            collection.replaceOne(dto.getObjectId(), dto.toDocument());
        }
    }
}
