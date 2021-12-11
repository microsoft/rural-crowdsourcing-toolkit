import { envGetString } from "@karya/misc-utils";
import axios from "axios";

const qAxios = axios.create({ 
    baseURL: envGetString('BACKEND_SERVER_URL')
})

export { qAxios }