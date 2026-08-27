import crypto from "crypto";

// Determine DOKU environment
function getDokuConfig() {
  const env = process.env.DOKU_ENV || "sandbox";
  const isProduction = env === "production";
  return {
    baseUrl: isProduction ? "https://api.doku.com" : "https://api-sandbox.doku.com",
    clientId: process.env.DOKU_CLIENT_ID || "",
    secretKey: process.env.DOKU_SECRET_KEY || "",
    isProduction,
  };
}

export function generateDigest(body: string): string {
  const hash = crypto.createHash("sha256").update(body).digest();
  return hash.toString("base64");
}

export function generateSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  targetPath: string,
  digest: string,
  secretKey: string
): string {
  const canonicalString = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`,
  ].join("\n");
  
  const hmac = crypto.createHmac("sha256", secretKey).update(canonicalString).digest("base64");
  return `HMACSHA256=${hmac}`;
}

export async function createCheckoutTransaction(params: {
  invoiceNumber: string;
  amount: number;
  callbackUrl: string;
  customerName?: string;
  customerEmail?: string;
  itemName?: string;
}) {
  const config = getDokuConfig();
  
  console.log("🔧 DOKU CONFIG DEBUG");
  console.log(`Mode: ${config.isProduction ? "PRODUCTION" : "SANDBOX"}`);
  console.log(`Client ID: ${config.clientId.substring(0, 10)}...`);
  console.log(`API Target: ${config.baseUrl}`);
  
  const targetPath = "/checkout/v1/payment";
  const url = `${config.baseUrl}${targetPath}`;
  
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  const body = {
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount,
      callback_url: params.callbackUrl,
    },
    payment: {
      payment_due_date: 60,
    },
    customer: {
      name: params.customerName || "Customer",
      email: params.customerEmail || "customer@example.com",
    },
  };
  
  const bodyString = JSON.stringify(body);
  const digest = generateDigest(bodyString);
  const signature = generateSignature(
    config.clientId,
    requestId,
    timestamp,
    targetPath,
    digest,
    config.secretKey
  );
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Client-Id": config.clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        "Request-Target": targetPath,
        "Digest": digest,
        "Signature": signature,
        "Content-Type": "application/json",
      },
      body: bodyString,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ DOKU API ERROR");
      console.error(`HTTP Status: ${response.status}`);
      console.error(`Response Body: ${JSON.stringify(data)}`);
      throw new Error(`DOKU API Error: ${response.statusText}`);
    }
    
    return {
      paymentUrl: data.response?.payment?.url || "",
      invoiceNumber: params.invoiceNumber,
      response: data,
    };
  } catch (error) {
    console.error("❌ DOKU API ERROR");
    console.error(error);
    throw error;
  }
}
