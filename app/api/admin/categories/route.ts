import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAdmin(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .some(
      (item) => item === "ahn_admin=authenticated"
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

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, section, created_at")
      .order("section", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: data || [],
    });
  } catch (error) {
    console.error(
      "Categories GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load categories.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      String(body.name || "").trim();

    const section =
      String(body.section || "")
        .trim()
        .toLowerCase();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Category name is required.",
        },
        { status: 400 }
      );
    }

    if (
      section !== "women" &&
      section !== "men"
    ) {
      return NextResponse.json(
        {
          error:
            "Section must be women or men.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminSupabase();

    const { data: existing } =
      await supabase
        .from("categories")
        .select("id")
        .eq("name", name)
        .eq("section", section)
        .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "That category already exists.",
        },
        { status: 409 }
      );
    }

    const { data, error } =
      await supabase
        .from("categories")
        .insert({
          name,
          section,
        })
        .select(
          "id, name, section, created_at"
        )
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        category: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Categories POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create category.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id =
      String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Category ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminSupabase();

    const { count, error: countError } =
      await supabase
        .from("products")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("category_id", id);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This category is being used by products and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    const { error } =
      await supabase
        .from("categories")
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
    console.error(
      "Categories DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete category.",
      },
      { status: 500 }
    );
  }
}