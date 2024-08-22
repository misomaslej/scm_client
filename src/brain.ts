import { doesNotThrow } from "assert";
import Client from "./client";
import logger from "./logger";

class Brain {
  client: Client;

  currentLocation: any;
  possibleDestinations: any;

  program: "idle" | "wandering" | "carrying_artefacts" | "press_button" = "press_button";

  papersPublished: number = 0;

  constructor(client: Client) {
    this.client = client;

    if (this.client.s == null) {
      throw new Error("This should not happen ");
    }
    this.client.s.on("data", this.handleData);
  }

  think = () => {
    setTimeout(async () => {
      await this.executeThink();
      this.think();
    }, 100);
  };

  executeThink = async () => {
    if (!this.client.loggedIn) return;

    switch (this.program) {
      case "idle":
        break;
      case "wandering":
        await this.wander();
        break;
      case "carrying_artefacts":
        await this.carryArtefacts();
        break;
      case "press_button":
        await this.pressButton();
        break;
    }
  };

  pressButton = async () => {
    await this.perform(".use", ["pepu"]);
    this.papersPublished += 1;
    console.log(this.papersPublished);
    await this.wait(10000);
  };

  wander = async () => {
    await this.perform(".look");
    await this.wait(1000);

    if (this.possibleDestinations != null) {
      const dest = this.possibleDestinations[Math.floor(this.possibleDestinations.length * Math.random())];
      await this.perform(".go", [dest.name]);
    }
  };

  hasArtefact: boolean | null = null;
  isArtefactInLocation: boolean | null = null;

  carryArtefacts = async () => {
    await this.wait(1000);
    if (this.hasArtefact == null) {
      this.perform(".ex");
      return;
    }
    if (this.hasArtefact) {
      // Go to dielna and use artefact
      console.log("Current location", this.currentLocation.name);
      switch (this.currentLocation.name) {
        case "Hangár":
          await this.perform(".go", ["Hub"]);
          break;
        case "Hub":
          await this.perform(".go", ["Konštrukcia"]);
          break;
        case "Konštrukcia":
          await this.perform(".go", ["Dieľňa"]);
          break;
        case "Dieľňa":
          await this.perform(".use", ["ANAR"]);
          await this.perform(".ex");
          break;
      }
    } else {
      // Go to hangar and wait for artefact
      switch (this.currentLocation.name) {
        case "Dieľňa":
          await this.perform(".go", ["Konštrukcia"]);
          break;
        case "Konštrukcia":
          await this.perform(".go", ["Hub"]);
          break;
        case "Hub":
          await this.perform(".go", ["Hangár"]);
          break;
        case "Hangár":
          if (this.isArtefactInLocation === true) {
            await this.perform(".pick", ["Artefact"]);
            await this.perform(".ex");
            this.isArtefactInLocation = null;
          } else {
            await this.perform(".look");
          }
          break;
        default:
          logger.info(`I'm lost in ${this.currentLocation.name}`);
      }
    }
  };

  perform = async (action: string, args?: string[]) => {
    logger.debug(`performing action ${JSON.stringify({ action, args })}`);
    await this.client.perform(action, args);
  };

  pendingData: string = "";
  handleData = (dataBuffer: Buffer | string) => {
    const incomingData = dataBuffer.toString();
    this.pendingData += incomingData;
    if (this.pendingData[this.pendingData.length - 1] !== "\n") return;
    
    
    const dataString = this.pendingData;
    this.pendingData = "";
    if (dataString.trim() === "Welcome!") return;

    // console.log("handleData", this);
    const data = JSON.parse(dataString);
    switch (data.action) {
      case "look":
        this.currentLocation = data.location;
        this.possibleDestinations = data.possible_destinations;
        this.isArtefactInLocation = data.items.some((item: any) => item.name === "Artefact");
        break;
      case "go":
        break;
      case "examine":
        this.hasArtefact = data.items.some((item: any) => item.name === "Artefact");
        break;
      default:
        console.log("Unknown data from server: ", JSON.stringify(data));
        break;
    }
  };

  wait = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}

export default Brain;
