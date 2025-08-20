package handler.goals;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonElement;
import dao.GoalDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

/**
 * Create a goal under a savings account.
 * Request: { "name": "Europe", "targetAmount": 2000, "accountId": "<ObjectId>", "dueDateMillis": 0 }
 */
public class CreateGoalHandler implements BaseHandler {
    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        // robust body parsing
        JsonObject body = JsonParser.parseString(request.getBody()).getAsJsonObject();
        ObjectId accountObjId = parseObjectId(body.get("accountId"));
        String name = body.has("name") ? body.get("name").getAsString() : null;
        Double target = body.has("targetAmount") && !body.get("targetAmount").isJsonNull()
                ? body.get("targetAmount").getAsDouble() : null;

        if (accountObjId == null || name == null || name.isBlank()) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "Invalid accountId or name"));
        }

        // create goal
        GoalDto g = new GoalDto();
        g.userName = auth.userName;
        g.accountId = accountObjId;
        g.name = name;
        g.targetAmount = target;
        g.allocatedAmount = 0.0;
        g.createdAt = System.currentTimeMillis();
        GoalDao.getInstance().put(g);

        // response
        JsonObject out = new JsonObject();
        out.addProperty("_id", g.id.toHexString());
        out.addProperty("userName", g.userName);
        out.addProperty("accountId", g.accountId.toHexString());
        out.addProperty("name", g.name);
        out.addProperty("allocatedAmount", g.allocatedAmount);
        if (g.targetAmount != null) out.addProperty("targetAmount", g.targetAmount);
        out.addProperty("createdAt", g.createdAt);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }

    private static ObjectId parseObjectId(JsonElement el) {
        if (el == null || el.isJsonNull()) return null;
        if (el.isJsonPrimitive()) {
            String s = el.getAsString();
            if (s != null && s.matches("^[0-9a-fA-F]{24}$")) return new ObjectId(s);
            return null;
        }
        if (el.isJsonObject() && el.getAsJsonObject().has("$oid")) {
            String s = el.getAsJsonObject().get("$oid").getAsString();
            if (s != null && s.matches("^[0-9a-fA-F]{24}$")) return new ObjectId(s);
        }
        return null;
    }
}
