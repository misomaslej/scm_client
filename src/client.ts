import { Socket } from "net";
import { TelnetSocket } from "telnet-stream";
import logger from "./logger";

class Client {
  _host: string;
  _port: number;
  _username: string;
  _password: string;
  _connectResolve: (() => void) | null;
  s: TelnetSocket;
  loggedIn: boolean = false;

  constructor(host: string, port: number, username: string, password: string) {
    this._host = host;
    this._port = port;
    this._username = username;
    this._password = password;
    this._connectResolve = null;
    this.s = this.buildSocket();
  }

  buildSocket() {
    const socket = new Socket();
    const ts = new TelnetSocket(socket);
    ts.setEncoding("utf-8");
    ts.on("connect", this.onConnect.bind(this));
    ts.on("data", this.onData.bind(this));
    ts.on("end", this.onEnd.bind(this));
    ts.on("error", this.onError.bind(this));
    return ts;
  }

  async connect() {
    return new Promise<void>((resolve) => {
      this._connectResolve = resolve;
      this.s.connect(this._port, this._host);
    });
  }

  onConnect() {
    logger.info("Connected to server");
    this.login();
  }

  onData(data: any) {
    if (data.toString().trim() === "Welcome!") return;
    //logger.debug(`[Client] <<< ${JSON.stringify(JSON.parse(data.toString()), null, 2)}`);
  }

  onEnd() {
    logger.info("Disconnected from server");
    this.loggedIn = false;
    this._connectResolve?.();
  }

  onError(err: Error) {
    logger.error(`Error: ${err.message}`);
  }

  async login() {
    logger.info("Changing mode to API...");
    await this.write(".mode api\n");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info("Logging in...");
    await this.perform(".login", [this._username, this._password]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.loggedIn = true;
    logger.info("Done logging in");
    return;
  }

  async write(data: string) {
    return new Promise<void>((res) => {
      this.s?.write(Buffer.from(data, "utf8"), () => res());
    });
  }

  async perform(action: string, args: string[] = []) {
    const msg = JSON.stringify({ action, args });
    logger.debug(`[Client] >>> ${JSON.stringify(JSON.parse(msg), null, 2)}`);
    return this.write(msg + "\n");
  }
}

export default Client;
