import { envGetString } from '@karya/misc-utils';
import axios from 'axios';

const credentials = envGetString('KEY_ID') + ':' + envGetString('KEY_SECRET');
// Converting to Base64 to send the credentials as auth in header
var authHeaderValue = 'Basic ' + Buffer.from(credentials).toString('base64');

const razorPayAxios = axios.create({
  baseURL: envGetString('RAZORPAY_API_BASE_URL'),
  headers: { Authorization: authHeaderValue },
});

export { razorPayAxios };
