package handler.goals;

import dao.GoalDao;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class DeleteGoalHandler implements BaseHandler {
    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        JsonObject body = null;
        try { body = JsonParser.parseString(req.getBody()).getAsJsonObject(); } catch (Exception ignored) {}
        if (body == null || !body.has("goalId")) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        String goalIdStr;
        var gEl = body.get("goalId");
        if (gEl.isJsonObject() && gEl.getAsJsonObject().has("$oid")) {
            goalIdStr = gEl.getAsJsonObject().get("$oid").getAsString();
        } else {
            goalIdStr = gEl.getAsString();
        }

        ObjectId id;
        try { id = new ObjectId(goalIdStr); }
        catch (IllegalArgumentException ex) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, java.util.Collections.emptyList(), "Invalid goalId format"));
        }

        var dao = GoalDao.getInstance();
        var del = dao.delete(new Document("_id", id).append("userName", auth.userName));
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, del, "Goal deleted"));
    }
}
