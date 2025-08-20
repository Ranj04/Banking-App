package handler.goals;

import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;
// added for account lookup
import dao.AccountDao;

public class CreateGoalHandler implements BaseHandler {
    static class CreateGoalBody { String type; String name; Double targetAmount; String category; Long dueDateMillis; String accountId; }

    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var body = new com.google.gson.Gson().fromJson(req.getBody(), CreateGoalBody.class);
        if (body == null || body.type == null || body.name == null || body.targetAmount == null)
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        // Require a valid accountId owned by the user
        if (body.accountId == null || body.accountId.isBlank()) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);
        }
        org.bson.types.ObjectId accId;
        try {
            accId = new org.bson.types.ObjectId(body.accountId);
        } catch (IllegalArgumentException e) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);
        }
        var acc = AccountDao.getInstance().query(
                new org.bson.Document("_id", accId).append("userName", auth.userName)
        ).stream().findFirst().orElse(null);
        if (acc == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND);
        }

        GoalDto g = new GoalDto();
        g.userName = auth.userName;
        g.type = body.type;
        g.name = body.name;
        g.targetAmount = Math.max(0, body.targetAmount);
        g.category = "spending".equalsIgnoreCase(body.type) ? (body.category == null ? "General" : body.category) : null;
        g.dueDateMillis = body.dueDateMillis;
        g.createdAt = System.currentTimeMillis();
        g.accountId = accId;           // set parent account
        g.allocatedAmount = 0.0;       // initialize allocation

        GoalDao.getInstance().put(g);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, g, "Goal created"));
    }
}
