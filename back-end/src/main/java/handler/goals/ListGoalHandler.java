package handler.goals;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.List;

public class ListGoalHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }

        List<GoalDto> goals = GoalDao.getInstance().findByUser(auth.userName);

        JsonArray out = new JsonArray();
        for (GoalDto g : goals) {
            // Assuming non-null ids per new data model; if legacy nulls appear, they will throw NPE earlier.
            JsonObject o = new JsonObject();
            o.addProperty("_id", g.id.toHexString());
            o.addProperty("userName", g.userName);
            o.addProperty("accountId", g.accountId.toHexString());
            o.addProperty("name", g.name);
            o.addProperty("allocatedAmount", g.allocatedAmount == null ? 0.0 : g.allocatedAmount);
            if (g.targetAmount != null) o.addProperty("targetAmount", g.targetAmount);
            o.addProperty("createdAt", g.createdAt);
            out.add(o);
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }
}
