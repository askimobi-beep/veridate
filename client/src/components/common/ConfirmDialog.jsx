// components/common/ConfirmDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Save changes?",
  description = "We’ll save your updates. Make sure everything looks right.",
  confirmText = "Yes, save it",
  cancelText = "Cancel",
  blockOutside = false, // set true to prevent click-outside close
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden bg-white/90"
        // prevent outside-click close if desired
        onInteractOutside={(e) => {
          if (blockOutside) e.preventDefault();
        }}
      >
        <div className="p-6">
          <DialogHeader className="mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <DialogTitle className="text-lg sm:text-xl text-gray-900">
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-sm text-gray-600">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" type="button" className="min-w-[96px]">
                {cancelText}
              </Button>
            </DialogClose>
            <Button
              className="min-w-[120px] bg-orange-600 text-white hover:bg-orange-700"
              onClick={onConfirm}
              type="button"
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
