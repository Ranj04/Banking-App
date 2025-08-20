package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.Map;

public class WhoAmIHandler implements BaseHandler {
    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, Map.of("userName", auth.userName), null));
    }
}

