package applogic;

import dto.TransactionDto;
import dto.UserDto;
import handler.GsonTool;
import handler.FinancingHandler;
import org.bson.Document;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.testng.Assert;
import org.testng.annotations.Test;
import request.ParsedRequest;

import java.util.ArrayList;
import java.util.List;

public class FinancingHandlerTest3 {

    @Test(singleThreaded = true)
    public void financingTest() {

        var tools = new CollectionTestTools();
        var auth = tools.createLogin();
        var handler = new FinancingHandler();

        ParsedRequest parsedRequest = new ParsedRequest();
        parsedRequest.setPath("/financing");
        parsedRequest.setCookieValue("auth", String.valueOf(Math.random()));

        TransactionDto transaction = new TransactionDto();
        transaction.setAmount(1000.0);
        parsedRequest.setBody(GsonTool.GSON.toJson(transaction));

        List<Document> userReturnList = new ArrayList<>();
        UserDto userDto = new UserDto();
        userDto.setBalance(5000.0);
        userDto.setDebt(9000.0d);
        userDto.setUserName(auth.getUserName());
        userReturnList.add(userDto.toDocument());
        Mockito.doReturn(userReturnList).when(tools.userfindIterable).into(Mockito.any());

        var builder = handler.handleRequest(parsedRequest);
        var res = builder.build();
        Assert.assertEquals(res.status, userDto.getUserName() + ", Financing denied, You already have debt");

        ArgumentCaptor<Document> transactionCaptor = ArgumentCaptor.forClass(Document.class);

        Mockito.verify(tools.mockTransactionCollection).insertOne(transactionCaptor.capture());
        var allTransactions = transactionCaptor.getAllValues();
        Assert.assertEquals(allTransactions.get(0).get("userId"), userDto.getUserName());
        Assert.assertEquals(allTransactions.get(0).get("amount"), transaction.getAmount());
        Assert.assertEquals(allTransactions.get(0).get("transactionType"), "Financing");

        ArgumentCaptor<Document> userCaptor = ArgumentCaptor.forClass(Document.class);

        Mockito.verify(tools.mockUserCollection).insertOne(userCaptor.capture());
        var allUsers = userCaptor.getAllValues();
        Assert.assertEquals(allUsers.get(0).get("userName"), userDto.getUserName());
        Assert.assertEquals(allUsers.get(0).get("balance"), userDto.getBalance() );
        Assert.assertEquals(allUsers.get(0).get("debt"), userDto.getDebt());
    }
}
