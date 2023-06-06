import axios from "axios";

const url = "http://localhost:8080";
export const getStacks = async () => {
    try {
        const result = await axios.get(`${url}/stacks`);
        return result.data;
    } catch {
        return [];
    }

};

export const getStackById = async (id: string) => {
    try {
        const result = await axios.get(`${url}/stacks/${id}`)
        return result.data;
    } catch {
        return {};
    }
};

