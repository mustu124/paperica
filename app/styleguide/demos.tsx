"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ScribbleCircle } from "@/components/ui/scribble-circle";
import { useToast } from "@/components/ui/toast";

export function StepperDemo() {
  const [qty, setQty] = useState(1);
  const [small, setSmall] = useState(2);
  return (
    <div className="flex flex-wrap items-end gap-8">
      <QuantityStepper value={qty} onChange={setQty} max={10} />
      <QuantityStepper value={small} onChange={setSmall} size="sm" label="Qty (small)" />
    </div>
  );
}

export function DrawerDemo() {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => setCartOpen(true)}>
        Open cart drawer
      </Button>
      <Button variant="secondary" onClick={() => setMenuOpen(true)}>
        Open left drawer
      </Button>

      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Your cart">
        {/* Empty-cart state, mirroring the reference layout */}
        <div className="relative isolate flex h-full flex-col items-center justify-center gap-2 text-center">
          <ScribbleCircle className="absolute left-1/2 top-1/2 -z-10 size-80 -translate-x-1/2 -translate-y-1/2" />
          <p className="font-serif text-2xl font-semibold">Your cart is empty</p>
          <p className="text-sm font-medium">Check out what&apos;s new</p>
          <ButtonLink href="/styleguide#buttons" variant="secondary" className="mt-4 min-w-40" onClick={() => setCartOpen(false)}>
            New in
          </ButtonLink>
        </div>
      </Drawer>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <p className="text-sm">Used for the mobile navigation.</p>
      </Drawer>
    </div>
  );
}

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Paper guide">
        <p className="mb-6 text-sm leading-relaxed">
          Modals are native dialogs: focus is trapped inside, Escape or a click on the backdrop
          closes them, and the page behind can&apos;t be scrolled.
        </p>
        <Button onClick={() => setOpen(false)}>Got it</Button>
      </Modal>
    </>
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => toast("Added to your cart", "success")}>
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => toast("Payment could not be completed. Please try again.", "error")}>
        Error toast
      </Button>
      <Button variant="secondary" onClick={() => toast("Your cart has been updated.", "info")}>
        Info toast
      </Button>
    </div>
  );
}
