import React from "react"

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-muted-foreground">
        Welcome to <span className="font-semibold">Veridate</span>. Your privacy
        matters to us. This Privacy Policy explains how we collect, use, and
        protect your information when you use our platform.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
      <p className="mb-4 text-muted-foreground">
        We only collect the information that is necessary to verify your
        identity. This may include basic personal details such as your name,
        contact information, or other verification data you choose to provide.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Purpose of Collection</h2>
      <p className="mb-4 text-muted-foreground">
        The information you provide is strictly used for verification purposes.
        Our goal is to confirm whether a person is truly trusted and authentic
        on the platform. We do not use your information for any illegal,
        unauthorized, or harmful activities.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. How We Use Your Information</h2>
      <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
        <li>To verify your identity for trust validation</li>
        <li>To maintain the security and integrity of the Veridate platform</li>
        <li>To improve user experience and platform reliability</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Protection</h2>
      <p className="mb-4 text-muted-foreground">
        We take reasonable security measures to protect your information against
        unauthorized access, disclosure, or misuse. Your personal data is never
        sold or shared with third parties for marketing purposes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. User Rights</h2>
      <p className="mb-4 text-muted-foreground">
        You have the right to request access to, correction of, or deletion of
        your personal information at any time. If you wish to exercise these
        rights, please contact us directly.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Updates to this Policy</h2>
      <p className="mb-4 text-muted-foreground">
        Veridate may update this Privacy Policy from time to time. Any changes
        will be reflected on this page with the revised date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact Us</h2>
      <p className="text-muted-foreground">
        If you have any questions or concerns about this Privacy Policy, please
        contact us at: <span className="font-semibold">support@veridate.com</span>
      </p>
    </div>
  )
}

export default PrivacyPolicy
