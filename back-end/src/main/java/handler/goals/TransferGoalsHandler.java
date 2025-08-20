package handler.goals;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import dao.AccountDao;
import dao.GoalDao;
import dao.GoalDaoExt;
import dao.TransactionDao;
import dto.GoalDto;
import dto.TransactionDto;
import dto.TransactionType;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.Instant;

public class TransferGoalsHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        JsonObject body = JsonParser.parseString(req.getBody()).getAsJsonObject();
        String fromGoalId = asId(body.get("fromGoalId"));
        String toGoalId   = asId(body.get("toGoalId"));
        double amount     = body.has("amount") ? body.get("amount").getAsDouble() : 0.0;

        if (fromGoalId == null || toGoalId == null || amount <= 0) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "fromGoalId, toGoalId and positive amount are required"));
        }
        if (fromGoalId.equals(toGoalId)) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "fromGoalId and toGoalId must be different"));
        }

        GoalDto from = GoalDaoExt.byIdForUser(new ObjectId(fromGoalId), auth.userName);
        GoalDto to   = GoalDaoExt.byIdForUser(new ObjectId(toGoalId), auth.userName);
        if (from == null || to == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<>(false, null, "Goal not found"));
        }

        double fromAlloc = from.allocatedAmount == null ? 0.0 : from.allocatedAmount;
        if (fromAlloc < amount) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "Insufficient allocated funds in source goal"));
        }

        // Destination guard: cannot oversubscribe destination account
        if (to.accountId != null) {
            var toAcc = AccountDao.getInstance()
                    .query(new Document("_id", to.accountId).append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            if (toAcc == null) {
                return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                        .setBody(new RestApiAppResponse<>(false, null, "Destination account not found"));
            }
            double toBal = toAcc.balance == null ? 0.0 : toAcc.balance;
            double toSumAllocated = GoalDao.getInstance()
                    .query(new Document("userName", auth.userName).append("accountId", to.accountId))
                    .stream().mapToDouble(g -> g.allocatedAmount == null ? 0.0 : g.allocatedAmount).sum();
            double toUnallocated = Math.max(0.0, toBal - toSumAllocated);
            if (amount > toUnallocated + 1e-9) {
                return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                        .setBody(new RestApiAppResponse<>(false, null, "Destination account lacks unallocated funds"));
            }
        }

        // Move allocations
        from.allocatedAmount = fromAlloc - amount;
        double toAlloc = to.allocatedAmount == null ? 0.0 : to.allocatedAmount;
        to.allocatedAmount = toAlloc + amount;

        GoalDao.getInstance().replace(from.id, from);
        GoalDao.getInstance().replace(to.id, to);

        // If different accounts, move balances too
        boolean crossAccount = (from.accountId != null && to.accountId != null && !from.accountId.equals(to.accountId));
        if (crossAccount) {
            var fromAcc = AccountDao.getInstance()
                    .query(new Document("_id", from.accountId).append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            var toAcc = AccountDao.getInstance()
                    .query(new Document("_id", to.accountId).append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            if (fromAcc == null || toAcc == null) {
                return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                        .setBody(new RestApiAppResponse<>(false, null, "Account not found"));
            }
            double fbal = fromAcc.balance == null ? 0.0 : fromAcc.balance;
            if (fbal < amount) {
                return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                        .setBody(new RestApiAppResponse<>(false, null, "Insufficient funds in source account"));
            }
            fromAcc.balance = fbal - amount;
            toAcc.balance = (toAcc.balance == null ? 0.0 : toAcc.balance) + amount;

            AccountDao.getInstance().replace(new ObjectId(fromAcc.getUniqueId()), fromAcc);
            AccountDao.getInstance().replace(new ObjectId(toAcc.getUniqueId()), toAcc);
        }

        // Record transfer
        TransactionDto tx = new TransactionDto();
        tx.setTransactionType(TransactionType.Transfer);
        tx.setUserId(auth.userName);
        tx.setAmount(amount);
        tx.setTimestamp(Instant.now().toEpochMilli());
        tx.setFromGoalId(fromGoalId);
        tx.setToGoalId(toGoalId);
        tx.setAccountId(from.accountId != null ? from.accountId.toHexString() : null);
        tx.setGoalId(to.id != null ? to.id.toHexString() : null);
        TransactionDao.getInstance().put(tx);

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, tx, "Transfer complete"));
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
