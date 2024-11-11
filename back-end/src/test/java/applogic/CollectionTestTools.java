package applogic;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import dao.AuthDao;
import dao.TransactionDao;
import dao.UserDao;
import dto.AuthDto;
import org.apache.commons.codec.digest.DigestUtils;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.mockito.Mockito;
import request.ParsedRequest;

import java.util.ArrayList;
import java.util.List;

// don't touch for resetting collections
public class CollectionTestTools {

    public MongoCollection mockUserCollection = Mockito.mock(MongoCollection.class);
    public MongoCollection mockAuthCollection = Mockito.mock(MongoCollection.class);
    public MongoCollection mockTransactionCollection = Mockito.mock(MongoCollection.class);

    public FindIterable userfindIterable = Mockito.mock(FindIterable.class);
    public FindIterable authfindIterable = Mockito.mock(FindIterable.class);
    public FindIterable transactionfindIterable = Mockito.mock(FindIterable.class);

    public CollectionTestTools() {
        UserDao userDao = UserDao.getInstance(mockUserCollection);
        AuthDao authDao = AuthDao.getInstance(mockAuthCollection);
        TransactionDao conversationDao = TransactionDao.getInstance(mockTransactionCollection);

        Mockito.doReturn(authfindIterable).when(mockAuthCollection).find((Bson) Mockito.any());
        Mockito.doReturn(userfindIterable).when(mockUserCollection).find((Bson) Mockito.any());
        Mockito.doReturn(transactionfindIterable).when(mockTransactionCollection).find((Bson) Mockito.any());
        System.out.println("Setup");
    }

    public AuthDto createLogin(){
        var request = new ParsedRequest();
        String hash = DigestUtils.sha256Hex(String.valueOf(Math.random()));
        String userName = String.valueOf(Math.random());
        request.setCookieValue("auth", hash);

        var authEntry = new AuthDto();
        authEntry.setHash(hash);
        authEntry.setUserName(userName);
        List<Document> returnList = new ArrayList<>();
        returnList.add(authEntry.toDocument());
        Mockito.doReturn(returnList).when(authfindIterable).into(Mockito.any());
        return authEntry;
    }

}
