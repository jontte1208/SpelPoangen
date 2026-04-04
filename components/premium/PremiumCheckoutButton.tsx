"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  isPremium: boolean;
}

export function PremiumCheckoutButton({ isPremium }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const endpoint = isPremium ? "/api/stripe/portal" : "/api/stripe/checkout";
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleClick}
      disabled={loading}
      className="w-full"
    >
      {loading
        ? "Laddar..."
        : isPremium
        ? "Hantera prenumeration"
        : "Bli Premium — 49 kr/mån"}
    </Button>
  );
}
