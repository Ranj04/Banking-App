package applogic;

import dto.TransactionDto;
import dto.UserDto;
import handler.GsonTool;
import handler.StatusCodes;
import handler.TransferHandler;
import org.bson.Document;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.testng.Assert;
import org.testng.annotations.Test;
import request.ParsedRequest;

import java.util.ArrayList;
import java.util.List;

public class TransferHandlerTest {

    @Test(singleThreaded = true)
    public void makeDeposit(){
        var tools = new CollectionTestTools();

        var auth = tools.createLogin();
        var handler = new TransferHandler();

        ParsedRequest parsedRequest = new ParsedRequest();
        parsedRequest.setPath("/withdraw");
        parsedRequest.setCookieValue("auth", String.valueOf(Math.random()));
        TransactionDto transaction = new TransactionDto();
        Double amount = Math.random();
        transaction.setAmount(amount);
        String userToGetFunds = String.valueOf(Math.random());
        transaction.setToId(userToGetFunds);
        parsedRequest.setBody(GsonTool.GSON.toJson(transaction));

        List<Document> userReturnList = new ArrayList<>();
        UserDto userDto = new UserDto();
        userDto.setBalance(200.0);
        userDto.setUserName(auth.getUserName());
        userReturnList.add(userDto.toDocument());
        Mockito.doReturn(userReturnList).when(tools.userfindIterable).into(Mockito.any());
        ArgumentCaptor<Document> transactionCaptor = ArgumentCaptor.forClass(Document.class);

        var builder = handler.handleRequest(parsedRequest);
        var res = builder.build();
        Assert.assertEquals(res.status, StatusCodes.OK);

        Mockito.verify(tools.mockTransactionCollection).insertOne(transactionCaptor.capture());
        var allTransactions = transactionCaptor.getAllValues();
        Assert.assertEquals(allTransactions.get(0).get("userId"), userDto.getUserName());
        Assert.assertEquals(allTransactions.get(0).get("toId"), transaction.getToId());
        Assert.assertEquals(allTransactions.get(0).get("amount"), transaction.getAmount());
        Assert.assertEquals(allTransactions.get(0).get("transactionType"), "Transfer");
    }
}
