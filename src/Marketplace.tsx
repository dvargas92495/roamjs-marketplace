import {
  Button,
  Classes,
  Drawer,
  H4,
  H6,
  InputGroup,
  Position,
  Spinner,
} from "@blueprintjs/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createOverlayRender } from "roamjs-components";

type Extension = {
  id: string;
  description: string;
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

const DrawerContent = () => {
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
        ) : (
          filteredExtensions.map((e) => (
            <div key={e.id} style={{ display: "flex", width: "100%" }}>
              <Thumbnail id={e.id} />
              <div style={{ flexGrow: 1, paddingLeft: 4 }}>
                <H4>{idToName(e.id)}</H4>
                <p>{e.description}</p>
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
                <Button text={"install"} disabled />
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
        />
      </div>
    </>
  );
};

const Marketplace = ({ onClose }: { onClose: () => void }) => {
  return (
    <Drawer
      title={"RoamJS Marketplace"}
      position={Position.LEFT}
      onClose={onClose}
      isOpen={true}
      style={{ zIndex: 1000 }}
    >
      <DrawerContent />
    </Drawer>
  );
};

export const render = createOverlayRender<{}>(
  "marketplace-drawer",
  Marketplace
);

export default Marketplace;
