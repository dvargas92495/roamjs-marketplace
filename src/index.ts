import {
  toConfig,
  runExtension,
  getShallowTreeByParentUid,
  createBlock,
  getPageUidByPageTitle,
} from "roam-client";
import { createConfigObserver, toFlexRegex } from "roamjs-components";
import { render } from "./Marketplace";

const ID = "marketplace";
const CONFIG = toConfig(ID);
runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: { tabs: [{ id: "extensions", fields: [] }] },
  });
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Open Marketplace",
    callback: () => {
      const pageUid = getPageUidByPageTitle(CONFIG);
      const parentUid =
        getShallowTreeByParentUid(pageUid)?.find((t) =>
          toFlexRegex("extensions").test(t.text)
        )?.uid ||
        createBlock({ parentUid: pageUid, node: { text: "extensions" } });
      render({ parentUid });
    },
  });
});
