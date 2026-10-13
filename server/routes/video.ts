import { Router, Request, Response } from 'express';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

export const videoRouter = Router();

// Initialize server-side GoogleGenAI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export type AspectRatio = '16:9' | '9:16';

interface StoredVideoOp {
  operationName: string;
  prompt: string;
  aspectRatio: AspectRatio;
  model: string;
  createdAt: number;
}

// In-memory cache of video operations for status retrieval & aspect-ratio tracking
const activeOperations = new Map<string, StoredVideoOp>();

// Curated automotive demo videos for instant showcase preview when quota is rate-limited
export const SAMPLE_VIDEOS: Record<AspectRatio, Array<{ id: string; title: string; prompt: string; url: string; duration: string }>> = {
  '16:9': [
    {
      id: 'sample-16-9-1',
      title: '360° Studio Inspection Sweep',
      prompt: 'Cinematic 360-degree sweep around a midnight black Porsche 911 GT3 in a clean studio showroom, spotlights reflecting off flawless ceramic coat paint, photorealistic 8k video.',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '15s',
    },
    {
      id: 'sample-16-9-2',
      title: 'Chassis & Engine Bay Walkthrough',
      prompt: 'Detailed mechanical inspection under the hood of a twin-turbo V8 engine, smooth macro camera pan over intake manifold, suspension struts, and brake calipers with automotive workshop lighting.',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: '15s',
    },
    {
      id: 'sample-16-9-3',
      title: 'Scenic Coastal Highway Test Drive',
      prompt: 'Low-angle drone tracking shot of an all-wheel-drive luxury SUV driving along a winding coastal highway at golden hour sunset, cinematic motion blur and lens flare.',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      duration: '15s',
    },
  ],
  '9:16': [
    {
      id: 'sample-9-16-1',
      title: 'Vertical Mobile Inspection Reel',
      prompt: 'Vertical 9:16 smartphone camera walkthrough inspecting body gaps, paint depth, and front fascia of a luxury performance vehicle, clean modern garage background.',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration: '10s',
    },
    {
      id: 'sample-9-16-2',
      title: 'Odometer & Cockpit Scan',
      prompt: 'Vertical portrait format cockpit scan showing leather steering wheel, pristine digital instrument cluster displaying low mileage, and clean carbon fiber interior trim.',
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      duration: '12s',
    },
  ],
};

/**
 * 1. Start Video Generation
 * Model: veo-3.1-fast-generate-preview
 * Aspect Ratio: 16:9 (landscape) or 9:16 (portrait)
 */
export async function handleGenerateVideo(req: Request, res: Response) {
  try {
    const { prompt, aspectRatio = '16:9', resolution = '720p' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A prompt describing the vehicle or scene is required.',
      });
    }

    const validAspectRatio: AspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const cleanPrompt = prompt.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    // Call Veo 3 model: veo-3.1-fast-generate-preview
    // Per instructions: model must be veo-3.1-fast-generate-preview, aspect ratio 16:9 or 9:16
    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: cleanPrompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution === '1080p' ? '1080p' : '720p',
          aspectRatio: validAspectRatio,
        },
      });
    } catch (apiError: any) {
      const errMsg = apiError?.message || String(apiError);
      const isQuotaError = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');

      // Return informative response with sample fallback available
      return res.status(isQuotaError ? 429 : 500).json({
        success: false,
        error: isQuotaError
          ? 'Gemini Veo API rate limit reached (Quota Exceeded). You can preview with pre-rendered automotive demo videos below or try again in a few moments.'
          : `Veo video generation error: ${errMsg}`,
        isQuotaError,
        model: 'veo-3.1-fast-generate-preview',
        fallbackSamples: SAMPLE_VIDEOS[validAspectRatio],
      });
    }

    if (!operation || !operation.name) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initiate Veo video generation operation.',
      });
    }

    // Store operation in active memory
    activeOperations.set(operation.name, {
      operationName: operation.name,
      prompt: cleanPrompt,
      aspectRatio: validAspectRatio,
      model: 'veo-3.1-fast-generate-preview',
      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      operationName: operation.name,
      prompt: cleanPrompt,
      aspectRatio: validAspectRatio,
      model: 'veo-3.1-fast-generate-preview',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Unexpected server error while generating video',
    });
  }
}

/**
 * 2. Poll Video Status
 */
export async function handleVideoStatus(req: Request, res: Response) {
  try {
    const { operationName } = req.body;

    if (!operationName || typeof operationName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'operationName is required to check status.',
      });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (updated.error) {
      return res.json({
        success: false,
        done: true,
        error: updated.error.message || 'Video generation failed during processing.',
      });
    }

    const isDone = !!updated.done;
    const downloadUrl = isDone
      ? `/api/video-download?operationName=${encodeURIComponent(operationName)}`
      : null;

    const stored = activeOperations.get(operationName);

    return res.json({
      success: true,
      done: isDone,
      downloadUrl,
      aspectRatio: stored?.aspectRatio || '16:9',
      prompt: stored?.prompt,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to poll video operation status.',
    });
  }
}

/**
 * 3. Video Download & Stream
 */
export async function handleVideoDownload(req: Request, res: Response) {
  try {
    const operationName = (req.query.operationName as string) || req.body?.operationName;

    if (!operationName || typeof operationName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'operationName parameter is required.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (!updated.done) {
      return res.status(202).json({
        success: false,
        done: false,
        message: 'Video is still rendering. Please poll again in a few seconds.',
      });
    }

    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(404).json({
        success: false,
        error: 'Completed operation did not return a valid video URI.',
      });
    }

    // Fetch video bytes from Google's video endpoint using the API key
    const videoRes = await fetch(videoUri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({
        success: false,
        error: `Failed to download generated video: ${videoRes.statusText}`,
      });
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'inline; filename="autoaudit-veo-video.mp4"');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error downloading video.',
    });
  }
}

// Router endpoints for /api/video/*
videoRouter.post('/generate', handleGenerateVideo);
videoRouter.post('/status', handleVideoStatus);
videoRouter.get('/download', handleVideoDownload);
videoRouter.post('/download', handleVideoDownload);
videoRouter.get('/samples', (_req: Request, res: Response) => {
  res.json({
    success: true,
    samples: SAMPLE_VIDEOS,
  });
});
