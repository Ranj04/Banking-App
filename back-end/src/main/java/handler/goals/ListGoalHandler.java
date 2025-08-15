package handler.goals;

import dao.GoalDao;
import dao.SpendDao;
import dto.GoalDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.*;
import java.util.*;

public class ListGoalHandler implements BaseHandler {

    static class GoalView {
        public GoalDto goal;
        public double progressAmount;
        public double percent;
        public String periodLabel;
    }

    @Override public HttpResponseBuilder handleRequest(ParsedRequest req) {
        var auth = AuthFilter.doFilter(req);
        if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

        var goals = GoalDao.getInstance().query(new org.bson.Document("userName", auth.userName));
        long now = System.currentTimeMillis();

        LocalDate today = Instant.ofEpochMilli(now).atZone(ZoneId.systemDefault()).toLocalDate();
        long monthStart = today.withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long monthEnd   = today.plusMonths(1).withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        String label    = today.getMonth().toString().substring(0,1) + today.getMonth().toString().substring(1).toLowerCase() + " " + today.getYear();

        var spendDao = SpendDao.getInstance();
        List<GoalView> out = new ArrayList<>();

        for (GoalDto g : goals) {
            GoalView v = new GoalView();
            v.goal = g;
            if ("savings".equalsIgnoreCase(g.type)) {
                double sum = g.contributions == null ? 0.0 :
                        g.contributions.stream().mapToDouble(c -> c.amount == null ? 0.0 : c.amount).sum();
                v.progressAmount = sum;
                v.percent = g.targetAmount != null && g.targetAmount > 0 ? Math.min(100, (sum / g.targetAmount) * 100.0) : 0;
                v.periodLabel = "All time";
            } else {
                double spent = spendDao.findForUserCategoryWindow(auth.userName, g.category, monthStart, monthEnd)
                        .stream().mapToDouble(s -> s.amount == null ? 0.0 : s.amount).sum();
                v.progressAmount = spent;
                v.percent = g.targetAmount != null && g.targetAmount > 0 ? Math.min(100, (spent / g.targetAmount) * 100.0) : 0;
                v.periodLabel = label;
            }
            out.add(v);
        }

        return new HttpResponseBuilder().setStatus(StatusCodes.OK)
                .setBody(new RestApiAppResponse<>(true, out, null));
    }
}
