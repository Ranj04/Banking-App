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
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class ContributeGoalHandler implements BaseHandler {
    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        // NEW safer parsing & validation block
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        // Accept either {"goalId":"..."} or {"goalId":{"$oid":"..."}}
        String goalIdStr = null;
        Double amountVal = null;
        try {
            JsonObject root = JsonParser.parseString(req.getBody()).getAsJsonObject();
            JsonElement gEl = root.get("goalId");
            if (gEl != null && gEl.isJsonObject() && gEl.getAsJsonObject().has("$oid")) {
                goalIdStr = gEl.getAsJsonObject().get("$oid").getAsString();
            } else if (gEl != null && gEl.isJsonPrimitive()) {
                goalIdStr = gEl.getAsString();
            }
            if (root.has("amount")) amountVal = root.get("amount").getAsDouble();
        } catch (Exception ignore) {}

        if (goalIdStr == null || goalIdStr.isBlank() || amountVal == null || amountVal <= 0) {
            return new HttpResponseBuilder()
                    .setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<GoalDto>(false, java.util.Collections.emptyList(), "Invalid goalId or amount"));
        }

        ObjectId goalId;
        try {
            goalId = new ObjectId(goalIdStr);
        } catch (IllegalArgumentException ex) {
            return new HttpResponseBuilder()
                    .setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<GoalDto>(false, java.util.Collections.emptyList(), "Invalid goalId format"));
        }

        // load the goal (reuse existing dao/byIdForUser)
        var dao = GoalDao.getInstance();
        var goal = dao.byIdForUser(goalId, auth.userName);
        if (goal == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<GoalDto>(false, java.util.Collections.emptyList(), "Goal not found"));
        }
        if (!"savings".equalsIgnoreCase(goal.type)) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<GoalDto>(false, java.util.Collections.emptyList(), "Only savings goals accept contributions"));
        }

        // ensure list exists
        if (goal.contributions == null) goal.contributions = new java.util.ArrayList<>();

        GoalDto.Contribution c = new GoalDto.Contribution();
        c.amount = amountVal;
        c.dateMillis = System.currentTimeMillis();
        goal.contributions.add(c);

        // bump allocatedAmount
        if (goal.allocatedAmount == null) goal.allocatedAmount = 0.0;
        goal.allocatedAmount += amountVal;

        // persist using existing replace helper (goal.id field)
        dao.replace(goal.id, goal);

        return new HttpResponseBuilder()
                .setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, goal, "Contribution added"));
    }
}
