package handler.spend;

import com.google.gson.Gson;
import dao.SpendDao;
import dto.SpendDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class LogSpendHandler implements BaseHandler {
    static class Body { String category; Double amount; Long dateMillis; }

    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var b = new Gson().fromJson(req.getBody(), Body.class);
        if (b == null || b.category == null || b.amount == null || b.amount <= 0)
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        SpendDto s = new SpendDto();
        s.userName = auth.userName;
        s.category = b.category;
        s.amount   = b.amount;
        s.dateMillis = (b.dateMillis == null ? System.currentTimeMillis() : b.dateMillis);
        s.createdAt = System.currentTimeMillis();

        SpendDao.getInstance().put(s);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, s, "Spend logged"));
    }
}
