package dao;

import com.mongodb.client.model.Filters;
import dto.GoalDto;
import org.bson.types.ObjectId;

public class GoalDaoExt {
    public static GoalDto byIdForUser(ObjectId id, String userName) {
        var doc = GoalDao.getInstance().col().find(
                Filters.and(Filters.eq("_id", id), Filters.eq("userName", userName))
        ).first();
        return doc == null ? null : GoalDto.fromDocument(doc);
    }
}

