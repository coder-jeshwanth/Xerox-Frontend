import React, { useEffect, useState, useMemo } from "react";
import { IoMdDownload } from "react-icons/io";
import { MdCancel } from "react-icons/md";
import { FaSearch, FaHandScissors } from "react-icons/fa";
import { RiRunLine, RiColorFilterFill } from "react-icons/ri";
import { LuLoaderPinwheel, LuRectangleHorizontal, LuRectangleVertical } from "react-icons/lu";
import { LiaHandPaper } from "react-icons/lia";
import styles from "./OwnerDashboard.module.css";
import config from "../../../config";

const OwnerDashboard = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [downloadStatus, setDownloadStatus] = useState({});
    const deletedUsers = new Set(); // Track deleted users

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("jwtToken");
            if (!token) {
                setError("No token found. Please log in.");
                return;
            }

            try {
                const response = await fetch(`${config.baseUrl}${config.api.getAllUsers}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await response.json();

                if (response.ok) {
                    console.log("Fetched data:", result);

                    // Remove users that were deleted
                    const filteredData = result.filter(user => !deletedUsers.has(user.phoneNumber));

                    // Always update `data` and trigger re-render
                    setData([...filteredData]); // New array reference ensures React updates

                } else {
                    setError(result.message || "Failed to fetch data.");
                }
            } catch (error) {
                console.error("Error:", error);
                setError("An error occurred. Please try again.");
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 2000); // Fetch every 2 seconds
        return () => clearInterval(intervalId);
    }, []);

    const handleDeleteUser = async (phoneNumber) => {
        console.log(`Attempting to delete user: ${phoneNumber}`);
        const deleteUrl = `${config.baseUrl}${config.api.deleteUser(phoneNumber)}`;

        try {
            const response = await fetch(deleteUrl, { method: "DELETE" });

            console.log(`Delete API Response Status for ${phoneNumber}:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete user: ${errorText}`);
            }

            console.log(`User ${phoneNumber} deleted successfully.`);
            deletedUsers.add(phoneNumber); // Track deleted users

            setData(prevData => {
                const updatedData = prevData.filter(user => user.phoneNumber !== phoneNumber);
                console.log("Updated data after deletion:", updatedData);
                return updatedData;
            });

        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleDownload = async (fileId, username, phoneNumber, fileName) => {
        const fileUrl = `${config.baseUrl}${config.api.downloadFile(fileId, username, phoneNumber)}`;
        console.log(`Downloading file from URL: ${fileUrl}`);
        try {
            const response = await fetch(fileUrl, {
                method: "POST"
            });
            console.log(`Response status: ${response.status}`);
            if (!response.ok) {
                throw new Error("Failed to download file.");
            }
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = `${username}_${fileName}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("File downloaded successfully.");

            setDownloadStatus(prevStatus => {
                const newStatus = { ...prevStatus };
                if (!newStatus[phoneNumber]) {
                    newStatus[phoneNumber] = new Set();
                }
                newStatus[phoneNumber].add(fileId);
                return newStatus;
            });
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };


    const groupedData = useMemo(() => {
        return data.reduce((acc, item) => {
            if (!acc[item.phoneNumber]) {
                acc[item.phoneNumber] = [];
            }
            acc[item.phoneNumber].push(item);
            return acc;
        }, {});
    }, [data]); // Recalculate when `data` updates

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <img src="/offshare.png" alt="Offshare Logo" className={styles.logo} />
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search by username"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchBar}
                    />
                    <FaSearch className={styles.searchIcon} />
                </div>
                <button className={styles.headerButton} onClick={() => {
                    localStorage.removeItem("jwtToken");
                    window.location.href = "/owner/login";
                }}>
                    <RiRunLine className={styles.buttonIcon} />
                    <span className={styles.buttonText}>Logout</span>
                </button>
            </header>

            <div className={styles.dashboardd}>
                {error && <p className={styles.errorr}>{error}</p>}
                {Object.keys(groupedData).length > 0 ? (
                    <div className={styles.containerBoxx}>
                        {Object.entries(groupedData).map(([phoneNumber, files]) => (
                            <div key={phoneNumber} className={styles.userGroupp}>
                                <div className={`${styles.usernameContainer} ${downloadStatus[phoneNumber] && downloadStatus[phoneNumber].size === files.length ? styles.downloaded : ''}`}>
                                    <h2 className={styles.usernamee}>{files[0].username}</h2>
                                    <MdCancel className={styles.cancelIcon} onClick={() => handleDeleteUser(phoneNumber)} />
                                </div>
                                <div className={styles.fileContainerr}>
                                    {files.map((file) => (
                                        <div key={file.fileId} className={styles.dataItemm}>
                                            <img
                                                src={file.fileName.endsWith(".pdf") ? "/pdffile.png" :
                                                    /\.(jpeg|jpg|png)$/i.test(file.fileName) ? "/imagefile.png" : "/file-icon.png"}
                                                alt="File Icon"
                                                className={styles.fileIconn}
                                            />
                                            <div className={styles.fileInfoo}>
                                                <p className={styles.fileNamee}>{file.fileName.length > 12 ? file.fileName.substring(0, 12) + "..." : file.fileName}</p>
                                                <div className={styles.fileAttributes}>
                                                    {file.color && (
                                                        <RiColorFilterFill className={file.color === "color" ? "red" : "black"} />
                                                    )}
                                                    {file.layout && (
                                                        file.layout === "landscape" ? <LuRectangleHorizontal /> : <LuRectangleVertical />
                                                    )}
                                                    {file.side && (
                                                        file.side === "single" ? <LiaHandPaper /> : <FaHandScissors />
                                                    )}
                                                    <p>{file.no_of_copies}</p>
                                                </div>
                                                <p className={styles.fileSizee}>{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button
                                                className={styles.downloadButtonn}
                                                onClick={() => handleDownload(file.fileId, file.username, file.phoneNumber, file.fileName)}
                                            >
                                                <IoMdDownload/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.loaderContainer}>
                        <LuLoaderPinwheel className={styles.loaderIcon}/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;