import React from "react";
import { Route, Routes } from "react-router-dom";

import FormComponent from "./component/User Interface/InputForm";
import OwnerLogin from "./component/Owner interface/login page/OwnerLogin";
import OwnerDashboard from "./component/Owner interface/Dashboard page/OwnerDashboard"; // Import the OwnerDashboard.js component

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<FormComponent />} />
                <Route path="/owner/login" element={<OwnerLogin />} />
                <Route path="/owner/dashboard" element={<OwnerDashboard />} /> {/* Add the route for OwnerDashboard.js */}
            </Routes>
        </div>
    );
}

export default App;