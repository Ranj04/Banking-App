# Final Project

## Overview
In teams of 3-4 members, enhance the hw2/react fullstack template to add 1 new feature per team member. Each team member to add 1 new additional feature. Coordinate so that the new features fit around a theme, and 2 people don't add the same feature. Large features can be split up between members. For example a contacts list feature may be composed of 2 endpoints, 1 to add a contact, and 1 to list contacts.

Please avoid force push (git push -f)! It can delete other student's commits.

Sample ideas:
- Contacts list
- Credit feature
- Send direct message
- public feed

### Requirements
- Add 1 new endpoint
- Modify front end to use new endpoint
- Merge all code to main branch
- Each member must submit commits for their own feature from their own account.

Each team member will have their own score.

### Scoring
- Does Feature work
- Are edge cases handled? (Think of what happens in common edge cases)
- Is work merged to main branch

## Team [Yogurts]
- Team members:
-   Clark Batungbakal
-   Alonzo Manosca
-   Yuya Hamase
-   Ranjiv Jithendran

- Feature: Savings Goal Tracker
  - Create savings goal: Allow users to set a new savings goal with details like target amount and deadline.
    -  Endpoint: POST /savings-goals
    -  Team member: Clark Batungbakal
  - Fetch all savings goals: Retrieve a list of all savings goals set by the user.
    -  Endpoint: GET /savings-goals
    -  Team member: Alonzo Manosca
 
      (Screenshots of back/front end)
    
      ![Screen Shot 2024-12-18 at 11 28 12 PM](https://github.com/user-attachments/assets/6268dbe0-c567-4931-8c3a-364448ed1f5b)
      ![image](https://github.com/user-attachments/assets/32cf7cfe-e630-456a-adb6-61074131a475)
      ![image](https://github.com/user-attachments/assets/0e94f627-e59b-4c71-8d0e-894387d72cfc)
      ![image](https://github.com/user-attachments/assets/2ef43452-fdd5-41ff-8910-109f38368af6)
      ![image](https://github.com/user-attachments/assets/7e81a593-00d8-4d2d-a7c3-e6b9f3bb60ab)
      ![image](https://github.com/user-attachments/assets/8fa735a6-deec-4f28-99e7-1c3894a8b58b)
      ![image](https://github.com/user-attachments/assets/69c202b0-9e0f-49dc-9737-c225214301fc)







  - Update savings goal progress: Allow users to update the current amount saved towards a specific goal.
    -  Endpoint: PUT /savings-goals/:id/progress
    -  Team member: Ranj
      
 - Feature: Financing and Repay
   - Financing
     -  add two variables to UserDto, debt and interest
     -  users can make a loan if they have no debt and upper limit of debt is twice of current balance
     -  I might add another requirement to make a loan
   - Repay
     -  users can repay debt to bank here
     -  interest increases deepends on the amount of debt
   -  Team member: Yuya Hamase

