"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

const JAZZCASH_NUMBER =
  "0300 8661317";

const BANK_NAME =
  "N/A";

const BANK_ACCOUNT_TITLE =
  "AHN COLLECTION";

const BANK_ACCOUNT_NUMBER =
  "N/A";

const BANK_IBAN =
  "N/A";

type PaymentMethod =
  | "COD"
  | "JAZZCASH"
  | "BANK";

type Product = {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  category_id: string | null;
  images: string[] | null;
  reel_url: string | null;
  sizes: string[] | null;
  active: boolean;
};

type FormState = {
  name: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  size: string;
  color: string;
};

function CheckoutContent() {
  const searchParams =
    useSearchParams();

  const productId =
    searchParams.get("product");

  const urlSize =
    searchParams.get("size") || "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [categoryName, setCategoryName] =
    useState("COLLECTION");

  const [loading, setLoading] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [payment, setPayment] =
    useState<PaymentMethod>("COD");

  const [form, setForm] =
    useState<FormState>({
      name: "",
      phone: "",
      whatsapp: "",
      city: "",
      address: "",
      size: urlSize,
      color: "",
    });

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setError(
          "No product was selected."
        );
        setLoading(false);
        return;
      }

      const {
        data,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id, name, price, original_price, category_id, images, reel_url, sizes, active"
        )
        .eq("id", productId)
        .eq("active", true)
        .single();

      if (
        productError ||
        !data
      ) {
        setError(
          productError?.message ||
            "Product not found."
        );
        setLoading(false);
        return;
      }

      setProduct(
        data as Product
      );

      if (
        !urlSize &&
        data.sizes &&
        data.sizes.length > 0
      ) {
        setForm(
          (current) => ({
            ...current,
            size:
              data.sizes?.[0] ||
              "",
          })
        );
      }

      if (data.category_id) {
        const {
          data: category,
        } = await supabase
          .from("categories")
          .select(
            "id, name, section"
          )
          .eq(
            "id",
            data.category_id
          )
          .single();

        if (category) {
          setCategoryName(
            category.name
          );
        }
      }

      setLoading(false);
    }

    loadProduct();
  }, [productId, urlSize]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function placeOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!product) return;

    setError("");
    setPlacingOrder(true);

    try {
      if (
        product.sizes &&
        product.sizes.length > 0 &&
        !form.size
      ) {
        throw new Error(
          "Please select a size."
        );
      }

      if (!form.name.trim()) {
        throw new Error(
          "Please enter your full name."
        );
      }

      if (!form.phone.trim()) {
        throw new Error(
          "Please enter your phone number."
        );
      }

      if (!form.city.trim()) {
        throw new Error(
          "Please enter your city."
        );
      }

      if (!form.address.trim()) {
        throw new Error(
          "Please enter your complete address."
        );
      }

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "place_order_and_reduce_stock",
        {
          p_product_id:
            product.id,

          p_product_name:
            product.name,

          p_customer_name:
            form.name.trim(),

          p_customer_phone:
            form.phone.trim(),

          p_customer_whatsapp:
            form.whatsapp.trim() ||
            null,

          p_customer_city:
            form.city.trim(),

          p_customer_address:
            form.address.trim(),

          p_product_size:
            form.size || null,

          p_product_color:
            form.color.trim() ||
            null,

          p_payment_method:
            payment,

          p_amount:
            product.price,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      if (!data?.success) {
        throw new Error(
          "Could not create your order."
        );
      }

      setSuccess(true);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (success && product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">

        <div className="w-full max-w-xl border border-[#e5e3de] p-10 text-center">

          <p className="ahn-label text-[#a88952]">
            AHN COLLECTION
          </p>

          <div className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-full border border-[#181818] text-xl">
            ✓
          </div>

          <h1 className="mt-7 text-5xl font-medium">
            Order Received
          </h1>

          <p className="mt-5 leading-7 text-[#666]">
            Thank you, {form.name}.
            <br />
            Your order for{" "}
            <strong>
              {product.name}
            </strong>{" "}
            has been received.
          </p>

          <p className="mt-5 text-xs font-semibold tracking-[0.15em] text-[#777]">
            PAYMENT:{" "}
            {payment === "COD"
              ? "CASH ON DELIVERY"
              : payment ===
                "JAZZCASH"
              ? "JAZZCASH"
              : "BANK TRANSFER"}
          </p>

          <p className="mt-3 text-lg text-[#181818]">
            Total: Rs.{" "}
            {product.price.toLocaleString(
              "en-PK"
            )}
          </p>

          <Link
            href="/"
            className="mt-9 inline-block bg-[#181818] px-8 py-4 text-xs font-semibold tracking-[0.15em] text-white"
          >
            RETURN TO COLLECTION
          </Link>

        </div>

      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-[#777]">
          Preparing checkout...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <h1 className="text-4xl">
            Checkout unavailable
          </h1>

          <p className="mt-4 text-[#777]">
            {error}
          </p>

          <Link
            href="/"
            className="mt-7 inline-block bg-[#181818] px-7 py-4 text-xs font-semibold text-white"
          >
            RETURN HOME
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#181818]">

      <header className="border-b border-[#e5e3de]">

        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.15em]"
          >
            AHN COLLECTION
          </Link>

          <span className="text-xs font-semibold tracking-[0.15em] text-[#777]">
            CHECKOUT
          </span>

        </div>

      </header>

      <section className="mx-auto max-w-5xl px-6 py-14">

        <div className="mb-12 text-center">

          <p className="ahn-label text-[#a88952]">
            COMPLETE YOUR ORDER
          </p>

          <h1 className="mt-4 text-6xl font-medium">
            Checkout
          </h1>

        </div>

        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={placeOrder}>

          <div className="grid gap-10 lg:grid-cols-2">

            {/* CUSTOMER */}

            <div className="border border-[#e5e3de] bg-white p-7">

              <h2 className="text-3xl font-medium">
                Customer Details
              </h2>

              <div className="mt-7 space-y-5">

                {[
                  [
                    "name",
                    "FULL NAME",
                    "text",
                    "Your full name",
                  ],
                  [
                    "phone",
                    "PHONE NUMBER",
                    "tel",
                    "03XX XXXXXXX",
                  ],
                  [
                    "whatsapp",
                    "WHATSAPP NUMBER",
                    "tel",
                    "03XX XXXXXXX",
                  ],
                  [
                    "city",
                    "CITY",
                    "text",
                    "Your city",
                  ],
                ].map(
                  (item) => (
                    <div key={item[0]}>

                      <label className="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[#666]">
                        {item[1]}
                      </label>

                      <input
                        required={
                          item[0] !==
                          "whatsapp"
                        }
                        type={item[2]}
                        value={
                          form[
                            item[0] as keyof FormState
                          ]
                        }
                        onChange={(event) =>
                          updateField(
                            item[0] as keyof FormState,
                            event.target.value
                          )
                        }
                        placeholder={
                          item[3]
                        }
                        className="ahn-input"
                      />

                    </div>
                  )
                )}

                <div>

                  <label className="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[#666]">
                    COMPLETE DELIVERY ADDRESS
                  </label>

                  <textarea
                    required
                    rows={5}
                    value={
                      form.address
                    }
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="House number, street, area..."
                    className="ahn-input resize-none"
                  />

                </div>

              </div>

            </div>

            {/* ORDER */}

            <div>

              <div className="border border-[#e5e3de] p-7">

                <h2 className="text-3xl font-medium">
                  Your Article
                </h2>

                <div className="mt-6 flex gap-5 border-t border-[#e5e3de] pt-6">

                  <div className="h-32 w-24 overflow-hidden bg-[#f5f5f3]">

                    {product.images?.[0] ? (

                      <img
                        src={
                          product.images[0]
                        }
                        alt={
                          product.name
                        }
                        className="h-full w-full object-cover"
                      />

                    ) : product.reel_url ? (

                      <video
                        src={
                          product.reel_url
                        }
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />

                    ) : null}

                  </div>

                  <div>

                    <p className="ahn-label text-[#a88952]">
                      {categoryName}
                    </p>

                    <h3 className="mt-2 text-xl font-medium">
                      {product.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-3">

                      <span className="text-lg text-[#ff4f1f]">
                        Rs.{" "}
                        {product.price.toLocaleString(
                          "en-PK"
                        )}
                      </span>

                      {product.original_price &&
                        product.original_price >
                          product.price && (
                          <span className="text-sm text-[#999] line-through">
                            Rs.{" "}
                            {product.original_price.toLocaleString(
                              "en-PK"
                            )}
                          </span>
                        )}

                    </div>

                  </div>

                </div>

                {product.sizes &&
                  product.sizes.length >
                    0 && (

                  <div className="mt-7">

                    <label className="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[#666]">
                      SIZE
                    </label>

                    <select
                      required
                      value={
                        form.size
                      }
                      onChange={(event) =>
                        updateField(
                          "size",
                          event.target.value
                        )
                      }
                      className="ahn-input"
                    >

                      <option value="">
                        Select size
                      </option>

                      {product.sizes.map(
                        (size) => (
                          <option
                            key={size}
                            value={size}
                          >
                            {size}
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )}

                <div className="mt-5">

                  <label className="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-[#666]">
                    COLOR
                  </label>

                  <input
                    value={form.color}
                    onChange={(event) =>
                      updateField(
                        "color",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Ivory, White, Black"
                    className="ahn-input"
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div className="mt-6 border border-[#e5e3de] p-7">

                <h2 className="text-3xl font-medium">
                  Payment Method
                </h2>

                <div className="mt-6 space-y-3">

                  {[
                    [
                      "COD",
                      "CASH ON DELIVERY",
                      "Pay when your order arrives.",
                    ],
                    [
                      "JAZZCASH",
                      "JAZZCASH",
                      "Pay through JazzCash.",
                    ],
                    [
                      "BANK",
                      "BANK TRANSFER",
                      "Transfer directly to our bank account.",
                    ],
                  ].map(
                    (item) => (

                      <button
                        key={item[0]}
                        type="button"
                        onClick={() =>
                          setPayment(
                            item[0] as PaymentMethod
                          )
                        }
                        className={`w-full border p-5 text-left ${
                          payment ===
                          item[0]
                            ? "border-[#181818] bg-[#fafafa]"
                            : "border-[#e5e3de]"
                        }`}
                      >

                        <p className="text-xs font-semibold tracking-[0.12em]">
                          {item[1]}
                        </p>

                        <p className="mt-2 text-sm text-[#777]">
                          {item[2]}
                        </p>

                      </button>

                    )
                  )}

                </div>

                {/* JAZZCASH */}

                {payment ===
                  "JAZZCASH" && (

                  <div className="mt-5 border border-[#e5e3de] bg-[#fafaf8] p-5">

                    <p className="ahn-label text-[#a88952]">
                      JAZZCASH PAYMENT DETAILS
                    </p>

                    <p className="mt-3 text-xl font-medium">
                      {JAZZCASH_NUMBER}
                    </p>

                    <p className="mt-5 border-t border-[#e5e3de] pt-4 text-sm leading-6 text-[#666]">
                      After making the payment,
                      please keep your transaction
                      screenshot.
                      <br />
                      <strong className="text-[#181818]">
                        When you are contacted by us,
                        you have to send the screenshot
                        of the cash transfer.
                      </strong>
                    </p>

                  </div>

                )}

                {/* BANK */}

                {payment ===
                  "BANK" && (

                  <div className="mt-5 border border-[#e5e3de] bg-[#fafaf8] p-5">

                    <p className="ahn-label text-[#a88952]">
                      BANK TRANSFER DETAILS
                    </p>

                    <div className="mt-4 space-y-4 text-sm">

                      <div>
                        <p className="text-xs text-[#888]">
                          BANK
                        </p>
                        <p className="mt-1 text-lg">
                          {BANK_NAME}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#888]">
                          ACCOUNT TITLE
                        </p>
                        <p className="mt-1 text-lg">
                          {
                            BANK_ACCOUNT_TITLE
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#888]">
                          ACCOUNT NUMBER
                        </p>
                        <p className="mt-1 break-all text-lg">
                          {
                            BANK_ACCOUNT_NUMBER
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#888]">
                          IBAN
                        </p>
                        <p className="mt-1 break-all text-lg">
                          {BANK_IBAN}
                        </p>
                      </div>

                    </div>

                    <p className="mt-5 border-t border-[#e5e3de] pt-4 text-sm leading-6 text-[#666]">
                      After making the payment,
                      please keep your transaction
                      screenshot.
                      <br />
                      <strong className="text-[#181818]">
                        When you are contacted by us,
                        you have to send the screenshot
                        of the cash transfer.
                      </strong>
                    </p>

                  </div>

                )}

              </div>

              {/* TOTAL */}

              <div className="mt-6 border border-[#e5e3de] p-7">

                <div className="flex items-center justify-between">

                  <span className="text-2xl">
                    Total
                  </span>

                  <span className="text-3xl font-medium text-[#ff4f1f]">
                    Rs.{" "}
                    {product.price.toLocaleString(
                      "en-PK"
                    )}
                  </span>

                </div>

                <button
                  type="submit"
                  disabled={
                    placingOrder
                  }
                  className="mt-7 w-full bg-[#181818] py-5 text-xs font-semibold tracking-[0.18em] text-white hover:bg-[#333] disabled:opacity-50"
                >
                  {placingOrder
                    ? "PLACING ORDER..."
                    : "PLACE ORDER"}
                </button>

              </div>

            </div>

          </div>

        </form>

      </section>

    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          Loading...
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}