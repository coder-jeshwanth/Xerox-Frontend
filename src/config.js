// src/config.js
const config = {
    baseUrl: "http://172.22.96.1:8081",
    
    // API Endpoints
    api: {
        // User APIs
        checkPhoneUsername: (phoneNumber, username) => 
            `/api/users/check-phone-username?phoneNumber=${phoneNumber}&username=${username}`,
        uploadFile: "/api/users/file",
        deleteUser: (phoneNumber) => `/api/users/delete/${phoneNumber}`,
        filePreferences: (fileId, layout, color, noOfCopies, side) => 
            `/api/users/filePreferences?fileId=${fileId}&layout=${layout}&color=${color}&noOfCopies=${noOfCopies}&side=${side}`,
        
        // File APIs
        getUserFiles: (phone) => `/api/files/user/phone/${phone}`,
        deleteFile: (fileId) => `/api/files/${fileId}`,
        downloadFile: (fileId, username, phoneNumber) => 
            `/api/files/download/${fileId}?username=${username}&phoneNumber=${phoneNumber}`,
        
        // Auth APIs
        login: "/api/auth/login",
        getAllUsers: "/api/auth/all"
    }
};

export default config;