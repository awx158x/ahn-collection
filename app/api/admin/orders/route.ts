import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAdmin(request: Request) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .some(
      (item) =>
        item ===
        "ahn_admin=authenticated"
    );
}

function getAdminSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase server credentials are missing."
    );
  }

  return createClient(
    url,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ==================================================
// GET ORDERS
// ==================================================

export async function GET(
  request: Request
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      getAdminSupabase();

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(`
        id,
        product_id,
        product_name,
        customer_name,
        customer_phone,
        customer_address,
        customer_whatsapp,
        customer_city,
        product_size,
        product_color,
        payment_method,
        payment_status,
        order_status,
        amount,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ADMIN ORDERS GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      orders: data || [],
    });

  } catch (error) {
    console.error(
      "ADMIN ORDERS SERVER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load orders.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==================================================
// UPDATE ORDER
// ==================================================

export async function PATCH(
  request: Request
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const orderId =
      String(body.orderId || "");

    const orderStatus =
      body.orderStatus !== undefined
        ? String(body.orderStatus)
        : undefined;

    const paymentStatus =
      body.paymentStatus !== undefined
        ? String(body.paymentStatus)
        : undefined;

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updates: Record<
      string,
      string
    > = {};

    if (
      orderStatus !==
      undefined
    ) {
      updates.order_status =
        orderStatus;
    }

    if (
      paymentStatus !==
      undefined
    ) {
      updates.payment_status =
        paymentStatus;
    }

    if (
      Object.keys(updates).length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Nothing to update.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getAdminSupabase();

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error(
        "ADMIN ORDER UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      order: data,
    });

  } catch (error) {
    console.error(
      "ADMIN ORDER PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update order.",
      },
      {
        status: 500,
      }
    );
  }
}