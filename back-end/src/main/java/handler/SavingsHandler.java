package handler;

import dao.SavingsGoalDao;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class SavingsHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        AuthFilter.AuthResult authResult = AuthFilter.doFilter(request);
        if (!authResult.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }

        try {
            if ("PUT".equalsIgnoreCase(request.getMethod())) {
                return handleUpdateProgress(request, authResult.userName);
            }
            return new HttpResponseBuilder().setStatus(StatusCodes.METHOD_NOT_ALLOWED);
        } catch (Exception e) {
            return new HttpResponseBuilder().setStatus(StatusCodes.INTERNAL_SERVER_ERROR).setBody(e.getMessage());
        }
    }

    private HttpResponseBuilder handleUpdateProgress(ParsedRequest request, String userName) {
        String id = request.getQueryParam("id");
        if (id == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST).setBody("Missing goal ID.");
        }

        SavingsGoalDao savingsGoalDao = SavingsGoalDao.getInstance();
        Document existingGoal = savingsGoalDao.getById(id);

        if (existingGoal == null) {
            return new HttpResponseBuilder().setStatus(StatusCodes.NOT_FOUND).setBody("Savings goal not found.");
        }

        if (!existingGoal.getString("userId").equals(userName)) {
            return new HttpResponseBuilder().setStatus(StatusCodes.FORBIDDEN).setBody("Unauthorized to update this goal.");
        }

        try {
            double additionalAmount = GsonTool.GSON.fromJson(request.getBody(), Double.class);
            double currentAmount = existingGoal.getDouble("currentAmount");
            double targetAmount = existingGoal.getDouble("targetAmount");

            double newAmount = currentAmount + additionalAmount;
            if (newAmount > targetAmount) {
                newAmount = targetAmount; // Cap at target amount
            }

            savingsGoalDao.updateProgress(id, newAmount);

            RestApiAppResponse<?> response = new RestApiAppResponse<>("Progress updated successfully.");
            response.addProperty("newAmount", newAmount);

            return new HttpResponseBuilder().setStatus(StatusCodes.OK).setBody(response);
        } catch (Exception e) {
            return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST).setBody("Invalid request body.");
        }
    }
}
