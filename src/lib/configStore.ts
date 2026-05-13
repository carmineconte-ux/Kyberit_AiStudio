import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "config.json");

export interface SiteConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  iubenda: {
    siteId: string;
    policyId: string;
  };
  turnstile: {
    siteKey: string;
  };
}

export const getConfig = (): SiteConfig => {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch (e) {
      console.error("Errore lettura config.json", e);
    }
  }
  return {
    smtp: { host: "", port: 587, user: "", pass: "", from: "" },
    iubenda: { siteId: "", policyId: "" },
    turnstile: { siteKey: "" }
  };
};

export const saveConfig = (config: SiteConfig) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};
