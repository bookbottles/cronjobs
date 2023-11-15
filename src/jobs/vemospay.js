import { vemospayApi_v2 } from "../api/vemospayApiV2.js";

export async function syncTicketsJob(job) {
	try {
	  const response = await vemospayApi_v2().syncTickets('open');
  
	  // Create a new log entry
	//   const log = new Log({
	// 	request: { action: 'syncTickets', status: 'open' },
	// 	response: response
	//   });
  
	  // Save the log
	//   await log.save();
  
	  console.log(response);
	} catch (error) {
	  console.error(error);
  
	  // Log the error
	//   const log = new Log({
	// 	request: { action: 'syncTickets', status: 'open' },
	// 	error: error
	//   });
  
	//   await log.save();
	}
  }