import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEye } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import styles from "./OwnerLogin.module.css";

const OwnerLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://192.168.29.114:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    username: username,
                    password: password
                })
            });
            const data = await response.json();
            if (data.message === "Login successful") {
                const jwtToken = data.jwtToken;
                // Store the JWT token in a variable (or localStorage/sessionStorage)
                localStorage.setItem("jwtToken", jwtToken);
                // Redirect to Owner Dashboard page
                navigate("/owner/dashboard");
            } else {
                setErrorMessage(data.message);
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage("An error occurred. Please try again.");
        }
    };

    return (
        <div className={styles.loginContainer}>
            <img src="/pri.png" alt="Pri" className={styles.priImage} />
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                    <div className={styles.inputBox}>
                        <FaUser className={styles.icon} />
                        <input
                            id="username"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputBox}>
                        <CiLock className={styles.icon} />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <FaEye className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)} />
                    </div>
                </div>
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                <button type="submit" className={styles.loginBtn}>Login</button>
            </form>
        </div>
    );
};

export default OwnerLogin;