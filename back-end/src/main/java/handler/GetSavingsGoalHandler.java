package handler;

import dao.SavingsGoalDao;
import request.ParsedRequest;
import response.HttpResponseBuilder;

public class GetSavingsGoalHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        SavingsGoalDao savingsGoalDao = SavingsGoalDao.getInstance();
        AuthFilter.AuthResult authResult = AuthFilter.doFilter(request);
        if (!authResult.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }
        return null;
    }
}
