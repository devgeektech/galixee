"use client";
import React from "react";

import {
  useUpload,
  useHandleStreamResponse,
} from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [error, setError] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationUrl, setAnimationUrl] = useState(null);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [voiceSamples, setVoiceSamples] = useState([]);

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method: "GET" }),
        });

        if (!response.ok) throw new Error("Failed to fetch profile");
        const { data } = await response.json();
        setUserProfile(data);
        setVoiceEnabled(data.voice_responses_enabled);
        setAnimationEnabled(data.animation_enabled);

        const voiceResponse = await fetch("/api/voice-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method: "GET" }),
        });

        if (voiceResponse.ok) {
          const { profile } = await voiceResponse.json();
          if (profile?.voice_sample_url) {
            setAudioUrl(profile.voice_sample_url);
          }
          setVoiceSamples(profile.voice_samples || []);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Unable to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: (message) => {
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      setStreamingMessage("");
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) throw new Error(uploadError);

      setProfileImage(url);
      setError(null);
    } catch (err) {
      setError("Failed to upload image");
      console.error(err);
    }
  };

  const handleAudioUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) throw new Error(uploadError);

      setAudioUrl(url);
      setError(null);
    } catch (err) {
      setError("Failed to upload audio");
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const { url, error: uploadError } = await upload({ file: audioBlob });
        if (uploadError) throw new Error(uploadError);
        setAudioUrl(url);

        const response = await fetch("/api/voice-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceSampleUrl: url }),
        });

        if (!response.ok) {
          throw new Error("Failed to save voice profile");
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError("Failed to start recording");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const toggleVoice = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          voice_responses_enabled: !voiceEnabled,
        }),
      });

      if (!response.ok) throw new Error("Failed to update voice settings");
      setVoiceEnabled(!voiceEnabled);
    } catch (err) {
      setError("Failed to update voice settings");
      console.error(err);
    }
  };

  const toggleAnimation = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          animation_enabled: !animationEnabled,
        }),
      });

      if (!response.ok) throw new Error("Failed to update animation settings");
      setAnimationEnabled(!animationEnabled);
    } catch (err) {
      setError("Failed to update animation settings");
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setIsAnimating(true);

      const personalDataResponse = await fetch("/api/personal-data-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!personalDataResponse.ok) {
        throw new Error("Failed to fetch personal data");
      }

      const personalData = await personalDataResponse.json();

      const contextMessage = {
        role: "system",
        content: `Here is the user's personal data that might be relevant to their question:
${JSON.stringify(personalData, null, 2)}

Important: Format your response as though you ARE the account holder directly answering the question. Use first person pronouns (I, my, me) and a casual, friendly tone. Only mention information that is directly relevant to their question. If you don't have certain information in your data, simply say you don't remember or haven't recorded that information yet.

For example:
Question: "What's your education?"
Good response: "I went to Springfield High School and then got my Bachelor's in Computer Science from State University in 2019."
Bad response: "The user attended Springfield High School..."

Question: "What's your favorite color?"
Good response: "I love blue! It's been my favorite color for as long as I can remember."
Bad response: "According to the user profile data, their favorite color is blue."

Question: "What's your mother's name?"
Good response: "My mom's name is Sarah. She lives in Chicago now."
Bad response: "The family tree data shows the user's mother is Sarah..."

If data isn't available:
Good response: "You know, I haven't actually added that information to my profile yet."
Bad response: "This information is not present in the database."
`,
      };

      const response = await fetch("/integrations/google-gemini-1-5/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, contextMessage, userMessage],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const textResponse = await handleStreamResponse(response);

      if (animationEnabled) {
        const animationResponse = await fetch("/api/talking-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textResponse }),
        });

        if (!animationResponse.ok) {
          throw new Error("Failed to generate animation");
        }

        const { animationUrl } = await animationResponse.json();
        setAnimationUrl(animationUrl);

        if (videoRef.current) {
          videoRef.current.src = animationUrl;
          videoRef.current.play();
        }
      }

      if (voiceEnabled) {
        const voiceResponse = await fetch("/api/voice-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textResponse }),
        });

        if (!voiceResponse.ok) {
          throw new Error("Failed to generate voice response");
        }

        const { url } = await voiceResponse.json();
        if (url && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
                Animated Profile
              </h2>
              <div className="space-y-4">
                <div className="relative w-48 h-48 mx-auto">
                  {profileLoading ? (
                    <div className="w-full h-full rounded-full bg-[#242424] border-4 border-[#333333] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
                    </div>
                  ) : animationUrl && isAnimating ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full rounded-full object-cover border-4 border-[#4FD1C5]"
                      autoPlay
                      muted={voiceEnabled}
                      playsInline
                    >
                      <source src={animationUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={userProfile?.image || "/default-avatar.png"}
                      alt="Profile"
                      className={`w-full h-full rounded-full object-cover border-4 ${
                        isAnimating
                          ? "border-[#4FD1C5] animate-pulse"
                          : "border-[#6366F1]"
                      }`}
                    />
                  )}
                  <a
                    href="/profile"
                    className="absolute bottom-2 right-2 bg-[#6366F1] p-2 rounded-full cursor-pointer hover:bg-[#4F46E5] transition-colors"
                    title="Edit profile picture"
                  >
                    <i className="fas fa-pencil"></i>
                  </a>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {profileLoading ? (
                      <div className="h-6 w-32 bg-[#242424] rounded animate-pulse"></div>
                    ) : (
                      userProfile?.first_name || user?.name || "Guest"
                    )}
                  </h3>
                  <p className="text-gray-400">
                    {profileLoading ? (
                      <div className="h-4 w-48 bg-[#242424] rounded animate-pulse"></div>
                    ) : (
                      user?.email
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
                Voice Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Voice Responses</span>
                  <button
                    onClick={toggleVoice}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      voiceEnabled ? "bg-[#6366F1]" : "bg-[#333333]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        voiceEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {voiceEnabled && (
                  <p className="text-sm text-gray-400">
                    AI responses will be spoken aloud
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
                Animation Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Enable Animation</span>
                  <button
                    onClick={toggleAnimation}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      animationEnabled ? "bg-[#6366F1]" : "bg-[#333333]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        animationEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {animationEnabled && (
                  <p className="text-sm text-gray-400">
                    Your profile picture will animate when speaking
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
                Your Voice Samples
              </h2>
              <p className="text-gray-400 mb-4">
                Record or upload voice samples. These will be saved to your
                profile for future features.
              </p>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-4 rounded-full ${
                      isRecording ? "bg-red-500" : "bg-[#6366F1]"
                    } hover:opacity-80 transition-opacity`}
                    disabled={uploadLoading}
                  >
                    <i
                      className={`fas ${
                        isRecording ? "fa-stop" : "fa-microphone"
                      }`}
                    ></i>
                  </button>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className={`block text-center py-2 px-4 bg-[#242424] rounded-lg cursor-pointer hover:bg-[#333333] transition-colors ${
                    uploadLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadLoading ? "Uploading..." : "Upload Audio File"}
                </label>

                {voiceSamples.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-300">
                      Saved Voice Samples ({voiceSamples.length})
                    </h3>
                    {voiceSamples.map((sample, index) => (
                      <div
                        key={sample.id}
                        className="bg-[#242424] p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            Sample {index + 1} -{" "}
                            {new Date(sample.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => deleteSample(sample.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                            title="Delete this sample"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <audio controls className="w-full">
                          <source
                            src={sample.voice_sample_url}
                            type="audio/wav"
                          />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-microphone-slash text-4xl text-gray-600 mb-4"></i>
                    <p className="text-gray-400">
                      No voice samples recorded yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Record or upload your first sample above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Talk with Me
            </h2>

            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                <p className="flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </p>
              </div>
            )}

            <div
              ref={chatContainerRef}
              className="h-[500px] overflow-y-auto mb-6 space-y-4 p-4 bg-[#242424] rounded-lg"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#333333] text-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-lg bg-[#333333] text-gray-200">
                    {streamingMessage}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#6366F1]"
              />
              <button
                type="submit"
                disabled={!input.trim() || uploadLoading}
                className={`bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                  !input.trim() || uploadLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </button>
            </form>
          </div>

          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;