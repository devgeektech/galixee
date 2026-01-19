"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useUser } from "../../components/use-user";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [activeSection, setActiveSection] = useState("understanding");

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
  }, [user, userLoading]);

  const sections = {
    understanding: {
      title: "Understanding Patents",
      content: [
        {
          title: "What is a Patent?",
          description:
            "A patent is a limited duration property right relating to an invention, granted by the United States Patent and Trademark Office (USPTO).",
          icon: "fa-lightbulb",
        },
        {
          title: "Types of Patents",
          description: "The three types of patents granted by the USPTO:",
          items: [
            "Utility Patents - New processes, machines, compositions of matter",
            "Design Patents - New, original, ornamental design",
            "Plant Patents - New varieties of plants",
          ],
          icon: "fa-layer-group",
        },
        {
          title: "Patent Requirements",
          description: "Key requirements for patentability:",
          items: [
            "Novel - Must be new and not publicly disclosed",
            "Non-obvious - Not obvious to someone skilled in the field",
            "Useful - Must have practical application",
            "Enablement - Must be described in sufficient detail",
          ],
          icon: "fa-check-circle",
        },
      ],
    },
    preparation: {
      title: "Preparation Steps",
      content: [
        {
          title: "Prior Art Search",
          description: "Essential steps before filing:",
          items: [
            "Search USPTO patent database",
            "Review scientific literature",
            "Check international patent databases",
            "Document search results",
            "Analyze similar patents",
          ],
          icon: "fa-search",
        },
        {
          title: "Documentation Needs",
          description: "Gather these materials:",
          items: [
            "Detailed invention description",
            "Drawings or diagrams",
            "Working prototype documentation",
            "Development records and dates",
            "Potential commercial applications",
          ],
          icon: "fa-file-alt",
        },
      ],
    },
    filing: {
      title: "Filing Process",
      content: [
        {
          title: "Application Components",
          description: "Required elements for filing:",
          items: [
            "Specification document",
            "Claims section",
            "Drawings (if necessary)",
            "Inventor information",
            "Filing fees",
            "Patent Application Declaration",
          ],
          icon: "fa-file-signature",
        },
        {
          title: "Timeline and Costs",
          description: "Understanding the patent process:",
          items: [
            "Provisional vs. non-provisional filing",
            "Examination period (18-24 months)",
            "Office action responses",
            "Issue fees and maintenance fees",
            "Total cost estimation ($8,000-15,000+)",
          ],
          icon: "fa-clock",
        },
      ],
    },
    maintenance: {
      title: "Post-Grant Requirements",
      content: [
        {
          title: "Maintenance Requirements",
          description: "Steps to maintain patent rights:",
          items: [
            "Pay maintenance fees at 3.5, 7.5, and 11.5 years",
            "Monitor for infringement",
            "Mark products with patent numbers",
            "Document commercial use",
            "Consider international protection",
          ],
          icon: "fa-shield-check",
        },
        {
          title: "Rights Management",
          description: "Managing your patent effectively:",
          items: [
            "License agreement considerations",
            "Infringement monitoring strategy",
            "Portfolio management",
            "International filing deadlines",
            "Continuation applications",
          ],
          icon: "fa-gavel",
        },
      ],
    },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333] print:hidden">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-6">
          <a
            href="/welcome"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Back to Welcome
          </a>
          <a
            href="/account/logout"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col mb-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5] print:text-black print:bg-none">
                U.S. Patent Application Checklist
              </h1>
              <button
                onClick={handlePrint}
                className="ml-4 bg-[#6366F1] hover:bg-[#5558DD] text-white px-6 py-3 rounded-lg flex items-center transition-colors print:hidden"
              >
                <i className="fas fa-print mr-2"></i>
                Print Checklist
              </button>
            </div>

            <p className="text-gray-400 text-lg mb-6 print:text-gray-600">
              A comprehensive guide to help you navigate the patent application
              process in the United States
            </p>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 print:bg-white print:text-black print:border-gray-300">
              <div className="flex items-center mb-4">
                <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl mr-3"></i>
                <h2 className="text-xl font-bold text-white">
                  Legal Disclaimer
                </h2>
              </div>
              <p className="text-gray-400">
                This guide is for informational purposes only and does not
                constitute legal advice. Galixee is not a law firm or legal
                service provider. The information provided here is general in
                nature and may not apply to your specific situation. For legal
                advice regarding your intellectual property rights, please
                consult with a qualified patent attorney.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 print:block">
          <div className="lg:col-span-3">
            {Object.keys(sections).map((sectionKey) => (
              <div
                key={sectionKey}
                className="mb-12 print:mb-8"
                id={sectionKey}
              >
                <h2 className="text-3xl font-bold mb-6 text-[#6366F1] print:text-black">
                  {sections[sectionKey].title}
                </h2>
                {sections[sectionKey].content.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-6 print:bg-white print:text-black print:border print:border-gray-300"
                  >
                    <div className="flex items-center mb-4">
                      <i
                        className={`fas ${item.icon} text-[#6366F1] text-2xl mr-3 print:text-gray-700`}
                      ></i>
                      <h3 className="text-2xl font-bold text-white print:text-black">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 mb-4 print:text-gray-600">
                      {item.description}
                    </p>
                    {item.items && (
                      <ul className="space-y-3">
                        {item.items.map((listItem, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-center text-gray-300 print:text-gray-700"
                          >
                            <i className="fas fa-check text-[#4FD1C5] mr-3 print:text-gray-600"></i>
                            {listItem}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="lg:col-span-1 print:hidden">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">
                Important Resources
              </h3>
              <div className="space-y-4">
                <a
                  href="https://www.uspto.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-external-link-alt text-[#6366F1] mr-2"></i>
                  USPTO Official Website
                </a>
                <a
                  href="https://www.uspto.gov/patents/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-file-alt text-[#6366F1] mr-2"></i>
                  Patent Application Process
                </a>
                <a
                  href="https://www.uspto.gov/patents/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-search text-[#6366F1] mr-2"></i>
                  Patent Search
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0 print:hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
          }
          
          body {
            background: white;
            color: black;
          }

          .print\\:hidden {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          h1, h2, h3 {
            break-after: avoid;
          }

          div {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default MainComponent;