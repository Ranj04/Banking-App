package handler.goals;

import dao.AccountDao;
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

  static final class Body {
    String name;
    Double targetAmount;
    String accountId;    // required
    Long dueDateMillis;  // optional
  }

  @Override
  public HttpResponseBuilder handleRequest(ParsedRequest request) {
    var auth = AuthFilter.doFilter(request);
    if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

    Body b = new com.google.gson.Gson().fromJson(request.getBody(), Body.class);
    if (b == null || b.name == null || b.name.trim().isEmpty()) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "Missing goal name"));
    }
    if (b.accountId == null || b.accountId.isBlank()) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "Missing accountId"));
    }

    ObjectId accId;
    try { accId = new ObjectId(b.accountId); }
    catch (IllegalArgumentException e) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "Invalid accountId"));
    }

    var acc = AccountDao.getInstance()
        .query(new org.bson.Document("_id", accId).append("userName", auth.userName))
        .stream().findFirst().orElse(null);
    if (acc == null) {
      return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
          .setBody(new RestApiAppResponse<>(false, null, "Account not found"));
    }

    GoalDto g = new GoalDto();
    g.userName = auth.userName;
    g.type = "savings";
    g.name = b.name.trim();
    g.targetAmount = b.targetAmount == null ? 0.0 : Math.max(0, b.targetAmount);
    g.dueDateMillis = b.dueDateMillis;
    g.createdAt = System.currentTimeMillis();
    g.accountId = accId;
    g.allocatedAmount = 0.0;

    GoalDao.getInstance().put(g);
    return new HttpResponseBuilder().setStatus(StatusCodes.OK)
        .setBody(new RestApiAppResponse<>(true, g, "Goal created"));
  }
}
