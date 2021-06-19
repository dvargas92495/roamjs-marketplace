import { toConfig, createPage } from "roam-client";

const CONFIG = toConfig("marketplace");
createPage({ title: CONFIG });
