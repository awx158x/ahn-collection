"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  section: string | null;
  images: string[] | null;
  reel_url: string | null;
  sizes: string[] | null;
  stock: number;
  featured: boolean;
  active: boolean;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  section: string;
};

type ReelCardProps = {
  product: Product;
};

function ReelCard({
  product,
}: ReelCardProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [muted, setMuted] =
    useState(true);

  function toggleMute() {
    const video =
      videoRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setMuted(video.muted);

    if (video.paused) {
      video.play().catch(() => {});
    }
  }

  return (
    <article className="group w-[260px] shrink-0 overflow-hidden border border-[#e5e3de] bg-white sm:w-[300px]">

      <div className="relative aspect-[9/16] overflow-hidden bg-black">

        <video
          ref={videoRef}
          src={product.reel_url || ""}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget
              .play()
              .catch(() => {});
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        {/* BRAND */}

        <div className="absolute left-5 top-5">

          <p className="ahn-label text-white">
            AHN COLLECTION
          </p>

        </div>

        {/* UNMUTE */}

        <button
          type="button"
          onClick={toggleMute}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/35 text-sm text-white backdrop-blur transition hover:bg-white hover:text-black"
          title={
            muted
              ? "Unmute reel"
              : "Mute reel"
          }
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* PRODUCT */}

        <div className="absolute bottom-5 left-5 right-5">

          <p className="ahn-label text-[#e8d3a5]">
            REEL
          </p>

          <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl text-white">
            {product.name}
          </h3>

          <p className="mt-1 font-[var(--font-cormorant)] text-lg text-white/90">
            Rs.{" "}
            {product.price.toLocaleString("en-PK")}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-2 border-t border-[#e5e3de]">

        <Link
          href={`/product/${product.id}`}
          className="py-4 text-center text-xs font-medium tracking-[0.12em] text-[#181818] transition hover:bg-[#181818] hover:text-white"
        >
          VIEW
        </Link>

        <button
          type="button"
          className="border-l border-[#e5e3de] py-4 text-center text-xs text-[#181818] transition hover:bg-[#181818] hover:text-white"
          onClick={() => {
            if (
              typeof window !==
              "undefined"
            ) {
              const url =
                `${window.location.origin}/product/${product.id}`;

              if (navigator.share) {
                navigator
                  .share({
                    title:
                      product.name,
                    text:
                      `Check out ${product.name} from AHN Collection.`,
                    url,
                  })
                  .catch(() => {});
              } else {
                navigator.clipboard
                  .writeText(url)
                  .then(() =>
                    alert(
                      "Product link copied!"
                    )
                  )
                  .catch(() => {});
              }
            }
          }}
        >
          SHARE
        </button>

      </div>

    </article>
  );
}

