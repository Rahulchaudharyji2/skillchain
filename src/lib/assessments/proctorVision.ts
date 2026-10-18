/**
 * SkillChain Client-Side AI Optical Proctoring Vision Engine
 * Performs continuous frame inspection on the candidate's camera stream:
 * 1. Native FaceDetector API (when available in Chromium/Edge/Safari)
 * 2. High-performance Fallback Face & Feature Cluster Analyzer (YCbCr + Skin/Contour Segmentation)
 *    Detects single face vs multiple independent face centroids (e.g. 2 candidates) or no face.
 * 3. Mobile Device / Smartphone Optical Detector:
 *    Identifies rectangular vertical aspect ratio handheld devices (4:7 to 9:19) with distinct frame contrast.
 * 4. Gaze & Face Angle Deviation:
 *    Measures face centering and centroid lateral drift away from screen center.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isViolation: boolean;
}

export interface ProctorVisionResult {
  faceCount: number;
  faces: BoundingBox[];
  phoneDetected: boolean;
  phoneBox?: BoundingBox;
  suspiciousAngle: boolean;
  gazeDeviationScore: number; // 0 to 1
  primaryFaceCentered: boolean;
}

export class ProctorVisionEngine {
  private nativeFaceDetector: any = null;
  private hasNativeDetectorChecked = false;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initNativeDetector();
  }

  private async initNativeDetector() {
    if (typeof window !== "undefined" && !this.hasNativeDetectorChecked) {
      this.hasNativeDetectorChecked = true;
      try {
        if ("FaceDetector" in window) {
          this.nativeFaceDetector = new (window as any).FaceDetector({
            maxDetectedFaces: 5,
            fastMode: true,
          });
        }
      } catch (e) {
        this.nativeFaceDetector = null;
      }
    }
  }

  // Temporal smoothing state to prevent momentary false-positives/negatives
  private lastFaceCount = 1;
  private noFaceConsecutiveFrames = 0;
  private multiFaceConsecutiveFrames = 0;
  private phoneConsecutiveFrames = 0;
  private backendMicroserviceAvailable = true;
  private lastBackendPollTime = 0;

  /**
   * Analyze an HTMLVideoElement frame in real time.
   * Native width/height of offscreen analysis is scaled to 320x240 for high FPS and low CPU impact.
   */
  public async analyzeFrame(video: HTMLVideoElement): Promise<ProctorVisionResult> {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return {
        faceCount: 1,
        faces: [],
        phoneDetected: false,
        suspiciousAngle: false,
        gazeDeviationScore: 0,
        primaryFaceCentered: true,
      };
    }

    const width = 320;
    const height = 240;

    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement("canvas");
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.offscreenCtx = this.offscreenCanvas.getContext("2d", { willReadFrequently: true });
    }

    const ctx = this.offscreenCtx;
    if (!ctx) {
      return {
        faceCount: 1,
        faces: [],
        phoneDetected: false,
        suspiciousAngle: false,
        gazeDeviationScore: 0,
        primaryFaceCentered: true,
      };
    }

    ctx.drawImage(video, 0, 0, width, height);

    // 1. Try Native FaceDetector first if supported
    let detectedFaces: BoundingBox[] = [];
    if (this.nativeFaceDetector) {
      try {
        const rawFaces = await this.nativeFaceDetector.detect(video);
        if (Array.isArray(rawFaces) && rawFaces.length > 0) {
          const scaleX = width / (video.videoWidth || width);
          const scaleY = height / (video.videoHeight || height);

          detectedFaces = rawFaces.map((f: any, idx: number) => {
            const bb = f.boundingBox;
            const isPrimary = idx === 0;
            return {
              x: Math.max(0, bb.x * scaleX),
              y: Math.max(0, bb.y * scaleY),
              width: Math.min(width, bb.width * scaleX),
              height: Math.min(height, bb.height * scaleY),
              label: isPrimary && rawFaces.length === 1 ? "Candidate" : `Face #${idx + 1} (${isPrimary ? "Primary" : "Intruder"})`,
              isViolation: idx > 0,
            };
          });
        }
      } catch (err) {
        // Fallback to optical frame segmentation
      }
    }

    // 2. Optical pixel analysis: Skin/Facial Centroid Clustering & Mobile Phone Profile
    const imageData = ctx.getImageData(0, 0, width, height);
    const opticalResult = this.detectOpticalFeatures(imageData, width, height);

    // If native detector wasn't supported or returned 0, use optical facial clustering
    if (detectedFaces.length === 0 && opticalResult.opticalFaces.length > 0) {
      detectedFaces = opticalResult.opticalFaces;
    }

    // Temporal Smoothing for Face Count to avoid false NO_FACE when candidate blinks or lighting shifts
    let rawFaceCount = detectedFaces.length;
    if (rawFaceCount === 0) {
      this.noFaceConsecutiveFrames++;
      // Only report 0 faces if absence persists for >= 4 consecutive frames (1.6 seconds)
      if (this.noFaceConsecutiveFrames < 4) {
        rawFaceCount = this.lastFaceCount;
      }
    } else {
      this.noFaceConsecutiveFrames = 0;
      if (rawFaceCount > 1) {
        this.multiFaceConsecutiveFrames++;
      } else {
        this.multiFaceConsecutiveFrames = 0;
      }
      this.lastFaceCount = rawFaceCount;
    }

    // Temporal smoothing for Phone detection (trigger quickly in 2 frames, hold for stability)
    if (opticalResult.phoneDetected) {
      this.phoneConsecutiveFrames = Math.min(10, this.phoneConsecutiveFrames + 2);
    } else {
      this.phoneConsecutiveFrames = Math.max(0, this.phoneConsecutiveFrames - 1);
    }
    const finalPhoneDetected = this.phoneConsecutiveFrames >= 2;

    // Check Gaze & Face Angle Deviation on primary face
    let suspiciousAngle = false;
    let gazeDeviationScore = 0;
    let primaryFaceCentered = true;

    if (detectedFaces.length > 0) {
      const primary = detectedFaces[0];
      const centerX = primary.x + primary.width / 2;
      const centerY = primary.y + primary.height / 2;

      const normX = Math.abs(centerX - width / 2) / (width / 2);
      const normY = Math.abs(centerY - height / 2) / (height / 2);
      gazeDeviationScore = Math.min(1, Math.sqrt(normX * normX + normY * normY));

      if (normX > 0.65 || primary.width < 30 || primary.height < 30) {
        suspiciousAngle = true;
        primaryFaceCentered = false;
      }
    }

    return {
      faceCount: rawFaceCount,
      faces: detectedFaces,
      phoneDetected: finalPhoneDetected,
      phoneBox: opticalResult.phoneBox,
      suspiciousAngle,
      gazeDeviationScore,
      primaryFaceCentered,
    };
  }

  /**
   * Fast spatial grid & optical analysis for:
   * A) Multiple Face Centroids via skin color & contrast distribution
   * B) Vertical Smartphone / Screen Detection (black bezel + high aspect ratio rectangle)
   */
  private detectOpticalFeatures(
    imageData: ImageData,
    width: number,
    height: number
  ): {
    opticalFaces: BoundingBox[];
    phoneDetected: boolean;
    phoneBox?: BoundingBox;
  } {
    const data = imageData.data;
    const skinGridCols = 32;
    const skinGridRows = 24;
    const cellW = width / skinGridCols;
    const cellH = height / skinGridRows;
    const densityMap: number[][] = Array.from({ length: skinGridRows }, () =>
      new Array(skinGridCols).fill(0)
    );

    // 1. Scan for human skin tones across broad lighting conditions
    for (let r = 0; r < skinGridRows; r++) {
      for (let c = 0; c < skinGridCols; c++) {
        let skinCount = 0;
        let totalSampled = 0;

        const startY = Math.floor(r * cellH);
        const startX = Math.floor(c * cellW);

        for (let py = startY; py < startY + cellH; py += 2) {
          for (let px = startX; px < startX + cellW; px += 2) {
            const idx = (py * width + px) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];

            totalSampled++;

            // Human Skin Detection:
            // High tolerance for indoor/webcam lighting
            const max = Math.max(red, green, blue);
            const min = Math.min(red, green, blue);
            const isSkin =
              red > 65 &&
              green > 30 &&
              blue > 15 &&
              max - min > 10 &&
              red > green &&
              red > blue &&
              Math.abs(red - green) >= 6;

            if (isSkin) {
              skinCount++;
            }
          }
        }

        const skinRatio = skinCount / (totalSampled || 1);
        if (skinRatio > 0.28) {
          densityMap[r][c] = 1;
        }
      }
    }

    // Cluster skin cells into connected regions (face candidates)
    const visited: boolean[][] = Array.from({ length: skinGridRows }, () =>
      new Array(skinGridCols).fill(false)
    );
    const clusters: { minC: number; maxC: number; minR: number; maxR: number; count: number }[] = [];

    for (let r = 0; r < skinGridRows; r++) {
      for (let c = 0; c < skinGridCols; c++) {
        if (densityMap[r][c] === 1 && !visited[r][c]) {
          let minC = c;
          let maxC = c;
          let minR = r;
          let maxR = r;
          let count = 0;
          const queue: [number, number][] = [[r, c]];
          visited[r][c] = true;

          while (queue.length > 0) {
            const [cr, cc] = queue.shift()!;
            count++;
            if (cc < minC) minC = cc;
            if (cc > maxC) maxC = cc;
            if (cr < minR) minR = cr;
            if (cr > maxR) maxR = cr;

            const neighbors: [number, number][] = [
              [cr - 1, cc],
              [cr + 1, cc],
              [cr, cc - 1],
              [cr, cc + 1],
            ];

            for (const [nr, nc] of neighbors) {
              if (
                nr >= 0 &&
                nr < skinGridRows &&
                nc >= 0 &&
                nc < skinGridCols &&
                !visited[nr][nc] &&
                densityMap[nr][nc] === 1
              ) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }

          const clusterW = (maxC - minC + 1) * cellW;
          const clusterH = (maxR - minR + 1) * cellH;
          const aspect = clusterH / (clusterW || 1);

          // Face cluster criteria:
          if (count >= 5 && clusterW >= 32 && clusterH >= 32 && aspect >= 0.65 && aspect <= 2.5 && minR < 20) {
            clusters.push({ minC, maxC, minR, maxR, count });
          }
        }
      }
    }

    clusters.sort((a, b) => b.count - a.count);

    const opticalFaces: BoundingBox[] = clusters.map((cl, i) => {
      const bx = Math.max(0, cl.minC * cellW - 6);
      const by = Math.max(0, cl.minR * cellH - 10);
      const bw = Math.min(width - bx, (cl.maxC - cl.minC + 1) * cellW + 12);
      const bh = Math.min(height - by, (cl.maxR - cl.minR + 1) * cellH + 16);

      const isPrimary = i === 0;
      return {
        x: bx,
        y: by,
        width: bw,
        height: bh,
        label: isPrimary && clusters.length === 1 ? "Candidate" : `Face #${i + 1} (${isPrimary ? "Primary" : "Intruder"})`,
        isViolation: i > 0,
      };
    });

    // -------------------------------------------------------------
    // Mobile Phone / Smartphone Optical Detection
    // -------------------------------------------------------------
    // Handheld smartphones in webcams:
    // - Held upright alongside candidate's face or body (Y from 20% to 92%)
    // - Aspect ratio ~1.6 to 2.4 (portrait phone profile)
    // - Distinct rectangular profile with dark bezel or screen contrast
    let phoneDetected = false;
    let phoneBox: BoundingBox | undefined = undefined;

    const startRow = Math.floor(height * 0.18);
    const endRow = Math.floor(height * 0.95);
    const phoneCandidates: { x: number; y: number; w: number; h: number; score: number }[] = [];

    // Scan for realistic handheld mobile phone dimensions:
    // Screen width 36-75px, height 70-160px
    for (let sampleY = startRow; sampleY < endRow; sampleY += 8) {
      for (let sampleX = 12; sampleX < width - 50; sampleX += 8) {
        for (const testW of [38, 50, 64]) {
          const testH = Math.floor(testW * 1.9);
          if (sampleY + testH >= height || sampleX + testW >= width) continue;

          // Do NOT flag candidate's own head center
          const isDirectlyCandidateHead = opticalFaces.some((f) => {
            const headCenterY = f.y + f.height * 0.45;
            const headCenterX = f.x + f.width / 2;
            const phoneCenterY = sampleY + testH / 2;
            const phoneCenterX = sampleX + testW / 2;
            return (
              Math.abs(phoneCenterX - headCenterX) < f.width * 0.35 &&
              Math.abs(phoneCenterY - headCenterY) < f.height * 0.4
            );
          });
          if (isDirectlyCandidateHead) continue;

          let edgeChecks = 0;
          let bezelAndScreenHits = 0;

          // Check along sample points of the vertical edges & screen interior
          for (let dy = 6; dy < testH - 6; dy += 6) {
            const cy = sampleY + dy;
            const leftIdx = (cy * width + sampleX) * 4;
            const rightIdx = (cy * width + (sampleX + testW)) * 4;
            const centerIdx = (cy * width + (sampleX + Math.floor(testW / 2))) * 4;
            const outLIdx = (cy * width + Math.max(0, sampleX - 6)) * 4;
            const outRIdx = (cy * width + Math.min(width - 1, sampleX + testW + 6)) * 4;

            const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
            const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
            const centerLum = 0.299 * data[centerIdx] + 0.587 * data[centerIdx + 1] + 0.114 * data[centerIdx + 2];
            const outLLum = 0.299 * data[outLIdx] + 0.587 * data[outLIdx + 1] + 0.114 * data[outLIdx + 2];
            const outRLum = 0.299 * data[outRIdx] + 0.587 * data[outRIdx + 1] + 0.114 * data[outRIdx + 2];

            edgeChecks++;

            // Mobile phone optical indicators:
            // 1) Distinct boundary gradient on left or right edge
            const hasEdgeStep = Math.abs(leftLum - outLLum) > 16 || Math.abs(rightLum - outRLum) > 16;
            // 2) Dark border or glass bezel (Lum < 90)
            const hasPhoneBezel = leftLum < 90 || rightLum < 90;
            // 3) Screen difference (reflection, lit screen, or phone glass)
            const hasScreenContrast = Math.abs(centerLum - leftLum) > 14 || Math.abs(centerLum - rightLum) > 14;

            if ((hasEdgeStep || hasPhoneBezel) && hasScreenContrast) {
              bezelAndScreenHits++;
            }
          }

          const confidence = bezelAndScreenHits / (edgeChecks || 1);

          // If over 52% of points match phone border & screen profile
          if (confidence >= 0.52) {
            phoneCandidates.push({
              x: sampleX,
              y: sampleY,
              w: testW,
              h: testH,
              score: confidence,
            });
          }
        }
      }
    }

    if (phoneCandidates.length > 0) {
      phoneCandidates.sort((a, b) => b.score - a.score);
      const best = phoneCandidates[0];
      phoneDetected = true;
      phoneBox = {
        x: best.x,
        y: best.y,
        width: best.w,
        height: best.h,
        label: "📱 MOBILE PHONE",
        isViolation: true,
      };
    }

    return {
      opticalFaces,
      phoneDetected,
      phoneBox,
    };
  }
}

// Export singleton instance
export const proctorVision = new ProctorVisionEngine();
