"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import type { Id } from "@/convex/_generated/dataModel";
import { trackAddToCart } from "@/lib/analytics/ga4/web";
import { trackMixpanel, MixpanelEvents } from "@/lib/analytics";

type AddToCartButtonProps = {
  productId: Id<"products">;
  maxStock: number;
  disabled?: boolean;
  productName?: string;
  priceCents?: number;
  currency?: string;
  merchantId?: string;
  merchantSlug?: string;
};

export default function AddToCartButton({
  productId,
  maxStock,
  disabled,
  productName,
  priceCents,
  currency = "zar",
  merchantId,
  merchantSlug,
}: AddToCartButtonProps) {
  const hasMounted = useCartStore((s) => s.hasMounted);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const [pending, setPending] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const existing = hasMounted
    ? items.find((it) => it.productId === productId)
    : undefined;
  const currentQty = existing?.quantity ?? 0;

  const fireAddToCart = () => {
    if (!productName || priceCents === undefined) return;
    const price = priceCents / 100;
    const item = {
      item_id: productId,
      item_name: productName,
      item_brand: merchantSlug,
      price,
      quantity: 1,
    };
    trackAddToCart({
      items: [item],
      persona: "consumer",
      value: price,
      currency: currency.toUpperCase(),
      userId: userId ?? undefined,
      emailAddress: email,
      merchantId,
      merchantSlug,
      contentType: "product",
      orderKind: "product",
    });
    void trackMixpanel(MixpanelEvents.AddToCart, {
      item_id: productId,
      item_name: productName,
      value: price,
      currency: currency.toUpperCase(),
      merchant_id: merchantId,
      merchant_slug: merchantSlug,
      persona: "consumer",
      content_type: "product",
    });
  };

  if (!hasMounted) {
    return (
      <Button disabled size="lg">
        <ShoppingCart className="size-4" />
        Add to cart
      </Button>
    );
  }

  if (currentQty === 0) {
    return (
      <Button
        size="lg"
        disabled={disabled || pending}
        onClick={() => {
          setPending(true);
          try {
            addItem(productId, 1, maxStock);
            fireAddToCart();
            toast.success("Added to cart");
          } catch (err) {
            console.error(err);
            toast.error("Could not add to cart");
          } finally {
            setPending(false);
          }
        }}
      >
        <ShoppingCart className="size-4" />
        Add to cart
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background p-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Decrease quantity"
        onClick={() => setQuantity(productId, currentQty - 1, maxStock)}
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums">
        {currentQty}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Increase quantity"
        disabled={currentQty >= maxStock}
        onClick={() => {
          setQuantity(productId, currentQty + 1, maxStock);
          fireAddToCart();
        }}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
