import Agenda from 'agenda';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.MONGO_DB_URL);
console.log(process.env.VEMOSPAY_API_V2_URL);

import { syncTicketsJob } from './jobs/vemospay.js';


async function main() {
  console.log('Connecting DB...');
  const agenda = new Agenda({ db: { address: process.env.MONGO_DB_URL } });
  console.log('DB connected!');

  console.log('Starting agenda...');
  await agenda.start();
  console.log('Agenda started!');

  console.log('Defining jobs...');
  await agenda.define('CREATE_TICKET', { priority: 'high', concurrency: 10 }, syncTicketsJob);
  await agenda.every('1 minute', 'CREATE_TICKET');
  console.log('Jobs defined!');
}

main();