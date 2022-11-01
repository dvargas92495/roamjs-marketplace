import {
  toConfig,
  runExtension,
  getShallowTreeByParentUid,
  createBlock,
  getPageUidByPageTitle,
  getBlockUidsAndTextsReferencingPage,
  getPageTitleByBlockUid,
} from "roam-client";
import {
  createConfigObserver,
  renderSimpleAlert,
  toFlexRegex,
} from "roamjs-components";
import { render } from "./Marketplace";

const ID = "marketplace";
const CONFIG = toConfig(ID);
const ROAMJS_SRC_REGEX =
  /https:\/\/roamjs.com\/([\w\d-]*?)(?:\/\d\d\d\d-\d\d-\d\d-\d\d-\d\d)?(?:\/main)?\.js/;
runExtension(ID, () => {
  renderSimpleAlert({
    content: `ATTENTION: This RoamJS extension (marketplace) is being removed in favor of Roam Depot! All RoamJS extensions are now either under review or have already been migrated to Roam Depot, removing the need for this extension.

Please remove the \`{{[[roam/js]]}}\` code that installed this extension and refresh before installing from RoamDepot.`,
    onConfirm: () => console.log("done"),
  });
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        { id: "extensions", fields: [] },
        {
          id: "install",
          fields: [
            {
              type: "flag",
              title: "auto enable",
              description: "Automatically turn on extensions after installing",
            },
          ],
        },
      ],
    },
  });
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Open Marketplace",
    callback: () => {
      const pageUid = getPageUidByPageTitle(CONFIG);
      const tree = getShallowTreeByParentUid(pageUid);
      const parentUid =
        tree?.find((t) => toFlexRegex("extensions").test(t.text))?.uid ||
        createBlock({ parentUid: pageUid, node: { text: "extensions" } });
      const installUid = tree?.find((t) =>
        toFlexRegex("install").test(t.text)
      )?.uid;
      render({ parentUid, installUid });
    },
  });
  const isSync = getShallowTreeByParentUid(getPageUidByPageTitle(CONFIG)).some(
    (t) => toFlexRegex("synced").test(t.text)
  );
  if (!isSync) {
    const roamJsBlocks = getBlockUidsAndTextsReferencingPage("roam/js")
      .filter(
        ({ text, uid }) =>
          text.includes("{{[[roam/js]]}}") &&
          getPageTitleByBlockUid(uid) !== CONFIG
      )
      .flatMap(({ uid }) =>
        getShallowTreeByParentUid(uid).map(({ text }) => ({ text, uid }))
      )
      .filter(({ text }) => ROAMJS_SRC_REGEX.test(text))
      .map(({ text, uid }) => ({ id: ROAMJS_SRC_REGEX.exec(text)?.[1], uid }));
    if (roamJsBlocks.length) {
      renderSimpleAlert({
        content: `We detected that you have the following extensions installed:\n\n${roamJsBlocks
          .map(({ id }) => `- ${id}\n`)
          .join(
            ""
          )}\nWould you like to move these installations to [[roam/js/marketplace]] to be managed by the Marketplace extension?`,
        onConfirm: () => {
          const pageUid = getPageUidByPageTitle(CONFIG);
          createBlock({ parentUid: pageUid, node: { text: "synced" } });
          const parentUid = getShallowTreeByParentUid(pageUid).find((t) =>
            toFlexRegex("extensions").test(t.text)
          )?.uid;
          if (parentUid) {
            const offset = getShallowTreeByParentUid(parentUid).length;
            roamJsBlocks.forEach(({ uid, id }, i) => {
              const idUid = createBlock({
                node: { text: id },
                parentUid,
                order: offset + i,
              });
              window.roamAlphaAPI.moveBlock({
                location: { "parent-uid": idUid, order: 0 },
                block: { uid },
              });
            });
          }
        },
        canCancel: true,
      });
    }
  }
});
