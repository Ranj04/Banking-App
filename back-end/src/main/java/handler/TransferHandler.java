package handler;

import dao.TransactionDao;
import dao.UserDao;
import dto.TransactionDto;
import dto.TransactionType;
import dto.TransferRequestDto;

import dto.UserDto;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.List;

public class TransferHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        UserDao userDao = UserDao.getInstance();

        TransferRequestDto transferRequestDto = GsonTool.GSON.fromJson(request.getBody(),
                TransferRequestDto.class);

        AuthFilter.AuthResult authResult = AuthFilter.doFilter(request);
        if (!authResult.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }

        UserDto fromUser = userDao.query(new Document("userName", authResult.userName))
                .iterator().next();

        if (fromUser == null) {
            var res = new RestApiAppResponse<>(false, "Invalid from user.");
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(GsonTool.GSON.toJson(res));
        }

        UserDto toUser = userDao.query(new Document("userName", transferRequestDto.toId))
                .iterator().next();

        if (toUser == null) {
            var res = new RestApiAppResponse<>(false, "Invalid user to transfer.");
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(GsonTool.GSON.toJson(res));
        }

        if (fromUser.getBalance() < transferRequestDto.amount) {
            var res = new RestApiAppResponse<>(false, "Not enough funds.");
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(GsonTool.GSON.toJson(res));
        }

        fromUser.setBalance(fromUser.getBalance() - transferRequestDto.amount);
        toUser.setBalance(toUser.getBalance() + transferRequestDto.amount);
        userDao.put(fromUser);
        userDao.put(toUser);

        TransactionDao transactionDao = TransactionDao.getInstance();
        var transaction = new TransactionDto();
        transaction.setTransactionType(TransactionType.Transfer);
        transaction.setAmount(transferRequestDto.amount);
        transaction.setToId(transferRequestDto.toId);
        transaction.setUserId(authResult.userName);
        transactionDao.put(transaction);

        var res = new RestApiAppResponse<>(true, List.of(fromUser, toUser), null);
        return new HttpResponseBuilder().setStatus("200 OK").setBody(GsonTool.GSON.toJson(res));
    }

}