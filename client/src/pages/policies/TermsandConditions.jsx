import React from "react"
import { Link } from "react-router-dom"

const TermsandConditions = () => {
  const effectiveDate = "October 2, 2025"

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Effective Date: {effectiveDate}
      </p>

      <p className="mb-4 text-muted-foreground">
        Welcome to <span className="font-semibold">Veridate</span>. By accessing or using our
        platform, you agree to these Terms & Conditions. If you don’t agree,
        please don’t use the service. These terms exist to keep the platform
        safe, fair, and useful for everyone.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. What Veridate Does</h2>
      <p className="mb-4 text-muted-foreground">
        Veridate helps people verify whether an individual is trusted and
        authentic. We collect only the minimum info needed for verification. We
        do <span className="font-semibold">not</span> use your data for any illegal or unauthorized purposes.
        Learn more in our{" "}
        <Link to="/privacy-policy" className="text-primary underline">
          Privacy Policy
        </Link>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Eligibility</h2>
      <p className="mb-4 text-muted-foreground">
        You must be legally capable of entering into a binding agreement in your
        jurisdiction to use Veridate. You are responsible for ensuring your use
        complies with local laws.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Your Account</h2>
      <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
        <li>You’re responsible for the security of your account and credentials.</li>
        <li>Provide accurate, current, and complete information during verification.</li>
        <li>Notify us immediately of any unauthorized use of your account.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Acceptable Use</h2>
      <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
        <li>No harassment, impersonation, fraud, or doxxing.</li>
        <li>No scraping, reverse engineering, or exploiting the platform.</li>
        <li>No posting or sharing content that is illegal, harmful, or violates others’ rights.</li>
        <li>Use verification results responsibly and lawfully.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Verification & Accuracy</h2>
      <p className="mb-4 text-muted-foreground">
        We work to keep verification reliable, but we don’t guarantee outcomes
        or accuracy. Verification results are informational and should be used
        with your own judgment. We’re not liable for decisions you make based on
        those results.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. No Legal or Professional Advice</h2>
      <p className="mb-4 text-muted-foreground">
        Veridate is not a law firm or professional service. Content and
        verification outcomes are not legal, financial, or professional advice.
        If you need that, talk to a qualified pro.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Fees (If Applicable)</h2>
      <p className="mb-4 text-muted-foreground">
        Some features may be paid. Prices and features can change. Taxes may
        apply. If we charge, we’ll disclose pricing before any payment.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Intellectual Property</h2>
      <p className="mb-4 text-muted-foreground">
        Veridate, the platform, text, graphics, logos, and related content are
        owned by us or our licensors and protected by IP laws. You get a
        limited, revocable, non-transferable license to use the service for its
        intended purpose.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. User Content</h2>
      <p className="mb-4 text-muted-foreground">
        If you submit content (e.g., info for verification), you represent that
        you have the right to share it and it’s accurate. You grant us a
        limited license to process that content solely to operate and improve
        Veridate, consistent with our Privacy Policy.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Third-Party Links & Services</h2>
      <p className="mb-4 text-muted-foreground">
        We may link to third-party sites or use third-party services for
        verification. We don’t control or endorse those sites/services and
        aren’t responsible for their content or policies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">11. Termination</h2>
      <p className="mb-4 text-muted-foreground">
        We may suspend or terminate access if you violate these terms, create
        risk, or harm the platform or others. You may stop using Veridate at
        any time. Certain sections survive termination (e.g., IP, disclaimers,
        limitation of liability, indemnity).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Disclaimers</h2>
      <p className="mb-4 text-muted-foreground">
        The service is provided “as is” and “as available” without warranties of
        any kind, express or implied, including fitness, merchantability, and
        non-infringement. We don’t guarantee uninterrupted or error-free service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">13. Limitation of Liability</h2>
      <p className="mb-4 text-muted-foreground">
        To the maximum extent permitted by law, Veridate and its affiliates
        won’t be liable for indirect, incidental, special, consequential, or
        punitive damages, or loss of data, profits, or reputation arising from
        your use of the service.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">14. Indemnification</h2>
      <p className="mb-4 text-muted-foreground">
        You agree to indemnify and hold Veridate harmless from claims, damages,
        or costs (including reasonable legal fees) arising from your use of the
        platform, your content, or your violation of these terms or applicable
        law.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">15. Changes to These Terms</h2>
      <p className="mb-4 text-muted-foreground">
        We can update these Terms & Conditions. If we make material changes,
        we’ll update this page and adjust the effective date. Continued use
        after changes means you accept the updated terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">16. Governing Law</h2>
      <p className="mb-4 text-muted-foreground">
        These terms are governed by the laws of your applicable jurisdiction.
        If you need a specific jurisdiction named (e.g., Pakistan, Sindh),
        replace this sentence with that exact reference.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">17. Contact</h2>
      <p className="text-muted-foreground">
        Questions? Hit us at{" "}
        <span className="font-semibold">support@veridate.com</span>.
      </p>

      <div className="mt-10 text-sm">
        <Link href="/privacy-policy" className="text-primary underline">
          View Privacy Policy ↗
        </Link>
      </div>
    </div>
  )
}

export default TermsandConditions
