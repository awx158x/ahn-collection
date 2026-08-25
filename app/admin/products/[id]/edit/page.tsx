"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

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
};

type Category = {
  id: string;
  name: string;
  section: string;
};

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Free Size",
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] =
    useState("");

  const [gender, setGender] = useState("women");
  const [categoryId, setCategoryId] =
    useState("");

  const [sizes, setSizes] = useState<string[]>(
    []
  );

  const [featured, setFeatured] =
    useState(false);

  const [active, setActive] =
    useState(true);

  const [image, setImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [existingImage, setExistingImage] =
    useState("");

  const [reel, setReel] =
    useState<File | null>(null);

  const [reelPreview, setReelPreview] =
    useState("");

  const [existingReel, setExistingReel] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==================================================
  // LOAD PRODUCT + CATEGORIES
  // ==================================================

  useEffect(() => {
    async function loadData() {
      if (!productId) {
        setError("Invalid product ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const [
        { data: productData, error: productError },
        { data: categoryData, error: categoryError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active"
          )
          .eq("id", productId)
          .single(),

        supabase
          .from("categories")
          .select("id, name, section")
          .order("section", {
            ascending: true,
          })
          .order("name", {
            ascending: true,
          }),
      ]);

      if (productError || !productData) {
        console.error(
          "Product load error:",
          productError
        );

        setError(
          productError?.message ||
            "Product could not be loaded."
        );

        setLoading(false);
        return;
      }

      if (categoryError) {
        console.error(
          "Category load error:",
          categoryError
        );

        setError(categoryError.message);
        setLoading(false);
        return;
      }

      const loadedProduct =
        productData as Product;

      setProduct(loadedProduct);
      setCategories(categoryData || []);

      setName(loadedProduct.name);

      setPrice(
        String(loadedProduct.price ?? "")
      );

      setStock(
        String(loadedProduct.stock ?? 0)
      );

      setDescription(
        loadedProduct.description || ""
      );

      const loadedGender =
        (
          loadedProduct.section ||
          "women"
        ).toLowerCase();

      setGender(loadedGender);

      setCategoryId(
        loadedProduct.category_id || ""
      );

      setSizes(
        Array.isArray(loadedProduct.sizes)
          ? loadedProduct.sizes
          : []
      );

      setFeatured(
        Boolean(loadedProduct.featured)
      );

      setActive(
        loadedProduct.active !== false
      );

      setExistingImage(
        loadedProduct.images?.[0] || ""
      );

      setExistingReel(
        loadedProduct.reel_url || ""
      );

      setLoading(false);
    }

    loadData();
  }, [productId]);

  // ==================================================
  // SECTION CHANGE
  // ==================================================

  useEffect(() => {
    if (!categories.length) return;

    const currentCategoryStillValid =
      categories.some(
        (category) =>
          category.id === categoryId &&
          category.section.toLowerCase() ===
            gender
      );

    if (!currentCategoryStillValid) {
      const firstCategory =
        categories.find(
          (category) =>
            category.section.toLowerCase() ===
            gender
        );

      setCategoryId(
        firstCategory?.id || ""
      );
    }
  }, [
    gender,
    categories,
    categoryId,
  ]);

  // ==================================================
  // IMAGE
  // ==================================================

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

    setError("");
    setSuccess("");
  }

  // ==================================================
  // REEL
  // ==================================================

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

    setError("");
    setSuccess("");
  }

  // ==================================================
  // SIZE
  // ==================================================

  function toggleSize(size: string) {
    setSizes((current) =>
      current.includes(size)
        ? current.filter(
            (item) => item !== size
          )
        : [...current, size]
    );
  }

  // ==================================================
  // UPLOAD
  // ==================================================

  async function uploadFile(
    file: File,
    bucket: string
  ) {
    const safeName = file.name
      .replace(
        /[^a-zA-Z0-9.-]/g,
        "-"
      )
      .toLowerCase();

    const filePath = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeName}`;

    const { error: uploadError } =
      await supabase.storage
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

  // ==================================================
  // SAVE
  // ==================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!productId) {
      setError("Invalid product ID.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const cleanName = name.trim();

      const numericPrice =
        Number(price);

      const numericStock =
        Number(stock);

      if (!cleanName) {
        throw new Error(
          "Product name is required."
        );
      }

      if (
        Number.isNaN(numericPrice) ||
        numericPrice < 0
      ) {
        throw new Error(
          "Please enter a valid price."
        );
      }

      if (
        Number.isNaN(numericStock) ||
        numericStock < 0
      ) {
        throw new Error(
          "Please enter valid stock."
        );
      }

      if (!categoryId) {
        throw new Error(
          "Please select a category."
        );
      }

      let imageUrls =
        product?.images || [];

      let reelUrl =
        product?.reel_url || null;

      // NEW IMAGE

      if (image) {
        setSuccess(
          "Uploading new product image..."
        );

        const uploadedImage =
          await uploadFile(
            image,
            "product-images"
          );

        imageUrls = [
          uploadedImage,
        ];
      }

      // NEW REEL

      if (reel) {
        setSuccess(
          "Uploading new product reel..."
        );

        reelUrl =
          await uploadFile(
            reel,
            "product-reels"
          );
      }

      // UPDATE PRODUCT

      setSuccess(
        "Saving product changes..."
      );

      const {
        data,
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          name: cleanName,
          description:
            description.trim(),
          price: numericPrice,
          category_id:
            categoryId,
          section: gender,
          images: imageUrls,
          reel_url: reelUrl,
          sizes,
          stock: numericStock,
          featured,
          active,
        })
        .eq("id", productId)
        .select()
        .single();

      if (updateError) {
        console.error(
          "Product update error:",
          updateError
        );

        throw new Error(
          updateError.message
        );
      }

      if (data) {
        setProduct(
          data as Product
        );

        setExistingImage(
          data.images?.[0] || ""
        );

        setExistingReel(
          data.reel_url || ""
        );

        setImage(null);
        setReel(null);

        setImagePreview("");
        setReelPreview("");
      }

      setSuccess(
        "Product updated successfully."
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1000);

    } catch (err) {
      console.error(err);

      setSuccess("");

      setError(
        err instanceof Error
          ? err.message
          : "Could not update product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // DELETE
  // ==================================================

  async function deleteProduct() {
    if (!product) return;

    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This cannot be undone.`
      );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      router.push("/admin");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete product."
      );

      setSaving(false);
    }
  }

  const visibleCategories =
    categories.filter(
      (category) =>
        category.section.toLowerCase() ===
        gender
    );

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f3] text-[#29251f]">

        <div className="text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a42]">
            AHN COLLECTION
          </p>

          <h1 className="mt-5 font-[var(--font-cormorant)] text-4xl">
            Loading product...
          </h1>

        </div>

      </main>
    );
  }

  // ==================================================
  // PRODUCT NOT FOUND
  // ==================================================

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f3] px-6">

        <div className="text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a42]">
            AHN COLLECTION
          </p>

          <h1 className="mt-5 font-[var(--font-cormorant)] text-5xl">
            Product Not Found
          </h1>

          <p className="mt-4 max-w-lg text-sm text-[#81786a]">
            {error ||
              "The product could not be loaded."}
          </p>

          <Link
            href="/admin"
            className="mt-8 inline-block bg-[#b28a42] px-8 py-4 font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-white"
          >
            BACK TO ADMIN
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f3] text-[#29251f]">

      {/* HEADER */}

      <header className="border-b border-[#dfd0b5] bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">

          <div>

            <p className="text-[11px] uppercase tracking-[0.4em] text-[#b28a42]">
              AHN
            </p>

            <h1 className="mt-1 text-2xl tracking-[0.18em]">
              COLLECTION
            </h1>

          </div>

          <Link
            href="/admin"
            className="border border-[#c9a96e]/50 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
          >
            ← BACK TO ADMIN
          </Link>

        </div>

      </header>

      {/* PAGE */}

      <div className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-10">

          <p className="text-xs uppercase tracking-[0.45em] text-[#b28a42]">
            INVENTORY
          </p>

          <h2 className="mt-3 text-4xl font-light tracking-wide">
            Edit Product
          </h2>

          <p className="mt-3 text-sm text-[#81786a]">
            Update your AHN Collection product.
          </p>

        </div>

        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-8 border border-[#d9c49a] bg-[#fffaf0] px-5 py-4 text-sm text-[#80652f]">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >

          <div className="space-y-8">

            {/* PRODUCT INFO */}

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">

                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  01
                </p>

                <h3 className="mt-2 text-xl">
                  Product Information
                </h3>

              </div>

              <div className="grid gap-6 md:grid-cols-2">

                <div className="md:col-span-2">

                  <label className="label">
                    PRODUCT NAME
                  </label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    className="input"
                    required
                  />

                </div>

                <div>

                  <label className="label">
                    PRICE (PKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value
                      )
                    }
                    className="input"
                    required
                  />

                </div>

                <div>

                  <label className="label">
                    STOCK
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) =>
                      setStock(
                        e.target.value
                      )
                    }
                    className="input"
                    required
                  />

                </div>

                <div>

                  <label className="label">
                    COLLECTION
                  </label>

                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(
                        e.target.value
                      )
                    }
                    className="input"
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

                  <label className="label">
                    CATEGORY
                  </label>

                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value
                      )
                    }
                    className="input"
                    required
                  >

                    {visibleCategories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

            </section>

            {/* DESCRIPTION */}

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">

                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  02
                </p>

                <h3 className="mt-2 text-xl">
                  Description
                </h3>

              </div>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={7}
                className="input resize-none"
                placeholder="Describe the product..."
              />

            </section>

            {/* SIZES */}

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">

                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  03
                </p>

                <h3 className="mt-2 text-xl">
                  Available Sizes
                </h3>

              </div>

              <div className="flex flex-wrap gap-3">

                {ALL_SIZES.map(
                  (size) => {

                    const selected =
                      sizes.includes(
                        size
                      );

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          toggleSize(
                            size
                          )
                        }
                        className={`border px-6 py-3 text-xs tracking-wider transition ${
                          selected
                            ? "border-[#b28a42] bg-[#b28a42] text-white"
                            : "border-[#d9cdb9] hover:border-[#b28a42]"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  }
                )}

              </div>

            </section>

            {/* IMAGE */}

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">

                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  04
                </p>

                <h3 className="mt-2 text-xl">
                  Product Photography
                </h3>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#81786a]">
                    CURRENT IMAGE
                  </p>

                  <div className="overflow-hidden border border-[#d9cdb9] bg-[#eee9df]">

                    {imagePreview ||
                    existingImage ? (

                      <img
                        src={
                          imagePreview ||
                          existingImage
                        }
                        alt={product.name}
                        className="aspect-[3/4] w-full object-cover"
                      />

                    ) : (

                      <div className="flex aspect-[3/4] items-center justify-center text-xs text-[#81786a]">
                        NO IMAGE
                      </div>

                    )}

                  </div>

                </div>

                <div>

                  <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#81786a]">
                    REPLACE IMAGE
                  </p>

                  <label className="flex aspect-[3/4] cursor-pointer items-center justify-center border border-dashed border-[#cbb99b] bg-[#fffdf9] text-center hover:border-[#b28a42]">

                    <div className="px-6">

                      {imagePreview ? (

                        <img
                          src={imagePreview}
                          alt="New preview"
                          className="max-h-[350px] max-w-full object-contain"
                        />

                      ) : (

                        <>
                          <div className="text-4xl text-[#b28a42]">
                            +
                          </div>

                          <p className="mt-3 text-sm">
                            Choose New Image
                          </p>

                          <p className="mt-2 text-xs text-[#81786a]">
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

                </div>

              </div>

            </section>

            {/* REEL */}

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">

                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  05
                </p>

                <h3 className="mt-2 text-xl">
                  Collection Reel
                </h3>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#81786a]">
                    CURRENT REEL
                  </p>

                  <div className="overflow-hidden border border-[#d9cdb9] bg-black">

                    {existingReel ? (

                      <video
                        src={
                          existingReel
                        }
                        controls
                        muted
                        playsInline
                        className="aspect-[9/16] w-full object-cover"
                      />

                    ) : (

                      <div className="flex aspect-[9/16] items-center justify-center bg-[#eee9df] text-xs text-[#81786a]">
                        NO REEL
                      </div>

                    )}

                  </div>

                </div>

                <div>

                  <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#81786a]">
                    REPLACE REEL
                  </p>

                  <label className="flex aspect-[9/16] cursor-pointer items-center justify-center border border-dashed border-[#cbb99b] bg-[#fffdf9] text-center hover:border-[#b28a42]">

                    <div className="px-6">

                      {reelPreview ? (

                        <video
                          src={
                            reelPreview
                          }
                          controls
                          className="max-h-[400px] max-w-full object-contain"
                        />

                      ) : (

                        <>
                          <div className="text-4xl text-[#b28a42]">
                            +
                          </div>

                          <p className="mt-3 text-sm">
                            Choose New Reel
                          </p>

                          <p className="mt-2 text-xs text-[#81786a]">
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

                </div>

              </div>

            </section>

          </div>

          {/* RIGHT */}

          <aside className="space-y-8">

            <section className="sticky top-6 border border-[#dfd0b5] bg-white p-7">

              <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                PRODUCT SETTINGS
              </p>

              <h3 className="mt-3 text-xl">
                Publishing
              </h3>

              <div className="my-7 h-px bg-[#e5dccd]" />

              <label className="flex cursor-pointer items-center justify-between border-b border-[#eee7dc] pb-5">

                <div>

                  <p className="text-sm">
                    Featured Product
                  </p>

                  <p className="mt-1 text-xs text-[#8c8172]">
                    Show in featured collections
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) =>
                    setFeatured(
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 accent-[#b28a42]"
                />

              </label>

              <label className="mt-5 flex cursor-pointer items-center justify-between border-b border-[#eee7dc] pb-5">

                <div>

                  <p className="text-sm">
                    Published
                  </p>

                  <p className="mt-1 text-xs text-[#8c8172]">
                    Make this product visible on the store
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    setActive(
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 accent-[#b28a42]"
                />

              </label>

              <div className="mt-6 border border-[#eee7dc] bg-[#fffdf9] p-5">

                <p className="text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  COLLECTION
                </p>

                <p className="mt-2 text-sm capitalize">
                  {gender}
                </p>

                <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  CATEGORY
                </p>

                <p className="mt-2 text-sm">
                  {visibleCategories.find(
                    (category) =>
                      category.id ===
                      categoryId
                  )?.name ||
                    "Select category"}
                </p>

                <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  PRICE
                </p>

                <p className="mt-2 text-lg text-[#b28a45]">
                  Rs.{" "}
                  {Number(
                    price || 0
                  ).toLocaleString(
                    "en-PK"
                  )}
                </p>

                <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  STOCK
                </p>

                <p className="mt-2 text-sm">
                  {stock}
                </p>

              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-7 w-full bg-[#b28a42] px-6 py-5 text-xs font-medium uppercase tracking-[0.25em] text-white transition hover:bg-[#96702f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "SAVING..."
                  : "SAVE CHANGES"}
              </button>

              <button
                type="button"
                onClick={deleteProduct}
                disabled={saving}
                className="mt-3 w-full border border-red-200 px-6 py-4 text-xs uppercase tracking-[0.2em] text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                DELETE PRODUCT
              </button>

            </section>

          </aside>

        </form>

      </div>

      <style jsx global>{`

        .label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-cinzel);
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #756c60;
        }

        .input {
          width: 100%;
          border: 1px solid rgba(201, 169, 110, 0.4);
          background: #fcfaf6;
          padding: 14px 15px;
          outline: none;
          font-family: var(--font-cormorant);
          font-size: 18px;
          color: #30291f;
          transition: border-color 0.2s;
        }

        .input:focus {
          border-color: #b28a45;
        }

      `}</style>

    </main>
  );
}