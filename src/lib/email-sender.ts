import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let sesClient: SESv2Client | null = null;

function getSES() {
  if (!sesClient) {
    sesClient = new SESv2Client({
      region: process.env.AWS_SES_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return sesClient;
}

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { from, to, subject, html, replyTo } = params;

  // Try Resend first (has 50,000/month free with Growth plan)
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          reply_to: replyTo || from,
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        return { success: true, provider: "resend", messageId: data.id };
      }
      // Resend failed, fall through to SES
    }
  } catch (e) {}

  // Fallback to AWS SES
  try {
    const ses = getSES();
    const command = new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });
    const result = await ses.send(command);
    return { success: true, provider: "ses", messageId: result.MessageId };
  } catch (e: any) {
    return { success: false, provider: "ses", error: e.message };
  }
}

export async function sendBulkEmails(
  emails: SendEmailParams[]
): Promise<{ results: SendEmailResult[]; stats: { resend: number; ses: number; failed: number } }> {
  const results: SendEmailResult[] = [];
  const stats = { resend: 0, ses: 0, failed: 0 };

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
    if (result.success) {
      if (result.provider === "resend") stats.resend++;
      else stats.ses++;
    } else {
      stats.failed++;
    }
  }

  return { results, stats };
}
