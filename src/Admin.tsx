import { Studio } from "sanity";
import { sanityConfig } from "./sanity/config";

export const Admin = () => {
  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <Studio config={sanityConfig} />
    </div>
  );
};
