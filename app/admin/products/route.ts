import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAdmin(request: Request) {
  const cookie =
    request.headers.get("cookie") || "";

  return cookie
    .split(";")
    .map((item) =>
      item.trim()
    )
    .includes(
      "ahn_admin=authenticated"
    );
}

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secret =
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Supabase server credentials are missing."
    );
  }

  return createClient(
    url,
    secret,
    {
      auth: {
        autoRefreshToken:
          false,
        persistSession:
          false,
      },
    }
  );
}

export async function GET(
  request: Request
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const supabase =
      adminClient();

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        "id, name, description, price, original_price, category_id, section, images, reel_url, sizes, featured, active, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: data || [],
    });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load products.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body =
      await request.json();

    const id =
      String(
        body.productId || ""
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const updates: Record<
      string,
      boolean
    > = {};

    if (
      body.active !==
      undefined
    ) {
      updates.active =
        Boolean(
          body.active
        );
    }

    if (
      body.featured !==
      undefined
    ) {
      updates.featured =
        Boolean(
          body.featured
        );
    }

    const supabase =
      adminClient();

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product: data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body =
      await request.json();

    const id =
      String(body.id || "");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      adminClient();

    const {
      error,
    } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete product.",
      },
      { status: 500 }
    );
  }
}