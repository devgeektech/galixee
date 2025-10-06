"use client";
import React from "react";

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
      title: "Understanding Copyright",
      content: [
        {
          title: "What is Copyright?",
          description:
            "Copyright is a form of intellectual property protection for original works of authorship fixed in a tangible form of expression.",
          icon: "fa-copyright",
        },
        {
          title: "Protected Works",
          description: "Types of works protected by copyright:",
          items: [
            "Literary, musical, and dramatic works",
            "Pictorial, graphic, and sculptural works",
            "Audiovisual works and sound recordings",
            "Architectural works",
            "Computer software and databases",
          ],
          icon: "fa-layer-group",
        },
        {
          title: "Copyright Protection",
          description: "Key aspects of copyright protection:",
          items: [
            "Protection begins when work is created",
            "Registration provides additional benefits",
            "Works must be original and fixed in tangible form",
            "Duration varies based on creation date and authorship",
          ],
          icon: "fa-shield-alt",
        },
      ],
    },
    preparation: {
      title: "Preparation Steps",
      content: [
        {
          title: "Required Materials",
          description: "Gather these essential items before registration:",
          items: [
            "Copy of the work to be registered",
            "Creation date documentation",
            "Publication information (if published)",
            "Author and claimant information",
            "Work samples or identifying materials",
          ],
          icon: "fa-clipboard-list",
        },
        {
          title: "Registration Options",
          description: "Choose the appropriate registration type:",
          items: [
            "Single work registration",
            "Group registration options",
            "Supplementary registration",
            "Renewal registration",
          ],
          icon: "fa-list-check",
        },
      ],
    },
    filing: {
      title: "Filing Process",
      content: [
        {
          title: "Application Steps",
          description: "Complete these steps to register your copyright:",
          items: [
            "Create account on Copyright.gov",
            "Select appropriate application type",
            "Complete application form",
            "Pay registration fee ($45-$125)",
            "Submit copies of your work",
          ],
          icon: "fa-file-alt",
        },
        {
          title: "Processing Timeline",
          description: "Understanding the registration process:",
          items: [
            "Electronic filing (2-7 months typical)",
            "Paper filing (8-13 months typical)",
            "Special handling available for urgency",
            "Correspondence if issues found",
          ],
          icon: "fa-clock",
        },
      ],
    },
    maintenance: {
      title: "Post-Registration",
      content: [
        {
          title: "Protection Measures",
          description: "Steps to maintain and protect your copyright:",
          items: [
            "Add copyright notice to works",
            "Monitor for unauthorized use",
            "Keep records of creation and registration",
            "Consider registering updates/versions",
          ],
          icon: "fa-shield-check",
        },
        {
          title: "Rights Management",
          description: "Managing your copyright effectively:",
          items: [
            "Document licensing agreements",
            "Track use permissions granted",
            "Maintain proof of ownership",
            "Consider copyright transfer options",
          ],
          icon: "fa-file-contract",
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
                U.S. Copyright Registration Checklist
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
              A comprehensive guide to help you navigate the copyright
              registration process in the United States
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
                consult with a qualified attorney.
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
                  href="https://www.copyright.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-external-link-alt text-[#6366F1] mr-2"></i>
                  U.S. Copyright Office
                </a>
                <a
                  href="https://www.copyright.gov/eco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-file-alt text-[#6366F1] mr-2"></i>
                  Register your Copyright
                </a>
                <a
                  href="https://www.copyright.gov/help/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#242424] p-4 rounded-lg text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                >
                  <i className="fas fa-question-circle text-[#6366F1] mr-2"></i>
                  Copyright FAQs
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