package applogic;

import dto.TransactionDto;
import dto.UserDto;
import handler.CreateDepositHandler;
import handler.GsonTool;
import handler.StatusCodes;
import org.bson.Document;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.testng.Assert;
import org.testng.annotations.Test;
import request.ParsedRequest;

import java.util.ArrayList;
import java.util.List;

public class DepositHandlerTests {

    @Test(singleThreaded = true)
    public void makeDeposit(){
        var tools = new CollectionTestTools();

        var auth = tools.createLogin();
        var handler = new CreateDepositHandler();

        ParsedRequest parsedRequest = new ParsedRequest();
        parsedRequest.setPath("/createDeposit");
        parsedRequest.setCookieValue("auth", String.valueOf(Math.random()));
        TransactionDto transaction = new TransactionDto();

        Double amount = Math.random();
        transaction.setAmount(amount);
        parsedRequest.setBody(GsonTool.GSON.toJson(transaction));

        List<Document> userReturnList = new ArrayList<>();
        UserDto userDto = new UserDto();
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
        Assert.assertEquals(allTransactions.get(0).get("amount"), transaction.getAmount());
        Assert.assertEquals(allTransactions.get(0).get("transactionType"), "Deposit");
    }
}
