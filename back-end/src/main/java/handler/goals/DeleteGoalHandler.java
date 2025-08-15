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

public class DeleteGoalHandler implements BaseHandler {
    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var body = com.google.gson.JsonParser.parseString(req.getBody()).getAsJsonObject();
        if (!body.has("goalId")) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        var id = new ObjectId(body.get("goalId").getAsString());
        var dao = GoalDao.getInstance();
        var del = dao.delete(new Document("_id", id).append("userName", auth.userName));
        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, del, "Goal deleted"));
    }
}
