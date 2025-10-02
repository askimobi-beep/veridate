import React from "react"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="w-full border-t bg-muted/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 py-6 gap-4">
        {/* Brand / Copyright */}
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Veridate. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/privacy-policy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link
            to="/terms-and-conditions"
            className="hover:text-primary transition-colors"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
