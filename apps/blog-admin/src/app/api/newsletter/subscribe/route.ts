/**
 * Newsletter Subscription API
 * POST /api/newsletter/subscribe
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const subscribeSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: "이미 구독 중인 이메일 주소입니다" },
          { status: 400 }
        );
      }

      // Reactivate subscription
      await prisma.subscriber.update({
        where: { email },
        data: {
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source,
        },
      });

      return NextResponse.json({
        message: "구독이 재활성화되었습니다",
        reactivated: true,
      });
    }

    // Create new subscriber
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        source: source || "website",
      },
    });

    // Send welcome email
    try {
      await resend.emails.send({
        from: "DEV_BBAK 블로그 <noreply@bbakjun.com>",
        to: email,
        subject: "DEV_BBAK 블로그 구독을 환영합니다! 🎉",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">구독해주셔서 감사합니다!</h1>
            <p>안녕하세요,</p>
            <p>DEV_BBAK 블로그 뉴스레터 구독을 환영합니다.</p>
            <p>새로운 포스트가 발행되면 이메일로 알려드리겠습니다.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 14px; color: #6b7280;">
              더 이상 이메일을 받고 싶지 않으시면
              <a href="${process.env.NEXT_PUBLIC_BLOG_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}"
                 style="color: #2563eb;">여기</a>를 클릭하여 구독을 취소할 수 있습니다.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
      // Continue even if email fails - subscriber is still created
    }

    return NextResponse.json({
      message: "구독이 완료되었습니다!",
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error("Subscribe error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "구독 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
