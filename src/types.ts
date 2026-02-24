export interface Shot {
  shotNumber: number;
  sceneDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  lens: string;
  lighting: string;
  imagePrompt: string;
}

export interface GeneratedShot extends Shot {
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
