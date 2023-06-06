import axios from 'axios';

export const get = async (id: string) => {
    const response = await axios.get(`http://localhost:8080/sites/${id}`);
    return response.data;
};

export const list = async () => {
    const response = await axios.get("http://localhost:8080/sites");
    return response.data;
};
