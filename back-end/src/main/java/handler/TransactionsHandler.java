package handler;

import dao.AccountDao;
import dao.GoalDao;
import dao.TransactionDao;
import dto.AccountDto;
import dto.GoalDto;
import dto.TransactionDto;
import dto.TransactionType;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.*;
import java.util.stream.Collectors;

public class TransactionsHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        int limit = 5;
        try {
            String q = request.getQueryParam("limit");
            if (q != null && !q.isBlank()) {
                int L = Integer.parseInt(q);
                if (L >= 1 && L <= 100) limit = L;
            }
        } catch (Exception ignored) {}

        // Load all accounts/goals for this user once, then map by id.
        List<AccountDto> accounts = AccountDao.getInstance()
                .query(new Document("userName", auth.userName));
        Map<String,String> accNameById = accounts.stream()
                .collect(Collectors.toMap(AccountDto::getUniqueId, a -> a.name == null ? "" : a.name));

        List<GoalDto> goals = GoalDao.getInstance()
                .query(new Document("userName", auth.userName));
        Map<String, GoalDto> goalById = new HashMap<>();
        for (GoalDto g : goals) {
            if (g.id != null) goalById.put(g.id.toHexString(), g);
        }

        // Fetch and sort transactions
        List<TransactionDto> raw = TransactionDao.getInstance()
                .query(new Document("userId", auth.userName));
        raw.sort(Comparator.comparing(TransactionDto::getTimestamp).reversed());

        List<Map<String,Object>> out = new ArrayList<>();
        for (TransactionDto t : raw.stream().limit(limit).toList()) {
            String type = t.getTransactionType() == null ? null : t.getTransactionType().name().toLowerCase();
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("_id", t.getUniqueId());
            row.put("userName", auth.userName);
            row.put("type", type);
            row.put("amount", t.getAmount());
            row.put("createdAt", t.getTimestamp());

            if (t.getTransactionType() == TransactionType.Deposit || t.getTransactionType() == TransactionType.Withdraw) {
                String goalId = t.getGoalId();
                String accountId = t.getAccountId();

                // derive accountId via goal if missing
                if ((accountId == null || accountId.isBlank()) && goalId != null) {
                    GoalDto g = goalById.get(goalId);
                    if (g != null && g.accountId != null) accountId = g.accountId.toHexString();
                }

                String accountName = accountId == null ? "" : accNameById.getOrDefault(accountId, "");
                String goalName = "";
                GoalDto g = goalById.get(goalId);
                if (g != null) goalName = g.name == null ? "" : g.name;

                row.put("accountId", accountId);
                row.put("accountName", accountName);
                row.put("goalId", goalId);
                row.put("goalName", goalName);
                row.put("displayAccount", accountName);
                row.put("displayGoal", goalName);

            } else if (t.getTransactionType() == TransactionType.Transfer) {
                String fromGoalId = t.getFromGoalId();
                String toGoalId   = t.getToGoalId();

                GoalDto fromG = goalById.get(fromGoalId);
                GoalDto toG   = goalById.get(toGoalId);

                String fromGoalName = fromG == null ? "" : Optional.ofNullable(fromG.name).orElse("");
                String toGoalName   = toG   == null ? "" : Optional.ofNullable(toG.name).orElse("");

                String fromAccId = (fromG != null && fromG.accountId != null) ? fromG.accountId.toHexString() : null;
                String toAccId   = (toG   != null && toG.accountId   != null) ? toG.accountId.toHexString()   : null;

                String fromAccName = fromAccId == null ? "" : accNameById.getOrDefault(fromAccId, "");
                String toAccName   = toAccId   == null ? "" : accNameById.getOrDefault(toAccId,   "");

                row.put("fromGoalId", fromGoalId);
                row.put("toGoalId", toGoalId);
                row.put("fromGoalName", fromGoalName);
                row.put("toGoalName", toGoalName);
                row.put("fromAccountId", fromAccId);
                row.put("toAccountId", toAccId);
                row.put("fromAccountName", fromAccName);
                row.put("toAccountName", toAccName);
                row.put("displayAccount", (fromAccName + " → " + toAccName).trim());
                row.put("displayGoal", (fromGoalName + " → " + toGoalName).trim());
            }

            out.add(row);
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }
}
