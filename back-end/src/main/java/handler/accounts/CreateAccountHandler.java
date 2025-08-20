package handler.accounts;

import com.google.gson.Gson;
import dao.AccountDao;
import dto.AccountDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class CreateAccountHandler implements BaseHandler {
    static class Body { String name; String type; }

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        Body b = new Gson().fromJson(req.getBody(), Body.class);
        if (b == null || b.name == null || b.name.isBlank() || b.type == null)
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        var t = b.type.toLowerCase();
        if (!t.equals("savings") && !t.equals("spending"))
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        AccountDto a = new AccountDto();
        a.userName = auth.userName;
        a.name = b.name.trim();
        a.type = t;
        a.balance = 0.0;
        a.createdAt = System.currentTimeMillis();
        a.active = true;

        AccountDao.getInstance().put(a);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, a, "Account created"));
    }
}

