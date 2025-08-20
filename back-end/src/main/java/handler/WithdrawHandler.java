package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class WithdrawHandler implements BaseHandler {

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

        // --- NEW: account-level withdraw ---
        if (accountId != null && !accountId.isBlank()) {
            var acc = dao.AccountDao.getInstance()
                    .query(new org.bson.Document("_id", new org.bson.types.ObjectId(accountId))
                            .append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            if (acc == null) return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND);

            double bal = acc.balance == null ? 0.0 : acc.balance;
            if (bal < amount) {
                return new HttpResponseBuilder().setStatus("400 Bad Request")
                        .setBody(new response.RestApiAppResponse<>(false, null, "Insufficient funds"));
            }
            acc.balance = bal - amount;
            dao.AccountDao.getInstance().replace(new org.bson.types.ObjectId(acc.getUniqueId()), acc);

            var txn = new dto.TransactionDto();
            txn.setUserId(auth.userName);
            txn.setTransactionType(dto.TransactionType.Withdraw);
            txn.setAmount(amount);
            txn.setAccountId(accountId);   // tag txn with account
            dao.TransactionDao.getInstance().put(txn);

            return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                    .setBody(new response.RestApiAppResponse<>(true, java.util.List.of(txn), "Withdraw complete"));
        }

        // --- LEGACY: keep your existing user-level logic unchanged below ---
        var userDao = dao.UserDao.getInstance();
        var user = userDao.query(new org.bson.Document("userName", auth.userName)).get(0);
        double bal = user.getBalance();
        if (bal < amount) {
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(GsonTool.GSON.toJson(new RestApiAppResponse<>(false, "Not enough funds")));
        }
        var txn = GsonTool.GSON.fromJson(request.getBody(), dto.TransactionDto.class);
        txn.setTransactionType(dto.TransactionType.Withdraw);
        txn.setUserId(auth.userName);
        dao.TransactionDao.getInstance().put(txn);
        user.setBalance(bal - txn.getAmount());
        userDao.put(user);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, java.util.List.of(txn), null));
    }
}
