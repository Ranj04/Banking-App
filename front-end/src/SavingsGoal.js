import React, { useState } from "react";

const SavingsGoal = () => {
  const [goal, setGoal] = useState({ targetAmount: "", deadline: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGoal({ ...goal, [name]: value });
  };

  async function getSavingsGoals() {
    try {
      const res = await fetch('/goals/list', { credentials: 'include' });
      const data = await res.json();
      
      if (data.success === false) {
        setMessage({ type: "error", text: data.message || "Failed to fetch goals" });
        return;
      }
      
      const goalsData = data.data || data;
      if (Array.isArray(goalsData)) {
        setGoal(goalsData[0] || { targetAmount: "", deadline: "" });
        setMessage({ type: "success", text: "Goals loaded successfully" });
      } else {
        setGoal(goalsData);
        setMessage({ type: "success", text: "Goal loaded successfully" });
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setMessage({ type: "error", text: "Failed to fetch goals" });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date(goal.deadline).getTime(); // Convert deadline to numeric timestamp

    if (isNaN(timestamp)) {
      setMessage({ type: "error", text: "Invalid date format" });
      return;
    }
    
    const payload = {
      targetAmount: goal.targetAmount,
      deadline: timestamp, // Send numeric timestamp
    };
    
    try {
      const response = await fetch("/goals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success === false) {
        setMessage({ type: "error", text: data.message || "Failed to create goal" });
        return;
      }

      if (!response.ok) {
        setMessage({ type: "error", text: data.message || "Error creating goal" });
        return;
      }

      setMessage({ type: "success", text: "Savings goal created successfully!" });
      console.log("Savings goal created:", data);
    } catch (error) {
      console.error("Request failed:", error);
      setMessage({ type: "error", text: "Request failed. Please try again." });
    }
  };

  return (
    <div>
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
        <label htmlFor="date">Date (yyyy-mm-dd):</label>
        <input id="date" type="date" name="deadline" value={goal.deadline} onChange={handleInputChange} />
        <br />
        <button type="submit">Set Goal</button>
        <button type="button" onClick={getSavingsGoals}>Show Current Goals</button>
      </form>
      
      {message.text && (
        <div className={`alert ${message.type === "success" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default SavingsGoal;