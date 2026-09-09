"use client";

import { useSheet } from "./sheet-controller";
import { AddTxnSheet } from "./AddTxnSheet";
import { EditTxnSheet } from "./EditTxnSheet";
import { CategoriesSheet } from "./CategoriesSheet";
import { SettleSheet } from "./SettleSheet";
import { InviteSheet } from "./InviteSheet";
import { NewTabSheet } from "./NewTabSheet";
import { EditTabSheet } from "./EditTabSheet";
import { EditProfileSheet } from "./EditProfileSheet";
import { CelebrationOverlay, Confetti } from "@/components/ui/Confetti";

/**
 * Mounts every sheet once at the layout level. Each sheet reads the shared
 * sheet state to decide whether it's open. This keeps sheet UX consistent
 * across routes and means any screen can `useSheet().open(...)`.
 */
export function SheetMount() {
  const { celebrate } = useSheet();
  return (
    <>
      <AddTxnSheet />
      <EditTxnSheet />
      <CategoriesSheet />
      <SettleSheet />
      <InviteSheet />
      <NewTabSheet />
      <EditTabSheet />
      <EditProfileSheet />
      {celebrate && (
        <>
          <Confetti />
          <CelebrationOverlay />
        </>
      )}
    </>
  );
}
