import { headers } from "next/headers";
import { env } from "@/shared/config";

function getApiKey(): string {
  const key = env.BACKOFFICE_API_KEY;
  if (!key) {
    throw new Error("BACKOFFICE_API_KEY environment variable is required");
  }
  return key;
}

export async function verifyApiKey(): Promise<boolean> {
  try {
    const API_KEY = getApiKey();
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader) {
      return false;
    }

    const token = authHeader.replace("Bearer ", "");
    return token === API_KEY;
  } catch (error) {
    console.error("Auth error:", error);
    return false;
  }
}

export function verifyApiKeySync(token: string): boolean {
  try {
    const API_KEY = getApiKey();
    return token === API_KEY;
  } catch (error) {
    console.error("Auth error:", error);
    return false;
  }
}
