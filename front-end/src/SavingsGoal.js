import React, { useState } from "react";

const SavingsGoal = () => {
  const [goal, setGoal] = useState({ targetAmount: "", deadline: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGoal({ ...goal, [name]: value });
  };

  function getSavingsGoals() {
    const httpSetting = {
        method: 'GET',
        credentials: 'include',
    };

    fetch('/getSavings', httpSetting)
        .then(res => res.json())
        .then((apiResult) => {
            console.log(apiResult);
            setGoal(apiResult.data);
        })
        .catch((e) => {
            console.log(e)
        })
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date(goal.deadline).getTime(); // Convert deadline to numeric timestamp

    if (isNaN(timestamp)) {
        console.error("Invalid date format");
        return;
    }
    const payload = {
        targetAmount: goal.targetAmount,
        deadline: timestamp, // Send numeric timestamp
    };
    try {
        const response = await fetch("/savings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error response:", data.message);
            return;
        }

        console.log("Savings goal created:", data);
    } catch (error) {
        console.error("Request failed:", error);
    }
};

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Target Amount:
        <input
          type="number"
          name="targetAmount"
          value={goal.targetAmount}
          onChange={handleInputChange}
        />
      </label>
      <br />
      <label>
        Deadline (mm/dd/yyyy):
        <input
          type="date"
          name="deadline"
          value={goal.deadline}
          onChange={handleInputChange}
        />
      </label>
      <br />
      <button type="submit">Set Goal</button>
      <button>Show Current Goals</button>
    </form>
  );
};

export default SavingsGoal;