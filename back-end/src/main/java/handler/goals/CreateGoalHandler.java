package handler.goals;

import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class CreateGoalHandler implements BaseHandler {
    static class CreateGoalBody { String type; String name; Double targetAmount; String category; Long dueDateMillis; }

    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var body = new com.google.gson.Gson().fromJson(req.getBody(), CreateGoalBody.class);
        if (body == null || body.type == null || body.name == null || body.targetAmount == null)
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        GoalDto g = new GoalDto();
        g.userName = auth.userName;
        g.type = body.type;
        g.name = body.name;
        g.targetAmount = Math.max(0, body.targetAmount);
        g.category = "spending".equalsIgnoreCase(body.type) ? (body.category == null ? "General" : body.category) : null;
        g.dueDateMillis = body.dueDateMillis;
        g.createdAt = System.currentTimeMillis();

        GoalDao.getInstance().put(g);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, g, "Goal created"));
    }
}
