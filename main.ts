import { argv } from "process";
import Brain from "./src/brain";
import Client from "./src/client";
import logger from "./src/logger";
import startTcpServer from "./terminateRequestHandler"; // Import the TCP server

const createClient = async (username: string, password: string) => {
  logger.info("Creating client...");

  const client = new Client("scm.lstme.sk", 7000, username, password);

  const brain = new Brain(client);
  brain.think();

  const handleInput = (buffer: Buffer) => {
    const [action, ...args] = buffer.toString("utf8").trim().split(" ");
    client.perform(action, args);
  };

  // Add listener to read stdin
  process.stdin.on("data", handleInput);

  await client.connect();

  // Remove the listener when the client disconnects
  process.stdin.removeListener("data", handleInput);
};

const main = async (username: string, password: string) => {
  while (true) {
    try {
      await createClient(username, password);
      logger.info("Disconnected");
    } catch (e: any) {
      logger.error(`Error: ${e.message}`);
    }
    logger.info("Reconnecting in 5 seconds...");
    // Sleep for 5 seconds before reconnecting
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

const [username, password] = argv.slice(2);
if (username == null || password == null) {
  logger.error("Missing username or password");
  logger.info("Usage: node main.js <username> <password>");
  process.exit(1);
}

console.log(`Connecting as ${username}:${password}`);

// Start the TCP server before running the main application
startTcpServer();

main(username, password);
