package handler.goals;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.List;

public class ListGoalHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        List<GoalDto> goals = GoalDao.getInstance().query(new Document("userName", auth.userName));

        JsonArray arr = new JsonArray();
        for (GoalDto g : goals) {
            JsonObject o = new JsonObject();
            o.addProperty("_id", g.id == null ? null : g.id.toHexString());
            o.addProperty("userName", g.userName);
            o.addProperty("accountId", g.accountId == null ? null : g.accountId.toHexString());
            o.addProperty("name", g.name);
            o.addProperty("allocatedAmount", g.allocatedAmount == null ? 0.0 : g.allocatedAmount);
            if (g.targetAmount != null) o.addProperty("targetAmount", g.targetAmount);
            if (g.dueDateMillis != null) o.addProperty("dueDateMillis", g.dueDateMillis);
            if (g.createdAt != null) o.addProperty("createdAt", g.createdAt);
            arr.add(o);
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, arr, null));
    }
}
