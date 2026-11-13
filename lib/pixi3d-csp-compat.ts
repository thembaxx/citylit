import "pixi.js/unsafe-eval";
import "@pixi/3d";
import { GlUboSystem, GlUniformGroupSystem, GpuUboSystem } from "pixi.js";

interface UniformFieldSpec {
  type: string;
  size?: number;
  value?: {
    elements?: Float32Array | number[];
    x?: number;
    y?: number;
    z?: number;
    r?: number;
    g?: number;
    b?: number;
  };
}

interface UniformValueSlot {
  location: WebGLUniformLocation | null;
  value: unknown;
}

interface UniformGroupLike {
  uniformStructures: Record<string, UniformFieldSpec>;
  uniforms: Record<string, unknown>;
}

interface UboElementLike {
  data: UniformFieldSpec & { name: string };
  offset: number;
}

interface PixiCustomParser {
  match: (data: UniformFieldSpec) => boolean;
  uploadGl: (
    name: string,
    ud: Record<string, UniformValueSlot>,
    uv: Record<string, unknown>,
    gl: WebGL2RenderingContext | WebGLRenderingContext,
  ) => void;
  uploadUbo: (
    name: string,
    data: Float32Array,
    offset: number,
    uv: Record<string, unknown>,
  ) => void;
}

/** Uploaders for @pixi/3d value types appended past pixi.js/unsafe-eval's built-in 5 parsers. */
const PIXI3D_CUSTOM_PARSERS: readonly PixiCustomParser[] = [
  {
    match: (d) => d.type === "mat4x4<f32>" && d.value?.elements?.length === 16,
    uploadGl: (name, ud, uv, gl) => {
      const val = uv[name] as { elements: Float32List };
      gl.uniformMatrix4fv(ud[name].location, false, val.elements);
    },
    uploadUbo: (name, data, offset, uv) => {
      const el = (uv[name] as { elements: ArrayLike<number> }).elements;
      for (let i = 0; i < 16; i += 1) data[offset + i] = el[i];
    },
  },
  {
    match: (d) => d.type === "mat3x3<f32>" && d.value?.elements?.length === 9,
    uploadGl: (name, ud, uv, gl) => {
      const val = uv[name] as { elements: Float32List };
      gl.uniformMatrix3fv(ud[name].location, false, val.elements);
    },
    uploadUbo: (name, data, offset, uv) => {
      const el = (uv[name] as { elements: ArrayLike<number> }).elements;
      data[offset] = el[0];
      data[offset + 1] = el[1];
      data[offset + 2] = el[2];
      data[offset + 4] = el[3];
      data[offset + 5] = el[4];
      data[offset + 6] = el[5];
      data[offset + 8] = el[6];
      data[offset + 9] = el[7];
      data[offset + 10] = el[8];
    },
  },
  {
    match: (d) => d.type === "vec3<f32>" && d.size === 1 && d.value?.x !== undefined,
    uploadGl: (name, ud, uv, gl) => {
      const cv = ud[name].value as number[];
      const v = uv[name] as { x: number; y: number; z: number };
      if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.z) {
        cv[0] = v.x;
        cv[1] = v.y;
        cv[2] = v.z;
        gl.uniform3f(ud[name].location, v.x, v.y, v.z);
      }
    },
    uploadUbo: (name, data, offset, uv) => {
      const v = uv[name] as { x: number; y: number; z: number };
      data[offset] = v.x;
      data[offset + 1] = v.y;
      data[offset + 2] = v.z;
    },
  },
  {
    match: (d) =>
      d.type === "vec3<f32>" &&
      d.value?.r !== undefined &&
      d.value?.g !== undefined &&
      d.value?.b !== undefined,
    uploadGl: (name, ud, uv, gl) => {
      const cv = ud[name].value as number[];
      const v = uv[name] as { r: number; g: number; b: number };
      if (cv[0] !== v.r || cv[1] !== v.g || cv[2] !== v.b) {
        cv[0] = v.r;
        cv[1] = v.g;
        cv[2] = v.b;
        gl.uniform3f(ud[name].location, v.r, v.g, v.b);
      }
    },
    uploadUbo: (name, data, offset, uv) => {
      const v = uv[name] as { r: number; g: number; b: number };
      data[offset] = v.r;
      data[offset + 1] = v.g;
      data[offset + 2] = v.b;
    },
  },
];

