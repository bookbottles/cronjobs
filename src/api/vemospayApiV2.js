import axios from 'axios';

const BASE_URL = process.env.VEMOSPAY_API_V2_URL;
const API_KEY = process.env.VEMOSPAY_API_V2_KEY;

console.log('-----------', BASE_URL);
export function vemospayApi_v2() {
	const commonHeaders = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
    
	// Define API methods
	const apiClient = {
    syncTickets(targetStatus) {
      return axios
        .post(
          `${BASE_URL}/vemospay/v2/ticket/sync`,
          { targetStatus },
          { headers: commonHeaders }
        )
        .then((response) => response.data)
        .catch((error) => Promise.reject(error));
    },
  };
  
	return apiClient;
}
