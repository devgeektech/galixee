"use client";
import React from "react";

function MainComponent() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="flex justify-between items-center p-6">
        <a href="/" className="text-2xl font-bold text-white">
          Galixee
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        <div className="space-y-8 text-gray-300">
          <div className="text-center mb-8">
            <p className="text-lg">Effective Date: July 11, 2025</p>
            <p className="mt-4">
              Welcome to Galixee.com Corp ("we," "us," or "our"). Your privacy
              is important to us. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our app
              and services ("Services"). By using our Services, you agree to the
              terms of this Privacy Policy.
            </p>
          </div>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. Information We Collect
            </h2>
            <p className="mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Personal Information:</strong> Name, email address, date
                of birth, contact details, and demographic information.
              </li>
              <li>
                <strong>User Content:</strong> Blog posts, photos, videos,
                documents, and other content you upload or create within the
                app.
              </li>
              <li>
                <strong>Health Information:</strong> Any health-related data you
                choose to upload or store.
              </li>
              <li>
                <strong>Digital Vault Content:</strong> Documents and files you
                upload to your secure digital vault.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you use the
                app, including device information, IP address, browser type, and
                access times.
              </li>
              <li>
                <strong>Cookies and Tracking Technologies:</strong> We use
                cookies and similar technologies to enhance your experience and
                analyze usage patterns.
              </li>
            </ul>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. How We Use Your Information
            </h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain our Services.</li>
              <li>Personalize your experience and deliver relevant content.</li>
              <li>Securely store your documents and sensitive information.</li>
              <li>
                Communicate with you about updates, security alerts, and
                support.
              </li>
              <li>Analyze usage and improve our Services.</li>
              <li>Comply with legal obligations and protect our rights.</li>
            </ul>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. How We Share Your Information
            </h2>
            <p className="mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>With Service Providers:</strong> Trusted third parties
                who assist us in operating our Services, subject to
                confidentiality agreements.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law,
                regulation, or legal process.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, sale, or transfer of assets.
              </li>
              <li>
                <strong>With Your Consent:</strong> When you provide explicit
                consent for sharing specific information.
              </li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> sell your personal information to third
              parties.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              information, including encryption, secure servers, and access
              controls. However, no method of transmission or storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Your Rights and Choices
            </h2>
            <p className="mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, correct, or delete your personal information.</li>
              <li>
                Withdraw consent for processing your health or sensitive data.
              </li>
              <li>Object to or restrict certain types of data processing.</li>
              <li>Request a copy of your data in a portable format.</li>
            </ul>
            <p className="mt-4">
              To exercise your rights, please contact us at{" "}
              <a
                href="mailto:GalixeePP@gmail.com"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                GalixeePP@gmail.com
              </a>
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Cookies and Tracking Technologies
            </h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences and settings.</li>
              <li>Analyze app usage and performance.</li>
              <li>Provide personalized content.</li>
            </ul>
            <p className="mt-4">
              You can manage your cookie preferences in your device or browser
              settings.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              7. Data Retention
            </h2>
            <p>
              We retain your information only as long as necessary to fulfill
              the purposes described in this policy, unless a longer retention
              period is required by law. You may request deletion of your
              account and data at any time.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              8. Data Handling After Account Deletion
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  8.1 Data Retention and Deletion
                </h3>
                <p>
                  If your account is deleted due to a violation of our content
                  policies, we will retain your personal data only as long as
                  necessary to comply with legal obligations, resolve disputes,
                  and enforce our agreements. We do not retain personal data
                  indefinitely for banned accounts. Data will be securely
                  deleted in accordance with applicable data protection laws,
                  such as the General Data Protection Regulation (GDPR).
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  8.2 Access and Appeals
                </h3>
                <p>
                  If your account is terminated, you may request access to your
                  personal data and submit an appeal as described in our Terms
                  of Service. During the appeals process, you may be granted
                  temporary access to your data for the purpose of review and
                  appeal submission. If your appeal is successful, your account
                  and data may be restored. If your appeal is denied, your data
                  will be deleted in accordance with our retention policy.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  8.3 User Reporting and Moderation Data
                </h3>
                <p>
                  Reports submitted by users and moderation actions taken are
                  logged for audit and compliance purposes. This information is
                  handled securely and is only accessible to authorized
                  personnel involved in content moderation and appeals review.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">8.4 Summary</h3>
                <p>
                  By using our app, you acknowledge and agree to these terms
                  regarding inappropriate content, enforcement actions, and your
                  rights to appeal. Our goal is to foster a safe, respectful,
                  and legally compliant community for all users.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              9. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your data in accordance with applicable laws.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              10. Children's Privacy
            </h2>
            <p>
              Our Services are not intended for children under 13. We do not
              knowingly collect personal information from children under 13. If
              you believe we have collected such information, please contact us
              immediately.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by posting the new policy in the
              app or by email. Your continued use of the Services after changes
              are made constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              12. Contact Us
            </h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or
              your data, please contact us at:{" "}
              <a
                href="mailto:GalixeePP@gmail.com"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                GalixeePP@gmail.com
              </a>
            </p>
          </section>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mt-12">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="agree-terms" className="text-gray-300">
                I have read and agree to the Privacy Policy
              </label>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/account/signup"
                className={`inline-block px-8 py-3 rounded-full text-lg font-semibold transition-colors ${
                  agreed
                    ? "bg-[#6366F1] hover:bg-[#4F46E5] cursor-pointer"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
                onClick={(e) => !agreed && e.preventDefault()}
              >
                Continue to Sign Up
              </a>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-12">
            <p>Last updated: July 11, 2025</p>
            <p className="mt-2">
              For questions about this privacy policy, please contact{" "}
              <a
                href="mailto:GalixeePP@gmail.com"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                GalixeePP@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;