package handler;

import dto.TransferRequestDto;

import request.ParsedRequest;
import response.HttpResponseBuilder;

public class TransferHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        TransferRequestDto transferRequestDto = GsonTool.GSON.fromJson(request.getBody(),
                TransferRequestDto.class);

        System.out.println(transferRequestDto);
        return null; // todo: complete
    }

}