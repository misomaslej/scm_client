"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var net = require("net");
var fs_1 = require("fs");
// Define the command to run
var command = 'npm run start -- MichalM FtPpft88Ne1r4bX2r7J6jq4K';
// Function to start the process
function startProcess() {
    return (0, child_process_1.spawn)(command, {
        shell: true,
        stdio: 'inherit'
    });
}
// Function to stop the process
function stopProcess() {
    var filePath = 'lastPort';
    var content = fs_1.promises.readFile(filePath, 'utf-8');
    var client = new net.Socket();
    var HOST = '127.0.0.1';
    var PORT = 5000;
    if (content == 5000) {
        PORT = 5001;
    }
    else if (content == 5001) {
        PORT = 5000;
    }
    client.connect(PORT, HOST, function () {
        console.log("Connected to server at ".concat(HOST, ":").concat(PORT));
        // Send data to the server
        client.write('shutdown');
    });
    client.destroy();
    client.on('close', function () {
        console.log('Connection closed');
    });
    client.on('error', function (err) {
        console.error("Connection error: ".concat(err.message));
    });
}
// Start the process
startProcess();
// Set a timer to restart the process after 3 minutes
setTimeout(function () {
    // Stop the process
    stopProcess();
    // Start the process again
    startProcess();
}, 3 * 60 * 1000); // 3 minutes in milliseconds
