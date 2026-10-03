import { NextRequest, NextResponse } from 'next/server';
import { requireUser, AuthError } from '@/server/auth/guards';
import { OrderService, OrderError } from '@/server/services/order.service';
import { createOrderSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    // Verify Origin / Host header for CSRF defense on state-changing requests
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Cross-origin request rejected' } },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Invalid Origin header' } },
          { status: 400 }
        );
      }
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing request payload' } },
        { status: 400 }
      );
    }

    // Validate request schema with Zod
    const validatedInput = createOrderSchema.parse(body);

    // Call atomic order transaction (re-pricing, inventory decrement, & confirmation email orchestration)
    // Rule: Customer email strictly comes from the verified user session
    const { order } = await OrderService.createOrder(user.id, user.email, validatedInput);

    return NextResponse.json(
      { orderNumber: order.orderNumber },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }

    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: firstIssue?.message || 'Invalid order data provided',
            details: error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 409 }
      );
    }

    console.error('[API Orders POST] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process timepiece order' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const userOrders = await OrderService.getUserOrders(user.id);
    return NextResponse.json({ orders: userOrders });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error('[API Orders GET] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve orders' } },
      { status: 500 }
    );
  }
}
