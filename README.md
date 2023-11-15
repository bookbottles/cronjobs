# CronJobs

## Overview and Description
This repository, named "cronjobs", focuses on managing cronjobs and long-living services using Node.js. It demonstrates setting up and managing cronjobs along with persistent services, leveraging Agenda for job scheduling, Axios for HTTP requests, and Dotenv for environment variable management. A key feature of this project is the use of Agenda, which requires a MongoDB instance for storing job data, making it ideal for scheduling recurring jobs with features like job prioritization, concurrency control, and repeating job scheduling. We also save request and response data for each job, which can be used for debugging and auditing purposes.


## Installation
To get started, clone the repository and install its dependencies:
`git clone https://github.com/bookbottles/cronjobs.git`
`cd cronjobs`
`npm install`

## Configuration
Ensure the following environment variables are set in your `.env` file before running the project:
- `MONGO_DB_URL`: The MongoDB connection URL, used by Agenda to store and manage job data.
- `VEMOSPAY_API_V2_URL`: API URL for VemosPay service.
A running MongoDB instance must be accessible at the `MONGO_DB_URL`.

## Running the Project
`npm start`

## Features
- **Agenda for Job Scheduling**: Utilizes Agenda, a Node.js library for job scheduling with a MongoDB backend.
- **Job Definition and Scheduling**: Includes setup for defining and scheduling jobs like `CREATE_TICKET`, which runs every minute.
