// Shared renderer, lighting and backdrop for the card scenes.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export const TAU = Math.PI * 2;
export const COLORS = { cyan: 0x22d3ee, violet: 0xa78bfa, pink: 0xf472b6, green: 0x4ade80, amber: 0xfbbf24, red: 0xf87171 };

export function seeded(seed = 7) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export function glassMaterial(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.4, ior: 1.5,
    dispersion: 1, iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 620],
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2,
    attenuationColor: new THREE.Color(0x9d8cff), attenuationDistance: 5, ...opts,
  });
}

export function glow(color, k = 2.5) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });
}

export function createStage(canvas, { capture, bloom = [0.5, 0.4, 0.9] } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: capture });
  renderer.setPixelRatio(capture ? devicePixelRatio : Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x05070f, 1);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.set(0, 0, 12);

  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-4, 5, 6); scene.add(key);
  const rimV = new THREE.PointLight(COLORS.violet, 90, 20); rimV.position.set(4, 2, -3); scene.add(rimV);
  const rimP = new THREE.PointLight(COLORS.pink, 40, 20); rimP.position.set(-3, -3, 2); scene.add(rimP);

  // soft nebula + grid backdrop, tinted per card
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      depthWrite: false, depthTest: false,
      uniforms: { uTint: { value: new THREE.Color(COLORS.violet) }, uAspect: { value: 1 }, uHaze: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }`,
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uTint; uniform float uAspect; uniform float uHaze;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.);
          return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float v=0., a=.5; mat2 r = mat2(.8,.6,-.6,.8); for(int i=0;i<6;i++){ v+=a*n(p); p=r*p*2.03; a*=.5; } return v; }
        void main(){
          vec2 p = vUv * vec2(uAspect, 1.);
          float f = fbm(p * 2.4 + fbm(p * 1.3));
          vec3 col = vec3(.014,.018,.04);
          col += uTint * .2 * uHaze * smoothstep(.45, 1., f) * smoothstep(.85, .0, distance(vUv, vec2(.5, .72)));
          col += vec3(.13,.83,.93) * .05 * smoothstep(.6, 1., f) * smoothstep(.7, .0, distance(vUv, vec2(.9, .95)));
          vec2 g = p * 22.;
          float grid = (1.-smoothstep(0.,.05,abs(fract(g.x)-.5)-.45)) + (1.-smoothstep(0.,.05,abs(fract(g.y)-.5)-.45));
          col += vec3(.4,.5,1.) * grid * .016 * smoothstep(.25, .8, vUv.y);
          col += h(vUv * 917.) > .997 ? vec3(.6) * h(vUv * 31.) : vec3(0.);
          gl_FragColor = vec4(col, 1.);
        }`,
    })
  );
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), ...bloom));
  composer.addPass(new OutputPass());
  // 8-bit dither after tone mapping: hides banding in dark gradients. Static per pixel so frames stay identical where nothing moves.
  const dither = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb += (h(gl_FragCoord.xy) - .5) / 255.; gl_FragColor = c; }`,
  });
  composer.addPass(dither);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    backdrop.material.uniforms.uAspect.value = w / h;
  }
  addEventListener("resize", resize);
  resize();

  return { THREE, renderer, scene, camera, composer, backdrop };
}
