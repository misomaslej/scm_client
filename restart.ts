import { exec, spawn, ChildProcess } from 'child_process';
import * as net from 'net';
import { promises as fs } from 'fs';

// Define the command to run
const command = 'npm run start -- MichalM FtPpft88Ne1r4bX2r7J6jq4K';

// Function to start the process
function startProcess(): ChildProcess {
    return spawn(command, {
        shell: true,
        stdio: 'inherit'
    });
}

// Function to stop the process
function stopProcess() {
    const filePath = 'lastPort';
    const content: any = fs.readFile(filePath, 'utf-8');
    const client = new net.Socket();

    const HOST = '127.0.0.1';
    let PORT = 5000;
    if (content == 5000) {
        PORT = 5001;
    } else if (content == 5001) {
        PORT = 5000;
    }

    client.connect(PORT, HOST, () => {
        console.log(`Connected to server at ${HOST}:${PORT}`);

        // Send data to the server
        client.write('shutdown');
    });

    client.destroy();

    client.on('close', () => {
        console.log('Connection closed');
    });

    client.on('error', (err) => {
        console.error(`Connection error: ${err.message}`);
    });
}


// Start the process
startProcess();

// Set a timer to restart the process after 3 minutes
setTimeout(() => {
    // Stop the process
    stopProcess();

    // Start the process again
    startProcess();
}, 3 * 60 * 1000); // 3 minutes in milliseconds
