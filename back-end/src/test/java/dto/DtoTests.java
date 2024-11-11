package dto;

import java.util.Random;
import org.bson.Document;
import org.testng.Assert;
import org.testng.annotations.Test;

public class DtoTests {

  @Test
  public void convertUserDto(){
    UserDto userDto = new UserDto();
    userDto.setUserName(String.valueOf(Math.random()));
    userDto.setPassword(String.valueOf(Math.random()));
    Document document = userDto.toDocument();
    Assert.assertEquals(document.getString("userName"), userDto.getUserName());
    Assert.assertEquals(document.getString("password"), userDto.getPassword());
  }

  @Test
  public void convertAuthDto(){
    AuthDto authDto = new AuthDto();
    authDto.setHash(String.valueOf(Math.random()));
    authDto.setUserName(String.valueOf(Math.random()));
    authDto.setExpireTime(new Random().nextLong());

    Document document = authDto.toDocument();
    Assert.assertEquals(document.getString("userName"), authDto.getUserName());
    Assert.assertEquals(document.getString("hash"), authDto.getHash());
    Assert.assertEquals(document.getLong("expireTime"), authDto.getExpireTime());
  }

  @Test
  public void converTransactionDto(){
    TransactionDto transactionDto = new TransactionDto();
    transactionDto.setTransactionType(TransactionType.Deposit);
    String randomId = String.valueOf(Math.random());
    transactionDto.setUserId(randomId);
    transactionDto.setToId(String.valueOf(Math.random()));
    transactionDto.setAmount(Math.random());
    Document document = transactionDto.toDocument();
    Assert.assertEquals(document.getString("userId"), transactionDto.getUserId());
    Assert.assertEquals(document.getString("toId"), transactionDto.getToId());
    Assert.assertEquals(document.getDouble("amount"), transactionDto.getAmount());
    Assert.assertEquals(document.getString("transactionType"), TransactionType.Deposit.toString());
  }

}
