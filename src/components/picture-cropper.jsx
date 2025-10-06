"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ image, onCrop, onCancel }) {
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      imageRef.current = img;
      drawImage();
    };
  }, [image]);

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply scale
    ctx.scale(scale, scale);

    // Apply position
    ctx.translate(position.x, position.y);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    // Restore context state
    ctx.restore();

    // Draw circular mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y,
    };

    setPosition(newPosition);
    drawImage();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    drawImage();
  };

  const handleCrop = async () => {
    if (!canvasRef.current) return;
    setLoading(true);

    try {
      const canvas = canvasRef.current;
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      const file = new File([blob], "profile-picture.jpg", {
        type: "image/jpeg",
      });
      onCrop(file);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-[#333333] bg-[#121212]">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: "100%",
            height: "100%",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-gray-400">
          <i className="fas fa-search-minus"></i>
        </span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={scale}
          onChange={handleScaleChange}
          className="flex-1 h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-gray-400">
          <i className="fas fa-search-plus"></i>
        </span>
      </div>

      <div className="flex justify-between space-x-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCrop}
          disabled={loading}
          className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function StoryComponent() {
  const [croppedImage, setCroppedImage] = useState(null);

  return (
    <div className="p-8 bg-[#121212] min-h-screen">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          Picture Cropper Demo
        </h2>

        {/* Example with sample image */}
        <MainComponent
          image="https://placekitten.com/800/800"
          onCrop={(file) => {
            const url = URL.createObjectURL(file);
            setCroppedImage(url);
          }}
          onCancel={() => console.log("Cancelled")}
        />

        {/* Preview cropped image */}
        {croppedImage && (
          <div className="mt-8">
            <h3 className="text-white mb-4">Cropped Result:</h3>
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#6366F1]">
              <img
                src={croppedImage}
                alt="Cropped preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
}