package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class CreateDepositHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var json = GsonTool.GSON.fromJson(request.getBody(), com.google.gson.JsonObject.class);
        if (json == null || !json.has("amount")) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);
        double amount = json.get("amount").getAsDouble();
        if (amount <= 0) return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST);

        String accountId = json.has("accountId") && !json.get("accountId").isJsonNull()
                ? json.get("accountId").getAsString() : null;
        String goalId = json.has("goalId") && !json.get("goalId").isJsonNull()
                ? json.get("goalId").getAsString() : null;

        // Account-aware deposit
        if (accountId != null && !accountId.isBlank()) {
            var acc = dao.AccountDao.getInstance()
                    .query(new org.bson.Document("_id", new org.bson.types.ObjectId(accountId))
                            .append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            if (acc == null) return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new response.RestApiAppResponse<>(false, null, "Account not found"));

            acc.balance = (acc.balance == null ? 0.0 : acc.balance) + amount;
            dao.AccountDao.getInstance().replace(new org.bson.types.ObjectId(acc.getUniqueId()), acc);

            // Updated goal allocation logic using string comparison of ObjectIds
            if (goalId != null && !goalId.isBlank()) {
                org.bson.types.ObjectId gid;
                try { gid = new org.bson.types.ObjectId(goalId); }
                catch (IllegalArgumentException e) {
                    return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                            .setBody(new response.RestApiAppResponse<>(false, null, "Invalid goalId"));
                }
                var goal = dao.GoalDao.getInstance().byIdForUser(gid, auth.userName);
                if (goal == null) return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                        .setBody(new response.RestApiAppResponse<>(false, null, "Goal not found"));

                String goalAcc = goal.accountId == null ? null : goal.accountId.toHexString();
                if (!accountId.equals(goalAcc)) {
                    return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                            .setBody(new response.RestApiAppResponse<>(false, null, "Goal does not belong to account"));
                }
                goal.allocatedAmount = (goal.allocatedAmount == null ? 0.0 : goal.allocatedAmount) + amount;
                dao.GoalDao.getInstance().replace(goal.id, goal);
            }

            var txn = new dto.TransactionDto();
            txn.setUserId(auth.userName);
            txn.setTransactionType(dto.TransactionType.Deposit);
            txn.setAmount(amount);
            txn.setAccountId(accountId);
            if (goalId != null && !goalId.isBlank()) txn.setGoalId(goalId); // tag txn with goal
            dao.TransactionDao.getInstance().put(txn);

            return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                    .setBody(new response.RestApiAppResponse<>(true, java.util.List.of(txn), "Deposit complete"));
        }

        // Legacy (user-level)
        var userDao = dao.UserDao.getInstance();
        var user = userDao.query(new org.bson.Document("userName", auth.userName)).get(0);
        var txn = GsonTool.GSON.fromJson(request.getBody(), dto.TransactionDto.class);
        txn.setTransactionType(dto.TransactionType.Deposit);
        txn.setUserId(auth.userName);
        dao.TransactionDao.getInstance().put(txn);
        user.setBalance(user.getBalance() + txn.getAmount());
        userDao.put(user);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new response.RestApiAppResponse<>(true, java.util.List.of(txn), null));
    }
}
