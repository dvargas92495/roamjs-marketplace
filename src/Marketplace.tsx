import {
  Button,
  Classes,
  Drawer,
  H4,
  H6,
  InputGroup,
  Intent,
  Position,
  Spinner,
} from "@blueprintjs/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createOverlayRender, toFlexRegex } from "roamjs-components";
import {
  createBlock,
  deleteBlock,
  getShallowTreeByParentUid,
  openBlockInSidebar,
} from "roam-client";

type Extension = {
  id: string;
  description: string;
  src: string;
};

type Props = {
  parentUid: string;
  installUid?: string;
};

const idToName = (id: string) =>
  id
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ")
    .replace(/_/g, " ");

const Thumbnail = ({ id }: { id: string }) => {
  const src = `https://roamjs.com/thumbnails/${id}.png`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(80);
  useEffect(() => {
    const dummyImage = new Image();
    dummyImage.src = src;
    dummyImage.style.visibility = "hidden";
    dummyImage.onload = () => {
      document.body.appendChild(dummyImage);
      const { clientWidth, clientHeight } = dummyImage;
      dummyImage.remove();
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 16;
        const containerHeight = containerRef.current.clientHeight - 16;
        if (clientWidth / clientHeight < containerWidth / containerHeight) {
          setHeight(containerHeight);
        } else {
          setHeight((containerWidth * clientHeight) / clientWidth);
        }
      }
    };
  }, [containerRef, setHeight, src]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: 80,
        width: 80,
        minWidth: 80,
        minHeight: 80,
      }}
      ref={containerRef}
    >
      <img
        style={{
          borderRadius: 4,
          height,
        }}
        src={src}
      />
    </div>
  );
};

const DrawerContent = ({ parentUid, installUid }: Props) => {
  const [installedExtensions, setInstalledExtensions] = useState(
    Object.fromEntries(
      getShallowTreeByParentUid(parentUid).map(({ text, uid }) => [text, uid])
    )
  );
  const autoEnable = useMemo(
    () =>
      !!installUid &&
      getShallowTreeByParentUid(installUid).some((t) =>
        toFlexRegex("auto enable").test(t.text)
      ),
    [installUid]
  );
  const isInstalled = useMemo(
    () => new Set(Object.keys(installedExtensions)),
    [installedExtensions]
  );
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    axios
      .get<{ extensions: Extension[] }>(`${process.env.API_URL}/marketplace`)
      .then((r) =>
        setExtensions(
          r.data.extensions.sort(({ id: a }, { id: b }) => a.localeCompare(b))
        )
      )
      .finally(() => setLoading(false));
  }, [setExtensions, setLoading]);
  const filteredExtensions = useMemo(() => {
    const regex = new RegExp(search, "i");
    return extensions.filter(
      (f) =>
        regex.test(f.id) ||
        regex.test(idToName(f.id)) ||
        regex.test(f.description)
    );
  }, [extensions, search]);
  return (
    <>
      <div className={Classes.DRAWER_BODY} style={{ padding: 4 }}>
        {loading ? (
          <Spinner />
        ) : !filteredExtensions.length ? (
          <H6>No Extensions Found.</H6>
        ) : (
          filteredExtensions.map((e) => (
            <div key={e.id} style={{ display: "flex", width: "100%" }}>
              <Thumbnail id={e.id} />
              <div style={{ flexGrow: 1, paddingLeft: 4 }}>
                <H4>{idToName(e.id)}</H4>
                <p style={{ color: "#182026" }}>{e.description}</p>
              </div>
              <div
                style={{
                  width: 80,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 80,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isInstalled.has(e.id) ? (
                  <Button
                    intent={Intent.DANGER}
                    text={"Remove"}
                    onClick={() => {
                      const { [e.id]: uid, ...rest } = installedExtensions;
                      deleteBlock(uid);
                      setInstalledExtensions(rest);
                    }}
                  />
                ) : (
                  <Button
                    text={"Install"}
                    intent={Intent.PRIMARY}
                    onClick={() => {
                      const uid = createBlock({
                        parentUid,
                        node: {
                          text: e.id,
                          children: [
                            {
                              text: "{{[[roam/js]]}}",
                              children: [
                                {
                                  text: `\`\`\`javascript
var existing = document.getElementById("roamjs-${e.id}");
if (!existing) {
  var extension = document.createElement("script");
  extension.src = "${e.src}";
  extension.id = "roamjs-${e.id}";
  extension.async = true;
  extension.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(extension);
}\`\`\``,
                                },
                              ],
                            },
                          ],
                        },
                      });
                      setInstalledExtensions({
                        ...installedExtensions,
                        [e.id]: uid,
                      });
                      setTimeout(() => {
                        openBlockInSidebar(uid);
                        if (autoEnable) {
                          setTimeout(() => {
                            const div = Array.from(
                              document.querySelectorAll(
                                ".rm-sidebar-outline .roam-block"
                              )
                            ).find((d) => d.id.endsWith(uid));
                            if (div) {
                              const blockContainer = div.closest(
                                ".roam-block-container"
                              );
                              if (blockContainer) {
                                const button =
                                  blockContainer.querySelector<HTMLButtonElement>(
                                    ".rm-roam-js--inactive .bp3-button"
                                  );
                                button?.click?.();
                              }
                            }
                          }, 500);
                        }
                      }, 1);
                    }}
                  />
                )}
              </div>
              <hr />
            </div>
          ))
        )}
      </div>
      <div className={Classes.DRAWER_FOOTER}>
        <InputGroup
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={"Search Extension..."}
          style={{ background: "#FFF" }}
        />
      </div>
    </>
  );
};

const Marketplace = ({
  onClose,
  ...props
}: { onClose: () => void } & Props) => {
  return (
    <Drawer
      title={"RoamJS Marketplace"}
      position={Position.LEFT}
      onClose={onClose}
      isOpen={true}
      style={{ zIndex: 1000 }}
    >
      <DrawerContent {...props} />
    </Drawer>
  );
};

export const render = createOverlayRender<Props>(
  "marketplace-drawer",
  Marketplace
);

export default Marketplace;
