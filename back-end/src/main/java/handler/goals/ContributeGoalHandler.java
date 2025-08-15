package handler.goals;

import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class ContributeGoalHandler implements BaseHandler {
    static class Body { String goalId; Double amount; String note; Long dateMillis; }

    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var b = new com.google.gson.Gson().fromJson(req.getBody(), Body.class);
        if (b == null || b.goalId == null || b.amount == null || b.amount <= 0) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        var dao = GoalDao.getInstance();
        var goal = dao.byIdForUser(new ObjectId(b.goalId), auth.userName);
        if (goal == null) return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND);

        if (!"savings".equalsIgnoreCase(goal.type))
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        if (goal.contributions == null) goal.contributions = new java.util.ArrayList<>();
        GoalDto.Contribution c = new GoalDto.Contribution();
        c.amount = b.amount;
        c.note = b.note;
        c.dateMillis = (b.dateMillis == null ? System.currentTimeMillis() : b.dateMillis);
        goal.contributions.add(c);

        dao.replace(goal.id, goal);
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, goal, "Contribution added"));
    }
}
