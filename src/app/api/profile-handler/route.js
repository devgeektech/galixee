
function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [configError, setConfigError] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Load saved credentials from localStorage if they exist
  useEffect(() => {
    const savedEmail = localStorage.getItem("sandbox_email");
    const savedPassword = localStorage.getItem("sandbox_password");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  // Handle auto-signin from welcome page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoSignin = urlParams.get("auto");
    const autoTrigger = localStorage.getItem("auto_signin_trigger");

    if (autoSignin === "true" || autoTrigger === "true") {
      const autoEmail = localStorage.getItem("auto_signin_email");
      const autoPassword = localStorage.getItem("auto_signin_password");

      if (autoEmail && autoPassword) {
        setEmail(autoEmail);
        setPassword(autoPassword);

        // Clear the trigger flag
        localStorage.removeItem("auto_signin_trigger");
        localStorage.removeItem("auto_signin_email");
        localStorage.removeItem("auto_signin_password");

        // Auto-submit the form after a short delay
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true }),
            );
          }
        }, 1000);
      }
    }
  }, []);

  // Add default sandbox credentials
  useEffect(() => {
    if (!email && !password) {
      const defaultEmail = "test@example.com";
      const defaultPassword = "password123";
      setEmail(defaultEmail);
      setPassword(defaultPassword);
      localStorage.setItem("sandbox_email", defaultEmail);
      localStorage.setItem("sandbox_password", defaultPassword);
    }
  }, [email, password]);
}