import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Digital Brokerage — الوساطة الرقمية";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    path.join(process.cwd(), "public/icons/black.png"),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      {/* An opaque surface keeps the logo legible in every sharing client. */}
      <img
        src={`data:image/png;base64,${logo.toString("base64")}`}
        width="560"
        height="400"
        style={{ objectFit: "contain" }}
        alt={alt}
      />
    </div>,
    size,
  );
}
