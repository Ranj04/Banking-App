package handler;

import dao.AccountDao;
import dao.GoalDao;
import dao.TransactionDao;
import dto.GoalDto;
import dto.TransactionDto;
import dto.TransactionType;
import org.bson.Document;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.Instant;

public class CreateDepositHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        // New allocation-only logic (does not change account balance)
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

        // Load account & goal owned by user
        var acc = AccountDao.getInstance()
                .query(new org.bson.Document("_id", new org.bson.types.ObjectId(accountId)).append("userName", auth.userName))
                .stream().findFirst().orElse(null);
        if (acc == null) return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                .setBody(new RestApiAppResponse<>(false, null, "Account not found"));

        var goal = GoalDao.getInstance()
                .query(new org.bson.Document("_id", new org.bson.types.ObjectId(goalId)).append("userName", auth.userName))
                .stream().findFirst().orElse(null);
        if (goal == null || goal.accountId == null || !goal.accountId.equals(new org.bson.types.ObjectId(accountId))) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<>(false, null, "Goal not found in this account"));
        }

        // Compute unallocated = balance - sumAllocated
        double balance = acc.balance == null ? 0.0 : acc.balance;
        double sumAllocated = GoalDao.getInstance()
                .query(new org.bson.Document("userName", auth.userName).append("accountId", new org.bson.types.ObjectId(accountId)))
                .stream()
                .mapToDouble(g -> g.allocatedAmount == null ? 0.0 : g.allocatedAmount)
                .sum();
        double unallocated = Math.max(0.0, balance - sumAllocated);

        if (amount > unallocated + 1e-9) { // tiny epsilon to avoid float quirks
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null,
                            "Insufficient unallocated funds in this account. Available: " + String.format("%.2f", unallocated)));
        }

        // Allocate (do NOT change account.balance)
        goal.allocatedAmount = (goal.allocatedAmount == null ? 0.0 : goal.allocatedAmount) + amount;
        GoalDao.getInstance().replace(goal.id, goal);

        // Log transaction
        var tx = new TransactionDto();
        tx.setTransactionType(TransactionType.Deposit);
        tx.setUserId(auth.userName);
        tx.setAmount(amount);
        tx.setTimestampNow();
        tx.setAccountId(accountId);
        tx.setGoalId(goalId);
        TransactionDao.getInstance().put(tx);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, tx, null));
    }

    private static String asId(com.google.gson.JsonElement el) {
        if (el == null || el.isJsonNull()) return null;
        if (el.isJsonPrimitive()) return el.getAsString();
        // support { "$oid": "..." }
        if (el.isJsonObject() && el.getAsJsonObject().has("$oid")) {
            return el.getAsJsonObject().get("$oid").getAsString();
        }
        return null;
    }
}
