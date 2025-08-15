package handler;

import dao.UserDao;
import dto.UserDto;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BalanceHandler implements BaseHandler {
    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }
        var userDao = UserDao.getInstance();
        List<UserDto> users = userDao.query(new Document("userName", auth.userName));
        if (users.isEmpty()) {
            return new HttpResponseBuilder().setStatus("404 Not Found")
                    .setBody("{\"status\":false,\"message\":\"User not found\"}");
        }
        UserDto user = users.get(0);
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", true);
        payload.put("balance", user.getBalance());
        return new HttpResponseBuilder()
                .setStatus(StatusCodes.OK)
                .setHeader("Content-Type", "application/json")
                .setBody(GsonTool.GSON.toJson(payload));
    }
}

