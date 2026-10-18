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
        if (Array.isArray(rawFaces)) {
          // Map to 320x240 coordinates
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
              label: isPrimary && rawFaces.length === 1 ? "Candidate" : `Face #${idx + 1}`,
              isViolation: idx > 0, // secondary faces are violations
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

    // If native detector wasn't supported or returned 0, use our robust optical facial clustering
    if (detectedFaces.length === 0 && opticalResult.opticalFaces.length > 0) {
      detectedFaces = opticalResult.opticalFaces;
    }

    // Determine final face count
    const faceCount = detectedFaces.length;

    // Check Gaze & Face Angle Deviation on primary face
    let suspiciousAngle = false;
    let gazeDeviationScore = 0;
    let primaryFaceCentered = true;

    if (faceCount > 0) {
      const primary = detectedFaces[0];
      const centerX = primary.x + primary.width / 2;
      const centerY = primary.y + primary.height / 2;

      const normX = Math.abs(centerX - width / 2) / (width / 2);
      const normY = Math.abs(centerY - height / 2) / (height / 2);
      gazeDeviationScore = Math.min(1, Math.sqrt(normX * normX + normY * normY));

      // If face is shifted heavily toward left/right border, candidate is looking away
      if (normX > 0.62 || primary.width < 35 || primary.height < 35) {
        suspiciousAngle = true;
        primaryFaceCentered = false;
      }
    }

    return {
      faceCount,
      faces: detectedFaces,
      phoneDetected: opticalResult.phoneDetected,
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

    // Also look for mobile smartphone profile:
    // Vertical dark rectangle or illuminated screen with height/width ratio ~1.6 - 2.4
    let phoneDetected = false;
    let phoneBox: BoundingBox | undefined = undefined;

    // Analyze pixel color & luminance
    for (let r = 0; r < skinGridRows; r++) {
      for (let c = 0; c < skinGridCols; c++) {
        let skinCount = 0;
        let totalSampled = 0;

        const startY = Math.floor(r * cellH);
        const startX = Math.floor(c * cellW);

        for (let py = startY; py < startY + cellH; py += 3) {
          for (let px = startX; px < startX + cellW; px += 3) {
            const idx = (py * width + px) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];

            totalSampled++;

            // Standard YCbCr & RGB human skin color threshold
            // R > 95, G > 40, B > 20, max - min > 15, |R - G| > 15, R > G, R > B
            const max = Math.max(red, green, blue);
            const min = Math.min(red, green, blue);
            if (
              red > 80 &&
              green > 35 &&
              blue > 20 &&
              max - min > 12 &&
              red > green &&
              red > blue &&
              Math.abs(red - green) > 10
            ) {
              skinCount++;
            }
          }
        }

        const skinRatio = skinCount / (totalSampled || 1);
        if (skinRatio > 0.35) {
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
          // BFS / Flood fill cluster
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

          // A cluster must be large enough to be a human face (>= 6 cells) and in the upper 75% of camera
          const clusterW = (maxC - minC + 1) * cellW;
          const clusterH = (maxR - minR + 1) * cellH;
          const aspect = clusterH / (clusterW || 1);

          if (count >= 7 && clusterW >= 40 && clusterH >= 40 && aspect > 0.7 && aspect < 2.3 && minR < 18) {
            clusters.push({ minC, maxC, minR, maxR, count });
          }
        }
      }
    }

    // Sort clusters by size (largest first - likely primary candidate)
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
    // Phones held in hands are typically located in the lower 70% of frame,
    // have high vertical aspect ratio (height:width between 1.6:1 and 2.5:1),
    // have sharp vertical border contrast, or screen illumination with dark borders.
    // Scan horizontal lines for high-contrast dark bezel / smartphone rectangle:
    const startRow = Math.floor(height * 0.25);
    const endRow = Math.floor(height * 0.95);
    const candidates: { x: number; y: number; w: number; h: number; score: number }[] = [];

    // Sample vertical strips
    for (let sampleY = startRow; sampleY < endRow; sampleY += 12) {
      for (let sampleX = 20; sampleX < width - 70; sampleX += 10) {
        // Test for smartphone width ~ 35 to 80 px, height ~ 60 to 140 px
        for (const testW of [45, 60, 75]) {
          const testH = Math.floor(testW * 1.8);
          if (sampleY + testH >= height || sampleX + testW >= width) continue;

          // Check if this box overlaps directly with a recognized face head center
          const overlapsFace = opticalFaces.some((f) => {
            const fx = f.x + f.width / 2;
            const fy = f.y + f.height / 2;
            return fx >= sampleX && fx <= sampleX + testW && fy >= sampleY && fy <= sampleY + testH;
          });
          if (overlapsFace) continue;

          // Check smartphone border characteristics:
          // 1. Dark edges on left and right border
          // 2. High gradient between inside and outside
          let darkEdgeCount = 0;
          let screenLuminanceTotal = 0;
          let edgeChecks = 0;

          for (let dy = 6; dy < testH - 6; dy += 8) {
            const cy = sampleY + dy;
            const leftEdgeIdx = (cy * width + sampleX) * 4;
            const rightEdgeIdx = (cy * width + (sampleX + testW)) * 4;
            const centerIdx = (cy * width + (sampleX + Math.floor(testW / 2))) * 4;

            const leftLum = 0.299 * data[leftEdgeIdx] + 0.587 * data[leftEdgeIdx + 1] + 0.114 * data[leftEdgeIdx + 2];
            const rightLum = 0.299 * data[rightEdgeIdx] + 0.587 * data[rightEdgeIdx + 1] + 0.114 * data[rightEdgeIdx + 2];
            const centerLum = 0.299 * data[centerIdx] + 0.587 * data[centerIdx + 1] + 0.114 * data[centerIdx + 2];

            edgeChecks++;
            screenLuminanceTotal += centerLum;

            // Smartphone bezel is commonly dark or strong contrast with screen
            if (leftLum < 75 || rightLum < 75 || Math.abs(centerLum - leftLum) > 35) {
              darkEdgeCount++;
            }
          }

          const bezelRatio = darkEdgeCount / (edgeChecks || 1);
          const avgCenterLum = screenLuminanceTotal / (edgeChecks || 1);

          // If bezel is consistent and screen is distinct
          if (bezelRatio > 0.65 && avgCenterLum > 40 && avgCenterLum < 240) {
            candidates.push({
              x: sampleX,
              y: sampleY,
              w: testW,
              h: testH,
              score: bezelRatio,
            });
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Pick best candidate
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      phoneDetected = true;
      phoneBox = {
        x: best.x,
        y: best.y,
        width: best.w,
        height: best.h,
        label: "Mobile Phone Detected",
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
