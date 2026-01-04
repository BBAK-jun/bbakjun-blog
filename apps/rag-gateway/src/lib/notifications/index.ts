/**
 * Notification Service
 *
 * Handles sending notifications for ingestion job completion/failure
 * via Slack and Email.
 */

import { env } from '@/env';
import type { IngestionJob } from '@/lib/rag/ingestion';

export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
  };
  email?: {
    to: string[];
    subject?: string;
  };
}

export interface NotificationPayload {
  jobId: string;
  status: 'completed' | 'failed';
  startedAt: string;
  completedAt: string;
  duration: number; // in seconds
  total: number;
  processed: number;
  failed: number;
  error?: string;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}초`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const color = payload.status === 'completed' ? '#36a64f' : '#dc3545'; // green or red
  const statusEmoji = payload.status === 'completed' ? '✅' : '❌';
  const statusText = payload.status === 'completed' ? '완료' : '실패';

  const message = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${statusEmoji} Ingestion ${statusText}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Job ID:*\n\`${payload.jobId}\``,
              },
              {
                type: 'mrkdwn',
                text: `*상태:*\n${statusText}`,
              },
              {
                type: 'mrkdwn',
                text: `*소요 시간:*\n${formatDuration(payload.duration)}`,
              },
              {
                type: 'mrkdwn',
                text: `*처리 문서:*\n${payload.processed}/${payload.total}`,
              },
            ],
          },
          ...(payload.failed > 0
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `⚠️ *실패한 문서:* ${payload.failed}개`,
                  },
                },
              ]
            : []),
          ...(payload.error
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*에러 메시지:*\n\`\`\`${payload.error}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(
  to: string[],
  payload: NotificationPayload
): Promise<void> {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY not set, skipping email notification');
    return;
  }

  const statusEmoji = payload.status === 'completed' ? '✅' : '❌';
  const statusText = payload.status === 'completed' ? '완료' : '실패';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${payload.status === 'completed' ? '#36a64f' : '#dc3545'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .stat { display: inline-block; margin-right: 20px; }
        .stat-label { color: #666; font-size: 12px; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .error { background: #fee; border-left: 4px solid #dc3545; padding: 10px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusEmoji} Ingestion ${statusText}</h1>
        </div>
        <div class="content">
          <div class="stat">
            <div class="stat-label">Job ID</div>
            <div class="stat-value"><code>${payload.jobId}</code></div>
          </div>
          <div class="stat">
            <div class="stat-label">소요 시간</div>
            <div class="stat-value">${formatDuration(payload.duration)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">처리 문서</div>
            <div class="stat-value">${payload.processed}/${payload.total}</div>
          </div>
          ${payload.failed > 0 ? `<div class="stat"><div class="stat-label">실패</div><div class="stat-value">${payload.failed}</div></div>` : ''}
          ${payload.error ? `<div class="error"><strong>Error:</strong><br><code>${payload.error}</code></div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  for (const email of to) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RAG Gateway <noreply@yourdomain.com>',
        to: email,
        subject: `${statusEmoji} Ingestion ${statusText} - ${payload.jobId}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send email to ${email}:`, await response.text());
    }
  }
}

/**
 * Send notification based on configuration
 */
export async function sendNotification(
  job: IngestionJob,
  config: NotificationConfig
): Promise<void> {
  if (job.status === 'running') {
    return; // Only send notifications for completed/failed jobs
  }

  const completedAt = job.completedAt ? new Date(job.completedAt) : new Date();
  const startedAt = new Date(job.startedAt);
  const duration = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);

  const payload: NotificationPayload = {
    jobId: job.id,
    status: job.status,
    startedAt: job.startedAt,
    completedAt: job.completedAt || completedAt.toISOString(),
    duration,
    total: job.progress.total,
    processed: job.progress.processed,
    failed: job.progress.failed,
    error: job.error,
  };

  // Send Slack notification
  if (config.slack?.webhookUrl) {
    try {
      await sendSlackNotification(config.slack.webhookUrl, payload);
      console.log('📬 Slack notification sent');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }

  // Send email notification
  if (config.email?.to && config.email.to.length > 0) {
    try {
      await sendEmailNotification(config.email.to, payload);
      console.log('📧 Email notification sent');
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
    }
  }
}

/**
 * Get notification config from environment
 */
export function getNotificationConfig(): NotificationConfig {
  const config: NotificationConfig = {};

  // Slack config
  if (env.SLACK_WEBHOOK_URL) {
    config.slack = {
      webhookUrl: env.SLACK_WEBHOOK_URL,
      channel: env.SLACK_CHANNEL,
    };
  }

  // Email config
  if (env.NOTIFICATION_EMAILS) {
    config.email = {
      to: env.NOTIFICATION_EMAILS.split(',').map(e => e.trim()),
    };
  }

  return config;
}
