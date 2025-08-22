package handler.accounts;

import dao.AccountDao;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.List;
import java.util.stream.Collectors;

public class ListAccountsHandler implements BaseHandler {
    static class View { public String _id, name, type; public Double balance; }

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var list = AccountDao.getInstance().query(new Document("userName", auth.userName));
        List<View> out = list.stream().map(a -> {
            var v = new View();
            v._id = a.getUniqueId();
            v.name = a.name;
            v.type = a.type;
            v.balance = a.balance == null ? 0.0 : a.balance;
            return v;
        }).collect(Collectors.toList());

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }
}
