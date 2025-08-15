package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class LogoutHandler implements BaseHandler {
    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        boolean isProd = "production".equalsIgnoreCase(System.getenv("APP_ENV"));
        String flags = isProd ? "Path=/; HttpOnly; SameSite=None; Secure" : "Path=/; HttpOnly; SameSite=Lax";
        return new HttpResponseBuilder()
                .setStatus(handler.StatusCodes.OK)
                .setHeader("Set-Cookie", "auth=; Max-Age=0; " + flags)
                .setBody(new RestApiAppResponse<>(true, "Logged out"));
    }
}
