import axios from "axios";

export const GetUser = async () => {
    const user = localStorage.getItem('userinfo');
    if (!user) {
        console.error("User info not found in localStorage");
        throw new Error("User info not found in localStorage");
    }

    const jsondata = JSON.parse(user);
    if (!jsondata.userid) {
        console.error("User ID is missing in localStorage data:", jsondata);
        throw new Error("User ID is missing in localStorage data");
    }

    const endpoint = `https://localhost:7039/api/Admin/GetAdminInfo?adminid=${jsondata.userid}`;

    try {
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        console.error("Error fetching admin data:", error);
        throw error;
    }
};
