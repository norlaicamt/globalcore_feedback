// frontend/src/App.js
import React from "react";
import UserList from "./components/UserList"; // make sure this exists
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Feedback Management System</h1>
      </header>
      <main style={{ padding: "20px" }}>
        <UserList />
        {/* Later you can add FeedbackList, CategoriesList, DepartmentsList, Dashboard, etc. */}
      </main>
    </div>
  );
}

export default App;