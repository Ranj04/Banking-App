package handler;

import dao.AccountDao;
import dao.GoalDao;
import dao.TransactionDao;
import dto.TransactionDto;
import dto.TransactionType;
import org.bson.Document;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.Instant;

public class WithdrawHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var json = GsonTool.GSON.fromJson(request.getBody(), com.google.gson.JsonObject.class);
        if (json == null) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        if (!json.has("accountId") || !json.has("goalId") || !json.has("amount")) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "accountId, goalId, amount are required"));
        }

        String accountId = asId(json.get("accountId"));
        String goalId    = asId(json.get("goalId"));
        double amount    = json.get("amount").getAsDouble();
        if (amount <= 0) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "amount must be > 0"));
        }

        var acc = AccountDao.getInstance()
                .query(new Document("_id", new ObjectId(accountId)).append("userName", auth.userName))
                .stream().findFirst().orElse(null);
        if (acc == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<>(false, null, "Account not found"));
        }

        var goal = GoalDao.getInstance()
                .query(new Document("_id", new ObjectId(goalId)).append("userName", auth.userName))
                .stream().findFirst().orElse(null);
        if (goal == null || goal.accountId == null || !goal.accountId.equals(new ObjectId(accountId))) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<>(false, null, "Goal not found in this account"));
        }

        double gAlloc = goal.allocatedAmount == null ? 0.0 : goal.allocatedAmount;
        if (gAlloc < amount) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "Insufficient allocated funds in this goal"));
        }

        // De-allocate only (balance unchanged)
        goal.allocatedAmount = gAlloc - amount;
        GoalDao.getInstance().replace(goal.id, goal);

        var tx = new TransactionDto();
        tx.setTransactionType(TransactionType.Withdraw);
        tx.setUserId(auth.userName);
        tx.setAmount(amount);
        tx.setTimestamp(Instant.now().toEpochMilli());
        tx.setAccountId(accountId);
        tx.setGoalId(goalId);
        TransactionDao.getInstance().put(tx);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, tx, null));
    }

    private static String asId(com.google.gson.JsonElement el) {
        if (el == null || el.isJsonNull()) return null;
        if (el.isJsonPrimitive()) return el.getAsString();
        if (el.isJsonObject() && el.getAsJsonObject().has("$oid")) {
            return el.getAsJsonObject().get("$oid").getAsString();
        }
        return null;
    }
}
