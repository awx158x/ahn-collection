"use client";

import Link from "next/link";
import { Suspense, FormEvent, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath =
    searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!email.trim()) {
        throw new Error(
          "Please enter your admin email."
        );
      }

      if (!password) {
        throw new Error(
          "Please enter your admin password."
        );
      }

      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
          cache: "no-store",
        }
      );

      const rawText = await response.text();

      let data: {
        success?: boolean;
        error?: string;
      } = {};

      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            "The login server returned an invalid response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Login failed. Server returned ${response.status}.`
        );
      }

      if (!data.success) {
        throw new Error(
          data.error ||
            "Login was not successful."
        );
      }

      router.replace(
        nextPath.startsWith("/admin")
          ? nextPath
          : "/admin"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleLogin}
        className="mt-7 space-y-5"
      >
        <div>
          <label className="mb-2 block font-[var(--font-cinzel)] text-[9px] tracking-[0.18em] text-[#756c60]">
            ADMIN EMAIL
          </label>

          <input
            required
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="admin@example.com"
            autoComplete="username"
            className="w-full border border-[#d9cdb9] bg-[#fcfaf6] px-4 py-4 text-sm text-[#30291f] outline-none transition focus:border-[#b28a45]"
          />
        </div>

        <div>
          <label className="mb-2 block font-[var(--font-cinzel)] text-[9px] tracking-[0.18em] text-[#756c60]">
            ADMIN PASSWORD
          </label>

          <input
            required
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Your admin password"
            autoComplete="current-password"
            className="w-full border border-[#d9cdb9] bg-[#fcfaf6] px-4 py-4 text-sm text-[#30291f] outline-none transition focus:border-[#b28a45]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full bg-[#b28a45] py-5 font-[var(--font-cinzel)] text-[10px] tracking-[0.25em] text-white transition hover:bg-[#967238] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "SIGNING IN..."
            : "SIGN IN"}
        </button>
      </form>
    </>
  );
}

function LoginFallback() {
  return (
    <div className="mt-7 h-40 animate-pulse rounded-sm bg-[#f4f0e8]" />
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-6">

      <div className="w-full max-w-md">

        <div className="mb-10 text-center">

          <p className="font-[var(--font-cinzel)] text-[10px] tracking-[0.45em] text-[#b28a45]">
            AHN
          </p>

          <h1 className="mt-2 font-[var(--font-cinzel)] text-3xl tracking-[0.25em] text-[#30291f]">
            COLLECTION
          </h1>

          <div className="mx-auto mt-4 h-px w-14 bg-[#c9a96e]" />

          <p className="mt-4 font-[var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#81786a]">
            OWNER ADMINISTRATION
          </p>

        </div>

        <div className="border border-[#c9a96e]/40 bg-[#fffdf9] p-8 shadow-sm">

          <h2 className="font-[var(--font-cormorant)] text-4xl text-[#30291f]">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm text-[#81786a]">
            Sign in to manage your AHN Collection.
          </p>

          <Suspense fallback={<LoginFallback />}>
            <LoginForm />
          </Suspense>

        </div>

        <Link
          href="/"
          className="mt-6 block text-center font-[var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#8c7044] transition hover:text-[#b28a45]"
        >
          ← BACK TO WEBSITE
        </Link>

      </div>

    </main>
  );
}