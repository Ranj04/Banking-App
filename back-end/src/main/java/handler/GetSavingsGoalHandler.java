package handler;

import dao.SavingsGoalDao;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.ArrayList;
import java.util.List;

public class GetSavingsGoalHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        SavingsGoalDao savingsGoalDao = SavingsGoalDao.getInstance();
        AuthFilter.AuthResult authResult = AuthFilter.doFilter(request);
        if (!authResult.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }

        List<Document> filterList = new ArrayList<>();
        filterList.add(new Document("userId", authResult.userName));


        var orFilter = new Document("$or", filterList);

        var res = new RestApiAppResponse<>(true, savingsGoalDao.query(orFilter), null);
        return new HttpResponseBuilder().setStatus("200 OK").setBody(res);
    }
}
