import * as THREE from "three";

export class LightingSystem {
  readonly sun: THREE.DirectionalLight;

  constructor(private scene: THREE.Scene) {
    scene.background = new THREE.Color(0x9ba9a4);
    scene.fog = new THREE.FogExp2(0xb7b6a5, 0.0072);

    const hemisphere = new THREE.HemisphereLight(0xc8d8dd, 0x6b5942, 2.15);
    scene.add(hemisphere);

    this.sun = new THREE.DirectionalLight(0xffc985, 3.25);
    this.sun.position.set(-48, 30, 38);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -62;
    this.sun.shadow.camera.right = 62;
    this.sun.shadow.camera.top = 62;
    this.sun.shadow.camera.bottom = -62;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 150;
    this.sun.shadow.bias = -0.00018;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.radius = 3;
    this.sun.target.position.set(0, 0, -5);
    scene.add(this.sun, this.sun.target);

    const fill = new THREE.DirectionalLight(0x91a8b8, 0.48);
    fill.position.set(35, 20, -40);
    scene.add(fill);

    this.createSky();
  }

  private createSky(): void {
    const geometry = new THREE.SphereGeometry(145, 24, 12);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x6f8f9d) },
        horizonColor: { value: new THREE.Color(0xf0c99b) },
        bottomColor: { value: new THREE.Color(0xd6b48c) },
      },
      vertexShader: `varying vec3 vWorld; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `varying vec3 vWorld; uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor;
        void main(){ float h=normalize(vWorld).y; vec3 c=mix(horizonColor,topColor,smoothstep(0.02,0.65,h)); c=mix(bottomColor,c,smoothstep(-0.18,0.03,h)); gl_FragColor=vec4(c,1.0); }`,
    });
    const sky = new THREE.Mesh(geometry, material);
    sky.userData.dynamic = true;
    this.scene.add(sky);
  }
}
