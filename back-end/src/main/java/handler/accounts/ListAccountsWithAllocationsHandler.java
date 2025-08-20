package handler.accounts;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import dao.AccountDao;
import dao.GoalDao;
import dto.AccountDto;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ListAccountsWithAllocationsHandler implements BaseHandler {
    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        var auth = AuthFilter.doFilter(request);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        List<AccountDto> accounts = AccountDao.getInstance().query(new Document("userName", auth.userName));
        List<GoalDto> goals = GoalDao.getInstance().query(new Document("userName", auth.userName));

        Map<String, List<GoalDto>> byAccount = goals.stream()
                .collect(Collectors.groupingBy(g -> g.accountId == null ? "null" : g.accountId.toHexString()));

        JsonArray out = new JsonArray();
        for (AccountDto acc : accounts) {
            String accId = acc.getUniqueId();
            double balance = acc.balance == null ? 0.0 : acc.balance;

            List<GoalDto> gs = byAccount.getOrDefault(accId, List.of());
            double sumAllocated = gs.stream().mapToDouble(g -> g.allocatedAmount == null ? 0.0 : g.allocatedAmount).sum();
            double unallocated = Math.max(0.0, balance - sumAllocated);

            JsonObject accJson = new JsonObject();
            accJson.addProperty("_id", accId);
            accJson.addProperty("name", acc.name);
            accJson.addProperty("type", acc.type);
            accJson.addProperty("balance", balance);
            accJson.addProperty("sumAllocated", sumAllocated);
            accJson.addProperty("unallocated", unallocated);

            JsonArray allocs = new JsonArray();
            for (GoalDto g : gs) {
                JsonObject go = new JsonObject();
                go.addProperty("goalId", g.id == null ? null : g.id.toHexString());
                go.addProperty("goalName", g.name);
                double amt = g.allocatedAmount == null ? 0.0 : g.allocatedAmount;
                go.addProperty("amount", amt);
                go.addProperty("pct", balance > 0 ? (amt / balance) : 0.0);
                allocs.add(go);
            }
            accJson.add("allocations", allocs);
            accJson.addProperty("unallocatedPct", balance > 0 ? (unallocated / balance) : 0.0);

            out.add(accJson);
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }
}

