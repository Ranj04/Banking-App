package dao;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoConnection {

    private static final String mongoUrl = System.getenv().getOrDefault("MONGO_URL", "mongodb://localhost:27017");
    private static final String mongoDb  = System.getenv().getOrDefault("MONGO_DB",  "Homework2");
    private static final MongoClient mongoClient = MongoClients.create(mongoUrl);

    public static MongoDatabase getDb() {
        return mongoClient.getDatabase(mongoDb);
    }

    public static MongoCollection<Document> getCollection(String collectionName) {
        return getDb().getCollection(collectionName);
    }

}