let installed = false;

function findCustomParser(spec: UniformFieldSpec): PixiCustomParser | undefined {
  return PIXI3D_CUSTOM_PARSERS.find((parser) => parser.match(spec));
}

function wrapUboSyncPrototype(proto: Record<string, unknown>) {
  const origGenerateUbo = proto._generateUboSync as (
    elements: UboElementLike[],
  ) => (
    uniforms: Record<string, unknown>,
    data: Float32Array,
    dataInt32: Int32Array,
    offset: number,
  ) => void;
  if (typeof origGenerateUbo !== "function") return;

  proto._generateUboSync = function wrappedGenerateUboSync(
    this: unknown,
    elements: UboElementLike[],
  ) {
    const stdElements: UboElementLike[] = [];
    const customUploads: Array<{
      name: string;
      offsetFloats: number;
      uploadUbo: PixiCustomParser["uploadUbo"];
    }> = [];

    for (const el of elements) {
      const custom = findCustomParser(el.data);
      if (custom) {
        customUploads.push({
          name: el.data.name,
          offsetFloats: el.offset / 4,
          uploadUbo: custom.uploadUbo,
        });
      } else {
        stdElements.push(el);
      }
    }

    const baseSync = origGenerateUbo.call(this, stdElements);
    if (customUploads.length === 0) return baseSync;

    return (
      uniforms: Record<string, unknown>,
      data: Float32Array,
      dataInt32: Int32Array,
      offset: number,
    ) => {
      baseSync(uniforms, data, dataInt32, offset);
      for (const item of customUploads) {
        item.uploadUbo(item.name, data, offset + item.offsetFloats, uniforms);
      }
    };
  };
}

/**
 * Bridges @pixi/3d's extra math/color uniform parsers with pixi.js/unsafe-eval
 * so CSP environments remain free of Function() eval without dropping @pixi/3d types.
 */
export function installPixi3DUnsafeEvalCompat(): void {
  if (installed) return;
  installed = true;

  const uniformProto = GlUniformGroupSystem.prototype as unknown as Record<string, unknown>;
  const origGenerateUniforms = uniformProto._generateUniformsSync as (
    group: UniformGroupLike,
    uniformData: Record<string, unknown>,
  ) => (
    ud: Record<string, UniformValueSlot>,
    uv: Record<string, unknown>,
    renderer: { gl: WebGL2RenderingContext | WebGLRenderingContext },
    syncData?: unknown,
  ) => void;

  if (typeof origGenerateUniforms === "function") {
    uniformProto._generateUniformsSync = function wrappedGenerateUniformsSync(
      this: unknown,
      group: UniformGroupLike,
      uniformData: Record<string, unknown>,
    ) {
      const stdStructures: Record<string, UniformFieldSpec> = {};
      const customUploads: Array<{ name: string; uploadGl: PixiCustomParser["uploadGl"] }> = [];

      for (const name of Object.keys(group.uniformStructures)) {
        if (!uniformData[name]) continue;
        const spec = group.uniformStructures[name];
        const custom = findCustomParser(spec);
        if (custom) {
          customUploads.push({ name, uploadGl: custom.uploadGl });
        } else {
          stdStructures[name] = spec;
        }
      }

      const filteredGroup: UniformGroupLike = {
        uniformStructures: stdStructures,
        uniforms: group.uniforms,
      };
      const baseSync = origGenerateUniforms.call(this, filteredGroup, uniformData);
      if (customUploads.length === 0) return baseSync;

      return (
        ud: Record<string, UniformValueSlot>,
        uv: Record<string, unknown>,
        renderer: { gl: WebGL2RenderingContext | WebGLRenderingContext },
        syncData?: unknown,
      ) => {
        baseSync(ud, uv, renderer, syncData);
        for (const item of customUploads) {
          item.uploadGl(item.name, ud, uv, renderer.gl);
        }
      };
    };
  }

  wrapUboSyncPrototype(GlUboSystem.prototype as unknown as Record<string, unknown>);
  wrapUboSyncPrototype(GpuUboSystem.prototype as unknown as Record<string, unknown>);
}