export default function Home() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showWishlist, setShowWishlist] =
    useState(false);

  const [wishlistIds, setWishlistIds] =
    useState<string[]>([]);

  const reelsScrollRef =
    useRef<HTMLDivElement | null>(null);

  const isResettingRef =
    useRef(false);

  // ==================================================
  // LOAD WISHLIST
  // ==================================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "ahn_wishlist"
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch (wishlistError) {
      console.error(
        "Wishlist load error:",
        wishlistError
      );
    }
  }, []);

  // ==================================================
  // SAVE WISHLIST
  // ==================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "ahn_wishlist",
        JSON.stringify(wishlistIds)
      );
    } catch (wishlistError) {
      console.error(
        "Wishlist save error:",
        wishlistError
      );
    }
  }, [wishlistIds]);

  // ==================================================
  // TOGGLE WISHLIST
  // ==================================================

  function toggleWishlist(
    productId: string
  ) {
    setWishlistIds(
      (current) =>
        current.includes(productId)
          ? current.filter(
              (id) =>
                id !== productId
            )
          : [
              ...current,
              productId,
            ]
    );
  }

  // ==================================================
  // LOAD STORE
  // ==================================================

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      setError("");

      const [
        {
          data: productData,
          error: productError,
        },
        {
          data: categoryData,
          error: categoryError,
        },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active, created_at"
          )
          .eq("active", true)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select(
            "id, name, section"
          )
          .order("name", {
            ascending: true,
          }),
      ]);

      if (productError) {
        console.error(
          "Homepage product error:",
          productError
        );

        setError(
          "Could not load the collection."
        );

        setLoading(false);
        return;
      }

      if (categoryError) {
        console.error(
          "Homepage category error:",
          categoryError
        );

        setError(
          "Could not load categories."
        );

        setLoading(false);
        return;
      }

      setProducts(
        productData || []
      );

      setCategories(
        categoryData || []
      );

      setLoading(false);
    }

    loadStore();
  }, []);

  // ==================================================
  // CATEGORY BUTTONS
  // ==================================================

  const categoryButtons =
    useMemo(() => {
      const buttons = [
        {
          key: "ALL",
          label: "ALL",
        },
      ];

      for (const category of categories) {
        buttons.push({
          key: category.id,
          label:
            category.name.toUpperCase(),
        });
      }

      buttons.push({
        key: "REELS",
        label: "REELS",
      });

      return buttons;
    }, [categories]);

  // ==================================================
  // SEARCH + FILTER
  // ==================================================

  const filteredProducts =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          if (
            selectedCategory ===
            "REELS"
          ) {
            return false;
          }

          if (
            selectedCategory !==
              "ALL" &&
            product.category_id !==
              selectedCategory
          ) {
            return false;
          }

          if (
            showWishlist &&
            !wishlistIds.includes(
              product.id
            )
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const categoryName =
            categories.find(
              (category) =>
                category.id ===
                product.category_id
            )?.name || "";

          const searchableText =
            [
              product.name,
              product.description ||
                "",
              categoryName,
              product.section ||
                "",
            ]
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      products,
      categories,
      selectedCategory,
      searchQuery,
      showWishlist,
      wishlistIds,
    ]);

  // ==================================================
  // REELS
  // ==================================================

  const reelProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            Boolean(
              product.reel_url
            )
        ),
      [products]
    );

  const loopedReels =
    useMemo(() => {
      if (
        reelProducts.length ===
        0
      ) {
        return [];
      }

      return [
        ...reelProducts,
        ...reelProducts,
        ...reelProducts,
      ];
    }, [reelProducts]);

  // ==================================================
  // INFINITE REEL SCROLL
  // ==================================================

  function handleReelScroll() {
    const container =
      reelsScrollRef.current;

    if (
      !container ||
      isResettingRef.current
    ) {
      return;
    }

    const oneSetWidth =
      container.scrollWidth / 3;

    if (
      container.scrollLeft <
      oneSetWidth * 0.4
    ) {
      isResettingRef.current =
        true;

      container.scrollLeft +=
        oneSetWidth;

      requestAnimationFrame(() => {
        isResettingRef.current =
          false;
      });

      return;
    }

    if (
      container.scrollLeft >
      oneSetWidth * 1.6
    ) {
      isResettingRef.current =
        true;

      container.scrollLeft -=
        oneSetWidth;

      requestAnimationFrame(() => {
        isResettingRef.current =
          false;
      });
    }
  }

  useEffect(() => {
    const container =
      reelsScrollRef.current;

    if (
      !container ||
      reelProducts.length === 0
    ) {
      return;
    }

    const oneSetWidth =
      container.scrollWidth / 3;

    container.scrollLeft =
      oneSetWidth;
  }, [reelProducts.length]);

  // ==================================================
  // PRODUCT CARD
  // ==================================================

  function ProductCard({
    product,
  }: {
    product: Product;
  }) {
    const imageUrl =
      product.images?.[0] || "";

    const isWishlisted =
      wishlistIds.includes(
        product.id
      );

    const categoryName =
      categories.find(
        (category) =>
          category.id ===
          product.category_id
      )?.name ||
      "COLLECTION";

    return (
      <article className="ahn-product-card group overflow-hidden border border-[#e5e3de] bg-white">

        {/* IMAGE */}

        <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f1]">

          {imageUrl ? (

            <img
              src={imageUrl}
              alt={product.name}
              className="ahn-product-image h-full w-full object-cover"
            />

          ) : product.reel_url ? (

            <video
              src={product.reel_url}
              muted
              autoPlay
              loop
              playsInline
              className="ahn-product-image h-full w-full object-cover"
            />

          ) : (

            <div className="flex h-full items-center justify-center text-xs tracking-wider text-[#999]">
              NO IMAGE
            </div>

          )}

          {/* WISHLIST */}

          <button
            type="button"
            onClick={() =>
              toggleWishlist(
                product.id
              )
            }
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 text-lg shadow-sm transition ${
              isWishlisted
                ? "border-[#181818] bg-[#181818] text-white"
                : "border-[#dedbd5] text-[#181818] hover:bg-[#181818] hover:text-white"
            }`}
            title={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >
            {isWishlisted
              ? "♥"
              : "♡"}
          </button>

        </div>

        {/* INFO */}

        <div className="p-5">

          <p className="ahn-label text-[#8b7147]">
            {categoryName}
          </p>

          <h3 className="mt-2 text-xl font-medium tracking-[-0.02em]">
            {product.name}
          </h3>

          <p className="mt-2 text-base text-[#555]">
            Rs.{" "}
            {product.price.toLocaleString(
              "en-PK"
            )}
          </p>

          {product.stock <=
            0 && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
              Out of stock
            </p>
          )}

        </div>

        {/* ACTIONS */}

        <div className="grid grid-cols-2 border-t border-[#e5e3de]">

          <button
            type="button"
            onClick={() => {
              if (
                typeof window !==
                "undefined"
              ) {
                const url =
                  `${window.location.origin}/product/${product.id}`;

                if (
                  navigator.share
                ) {
                  navigator
                    .share({
                      title:
                        product.name,
                      text:
                        `Check out ${product.name} from AHN Collection.`,
                      url,
                    })
                    .catch(() => {});
                } else {
                  navigator.clipboard
                    .writeText(url)
                    .then(() =>
                      alert(
                        "Product link copied!"
                      )
                    )
                    .catch(
                      () => {}
                    );
                }
              }
            }}
            className="border-r border-[#e5e3de] py-4 text-xs font-medium tracking-[0.12em] text-[#444] transition hover:bg-[#f5f5f3]"
          >
            SHARE
          </button>

          <Link
            href={`/product/${product.id}`}
            className="py-4 text-center text-xs font-semibold tracking-[0.12em] text-[#181818] transition hover:bg-[#181818] hover:text-white"
          >
            VIEW PRODUCT
          </Link>

        </div>

      </article>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-white text-[#181818]">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#e5e3de] bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-9 w-9 items-center justify-center border border-[#a88952] text-sm font-semibold tracking-[0.16em] text-[#a88952]">
              AHN
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-semibold tracking-[0.14em]">
                AHN COLLECTION
              </p>

              <p className="mt-0.5 text-[8px] tracking-[0.25em] text-[#888]">
                EST. 2026
              </p>

            </div>

          </Link>

          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#women"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] transition hover:text-[#a88952]"
            >
              WOMEN
            </a>

            <a
              href="#men"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] transition hover:text-[#a88952]"
            >
              MEN
            </a>

            <a
              href="#reels"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] transition hover:text-[#a88952]"
            >
              REELS
            </a>

          </nav>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">

            {/* SEARCH */}

            <button
              type="button"
              onClick={() =>
                setSearchOpen(
                  (current) =>
                    !current
                )
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                searchOpen
                  ? "bg-[#181818] text-white"
                  : "text-[#333] hover:bg-[#f3f3f1]"
              }`}
              title="Search"
            >
              ⌕
            </button>

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() => {
                setShowWishlist(
                  (current) =>
                    !current
                );

                setSelectedCategory(
                  "ALL"
                );

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                showWishlist
                  ? "bg-[#181818] text-white"
                  : "text-[#333] hover:bg-[#f3f3f1]"
              }`}
              title="Wishlist"
            >
              {showWishlist
                ? "♥"
                : "♡"}
            </button>

            {/* CHECKOUT */}

            <Link
              href="/checkout"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#333] transition hover:bg-[#f3f3f1]"
              title="Checkout"
            >
              ♧
            </Link>

          </div>

        </div>

        {/* SEARCH BAR */}

        {searchOpen && (

          <div className="border-t border-[#e5e3de] bg-white px-6 py-4">

            <div className="mx-auto max-w-3xl">

              <div className="relative">

                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search products, categories..."
                  className="ahn-input pr-12"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#777]"
                  >
                    ×
                  </button>
                )}

              </div>

            </div>

          </div>

        )}

      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="border-b border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center">

        <p className="ahn-label text-[#a88952]">
          AHN COLLECTION
        </p>

        <h1 className="ahn-heading mx-auto mt-6 max-w-4xl text-6xl md:text-8xl">
          Modern elegance,
          <br />
          <span className="text-[#a88952]">
            thoughtfully made.
          </span>
        </h1>

        <div className="mx-auto my-8 h-px w-12 bg-[#a88952]" />

        <p className="mx-auto max-w-2xl text-base leading-7 text-[#6f6f6b] md:text-lg">
          Discover carefully curated pieces
          designed around simplicity, quality
          and timeless style.
        </p>

      </section>

      {/* ==================================================
          COLLECTION
      ================================================== */}

      <section
        id="women"
        className="mx-auto max-w-7xl px-6 py-20"
      >

        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="ahn-label text-[#a88952]">
              DISCOVER
            </p>

            <h2
              id="collections"
              className="ahn-heading mt-3 text-4xl md:text-5xl"
            >
              The Collection
            </h2>

          </div>

          {showWishlist && (

            <button
              type="button"
              onClick={() =>
                setShowWishlist(
                  false
                )
              }
              className="text-xs font-semibold tracking-[0.12em] text-[#777] underline underline-offset-4"
            >
              SHOW ALL PRODUCTS
            </button>

          )}

        </div>

        {/* FILTERS */}

        <div className="mb-12 flex flex-wrap gap-2">

          {categoryButtons.map(
            (category) => (

              <button
                key={category.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(
                    category.key
                  );
                  setShowWishlist(
                    false
                  );
                }}
                className={`border px-5 py-3 text-[10px] font-semibold tracking-[0.13em] transition ${
                  selectedCategory ===
                  category.key
                    ? "border-[#181818] bg-[#181818] text-white"
                    : "border-[#dedbd5] bg-white text-[#555] hover:border-[#181818]"
                }`}
              >
                {category.label}
              </button>

            )
          )}

        </div>

        {/* SEARCH / WISHLIST STATUS */}

        {(searchQuery ||
          showWishlist) && (

          <div className="mb-8 flex items-center justify-between border-b border-[#e5e3de] pb-4">

            <p className="text-sm text-[#666]">

              {showWishlist
                ? `Wishlist · ${filteredProducts.length} item${
                    filteredProducts.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : `Search results · ${filteredProducts.length}`}

            </p>

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery(
                    ""
                  )
                }
                className="text-xs font-semibold tracking-[0.1em] underline"
              >
                CLEAR SEARCH
              </button>
            )}

          </div>

        )}

        {/* LOADING */}

        {loading && (

          <div className="py-24 text-center">

            <p className="text-lg text-[#777]">
              Loading collection...
            </p>

          </div>

        )}

        {/* ERROR */}

        {!loading &&
          error && (

            <div className="border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-700">
              {error}
            </div>

          )}

        {/* ==================================================
            REELS CATEGORY
        ================================================== */}

        {!loading &&
          !error &&
          selectedCategory ===
            "REELS" && (

            <section
              id="reels"
              className="relative"
            >

              <div className="mb-8">

                <p className="ahn-label text-[#a88952]">
                  AHN MOTION
                </p>

                <h3 className="ahn-heading mt-3 text-3xl md:text-4xl">
                  Collection Reels
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#777]">
                  Explore the latest AHN
                  pieces in motion.
                </p>

              </div>

              {reelProducts.length ===
              0 ? (

                <div className="py-20 text-center">

                  <p className="text-lg text-[#777]">
                    No reels have been uploaded yet.
                  </p>

                </div>

              ) : (

                <div className="relative">

                  <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-white to-transparent" />

                  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white to-transparent" />

                  <div
                    ref={reelsScrollRef}
                    onScroll={
                      handleReelScroll
                    }
                    className="flex gap-6 overflow-x-auto px-2 pb-6 [scrollbar-width:thin]"
                  >

                    {loopedReels.map(
                      (
                        product,
                        index
                      ) => (

                        <ReelCard
                          key={`${product.id}-${index}`}
                          product={product}
                        />

                      )
                    )}

                  </div>

                </div>

              )}

            </section>

          )}

        {/* ==================================================
            PRODUCTS
        ================================================== */}

        {!loading &&
          !error &&
          selectedCategory !==
            "REELS" && (

            filteredProducts.length ===
            0 ? (

              <div className="border border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center">

                <p className="text-xl text-[#666]">
                  {showWishlist
                    ? "Your wishlist is empty."
                    : searchQuery
                    ? "No products match your search."
                    : "More beautiful pieces are coming soon."}
                </p>

                {showWishlist &&
                  wishlistIds.length ===
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowWishlist(
                          false
                        )
                      }
                      className="mt-6 border border-[#181818] px-6 py-3 text-xs font-semibold tracking-[0.12em]"
                    >
                      BROWSE COLLECTION
                    </button>
                  )}

              </div>

            ) : (

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  )
                )}

              </div>

            )

          )}

      </section>

      {/* ==================================================
          MEN
      ================================================== */}

      <section
        id="men"
        className="border-y border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center"
      >

        <p className="ahn-label text-[#a88952]">
          COMING SOON
        </p>

        <h2 className="ahn-heading mt-4 text-5xl md:text-6xl">
          Men&apos;s Collection
        </h2>

        <div className="mx-auto my-7 h-px w-12 bg-[#a88952]" />

        <p className="mx-auto max-w-xl text-base leading-7 text-[#777]">
          A refined collection for the
          modern gentleman.
        </p>

      </section>

      {/* ==================================================
          PHILOSOPHY
      ================================================== */}

      <section className="px-6 py-28 text-center">

        <p className="ahn-label text-[#a88952]">
          OUR PHILOSOPHY
        </p>

        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-medium leading-tight tracking-[-0.03em] md:text-6xl">
          Fashion changes.
          <br />
          <span className="text-[#a88952]">
            Good design remains.
          </span>
        </h2>

      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="border-t border-[#e5e3de] bg-white px-6 py-14">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="text-lg font-semibold tracking-[0.16em]">
                AHN COLLECTION
              </p>

              <p className="mt-2 text-sm text-[#777]">
                Elegance in every thread.
              </p>

            </div>

            <div className="flex gap-8 text-[10px] font-semibold tracking-[0.14em] text-[#666]">
              <span>
                INSTAGRAM
              </span>

              <span>
                WHATSAPP
              </span>

              <span>
                CONTACT
              </span>
            </div>

          </div>

          <div className="mt-10 border-t border-[#e5e3de] pt-6">

            <p className="text-[9px] tracking-[0.15em] text-[#999]">
              © 2026 AHN COLLECTION — ALL RIGHTS RESERVED
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}