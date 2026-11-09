import * as THREE from "three";
import type { GameMetrics } from "../types";

export class PerformanceMonitor {
  private frames = 0;
  private elapsed = 0;
  private lowSeconds = 0;
  private fps = 60;
  private quality: "high" | "balanced" = "high";
  private rendererName = "unknown";

  constructor(private renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext();
    const extension = gl.getExtension("WEBGL_debug_renderer_info");
    if (extension) this.rendererName = String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL));
  }

  update(dt: number): void {
    this.frames++;
    this.elapsed += dt;
    if (this.elapsed >= 1) {
      this.fps = Math.round(this.frames / this.elapsed);
      if (this.fps < 42) this.lowSeconds += this.elapsed; else this.lowSeconds = Math.max(0, this.lowSeconds - this.elapsed);
      if (this.lowSeconds > 4 && this.quality === "high") {
        this.quality = "balanced";
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
        this.renderer.shadowMap.enabled = true;
      }
      this.frames = 0;
      this.elapsed = 0;
    }
  }

  getMetrics(): GameMetrics {
    return {
      fps: this.fps,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      quality: this.quality,
      renderer: this.rendererName,
    };
  }
}
