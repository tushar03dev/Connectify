const axios = require("axios");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const API_URL = `http://localhost:5200/auth/sign-up`; // Change this to your registration endpoint
const TOTAL_REQUESTS = 50;
const THREADS = 100; // Number of parallel worker threads
const REQUESTS_PER_THREAD = TOTAL_REQUESTS / THREADS;

async function sendRequest(index) {
    try {
        const response = await axios.post(API_URL, {
            email: `testuser${index}`, // Unique email per request
            password: "StrongPass123!"
        });
        return response.status;
    } catch (error) {
        return error.response ? error.response.status : "Error";
    }
}

async function workerTask(startIndex) {
    let success = 0, failure = 0;
    for (let i = 0; i < REQUESTS_PER_THREAD; i++) {
        const requestIndex = startIndex + i;
        const status = await sendRequest(requestIndex);
        status === 200 ? success++ : failure++;
    }
    return { success, failure };
}

if (!isMainThread) {
    (async () => {
        const result = await workerTask(workerData);
        parentPort.postMessage(result);
    })();
} else {
    async function startWorker(threadId) {
        return new Promise((resolve, reject) => {
            const startIndex = threadId * REQUESTS_PER_THREAD + 1;
            const worker = new Worker(__filename, { workerData: startIndex });

            worker.on("message", resolve);
            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }

    (async () => {
        console.log(`Starting load test with ${TOTAL_REQUESTS} unique emails...`);

        const results = await Promise.all([...Array(THREADS)].map((_, i) => startWorker(i)));

        let totalSuccess = results.reduce((sum, res) => sum + res.success, 0);
        let totalFailure = results.reduce((sum, res) => sum + res.failure, 0);

        console.log(`Test Completed! ✅`);
        console.log(`Successful Registrations: ${totalSuccess}`);
        console.log(`Failed Registrations: ${totalFailure}`);
    })();
}
