"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Send, BarChart3, Globe, Zap, Shield, ArrowRight, Menu, X, ChevronDown } from "lucide-react";

const plans = [
  {
    name: "Free", price: 0, yearly: 0, search: "50/mo", features: ["50 contacts/mo", "20 emails/mo", "Email + WhatsApp + Telegram", "Basic CRM", "5 AI-generated messages", "Email warmup"],
    color: "border-gray-200", btn: "bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900"
  },
  {
    name: "Starter", price: 29, yearly: 23, search: "500/mo", features: ["500 contacts/mo", "500 emails/mo", "200 WhatsApp & Telegram msgs", "AI email generation", "Email tracking & analytics", "5 automation sequences", "CSV import", "Email templates"],
    color: "border-gray-200", btn: "bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900"
  },
  {
    name: "Pro", price: 79, yearly: 63, search: "2,000/mo", popular: true, features: ["2,000 contacts/mo", "2,000 emails/mo", "1,000 WhatsApp & Telegram msgs", "Unlimited AI generation", "Full CRM + Pipeline", "Advanced analytics", "Unlimited sequences", "Priority support", "A/B testing"],
    color: "border-blue-500 ring-2 ring-blue-500", btn: "bg-blue-600 hover:bg-blue-500 text-white"
  },
  {
    name: "Growth", price: 199, yearly: 159, search: "Unlimited", features: ["Unlimited contacts", "5,000 emails/mo", "5,000 WhatsApp & Telegram msgs", "Team collaboration (10 seats)", "Full pipeline & CRM", "API access", "Dedicated support"],
    color: "border-purple-200", btn: "bg-purple-600 hover:bg-purple-500 text-white"
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Findsly
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <Link href="/auth" className="text-sm font-medium text-blue-600 hover:text-blue-500">Log in</Link>
            <Link href="/auth" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Get Started</Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Zap className="h-4 w-4" /> Email + WhatsApp + Telegram
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            All-in-One Outreach<br />with AI Power
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Send personalized messages via Email, WhatsApp, and Telegram from one dashboard.
            AI writes your emails, tracks opens & clicks, and manages follow-ups automatically.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth" className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20">
              Start Free - No Credit Card
            </Link>
            <a href="#how-it-works" className="rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-gray-300">
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Trusted by 2,000+ businesses worldwide</p>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">All-in-One Customer Growth Platform</h2>
            <p className="mt-4 text-lg text-gray-500">Replace 4 tools with 1. Discovery, CRM, Pipeline, and Outreach -all in Findsly.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Send, title: "Email + WhatsApp + Telegram", desc: "Send personalized messages across 3 channels from one dashboard. AI writes your emails, tracks opens and clicks.", color: "text-blue-600 bg-blue-50" },
              { icon: Zap, title: "AI-Powered Everything", desc: "AI generates personalized emails, scores leads, predicts conversions, and automates follow-up sequences.", color: "text-green-600 bg-green-50" },
              { icon: BarChart3, title: "CRM + Pipeline + Analytics", desc: "Visual sales pipeline, contact management, revenue tracking, open/click analytics, and automated workflows.", color: "text-purple-600 bg-purple-50" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-500">From idea to outreach in 3 simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Describe Your Customer", desc: "Tell us who you're looking for. 'Yoga studio owners in California' or 'E-commerce CEOs in Europe'. AI handles the rest.", icon: Globe },
              { step: "2", title: "AI Finds Them Everywhere", desc: "Our engine searches 8 sources simultaneously -Google Maps, LinkedIn, social media, and more -to find complete contact info.", icon: Search },
              { step: "3", title: "Reach Out Instantly", desc: "AI generates personalized messages for each channel. Send via email, WhatsApp, Telegram -all from one dashboard.", icon: Send },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">{s.step}</div>
                {i < 2 && <div className="absolute right-0 top-8 hidden h-0.5 w-1/3 bg-blue-200 md:block" />}
                <h3 className="mb-2 text-xl font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you need more.</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-gray-100 p-1">
              <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-2 text-sm font-medium ${!yearly ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Monthly</button>
              <button onClick={() => setYearly(true)} className={`rounded-full px-4 py-2 text-sm font-medium ${yearly ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Yearly (Save 20%)</button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {plans.map((p, i) => (
              <div key={i} className={`relative rounded-2xl border bg-white p-6 ${p.color} ${p.popular ? "scale-105 shadow-xl" : "shadow-sm"}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white">Most Popular</div>}
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold text-gray-900">${yearly ? p.yearly : p.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-900">{p.search} searches</li>
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${p.btn}`}>
                  {p.name === "Starter" ? "Start Free" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          {[
            { q: "How does Findsly find contact information?", a: "Findsly searches 8 public data sources -including Google Maps, LinkedIn public profiles, Instagram, YouTube, Twitter/X, Reddit, TikTok, and Facebook Pages -to find publicly available contact information. We then extract email addresses from business websites and verify them." },
            { q: "Can I export or download my contacts?", a: "No. Findsly contacts are platform-exclusive for security and compliance. You can use them within the platform for outreach, CRM, and pipeline management, but data cannot be exported. Contacts you manually uploaded via CSV can be exported." },
            { q: "Is WhatsApp/Instagram cold outreach allowed?", a: "WhatsApp supports business-initiated template messages through Meta's official Cloud API. Instagram supports pre-filled DM links. We recommend always following platform-specific policies and anti-spam laws." },
            { q: "What happens to my data if I cancel?", a: "Your contacts remain accessible in read-only mode for 30 days after cancellation. After 30 days, all data is permanently deleted. You can reactivate your subscription anytime within those 30 days to restore full access." },
          ].map((faq, i) => (
            <div key={i} className="mb-4 rounded-xl border border-gray-200 bg-white">
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between px-6 py-4 text-left">
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="h-4 w-4" /> Findsly 2026
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-600">Privacy</a>
              <a href="#" className="hover:text-gray-600">Terms</a>
              <a href="#" className="hover:text-gray-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


