package dao;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoConnection {

    private static final MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");

    public static MongoDatabase getDb() {
        return mongoClient.getDatabase("Homework2");
    }

    public static MongoCollection<Document> getCollection(String collectionName) {
        return getDb().getCollection(collectionName);
    }

}
