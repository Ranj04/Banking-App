package handler.goals;

import com.google.gson.Gson;
import dao.AccountDao;
import dao.GoalDao;
import dao.GoalDaoExt;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import org.bson.types.ObjectId;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class TransferGoalsHandler implements BaseHandler {
    static class Body { String fromGoalId; String toGoalId; Double amount; }

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        Body b = new Gson().fromJson(req.getBody(), Body.class);
        if (b == null || b.fromGoalId == null || b.toGoalId == null || b.amount == null || b.amount <= 0) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "fromGoalId, toGoalId and positive amount required"));
        }

        ObjectId fromId;
        ObjectId toId;
        try { fromId = new ObjectId(b.fromGoalId); toId = new ObjectId(b.toGoalId); }
        catch (IllegalArgumentException e) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                    .setBody(new RestApiAppResponse<>(false, null, "Invalid goal id format"));
        }

        GoalDto from = GoalDaoExt.byIdForUser(fromId, auth.userName);
        GoalDto to   = GoalDaoExt.byIdForUser(toId, auth.userName);
        if (from == null || to == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                    .setBody(new RestApiAppResponse<>(false, null, "Goal not found"));
        }

        double fromAlloc = from.allocatedAmount == null ? 0.0 : from.allocatedAmount;
        if (fromAlloc < b.amount) {
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(new RestApiAppResponse<>(false, null, "Insufficient allocation in source goal"));
        }

        // Adjust allocations
        from.allocatedAmount = fromAlloc - b.amount;
        to.allocatedAmount = (to.allocatedAmount == null ? 0.0 : to.allocatedAmount) + b.amount;

        // Persist goals (using existing replace helper; GoalDto uses 'id')
        GoalDao.getInstance().replace(from.id, from);
        GoalDao.getInstance().replace(to.id, to);

        // If different accounts, move balances (only if both have accountIds)
        if (from.accountId != null && to.accountId != null && !from.accountId.equals(to.accountId)) {
            var fromAcc = AccountDao.getInstance().query(new Document("_id", from.accountId).append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            var toAcc = AccountDao.getInstance().query(new Document("_id", to.accountId).append("userName", auth.userName))
                    .stream().findFirst().orElse(null);
            if (fromAcc != null && toAcc != null) {
                double fbal = fromAcc.balance == null ? 0.0 : fromAcc.balance;
                if (fbal < b.amount) {
                    return new HttpResponseBuilder().setStatus("400 Bad Request")
                            .setBody(new RestApiAppResponse<>(false, null, "Insufficient funds in source account"));
                }
                fromAcc.balance = fbal - b.amount;
                toAcc.balance = (toAcc.balance == null ? 0.0 : toAcc.balance) + b.amount;
                AccountDao.getInstance().replace(new ObjectId(fromAcc.getUniqueId()), fromAcc);
                AccountDao.getInstance().replace(new ObjectId(toAcc.getUniqueId()), toAcc);
            }
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, null, "Transfer complete"));
    }
}
