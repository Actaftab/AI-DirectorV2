import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Loader2,
  Film,
  Camera,
  Aperture,
  Sun,
  Play,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { GeneratedShot } from "../types";

export function CinematicTool() {
  const [script, setScript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shots, setShots] = useState<GeneratedShot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeScript = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setShots([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze the following film/ad script and break it down into a detailed shot-by-shot visual list. Act as an expert Director of Photography (DOP). For each shot, provide the camera angle, movement, specific lens choice (e.g., 35mm, 50mm, 85mm), lighting style, and a highly detailed image prompt for an AI image generator to create this exact cinematic frame.

Script:
${script}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shotNumber: {
                  type: Type.INTEGER,
                  description: "The sequential number of the shot",
                },
                sceneDescription: {
                  type: Type.STRING,
                  description: "Brief description of the action in the shot",
                },
                cameraAngle: {
                  type: Type.STRING,
                  description:
                    "Camera angle (e.g., Wide Shot, Close Up, Low Angle)",
                },
                cameraMovement: {
                  type: Type.STRING,
                  description:
                    "Camera movement (e.g., Static, Pan, Tracking, Dolly)",
                },
                lens: {
                  type: Type.STRING,
                  description:
                    "Specific lens choice (e.g., 24mm, 50mm, 85mm anamorphic)",
                },
                lighting: {
                  type: Type.STRING,
                  description:
                    "Lighting style (e.g., High contrast, moody, soft natural)",
                },
                imagePrompt: {
                  type: Type.STRING,
                  description:
                    "A highly detailed prompt for an image generation model to create this exact cinematic shot. Include subject, environment, lighting, camera angle, lens effect, and cinematic style.",
                },
              },
              required: [
                "shotNumber",
                "sceneDescription",
                "cameraAngle",
                "cameraMovement",
                "lens",
                "lighting",
                "imagePrompt",
              ],
            },
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsedShots = JSON.parse(jsonStr) as GeneratedShot[];
        setShots(parsedShots);
      } else {
        throw new Error("Failed to parse script analysis.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateImageForShot = async (shotIndex: number) => {
    const shot = shots[shotIndex];
    if (!shot || shot.isGenerating) return;

    setShots((prev) => {
      const newShots = [...prev];
      newShots[shotIndex] = {
        ...newShots[shotIndex],
        isGenerating: true,
        error: undefined,
      };
      return newShots;
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: shot.imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K",
          },
        },
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setShots((prev) => {
          const newShots = [...prev];
          newShots[shotIndex] = {
            ...newShots[shotIndex],
            imageUrl,
            isGenerating: false,
          };
          return newShots;
        });
      } else {
        throw new Error("No image generated.");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      // If the error contains "Requested entity was not found", it might be an API key issue.
      if (
        err.message &&
        err.message.includes("Requested entity was not found")
      ) {
        // Reset key selection state and prompt user
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      }
      setShots((prev) => {
        const newShots = [...prev];
        newShots[shotIndex] = {
          ...newShots[shotIndex],
          isGenerating: false,
          error: err.message || "Failed to generate image.",
        };
        return newShots;
      });
    }
  };

  const generateAllImages = async () => {
    for (let i = 0; i < shots.length; i++) {
      if (!shots[i].imageUrl && !shots[i].isGenerating) {
        await generateImageForShot(i);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <Film className="w-4 h-4 text-black" />
            </div>
            <h1 className="font-serif text-xl tracking-wide">
              Cinematic Vision
            </h1>
          </div>
          <div className="text-xs uppercase tracking-widest text-white/50 font-mono">
            Nano Banana Pro
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-3xl mb-2">The Script</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Paste your film or ad script below. Our AI Director of Photography
              will analyze it and suggest the best shot-by-shot visuals, camera
              angles, and lenses.
            </p>
          </div>

          <div className="relative">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="INT. COFFEE SHOP - DAY&#10;&#10;Rain streaks the window. SARAH (30s) stares into her black coffee, lost in thought. The bell above the door chimes..."
              className="w-full h-[400px] bg-[#121212] border border-white/10 rounded-2xl p-6 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 resize-none font-mono text-sm leading-relaxed transition-all"
            />
          </div>

          <button
            onClick={analyzeScript}
            disabled={isAnalyzing || !script.trim()}
            className="w-full py-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Script...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Analyze & Generate Shot List
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="space-y-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <h2 className="font-serif text-3xl">Shot List</h2>
            {shots.length > 0 && (
              <button
                onClick={generateAllImages}
                className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Generate All Visuals
              </button>
            )}
          </div>

          {shots.length === 0 && !isAnalyzing && (
            <div className="h-[400px] flex flex-col items-center justify-center text-white/30 border border-white/5 border-dashed rounded-2xl bg-[#0a0a0a]">
              <Film className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-serif text-lg">Awaiting Script</p>
              <p className="text-sm font-mono mt-2">No shots generated yet.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex gap-6 p-6 bg-[#121212] rounded-2xl border border-white/5"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded" />
                      <div className="h-3 bg-white/5 rounded w-5/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {shots.map((shot, index) => (
              <div
                key={index}
                className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden group transition-all hover:border-white/20"
              >
                {/* Image Section */}
                <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center border-b border-white/10">
                  {shot.imageUrl ? (
                    <img
                      src={shot.imageUrl}
                      alt={`Shot ${shot.shotNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      {shot.isGenerating ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin text-white/50 mb-4" />
                          <p className="text-sm text-white/50 font-mono uppercase tracking-widest">
                            Rendering Frame...
                          </p>
                        </>
                      ) : shot.error ? (
                        <>
                          <AlertCircle className="w-8 h-8 text-red-500/50 mb-4" />
                          <p className="text-sm text-red-400 mb-4">
                            {shot.error}
                          </p>
                          <button
                            onClick={() => generateImageForShot(index)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                          >
                            Retry Generation
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-white/20 mb-4" />
                          <button
                            onClick={() => generateImageForShot(index)}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Generate Visual
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Shot Number Badge */}
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg font-mono text-xs tracking-widest">
                    SHOT {String(shot.shotNumber).padStart(2, "0")}
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="p-6">
                  <p className="text-lg font-serif mb-6 leading-relaxed">
                    {shot.sceneDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest font-mono mb-2">
                        <Camera className="w-3 h-3" />
                        Camera
                      </div>
                      <p className="text-sm">{shot.cameraAngle}</p>
                      <p className="text-sm text-white/60">
                        {shot.cameraMovement}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest font-mono mb-2">
                        <Aperture className="w-3 h-3" />
                        Lens & Light
                      </div>
                      <p className="text-sm">{shot.lens}</p>
                      <p className="text-sm text-white/60">{shot.lighting}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
