"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  section: string | null;
  images: string[] | null;
  reel_url: string | null;
  sizes: string[] | null;
  featured: boolean;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
  section: string;
};

function getDiscount(
  price: number,
  originalPrice: number | null
) {
  if (
    !originalPrice ||
    originalPrice <= price ||
    originalPrice <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((originalPrice - price) /
      originalPrice) *
      100
  );
}

export default function ProductPage() {
  const params = useParams();

  const id =
    typeof params.id === "string"
      ? params.id
      : "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [category, setCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedSize, setSelectedSize] =
    useState("");

  const [muted, setMuted] =
    useState(true);

  const reelRef =
    useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError(
          "Invalid product."
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
          "id, name, description, price, original_price, category_id, section, images, reel_url, sizes, featured, active"
        )
        .eq("id", id)
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

      const loaded =
        data as Product;

      setProduct(loaded);

      if (
        loaded.sizes &&
        loaded.sizes.length > 0
      ) {
        setSelectedSize(
          loaded.sizes[0]
        );
      }

      if (loaded.category_id) {
        const {
          data: categoryData,
        } = await supabase
          .from("categories")
          .select(
            "id, name, section"
          )
          .eq(
            "id",
            loaded.category_id
          )
          .single();

        if (categoryData) {
          setCategory(
            categoryData as Category
          );
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  function toggleMute() {
    const video =
      reelRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setMuted(video.muted);

    if (video.paused) {
      video.play().catch(() => {});
    }
  }

  async function shareProduct() {
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            product?.name ||
            "AHN Collection",
          text:
            `Check out ${product?.name || "this product"} from AHN Collection.`,
          url:
            window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        alert(
          "Product link copied!"
        );
      }
    } catch {}
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#777]">
          Loading product...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">

        <div className="text-center">

          <p className="ahn-label text-[#a88952]">
            AHN COLLECTION
          </p>

          <h1 className="mt-5 text-5xl font-medium">
            Product Not Found
          </h1>

          <p className="mt-4 text-[#777]">
            {error}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex bg-[#181818] px-7 py-4 text-xs font-semibold tracking-[0.15em] text-white"
          >
            RETURN HOME
          </Link>

        </div>

      </main>
    );
  }

  const discount =
    getDiscount(
      product.price,
      product.original_price
    );

  const images =
    product.images || [];

  return (
    <main className="min-h-screen bg-white text-[#181818]">

      <header className="border-b border-[#e5e3de]">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.15em]"
          >
            AHN COLLECTION
          </Link>

          <Link
            href="/checkout"
            className="text-xs font-semibold tracking-[0.12em]"
          >
            CHECKOUT
          </Link>

        </div>

      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">

        <Link
          href="/"
          className="mb-8 inline-block text-xs font-medium tracking-[0.1em] text-[#777]"
        >
          ← BACK TO COLLECTION
        </Link>

        <div className="grid gap-14 lg:grid-cols-2">

          {/* MEDIA */}

          <div>

            <div className="relative overflow-hidden bg-[#f5f5f3]">

              {product.reel_url ? (

                <div className="relative">

                  <video
                    ref={reelRef}
                    src={product.reel_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-[3/4] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={
                      toggleMute
                    }
                    className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    {muted
                      ? "🔇"
                      : "🔊"}
                  </button>

                </div>

              ) : images[0] ? (

                <img
                  src={images[0]}
                  alt={product.name}
                  className="aspect-[3/4] w-full object-cover"
                />

              ) : (

                <div className="flex aspect-[3/4] items-center justify-center text-sm text-[#999]">
                  NO IMAGE
                </div>

              )}

            </div>

            {images.length >
              1 && (

              <div className="mt-4 grid grid-cols-4 gap-3">

                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                  )
                )}

              </div>

            )}

          </div>

          {/* INFO */}

          <div className="lg:pt-8">

            <p className="ahn-label text-[#a88952]">
              {product.section?.toUpperCase() ||
                "COLLECTION"}
              {" · "}
              {category?.name ||
                "COLLECTION"}
            </p>

            <h1 className="mt-4 text-5xl font-medium tracking-[-0.04em] md:text-6xl">
              {product.name}
            </h1>

            <div className="mt-7 flex flex-wrap items-baseline gap-4">

              <span className="text-3xl font-medium text-[#ff4f1f]">
                Rs.{" "}
                {product.price.toLocaleString(
                  "en-PK"
                )}
              </span>

              {discount > 0 && (
                <>
                  <span className="text-lg text-[#999] line-through">
                    Rs.{" "}
                    {product.original_price?.toLocaleString(
                      "en-PK"
                    )}
                  </span>

                  <span className="text-base font-medium text-[#666]">
                    -{discount}%
                  </span>
                </>
              )}

            </div>

            {product.description && (

              <p className="mt-7 max-w-xl text-base leading-7 text-[#686868]">
                {product.description}
              </p>

            )}

            {product.sizes &&
              product.sizes.length >
                0 && (

              <div className="mt-10">

                <p className="mb-4 text-xs font-semibold tracking-[0.15em]">
                  SELECT SIZE
                </p>

                <div className="flex flex-wrap gap-2">

                  {product.sizes.map(
                    (size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSelectedSize(
                            size
                          )
                        }
                        className={`border px-5 py-3 text-xs font-semibold ${
                          selectedSize ===
                          size
                            ? "border-[#181818] bg-[#181818] text-white"
                            : "border-[#d8d5cf] hover:border-[#181818]"
                        }`}
                      >
                        {size}
                      </button>
                    )
                  )}

                </div>

              </div>

            )}

            <div className="mt-10 grid gap-3">

              <Link
                href={`/checkout?product=${product.id}${
                  selectedSize
                    ? `&size=${encodeURIComponent(selectedSize)}`
                    : ""
                }`}
                onClick={(event) => {
                  if (
                    product.sizes &&
                    product.sizes.length >
                      0 &&
                    !selectedSize
                  ) {
                    event.preventDefault();

                    alert(
                      "Please select a size first."
                    );
                  }
                }}
                className="bg-[#181818] py-5 text-center text-xs font-semibold tracking-[0.18em] text-white hover:bg-[#333]"
              >
                BUY NOW
              </Link>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  className="border border-[#181818] py-5 text-xs font-semibold tracking-[0.12em]"
                >
                  ♡ ADD TO WISHLIST
                </button>

                <button
                  type="button"
                  onClick={
                    shareProduct
                  }
                  className="border border-[#181818] py-5 text-xs font-semibold tracking-[0.12em]"
                >
                  ↗ SHARE
                </button>

              </div>

            </div>

            <div className="mt-10 border-t border-[#e5e3de]">

              <div className="border-b border-[#e5e3de] py-5">

                <p className="ahn-label">
                  DELIVERY
                </p>

                <p className="mt-2 text-sm text-[#666]">
                  Delivery available across Pakistan.
                </p>

              </div>

              <div className="border-b border-[#e5e3de] py-5">

                <p className="ahn-label">
                  PAYMENT
                </p>

                <p className="mt-2 text-sm text-[#666]">
                  Cash on Delivery, JazzCash and Bank Transfer.
                </p>

              </div>

              <div className="py-5">

                <p className="ahn-label">
                  CUSTOMER CARE
                </p>

                <p className="mt-2 text-sm text-[#666]">
                  Contact AHN Collection for questions,
                  returns and assistance.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}