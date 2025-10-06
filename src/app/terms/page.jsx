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
        <h1 className="text-4xl font-bold mb-8 text-center">
          Terms of Service
        </h1>
        <div className="space-y-8 text-gray-300">
          <div className="text-center mb-8">
            <p className="text-lg">Effective Date: July 11, 2025</p>
            <p className="mt-4">
              Welcome to Galixee.com Corp ("we," "us," or "our"). By creating an
              account or using our app and services ("Services"), you ("User,"
              "you," or "your") agree to these Terms of Service ("Terms").
              Please read them carefully.
            </p>
          </div>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. Acceptance of Terms
            </h2>
            <div className="space-y-4">
              <p>
                By accessing or using our Services, you acknowledge that you
                have read, understood, and agree to be bound by these Terms and
                our Privacy Policy. If you do not agree, do not use our
                Services.
              </p>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  1.1 Definition of "Lifetime"
                </h3>
                <p>
                  Where the term "Lifetime" is used in relation to any of our
                  Services, products, or features, it is defined as the duration
                  of Galixee.com Corp's corporate existence or the account
                  holder's life, whichever is less. This definition applies to
                  all references to "Lifetime" throughout these Terms and in
                  relation to any of our offerings.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. Eligibility
            </h2>
            <p>
              You must be at least 18 years old or the age of majority in your
              jurisdiction to use our Services. By using the app, you represent
              and warrant that you meet these requirements.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. Notify us immediately of any unauthorized use or security
              breach.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. User-Generated Content
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">4.1 Definition</h3>
                <p>
                  User-Generated Content ("UGC") includes any text, images,
                  videos, documents, health information, demographic data, or
                  other materials you upload, post, or share through the app.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  4.2 Ownership and License
                </h3>
                <p>
                  You retain ownership of your UGC. By submitting UGC, you grant
                  us a worldwide, non-exclusive, royalty-free license to use,
                  reproduce, modify, adapt, publish, and display your content
                  solely for the purpose of operating and improving our
                  Services.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  4.3 User Responsibilities
                </h3>
                <p>
                  You are solely responsible for your UGC. You represent that
                  you have all necessary rights to upload and share your content
                  and that it does not infringe on any third-party rights or
                  violate any laws.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  4.4 Content Moderation
                </h3>
                <p>
                  We reserve the right to review, remove, or refuse to display
                  any UGC that violates these Terms, our community guidelines,
                  or applicable law.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Digital Vault and Document Storage
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  5.1 Security Measures
                </h3>
                <p>
                  We implement industry-standard security measures, including
                  encryption at rest and in transit, multi-factor
                  authentication, and access controls to protect your documents
                  and sensitive information.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">5.2 Compliance</h3>
                <p>
                  Our digital vault complies with applicable data protection
                  laws, including HIPAA (for health information) and GDPR (where
                  applicable).
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  5.3 Backup and Recovery
                </h3>
                <p>
                  We maintain regular backups and disaster recovery protocols to
                  ensure data integrity and availability.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Health and Demographic Information
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  6.1 Sensitive Data Handling
                </h3>
                <p>
                  We collect and process health and demographic information only
                  with your explicit consent. This data is handled in accordance
                  with HIPAA, GDPR, and other relevant regulations.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">6.2 User Consent</h3>
                <p>
                  By uploading health or demographic information, you provide
                  explicit, informed consent for us to process this data as
                  described in our Privacy Policy. You may withdraw your consent
                  at any time by contacting us or using in-app controls.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              7. Privacy and Data Protection
            </h2>
            <p>
              Your privacy is important to us. Please review our{" "}
              <a
                href="/privacy"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                Privacy Policy
              </a>{" "}
              for details on how we collect, use, store, and protect your
              personal information, including your rights regarding your data.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              8. Third-Party Integrations
            </h2>
            <p>
              Our Services may integrate with third-party services. We will
              disclose the nature and purpose of these integrations, the data
              shared, and obtain your consent where required. We are not
              responsible for the privacy practices of third parties.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              9. Prohibited Conduct
            </h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any laws or regulations;</li>
              <li>Infringe on intellectual property or privacy rights;</li>
              <li>Upload harmful, offensive, or illegal content;</li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users' data;
              </li>
              <li>Use the Services for any unlawful or abusive purpose.</li>
            </ul>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              10. Inappropriate Content and Enforcement
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  10.1 Prohibited Content
                </h3>
                <p className="mb-4">
                  You agree not to upload, post, transmit, or otherwise make
                  available any content that is inappropriate, offensive, or
                  violates applicable laws or our community standards.
                  Inappropriate content includes, but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sexually explicit material</li>
                  <li>
                    Hate speech, harassment, or discriminatory content based on
                    race, gender, religion, nationality, disability, or sexual
                    orientation
                  </li>
                  <li>Violent, graphic, or threatening material</li>
                  <li>Misinformation, false or misleading information</li>
                  <li>
                    Content promoting illegal activities, controlled substances,
                    or unsafe health advice
                  </li>
                  <li>Defamatory, profane, or otherwise offensive material</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to determine, at our sole discretion,
                  what constitutes inappropriate content.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  10.2 Content Moderation and Security
                </h3>
                <p>
                  To maintain a safe and respectful environment, we employ a
                  combination of automated AI-based content filters and a user
                  reporting system. Our AI filters are designed to detect and
                  block inappropriate content before it is published.
                  Additionally, users can report content they believe violates
                  these guidelines. All reports are reviewed by our moderation
                  team for further action.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  10.3 Enforcement Actions
                </h3>
                <p className="mb-4">
                  If you are found to have posted or engaged with inappropriate
                  content, we may take one or more of the following actions:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Immediate removal of the offending content</li>
                  <li>Suspension or permanent deletion of your account</li>
                  <li>Permanent ban from accessing or using the platform</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to take these actions without prior
                  notice if we determine that your conduct poses a risk to the
                  safety or integrity of the platform or its users.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  10.4 Appeals Process
                </h3>
                <p className="mb-4">
                  If you believe your account was deleted or banned in error,
                  you have the right to appeal the decision. To initiate an
                  appeal, please contact our support team at{" "}
                  <a
                    href="mailto:security@galixee.com"
                    className="text-[#6366F1] hover:text-[#4F46E5]"
                  >
                    security@galixee.com
                  </a>{" "}
                  within 30 days of receiving notice of your account action.
                  Your appeal should include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your account information</li>
                  <li>
                    A detailed explanation of why you believe the action was
                    taken in error
                  </li>
                  <li>Any supporting evidence or context</li>
                </ul>
                <p className="mt-4">
                  Our team will review your appeal and respond within a
                  reasonable timeframe. If your appeal is successful, your
                  account may be reinstated and your data restored, subject to
                  our data retention policies.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              11. Modifications to the Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you of
              significant changes via email or in-app notification. Continued
              use of the Services after changes constitutes acceptance of the
              new Terms.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              12. Limitation of Liability
            </h2>
            <p className="mb-4">
              To the maximum extent permitted by law, we are not liable for any
              indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits or revenues, whether incurred directly or
              indirectly, or any loss of data, use, goodwill, or other
              intangible losses resulting from your use of the Services.
            </p>
            <p>
              Our total liability for any claim arising out of or relating to
              these Terms or the Services is limited to the amount you paid us,
              if any, for the Services in the 12 months preceding the claim.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              13. Dispute Resolution
            </h2>
            <p>
              Any disputes arising from these Terms or your use of the Services
              will be resolved through binding arbitration, rather than in
              court, except that you may assert claims in small claims court if
              your claims qualify. The arbitration will be conducted in Florida.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              14. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account and
              access to the Services at our discretion, with or without notice,
              for conduct that we believe violates these Terms or is otherwise
              harmful to us or other users.
            </p>
          </section>

          <section className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              15. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:GalixeeTOS@gmail.com"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                GalixeeTOS@gmail.com
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
                I have read and agree to the Terms of Service
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
              For questions about these terms, please contact{" "}
              <a
                href="mailto:GalixeeTOS@gmail.com"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                GalixeeTOS@gmail.com
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