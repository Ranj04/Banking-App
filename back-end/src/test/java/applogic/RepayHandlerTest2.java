package applogic;

import dto.UserDto;
import handler.RepayHandler;
import org.bson.Document;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.testng.Assert;
import org.testng.annotations.Test;
import request.ParsedRequest;


import java.util.ArrayList;
import java.util.List;

public class RepayHandlerTest2 {

    @Test(singleThreaded = true)
    public void RepayTest() {

        var tools = new CollectionTestTools();
        var auth = tools.createLogin();
        var handler = new RepayHandler();

        ParsedRequest parsedRequest = new ParsedRequest();
        parsedRequest.setPath("/repay");
        parsedRequest.setCookieValue("auth", String.valueOf(Math.random()));

        List<Document> userReturnList = new ArrayList<>();
        UserDto userDto = new UserDto();
        userDto.setBalance(1000.0);
        userDto.setDebt(1000.0d);
        userDto.setUserName(auth.getUserName());
        userReturnList.add(userDto.toDocument());
        Mockito.doReturn(userReturnList).when(tools.userfindIterable).into(Mockito.any());

        var builder = handler.handleRequest(parsedRequest);
        var res = builder.build();
        Assert.assertEquals(res.status,  "Repayment denied, You don't have enough balance");

        ArgumentCaptor<Document> transactionCaptor = ArgumentCaptor.forClass(Document.class);

        Mockito.verify(tools.mockTransactionCollection).insertOne(transactionCaptor.capture());
        var allTransactions = transactionCaptor.getAllValues();
        Assert.assertEquals(allTransactions.get(0).get("userId"), userDto.getUserName());
        Assert.assertEquals(allTransactions.get(0).get("amount"), 0.0d);
        Assert.assertEquals(allTransactions.get(0).get("transactionType"), "Repay");

        ArgumentCaptor<Document> userCaptor = ArgumentCaptor.forClass(Document.class);

        Mockito.verify(tools.mockUserCollection).insertOne(userCaptor.capture());
        var allUsers = userCaptor.getAllValues();
        Assert.assertEquals(allUsers.get(0).get("userName"), userDto.getUserName());
        Assert.assertEquals(allUsers.get(0).get("balance"), 1000.0d );
        Assert.assertEquals(allUsers.get(0).get("debt"), 1000.0d);
        Assert.assertEquals(allUsers.get(0).get("interest"), 1.2);
    }
}
