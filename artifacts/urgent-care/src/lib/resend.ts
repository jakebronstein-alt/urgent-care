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

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const fromEmailDefault =
    process.env.RESEND_FROM_EMAIL ?? "noreply@ubiehealth.com";

  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: fromEmailDefault,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Resend: RESEND_API_KEY secret is not set and the connector is unavailable"
    );
  }

  const data: ConnectorApiResponse = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  ).then((r) => r.json() as Promise<ConnectorApiResponse>);

  const conn = data.items?.[0];

  if (!conn?.settings?.api_key) {
    throw new Error("Resend not connected");
  }

  return {
    apiKey: conn.settings.api_key,
    fromEmail: conn.settings.from_email ?? fromEmailDefault,
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}
