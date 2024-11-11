package handler;

import dto.TransactionDto;
import request.ParsedRequest;
import response.HttpResponseBuilder;

public class WithdrawHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        TransactionDto transactionDto = GsonTool.GSON.fromJson(request.getBody(),
                TransactionDto.class);
        System.out.println(transactionDto);
        return null;
    }
}
