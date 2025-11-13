import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = 'srv-d477ecjipnbc73clq6f0';
const API_BASE_URL = 'https://api.render.com/v1';

const HEADERS = {
  Authorization: `Bearer ${RENDER_API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const jobs = [
  {
    name: 'Database Migration',
    command: 'npm run db:migrate',
  },
  {
    name: 'The "Great Sync"',
    command: 'npm run tsx scripts/full-airtable-sync-ENHANCED.ts',
  },
  {
    name: 'Delta Sync Verification',
    command: 'npm run sync:delta',
  },
];

interface Job {
  id: string;
  status: string;
  startCommand: string;
}

function createJob(command: string): Job {
  console.log(`\n🚀 Creating job with command: "${command}"...`);
  const data = JSON.stringify({ startCommand: command });
  const response = execSync(
    `curl --request POST '${API_BASE_URL}/services/${SERVICE_ID}/jobs' \
         --header 'Authorization: ${HEADERS.Authorization}' \
         --header 'Accept: ${HEADERS.Accept}' \
         --header 'Content-Type: ${HEADERS['Content-Type']}' \
         --data-raw '${data}' \
         --silent`
  );
  const job = JSON.parse(response.toString());
  console.log(`✅ Job created with ID: ${job.id}`);
  return job;
}

function pollJobStatus(jobId: string): boolean {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = execSync(
        `curl --request GET '${API_BASE_URL}/services/${SERVICE_ID}/jobs/${jobId}' \
             --header 'Authorization: ${HEADERS.Authorization}' \
             --header 'Accept: ${HEADERS.Accept}' \
             --silent`
      );
      const job = JSON.parse(response.toString()) as Job;

      process.stdout.write(`\rJob Status: ${job.status}... (Attempt ${attempts}/${maxAttempts})`);

      if (job.status === 'succeeded') {
        console.log(`\n🎉 Job ${jobId} succeeded!`);
        return true;
      }
      if (job.status === 'failed' || job.status === 'canceled') {
        console.error(`\n❌ Job ${jobId} finished with status: ${job.status}`);
        return false;
      }
    } catch (error) {
      console.error(`\n❌ An error occurred while polling job ${jobId}:`, error);
      return false;
    }
    execSync('sleep 5');
  }
  console.error(`\n❌ Job ${jobId} timed out after 5 minutes.`);
  return false;
}

function getJobLogs(jobId: string) {
    console.log(`\n📄 Fetching logs for job ${jobId}...`);
    try {
        const rawResponse = execSync(
            `curl --request GET 'https://api.render.com/v1/services/${SERVICE_ID}/jobs/${jobId}/logs' \
                 --header 'Authorization: ${HEADERS.Authorization}' \
                 --header 'Accept: application/json' \
                 --silent`
        ).toString();

        try {
            // Attempt to parse as JSON, which is the expected format
            const logs = JSON.parse(rawResponse);
            console.log('--- JOB LOGS ---');
            if (Array.isArray(logs) && logs.length > 0) {
                logs.forEach((logEntry: { cursor: string; log: { content: string; timestamp: string } }) => {
                    console.log(`[${logEntry.log.timestamp}] ${logEntry.log.content}`);
                });
            } else {
                console.log('No structured logs returned from API.');
            }
            console.log('--- END LOGS ---');
        } catch (jsonError) {
            // If JSON parsing fails, the response is likely a plain text error. Print it directly.
            console.error(`\n❌ Could not parse logs as JSON. This usually means an API error occurred.`);
            console.log('--- RAW API RESPONSE ---');
            console.log(rawResponse);
            console.log('--- END RAW RESPONSE ---');
        }
    } catch (error) {
        console.error(`\n❌ An exception occurred while fetching logs for job ${jobId}:`, error);
    }
}


async function main() {
  if (!RENDER_API_KEY) {
    console.error('❌ RENDER_API_KEY not found in .env file. Please create a .env file in the project root (uysp-client-portal) and add your key.');
    process.exit(1);
  }
  console.log('🔑 Render API Key found. Starting jobs...');

  for (const jobDef of jobs) {
    console.log(`\n--- Starting: ${jobDef.name} ---`);
    const job = createJob(jobDef.command);
    const success = pollJobStatus(job.id);
    
    getJobLogs(job.id);

    if (!success) {
      console.error(`\n❌ Job "${jobDef.name}" failed. Aborting remaining jobs.`);
      process.exit(1);
    }
    console.log(`--- Finished: ${jobDef.name} ---`);
  }

  console.log('\n\n🎉 All jobs completed successfully! Staging is ready for review.');
}

main();
