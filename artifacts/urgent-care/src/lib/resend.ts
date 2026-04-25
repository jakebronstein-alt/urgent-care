import { Resend } from "resend";

interface ResendConnectorSettings {
  api_key: string;
  from_email?: string;
}

interface ResendConnectionItem {
  settings: ResendConnectorSettings;
}

interface ConnectorApiResponse {
  items?: ResendConnectionItem[];
}

let connectionSettings: ResendConnectionItem | undefined;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Resend: missing connector environment variables");
  }

  const data: ConnectorApiResponse = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  ).then((r) => r.json() as Promise<ConnectorApiResponse>);

  connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.api_key) {
    throw new Error("Resend not connected");
  }

  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email ?? "noreply@ubiehealth.com",
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}
