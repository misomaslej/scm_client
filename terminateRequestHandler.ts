import net from "net";
import logger from "./src/logger";

import { promises as fs } from 'fs';

async function writeFile(filePath: string, content: string) {
    try {
        await fs.writeFile(filePath, content);
        console.log('File written successfully');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error writing file:', error.message);
        } else {
            console.error('Error writing file: An unknown error occurred');
        }
    }
}

// Configuration for the TCP server
let TCP_PORT: number; // Port number for the TCP server
const TERMINATION_COMMAND = "shutdown";

const startTcpServer = async () => { // Make the function async to use await
    const filePath = 'lastPort';
    
    try {
        const content = await fs.readFile(filePath, 'utf-8'); // Await the Promise to get the string content
        
        if (content.trim() === "5000") {
            TCP_PORT = 5001;
        } else if (content.trim() === "5001") {
            TCP_PORT = 5000;
        } else {
            // Handle the case where the content is neither "5000" nor "5001"
            TCP_PORT = 5000; // Default value or throw an error if needed
        }

        console.log(TCP_PORT.toString());
        await writeFile("lastPort", TCP_PORT.toString()); // Await the writeFile call

        const server = net.createServer((socket) => {
            logger.info("TCP server: Client connected");

            socket.on("data", (data) => {
                const message = data.toString().trim();
                logger.info(`TCP server: Received message - "${message}"`);

                if (message === TERMINATION_COMMAND) {
                    logger.info("TCP server: Termination command received. Shutting down...");
                    process.exit(0); // Terminate the process
                } else {
                    logger.info(`TCP server: Unknown command received - "${message}"`);
                }
            });

            socket.on("end", () => {
                logger.info("TCP server: Client disconnected");
            });

            socket.on("error", (err) => {
                logger.error(`TCP server: Error - ${err.message}`);
            });
        });

        server.listen(TCP_PORT, () => {
            logger.info(`TCP server is listening on port ${TCP_PORT}`);
        });

        server.on("error", (err) => {
            if (err instanceof Error) {
                logger.error(`TCP server: Error - ${err.message}`);
            } else {
                logger.error('TCP server: An unknown error occurred');
            }
            process.exit(1); // Exit with error code
        });

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error occurred: ${error.message}`);
        } else {
            logger.error('An unknown error occurred');
        }
        process.exit(1); // Exit with error code
    }
};

export default startTcpServer;
