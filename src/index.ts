import { toConfig, runExtension } from "roam-client";
import { createConfigObserver } from "roamjs-components";
import { render } from "./Marketplace";

const ID = "marketplace";
const CONFIG = toConfig(ID);
runExtension(ID, () => {
  createConfigObserver({ title: CONFIG, config: { tabs: [] } });
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Open Marketplace",
    callback: () => render({}),
  });
});
