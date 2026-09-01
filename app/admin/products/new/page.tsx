"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Category = {
  id: string;
  name: string;
  section: string;
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [gender, setGender] =
    useState("women");

  const [categoryId, setCategoryId] =
    useState("");

  const [image, setImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [reel, setReel] =
    useState<File | null>(null);

  const [reelPreview, setReelPreview] =
    useState("");

  const [featured, setFeatured] =
    useState(false);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);

      const {
        data,
        error,
      } = await supabase
        .from("categories")
        .select(
          "id, name, section"
        )
        .order("name", {
          ascending: true,
        });

      if (error) {
        setError(error.message);
        setLoadingCategories(false);
        return;
      }

      setCategories(data || []);

      setLoadingCategories(false);
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const matching =
      categories.find(
        (category) =>
          category.section.toLowerCase() ===
          gender
      );

    setCategoryId(
      matching?.id || ""
    );
  }, [gender, categories]);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(
      URL.createObjectURL(file)
    );
  }

  function handleReelChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setReel(file);
    setReelPreview(
      URL.createObjectURL(file)
    );
  }

  async function uploadFile(
    file: File,
    bucket: string
  ) {
    const safeName =
      file.name
        .replace(
          /[^a-zA-Z0-9.-]/g,
          "-"
        )
        .toLowerCase();

    const filePath =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(bucket)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const { data } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(
          filePath
        );

    return data.publicUrl;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData =
        new FormData(
          event.currentTarget
        );

      const name =
        String(
          formData.get("name") ||
            ""
        ).trim();

      const description =
        String(
          formData.get(
            "description"
          ) || ""
        ).trim();

      const price =
        Number(
          formData.get("price") ||
            0
        );

      const originalPriceRaw =
        String(
          formData.get(
            "original_price"
          ) || ""
        ).trim();

      const originalPrice =
        originalPriceRaw
          ? Number(
              originalPriceRaw
            )
          : null;

      const sizes =
        formData
          .getAll("sizes")
          .map(String);

      if (!name) {
        throw new Error(
          "Please enter a product name."
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "Please enter a valid price."
        );
      }

      if (
        originalPrice !==
          null &&
        (
          !Number.isFinite(
            originalPrice
          ) ||
          originalPrice < 0
        )
      ) {
        throw new Error(
          "Please enter a valid original price."
        );
      }

      if (
        originalPrice !== null &&
        originalPrice < price
      ) {
        throw new Error(
          "Original price cannot be lower than the sale price."
        );
      }

      if (!categoryId) {
        throw new Error(
          "Please select a category."
        );
      }

      if (!image) {
        throw new Error(
          "Please upload a product image."
        );
      }

      setMessage(
        "Uploading product image..."
      );

      const imageUrl =
        await uploadFile(
          image,
          "product-images"
        );

      let reelUrl:
        | string
        | null = null;

      if (reel) {
        setMessage(
          "Uploading product reel..."
        );

        reelUrl =
          await uploadFile(
            reel,
            "product-reels"
          );
      }

      setMessage(
        "Creating product..."
      );

      const {
        error: productError,
      } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price,
          original_price:
            originalPrice,
          category_id:
            categoryId,
          section: gender,
          images: [
            imageUrl,
          ],
          reel_url:
            reelUrl,
          sizes,
          featured,
          active: true,

          // Compatibility only.
          // The website no longer uses stock.
          stock: 0,
        });

      if (productError) {
        throw new Error(
          productError.message
        );
      }

      setMessage(
        "Product created successfully."
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1000);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  const visibleCategories =
    categories.filter(
      (category) =>
        category.section.toLowerCase() ===
        gender
    );

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#181818]">

      <header className="border-b border-[#e5e3de] bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

          <Link
            href="/admin"
            className="text-sm font-semibold tracking-[0.15em]"
          >
            AHN COLLECTION · ADMIN
          </Link>

          <Link
            href="/admin"
            className="text-xs text-[#666]"
          >
            BACK TO ADMIN
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">

        <div className="mb-10">

          <p className="ahn-label text-[#a88952]">
            INVENTORY
          </p>

          <h1 className="mt-3 text-5xl font-medium">
            Create New Product
          </h1>

        </div>

        {message && (
          <div className="mb-6 border border-[#e5e3de] bg-white px-5 py-4 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* BASIC */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <h2 className="text-2xl font-medium">
              Product Information
            </h2>

            <div className="mt-7 grid gap-6 md:grid-cols-2">

              <div className="md:col-span-2">

                <label className="field-label">
                  PRODUCT NAME
                </label>

                <input
                  required
                  name="name"
                  placeholder="e.g. Royal Ivory Ensemble"
                  className="field-input"
                />

              </div>

              <div>

                <label className="field-label">
                  SALE PRICE (PKR)
                </label>

                <input
                  required
                  name="price"
                  type="number"
                  min="0"
                  placeholder="7199"
                  className="field-input"
                />

              </div>

              <div>

                <label className="field-label">
                  ORIGINAL PRICE (PKR)
                </label>

                <input
                  name="original_price"
                  type="number"
                  min="0"
                  placeholder="9500"
                  className="field-input"
                />

              </div>

              <div>

                <label className="field-label">
                  COLLECTION
                </label>

                <select
                  value={gender}
                  onChange={(event) =>
                    setGender(
                      event.target.value
                    )
                  }
                  className="field-input"
                >

                  <option value="women">
                    Women
                  </option>

                  <option value="men">
                    Men
                  </option>

                </select>

              </div>

              <div>

                <label className="field-label">
                  CATEGORY
                </label>

                <select
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingCategories ||
                    visibleCategories.length === 0
                  }
                  className="field-input"
                >

                  {loadingCategories ? (

                    <option>
                      Loading...
                    </option>

                  ) : visibleCategories.length === 0 ? (

                    <option>
                      No categories available
                    </option>

                  ) : (

                    visibleCategories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )

                  )}

                </select>

              </div>

            </div>

          </section>

          {/* DESCRIPTION */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <h2 className="text-2xl font-medium">
              Description
            </h2>

            <textarea
              required
              name="description"
              rows={7}
              placeholder="Describe the fabric, embroidery, design, colour and other details..."
              className="field-input mt-6 resize-none"
            />

          </section>

          {/* SIZES */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <h2 className="text-2xl font-medium">
              Available Sizes
            </h2>

            <div className="mt-6 flex flex-wrap gap-2">

              {[
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "Free Size",
              ].map(
                (size) => (

                  <label
                    key={size}
                    className="cursor-pointer"
                  >

                    <input
                      type="checkbox"
                      name="sizes"
                      value={size}
                      className="peer hidden"
                    />

                    <span className="block border border-[#d9d5ce] px-5 py-3 text-xs font-semibold peer-checked:border-[#181818] peer-checked:bg-[#181818] peer-checked:text-white">
                      {size}
                    </span>

                  </label>

                )
              )}

            </div>

          </section>

          {/* IMAGE */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <h2 className="text-2xl font-medium">
              Product Photography
            </h2>

            <label className="mt-6 block cursor-pointer">

              <div className="border border-dashed border-[#cfcac0] bg-[#fafaf8] p-10 text-center">

                {imagePreview ? (

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto max-h-[500px] object-contain"
                  />

                ) : (

                  <>
                    <p className="text-4xl text-[#999]">
                      +
                    </p>

                    <p className="mt-4 text-sm font-medium">
                      Upload Product Image
                    </p>

                    <p className="mt-2 text-xs text-[#888]">
                      JPG, PNG or WEBP
                    </p>
                  </>

                )}

              </div>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageChange
                }
                className="hidden"
              />

            </label>

          </section>

          {/* REEL */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <h2 className="text-2xl font-medium">
              Collection Reel
            </h2>

            <label className="mt-6 block cursor-pointer">

              <div className="border border-dashed border-[#cfcac0] bg-[#fafaf8] p-10 text-center">

                {reelPreview ? (

                  <video
                    src={reelPreview}
                    controls
                    className="mx-auto max-h-[500px]"
                  />

                ) : (

                  <>
                    <p className="text-4xl text-[#999]">
                      +
                    </p>

                    <p className="mt-4 text-sm font-medium">
                      Upload Product Reel
                    </p>

                    <p className="mt-2 text-xs text-[#888]">
                      MP4 or WEBM
                    </p>
                  </>

                )}

              </div>

              <input
                type="file"
                accept="video/*"
                onChange={
                  handleReelChange
                }
                className="hidden"
              />

            </label>

          </section>

          {/* FEATURED */}

          <section className="border border-[#e5e3de] bg-white p-8">

            <label className="flex cursor-pointer items-center justify-between">

              <div>

                <p className="font-medium">
                  Featured Product
                </p>

                <p className="mt-1 text-sm text-[#777]">
                  Show this product as featured.
                </p>

              </div>

              <input
                type="checkbox"
                checked={featured}
                onChange={(event) =>
                  setFeatured(
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-[#181818]"
              />

            </label>

          </section>

          <button
            type="submit"
            disabled={
              saving ||
              loadingCategories
            }
            className="w-full bg-[#181818] py-5 text-xs font-semibold tracking-[0.18em] text-white disabled:opacity-50"
          >
            {saving
              ? "CREATING PRODUCT..."
              : "CREATE PRODUCT"}
          </button>

        </form>

      </div>

      <style jsx global>{`
        .field-label {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #666;
        }

        .field-input {
          width: 100%;
          border: 1px solid #dcd9d2;
          background: white;
          padding: 14px 16px;
          outline: none;
          font-size: 15px;
        }

        .field-input:focus {
          border-color: #181818;
        }
      `}</style>

    </main>
  );
}