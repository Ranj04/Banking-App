package handler;

import request.ParsedRequest;

public class HandlerFactory {
    // routes based on the path. Add your custom handlers here
    public static BaseHandler getHandler(ParsedRequest request) {
        return switch (request.getPath()) {
            case "/createUser" -> new CreateUserHandler();
            case "/login" -> new LoginHandler();
            case "/getTransactions" -> new GetTransactionsHandler();
            case "/createDeposit" -> new CreateDepositHandler();
            case "/transfer" -> new TransferHandler();
            case "/withdraw" -> new WithdrawHandler();
            case "/savings" -> new SavingsHandler();
            case "/getSavings" -> new GetSavingsGoalHandler();
            case "/financing" -> new FinancingHandler();
            case "/repay" -> new RepayHandler();
            case "/balance" -> new BalanceHandler();
            default -> new FallbackHandler();
        };
    }

}
