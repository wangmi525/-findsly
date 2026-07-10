"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Data Collection</h2>
          <p>Findsly collects information you provide when registering (email, name), and data from publicly available sources through our search engine (business names, public contact information).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Data Usage</h2>
          <p>Your data is used solely to provide the Findsly service — searching for contacts, managing your CRM, and sending outreach messages. We do not sell, rent, or share your contact data with third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Export</h2>
          <p>Contacts discovered through Findsly&apos;s search engine are platform-exclusive and cannot be exported or downloaded. This is a core security feature to protect the integrity of our service. Contacts you manually uploaded via CSV can be exported by contacting support.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Retention</h2>
          <p>Your data is retained as long as your account is active. If you cancel your subscription, your contacts remain in read-only mode for 30 days, after which all data is permanently deleted.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
          <p>Findsly uses essential cookies for authentication (Supabase session tokens) and preferences. We do not use tracking cookies for advertising. You can disable cookies in your browser settings, but this may prevent you from using Findsly.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Third-Party Services</h2>
          <div className="space-y-2 mt-2">
            <p><strong>Supabase (auth + database):</strong> Session cookies, database storage</p>
            <p><strong>Stripe (payments):</strong> Payment processing, subscription management</p>
            <p><strong>Groq (AI):</strong> Message generation requests</p>
            <p><strong>Resend (email):</strong> Email delivery and tracking</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
          <p>Under GDPR and similar regulations, you have the right to access, correct, or delete your personal data. Contact us at support@findsly.vercel.app for any data requests.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
          <p>For privacy questions, contact support@findsly.vercel.app.</p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Findsly</Link>
      </div>
    </div>
  );
}
