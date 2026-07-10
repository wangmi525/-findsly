"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>By using Findsly, you agree to these Terms of Service. If you do not agree, do not use Findsly.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Service Description</h2>
          <p>Findsly is an AI-powered customer discovery and outreach platform. We help you find contact information from publicly available sources and manage your customer relationships.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Usage Restrictions</h2>
          <p>Contact data discovered through Findsly is licensed for use within the Findsly platform only. You may not export, download, scrape, or use contact data outside of Findsly. Violation results in immediate account termination without refund.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Acceptable Use</h2>
          <p>You agree not to use Findsly for spam, harassment, or any activity violating CAN-SPAM, GDPR, or other applicable laws. You are responsible for complying with all relevant regulations in your jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Subscription & Billing</h2>
          <p>Paid plans renew automatically. You may cancel anytime. Cancellations take effect at the end of the current billing period. No refunds for partial months. Yearly plans may be refunded pro-rata per our refund policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
          <p>Findsly is provided &quot;as is.&quot; We do not guarantee the accuracy of discovered contact information. We are not liable for any damages arising from the use of our service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact</h2>
          <p>support@findsly.vercel.app</p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Findsly</Link>
      </div>
    </div>
  );
}
