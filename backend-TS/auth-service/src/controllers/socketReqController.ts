import axios from "axios";
const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

export const socketRequest = async(token: string) => {
    if (!token) {
        console.log('token is missing');
        return;
    }
    token = "Bearer " + token;
    const response = await axios.post(`${API_GATEWAY_URL}/a/connect`,{},{
        headers:{
            "authorization":token
        }
    })
    if(response.data.success){
        console.log({msg:"Socket established to the server"});
    } else{
        console.error(response.data);
    }
}