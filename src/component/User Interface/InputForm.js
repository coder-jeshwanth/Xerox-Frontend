import React, { useState, useEffect, useRef } from "react";
import "./InputForm.css"; // Import the CSS file
import { RiDeleteBin6Line } from "react-icons/ri"; // Import the delete icon
import { FaUser } from "react-icons/fa"; // Import the user icon
import { IoCallSharp } from "react-icons/io5"; // Import the call icon
import { IoSettingsOutline } from "react-icons/io5";
import config from "../../config";

const printerIcon = require("../printer.png"); // Import the printer image

const FormComponent = () => {
    const [username, setUsername] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [showUploadButton, setShowUploadButton] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadButtonText, setUploadButtonText] = useState("Upload");
    const [isUploaded, setIsUploaded] = useState(false);
    const [fetchedFiles, setFetchedFiles] = useState([]);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [fetchInterval, setFetchInterval] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // Add state for error message
    const [hasUploadedFiles, setHasUploadedFiles] = useState(false); // Add state to track if files are uploaded
    const [showPopup, setShowPopup] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [color, setColor] = useState("bw");
    const [layout, setLayout] = useState("portrait");
    const [side, setSide] = useState("single");
    const [noOfCopies, setNoOfCopies] = useState(1);
    const formBoxRef = useRef(null);
    const popupContainerRef = useRef(null);

    const handleSettingsClick = (file) => {
        setSelectedFile(file);
        setShowPopup(true);
    };

    const handleClosePopup = async () => {
        setShowPopup(false);
        setSelectedFile(null);

        // Trigger the API call with the respective values
        const fileId = selectedFile.fileId;
        const apiUrl = `${config.baseUrl}${config.api.filePreferences(fileId, layout, color, noOfCopies, side)}`;
        try {
            const response = await fetch(apiUrl, {
                method: "POST"
            });
            const data = await response.json();
            console.log("API Response:", data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        // Retrieve user information from localStorage
        const storedUsername = localStorage.getItem("username");
        const storedPhoneNumber = localStorage.getItem("phoneNumber");

        if (storedUsername && storedPhoneNumber) {
            setUsername(storedUsername);
            setPhoneNumber(storedPhoneNumber);
            setShowUploadButton(true);
            fetchFiles(storedPhoneNumber);
        }

        return () => {
            if (fetchInterval) {
                clearInterval(fetchInterval);
            }
        };
    }, [fetchInterval]);

    useEffect(() => {
        if (showPopup && formBoxRef.current && popupContainerRef.current) {
            const formBoxHeight = formBoxRef.current.offsetHeight;
            popupContainerRef.current.style.height = `${formBoxHeight / 1.3}px`;
        }
    }, [showPopup]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (phoneNumber.length !== 10) {
            setErrorMessage("Phone number must be exactly 10 digits");
            return;
        }
        try {
            const response = await fetch(`${config.baseUrl}${config.api.checkPhoneUsername(phoneNumber, username)}`);
            const data = await response.json();
            if (data.message === "proceed") {
                setShowUploadButton(true);
                setErrorMessage(""); // Clear error message
                // Store user information in localStorage
                localStorage.setItem("username", username);
                localStorage.setItem("phoneNumber", phoneNumber);
            } else if (data.message === "phonenumber exist with a different name") {
                setErrorMessage("Phone number exists with a different name");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleFileUpload = async () => {
        setIsUploading(true); // Start the upload animation
        const formData = new FormData();
        formData.append("userName", username);
        formData.append("phoneNumber", phoneNumber);
        selectedFiles.forEach(file => {
            formData.append("files", file);
        });

        try {
            const response = await fetch(`${config.baseUrl}${config.api.uploadFile}`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            if (data.message === "Files uploaded successfully") {
                setUploadButtonText("Upload");
                setIsUploaded(true);
                setSelectedFiles([]); // Clear selected files
                fetchFiles(); // Fetch files after successful upload
                setHasUploadedFiles(true); // Update state to indicate files are uploaded

                // Set up interval to fetch files every 2 seconds
                const interval = setInterval(() => {
                    fetchFiles();
                }, 2000);
                setFetchInterval(interval);
            } else if (data.error === "File already exists") {
                setUploadButtonText("File already exists");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsUploading(false); // End the upload animation
        }
    };

    const fetchFiles = async (phone = phoneNumber) => {
        try {
            const response = await fetch(`${config.baseUrl}${config.api.getUserFiles(phone)}`);
            const data = await response.json();
            setFetchedFiles(data);
            if (data.length > 0) {
                setHasUploadedFiles(true); // Update state if files are fetched
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDelete = async () => {
        if (!fileToDelete) return;
        try {
            const response = await fetch(`${config.baseUrl}${config.api.deleteFile(fileToDelete.fileId)}`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (data.error === "File not found in the database") {
                alert(`${fileToDelete.fileName} not found in the database`);
            } else if (data.message === "File and related download logs deleted successfully") {
                // Add the "boom" animation class
                const fileItem = document.getElementById(`file-${fileToDelete.fileId}`);
                fileItem.classList.add("boom");
                setTimeout(() => {
                    setFetchedFiles(fetchedFiles.filter(file => file.fileId !== fileToDelete.fileId));
                    setFileToDelete(null);
                }, 500); // Match the duration of the animation
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const isImageFile = (fileName) => {
        if (!fileName) return false; // Check if fileName is null or undefined
        const imageExtensions = ["jpg", "jpeg", "png", "gif"];
        const fileExtension = fileName.split('.').pop().toLowerCase();
        return imageExtensions.includes(fileExtension);
    };

    const isPdfFile = (fileName) => {
        if (!fileName) return false; // Check if fileName is null or undefined
        const pdfExtensions = ["pdf"];
        const fileExtension = fileName.split('.').pop().toLowerCase();
        return pdfExtensions.includes(fileExtension);
    };

    const formatFileSize = (size) => {
        const [number, unit] = size.split(" ");
        return `${parseFloat(number).toFixed(2)} ${unit}`;
    };

    const handleDeleteAllFiles = async () => {
        try {
            const response = await fetch(`${config.baseUrl}${config.api.deleteUser(phoneNumber)}`, {
                method: "DELETE"
            });
            const data = await response.json();
            if (data.message === "Files are deleted from the Database but some files are not deleted on the downloads folder") {
                alert(JSON.stringify(data, null, 2));
            }
            if (data.message === "All files are deleted successfully") {
                setFetchedFiles([]);
                setHasUploadedFiles(false); // Update state if all files are deleted
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to delete all files.");
        }
    };

    const truncateFileName = (fileName) => {
        const extension = fileName.split('.').pop();
        const name = fileName.substring(0, 5);
        return `${name}...${extension}`;
    };

    return (
        <div className="container">
            {/* Conditionally render Curved Top Section */}
            {!hasUploadedFiles && (
                <div className={`curved-top sticky${showUploadButton ? 'right' : ''} ${isUploaded ? 'uploaded' : ''}`}>
                    <img src={printerIcon} alt="Printer Icon" className="center-image" />
                </div>
            )}
            <div className="form-box" ref={formBoxRef}>
                {showUploadButton && (
                    <div className={`greeting ${isUploaded ? 'uploaded' : ''}`}>
                        <p>Hi {username}!</p>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    {!showUploadButton && (
                        <div className="inpu">
                            {/* Input Fields */}
                            <div className="input-group">
                                <FaUser className="icon" />
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <IoCallSharp className="icon" />
                                <input
                                    type="number"
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    onInput={(e) => {
                                        if (e.target.value.length > 10) {
                                            e.target.value = e.target.value.slice(0, 10);
                                        }
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    )}
                    {/* Error Message */}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {/* Upload Section */}
                    {showUploadButton && (
                        <div className="upload-section">
                            <div className="upload-area">
                                {selectedFiles.length === 0 ? (
                                    <>
                                        <p>Select your file or drag and drop</p>
                                        <p>PNG, JPG, PDF accepted</p>
                                    </>
                                ) : (
                                    selectedFiles.map((file, index) => (
                                        <p key={index}>{file.name}</p>
                                    ))
                                )}
                                <input
                                    type="file"
                                    id="file-input"
                                    onChange={handleFileChange}
                                    multiple
                                    style={{ display: "none" }}
                                />
                                <label htmlFor="file-input" className="browse-btn">
                                    Browse File
                                </label>
                            </div>
                            <button
                                type="button"
                                className={`upload-btn ${isUploading ? 'uploading' : ''}`}
                                onClick={handleFileUpload}
                                disabled={isUploading} // Disable the button while uploading
                            >
                                {isUploading ? 'Uploading...' : uploadButtonText}
                            </button>
                        </div>
                    )}
                    {/* Submit Button */}
                    {!showUploadButton && <button type="submit" className="submit-btn">Submit</button>}
                </form>
                {/* Fetched Files Section */}
                {fetchedFiles.length > 0 && (
                    <>
                        <div className="file-list">
                            {fetchedFiles.map((file) => (
                                <div key={file.fileId} id={`file-${file.fileId}`} className="file-item">
                                    <span className="file-icon">
                                        {isImageFile(file.fileName) ? (
                                            <img src="/imagefile.png" alt="Default" className="file-image"/>
                                        ) : isPdfFile(file.fileName) ? (
                                            <img src="/pdffile.png" alt="PDF" className="file-image"/>
                                        ) : (
                                            "📄"
                                        )}
                                    </span>
                                    <span>{truncateFileName(file.fileName)}</span>
                                    <div className="settings-container">
                                        <IoSettingsOutline className="settings-icon" onClick={() => handleSettingsClick(file)}/>
                                    </div>
                                    <span className="filesize">{formatFileSize(file.fileSize)}</span>
                                    {fileToDelete && fileToDelete.fileId === file.fileId ? (
                                        <div className="delete-options">
                                            <button onClick={handleDelete}>Delete</button>
                                            <button onClick={() => setFileToDelete(null)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <RiDeleteBin6Line className="delete-icon"
                                                          onClick={() => setFileToDelete(file)}/>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" className="delete-all-btn" onClick={handleDeleteAllFiles}>
                            Delete All Files
                        </button>
                    </>
                )}
            </div>
            {showPopup && selectedFile && (
                <div className="popup-container" ref={popupContainerRef}>
                    <div className="popup-header">
        <span className="file-icon">
            {isImageFile(selectedFile.fileName) ? (
                <img src="/imagefile.png" alt="Default" className="file-image"/>
            ) : isPdfFile(selectedFile.fileName) ? (
                <img src="/pdffile.png" alt="PDF" className="file-image"/>
            ) : (
                "📄"
            )}
        </span>
                        <span>{truncateFileName(selectedFile.fileName)}</span>
                        <span className="filesize">{formatFileSize(selectedFile.fileSize)}</span>
                        <button className="close-btn" onClick={handleClosePopup}>X</button>
                    </div>
                    <div className="popup-body">
                        <form>
                            <fieldset className="radio-group">
                                <legend>Color</legend>
                                <label>
                                    <input type="radio" name="color" value="bw"
                                           onChange={(e) => setColor(e.target.value)}/> B/W
                                </label>
                                <label>
                                    <input id="co" type="radio" name="color" value="color"
                                           onChange={(e) => setColor(e.target.value)}/> Color
                                </label>
                            </fieldset>
                            <fieldset className="radio-group">
                                <legend>Layout</legend>
                                <label>
                                    <input type="radio" name="layout" value="portrait"
                                           onChange={(e) => setLayout(e.target.value)}/> Portrait
                                </label>
                                <label>
                                    <input id="la" type="radio" name="layout" value="landscape"
                                           onChange={(e) => setLayout(e.target.value)}/> Landscape
                                </label>
                            </fieldset>
                            <fieldset className="radio-group">
                                <legend>Side</legend>
                                <label>
                                    <input type="radio" name="side" value="single"
                                           onChange={(e) => setSide(e.target.value)} /> Single side
                                </label>
                                <label>1
                                    <input type="radio" name="side" value="double"
                                           onChange={(e) => setSide(e.target.value)}/> Double side
                                </label>
                            </fieldset>
                            <fieldset>
                                <legend>No. of Copies</legend>
                                <label>
                                    <input type="number" name="no_of_copies" min="1" className="no-border-input"
                                           value={noOfCopies} onChange={(e) => setNoOfCopies(e.target.value)}/>
                                </label>
                            </fieldset>
                            <button type="button" className="update-btn" onClick={handleClosePopup}>Update</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormComponent;