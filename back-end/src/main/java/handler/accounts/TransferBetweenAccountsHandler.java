package handler.accounts;

import com.google.gson.Gson;
import dao.AccountDao;
import dao.TransactionDao;
import dao.GoalDao; // added
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

public class TransferBetweenAccountsHandler implements BaseHandler {

  static class Body { String fromAccountId; String toAccountId; String fromGoalId; String toGoalId; Double amount; }

  @Override
  public HttpResponseBuilder handleRequest(ParsedRequest req) {
    var auth = AuthFilter.doFilter(req);
    if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

    Body b = new Gson().fromJson(req.getBody(), Body.class);
    if (b == null || b.amount == null || b.amount <= 0 || b.fromAccountId == null || b.toAccountId == null) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "fromAccountId, toAccountId and positive amount required"));
    }
    if (b.fromAccountId.equals(b.toAccountId)) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "from and to cannot be the same"));
    }

    var accDao = AccountDao.getInstance();
    var from = accDao.query(new Document("_id", new ObjectId(b.fromAccountId))
        .append("userName", auth.userName)).stream().findFirst().orElse(null);
    var to = accDao.query(new Document("_id", new ObjectId(b.toAccountId))
        .append("userName", auth.userName)).stream().findFirst().orElse(null);

    if (from == null || to == null) {
      return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
          .setBody(new RestApiAppResponse<>(false, null, "Account not found"));
    }

    double fromBal = from.balance == null ? 0.0 : from.balance;
    if (fromBal < b.amount) {
      return new HttpResponseBuilder().setStatus("400 Bad Request")
          .setBody(new RestApiAppResponse<>(false, null, "Insufficient funds"));
    }

    // Update balances
    from.balance = fromBal - b.amount;
    to.balance = (to.balance == null ? 0.0 : to.balance) + b.amount;
    accDao.replace(new ObjectId(from.getUniqueId()), from);
    accDao.replace(new ObjectId(to.getUniqueId()), to);

    // Optional goal allocation adjustments
    dto.GoalDto fromGoal = null, toGoal = null;
    if (b.fromGoalId != null && !b.fromGoalId.isBlank()) {
      try {
        var gid = new ObjectId(b.fromGoalId);
        fromGoal = GoalDao.getInstance().byIdForUser(gid, auth.userName);
        if (fromGoal == null) {
          return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                  .setBody(new RestApiAppResponse<>(false, null, "fromGoal not found"));
        }
        if (fromGoal.accountId == null || !fromGoal.accountId.equals(new ObjectId(b.fromAccountId))) {
          return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                  .setBody(new RestApiAppResponse<>(false, null, "fromGoal not in fromAccount"));
        }
        double alloc = fromGoal.allocatedAmount == null ? 0.0 : fromGoal.allocatedAmount;
        if (alloc < b.amount) {
          return new HttpResponseBuilder().setStatus("400 Bad Request")
                  .setBody(new RestApiAppResponse<>(false, null, "Insufficient fromGoal allocation"));
        }
        fromGoal.allocatedAmount = alloc - b.amount;
        GoalDao.getInstance().replace(fromGoal.id, fromGoal);
      } catch (IllegalArgumentException e) {
        return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                .setBody(new RestApiAppResponse<>(false, null, "Invalid fromGoalId"));
      }
    }

    if (b.toGoalId != null && !b.toGoalId.isBlank()) {
      try {
        var gid = new ObjectId(b.toGoalId);
        toGoal = GoalDao.getInstance().byIdForUser(gid, auth.userName);
        if (toGoal == null) {
          return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND)
                  .setBody(new RestApiAppResponse<>(false, null, "toGoal not found"));
        }
        if (toGoal.accountId == null || !toGoal.accountId.equals(new ObjectId(b.toAccountId))) {
          return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                  .setBody(new RestApiAppResponse<>(false, null, "toGoal not in toAccount"));
        }
        toGoal.allocatedAmount = (toGoal.allocatedAmount == null ? 0.0 : toGoal.allocatedAmount) + b.amount;
        GoalDao.getInstance().replace(toGoal.id, toGoal);
      } catch (IllegalArgumentException e) {
        return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
                .setBody(new RestApiAppResponse<>(false, null, "Invalid toGoalId"));
      }
    }

    // Log two transactions so Recent Activity can show per-account context
    var tOut = new TransactionDto();
    tOut.setUserId(auth.userName);
    tOut.setTransactionType(TransactionType.Transfer);
    tOut.setAmount(-b.amount);            // negative for outflow
    tOut.setAccountId(b.fromAccountId);   // from account
    TransactionDao.getInstance().put(tOut);

    var tIn = new TransactionDto();
    tIn.setUserId(auth.userName);
    tIn.setTransactionType(TransactionType.Transfer);
    tIn.setAmount(b.amount);              // positive for inflow
    tIn.setAccountId(b.toAccountId);      // to account
    TransactionDao.getInstance().put(tIn);

    return new HttpResponseBuilder().setStatus(StatusCodes.OK)
        .setBody(new RestApiAppResponse<>(true, null, "Transfer complete"));
  }
}
