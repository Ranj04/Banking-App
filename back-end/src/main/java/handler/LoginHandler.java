package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;

class LoginDto {
    String userName;
    String password;
}

public class LoginHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        LoginDto userDto = GsonTool.GSON.fromJson(request.getBody(), LoginDto.class);
        System.out.println(userDto);
        return null; // todo complete
    }
}
