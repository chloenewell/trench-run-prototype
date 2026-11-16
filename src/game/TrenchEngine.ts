import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  MINIGAME_1_PACKETS,
  MINIGAME_2_NODES,
  MINIGAME_3_CHAIN_LINKS,
} from '../data/curriculum';
import { soundEngine } from '../audio/soundEngine';
import { GameStage, MiniGameHUDState } from '../types/game';
import {
  CipherRig,
  createCipherModel,
  createCoreMonumentModel,
  createEventPacketModel,
  createFirewallObstacleModel,
  createHoverCraftModel,
  createRunnerModel,
  createServerTower,
  RunnerRig,
} from './models';
import {
  createContactShadowTexture,
  createGridTileTexture,
  createHoloBoardTexture,
} from './textures';

// Pre-allocated math helpers outside render loop (zero GC)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();

interface TrackTile {
  mesh: THREE.Mesh;
  strip: THREE.Mesh;
  flash: number;
}

interface SpawnedPacket {
  id: number;
  order: number;
  label: string;
  wrongHint: string;
  lane: number;
  x: number;
  z: number;
  group: THREE.Group;
  crystal: THREE.Mesh;
  ring: THREE.Mesh;
  collected: boolean;
}

interface SpawnedObstacle {
  lane: number;
  x: number;
  z: number;
  oscillatePhase: number;
  oscillateAmp: number;
  group: THREE.Group;
  hit: boolean;
}

interface CanyonBarrier {
  order: number;
  z: number;
  gapY: number;
  gapHalfHeight: number;
  group: THREE.Group;
  nodeCrystal: THREE.Mesh;
  cleared: boolean;
  bumped: boolean;
}

interface ParticleBurst {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: MiniGameHUDState) => void;
  onMiniGameComplete: (gameNum: 1 | 2 | 3, elapsedSeconds: number, wrongHits: number) => void;
  onContextLost: (lost: boolean) => void;
}

export class TrenchEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private paused = false;
  private maxAnisotropy = 4;

  private stage: GameStage = 'TITLE';
  private elapsed = 0;

  // Lighting
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.PointLight;

  // Hero Models
  private runnerRig!: RunnerRig;
  private hoverCraft!: THREE.Group;
  private cipherRig!: CipherRig;
  private coreMonument!: THREE.Group;
  private holoBoard!: THREE.Mesh;
  private chamberGroup!: THREE.Group;
  private chamberPadRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;

  // Runway & Towers
  private runwayGroup!: THREE.Group;
  private trackTiles: TrackTile[] = [];
  private serverTowers: THREE.Group[] = [];
  private driftlineGroup!: THREE.Group;
  private driftRibbons: THREE.Mesh[] = [];
  private effectContainerPortal!: THREE.Group;
  private canyonWallGroup!: THREE.Group;
  private starPoints!: THREE.Points;

  // Mini-game dynamic state
  private activeGame: 1 | 2 | 3 | null = null;
  private gameTime = 0;
  private collectedCount = 0;
  private wrongHits = 0;
  private runnerLane = 1; // 0, 1, 2
  private runnerX = 0;
  private runnerY = 0;
  private runnerVy = 0;
  private steerInput = 0; // -1..1 for MG2
  private thrusterHeld = false; // MG3 ascend
  private boostTimer = 0;
  private slowdownTimer = 0;
  private shieldFlashTimer = 0;
  private invulnTimer = 0;
  private spawnCooldown = 0;
  private nextPacketId = 1;
  private effectPortalSpawned = false;
  private effectPortalZ = -65;

  private packets: SpawnedPacket[] = [];
  private obstacles: SpawnedObstacle[] = [];
  private barriers: CanyonBarrier[] = [];
  private particles: ParticleBurst[] = [];

  private feedbackBanner: MiniGameHUDState['feedbackBanner'] = null;
  private hudSyncTimer = 0;

  // Camera damping targets
  private camPos = new THREE.Vector3(0, 3.2, 8.5);
  private camTarget = new THREE.Vector3(0, 1.5, 0);
  private targetFov = 58;

  // Shared particle geo/mats
  private particleGeo = new THREE.OctahedronGeometry(0.12, 0);
  private particleCyanMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true });
  private particleVioletMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true });
  private particleOrangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true });

  // Bound handlers
  private handleResizeBound: () => void;
  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.handleResizeBound = this.onResize.bind(this);
    this.handleKeyDownBound = this.onKeyDown.bind(this);
    this.handleKeyUpBound = this.onKeyUp.bind(this);

    this.initRenderer();
    this.initScene();
    this.buildWorld();
    this.setStage('TITLE');

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResizeBound);
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);

    this.clock.start();
    this.startLoop();
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRenderer(): void {
    this.isSoftwareGl = this.detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy() || 1);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.callbacks.onContextLost(true);
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.callbacks.onContextLost(false);
    });

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040713);
    this.scene.fog = new THREE.FogExp2(0x040713, 0.017);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 180);
    this.camera.position.copy(this.camPos);

    // Studio environment reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-point warm/cool studio & cyberpunk rig
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    this.keyLight.position.set(8, 16, 10);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    const d = 14;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0xa855f7, 6.0, 28, 1.5);
    this.rimLight.position.set(-4, 5, -4);
    this.scene.add(this.rimLight);
  }

  private buildWorld(): void {
    // 1. Starfield / ambient cyber particles
    const starCount = 450;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = Math.random() * 34 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140 - 30;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.72,
    });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);

    // 2. Hero Models
    this.runnerRig = createRunnerModel();
    this.scene.add(this.runnerRig.root);

    this.hoverCraft = createHoverCraftModel();
    this.hoverCraft.visible = false;
    this.scene.add(this.hoverCraft);

    this.cipherRig = createCipherModel();
    this.cipherRig.root.position.set(-2.3, 0, -1.2);
    this.scene.add(this.cipherRig.root);

    // Contact shadow grounding
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    this.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.02;
    this.scene.add(this.contactShadow);

    // 3. Chamber Environment (Spawn Bay / Signal Tower / Server Vault / The Core)
    this.chamberGroup = new THREE.Group();
    const padBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6.2, 0.22, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b1224, roughness: 0.45, metalness: 0.75 })
    );
    padBase.position.y = -0.11;
    padBase.receiveShadow = true;
    this.chamberGroup.add(padBase);

    this.chamberPadRing = new THREE.Mesh(
      new THREE.TorusGeometry(4.4, 0.07, 10, 64),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    this.chamberPadRing.rotation.x = Math.PI / 2;
    this.chamberPadRing.position.y = 0.02;
    this.chamberGroup.add(this.chamberPadRing);

    // Holographic board in chamber
    const boardTex = createHoloBoardTexture(
      'CAUSE & EFFECT CHAIN',
      '1963 Surtsey Eruption Report',
      ['Pressure Builds', 'Seafloor Cracks', 'Lava Pours Out', 'Island Forms'],
      this.maxAnisotropy
    );
    this.holoBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 2.6),
      new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, side: THREE.DoubleSide })
    );
    this.holoBoard.position.set(-0.2, 2.4, -3.5);
    this.chamberGroup.add(this.holoBoard);

    this.coreMonument = createCoreMonumentModel();
    this.coreMonument.position.set(0, 0, -14);
    this.coreMonument.visible = false;
    this.chamberGroup.add(this.coreMonument);

    this.scene.add(this.chamberGroup);

    // 4. Grid Runway (used during mini-games & distant skyline)
    this.runwayGroup = new THREE.Group();
    const tileTex = createGridTileTexture(this.maxAnisotropy);
    const tileGeo = new THREE.BoxGeometry(9.6, 0.2, 5.2);
    const stripGeo = new THREE.BoxGeometry(9.4, 0.06, 0.16);

    for (let i = 0; i < 24; i++) {
      const tileMat = new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.38,
        metalness: 0.72,
        emissive: new THREE.Color(0x082f49),
        emissiveIntensity: 0.45,
      });
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.position.set(0, -0.1, 10 - i * 5.4);
      tile.receiveShadow = true;

      const stripMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 0.03, tile.position.z);

      this.runwayGroup.add(tile, strip);
      this.trackTiles.push({ mesh: tile, strip, flash: 0 });
    }

    // Side rails & illuminated server towers bordering the trench
    for (let i = 0; i < 18; i++) {
      const zPos = 10 - i * 7.5;
      const hL = 8 + ((i * 5) % 9);
      const hR = 9 + ((i * 7) % 10);
      const towerL = createServerTower(hL, i % 2 === 0 ? '#22d3ee' : '#a855f7', this.maxAnisotropy);
      towerL.position.set(-8.6 - (i % 2) * 1.4, -1.5, zPos);
      const towerR = createServerTower(hR, i % 2 === 0 ? '#a855f7' : '#22d3ee', this.maxAnisotropy);
      towerR.position.set(8.6 + (i % 2) * 1.4, -1.5, zPos);
      this.runwayGroup.add(towerL, towerR);
      this.serverTowers.push(towerL, towerR);
    }

    this.scene.add(this.runwayGroup);

    // 5. Driftlines for Mini-Game 2
    this.driftlineGroup = new THREE.Group();
    for (let lane = -1; lane <= 1; lane++) {
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 24; step++) {
        const z = 8 - step * 5;
        const x = lane * 2.9 + Math.sin(step * 0.45 + lane) * 0.7;
        points.push(new THREE.Vector3(x, 0.08, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: lane === 0 ? 0xa855f7 : 0x22d3ee,
        transparent: true,
        opacity: 0.78,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this.driftlineGroup.add(tube);
      this.driftRibbons.push(tube);
    }
    this.driftlineGroup.visible = false;
    this.scene.add(this.driftlineGroup);

    // Effect Container Portal for MG2 finish
    this.effectContainerPortal = new THREE.Group();
    const portalRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.24, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    portalRing.position.y = 3.2;
    const portalCore = new THREE.Mesh(
      new THREE.CircleGeometry(2.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
      })
    );
    portalCore.position.y = 3.2;
    this.effectContainerPortal.add(portalRing, portalCore);
    this.effectContainerPortal.visible = false;
    this.scene.add(this.effectContainerPortal);

    // 6. Canyon Wall Circuit Nodes for Mini-Game 3
    this.canyonWallGroup = new THREE.Group();
    const nodeGeo = new THREE.BoxGeometry(0.45, 0.45, 2.2);
    const nodeMatCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const nodeMatViolet = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    for (let i = 0; i < 20; i++) {
      const nL = new THREE.Mesh(nodeGeo, i % 2 === 0 ? nodeMatCyan : nodeMatViolet);
      nL.position.set(-5.2, 1.5 + (i % 4) * 2.0, 6 - i * 6);
      const nR = new THREE.Mesh(nodeGeo, i % 2 === 0 ? nodeMatViolet : nodeMatCyan);
      nR.position.set(5.2, 2.0 + ((i + 2) % 4) * 2.0, 6 - i * 6);
      this.canyonWallGroup.add(nL, nR);
    }
    this.canyonWallGroup.visible = false;
    this.scene.add(this.canyonWallGroup);
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public setStage(nextStage: GameStage): void {
    this.stage = nextStage;
    this.clearDynamicEntities();
    this.boostTimer = 0;
    this.slowdownTimer = 0;
    this.shieldFlashTimer = 0;
    this.invulnTimer = 0;
    this.feedbackBanner = null;
    this.thrusterHeld = false;
    this.steerInput = 0;

    // Default visibility resets
    this.runnerRig.root.visible = true;
    this.hoverCraft.visible = false;
    this.cipherRig.root.visible = true;
    this.chamberGroup.visible = true;
    this.holoBoard.visible = true;
    this.coreMonument.visible = false;
    this.driftlineGroup.visible = false;
    this.effectContainerPortal.visible = false;
    this.canyonWallGroup.visible = false;

    if (nextStage === 'TITLE') {
      this.activeGame = null;
      this.runnerRig.root.position.set(1.3, 0, 0.2);
      this.runnerRig.root.rotation.set(0, -0.35, 0);
      this.cipherRig.root.position.set(-1.35, 0, 0.4);
      this.cipherRig.root.rotation.set(0, 0.35, 0);
      this.updateHoloBoard(
        'THE EARTH NEVER STOPS',
        '1963 Surtsey Expedition · RI.4.3',
        ['Pressure Builds', 'Eruption Starts', 'Lava Hardens', 'Life Arrives']
      );
      (this.chamberPadRing.material as THREE.MeshBasicMaterial).color.setHex(0xa855f7);
      this.targetFov = 54;
    } else if (nextStage === 'STAGE_1_I_DO') {
      this.activeGame = null;
      this.runnerRig.root.position.set(1.6, 0, 0.8);
      this.runnerRig.root.rotation.set(0, -0.45, 0);
      this.cipherRig.root.position.set(-2.3, 0, -1.2);
      this.cipherRig.root.rotation.set(0, 0.45, 0);
      this.updateHoloBoard(
        'THINK-ALOUD: CAUSE & EFFECT',
        'Paragraph 1 · Birth of Surtsey',
        ['Pressure Builds', 'Seafloor Cracks', 'Lava Pours Out', 'New Island Forms']
      );
      this.targetFov = 55;
    } else if (nextStage === 'STAGE_2_WE_DO') {
      this.activeGame = null;
      this.runnerRig.root.position.set(1.6, 0, 0.8);
      this.runnerRig.root.rotation.set(0, -0.45, 0);
      this.cipherRig.root.position.set(-2.1, 0, -1.0);
      this.cipherRig.root.rotation.set(0, 0.5, 0);
      this.updateHoloBoard(
        'SIGNAL TOWER: WE DO',
        'Paragraph 2 · Building the Rock Shield',
        ['Waves Erode Ash', 'Crack Erupts', 'Lava Hardens', 'Island Protected']
      );
      this.targetFov = 55;
    } else if (nextStage === 'STAGE_3_YOU_DO') {
      this.activeGame = null;
      // Cipher physically steps away from console for YOU DO independence
      this.runnerRig.root.position.set(0.9, 0, 0.2);
      this.runnerRig.root.rotation.set(0, -0.15, 0);
      this.cipherRig.root.position.set(-4.2, 0, 1.4);
      this.cipherRig.root.rotation.set(0, 0.75, 0);
      this.updateHoloBoard(
        'SERVER VAULT: YOU DO',
        'Paragraph 3 · Build the Ecosystem Chain',
        ['Island Stable', 'Seeds & Spores', 'Seabirds Nest', 'Busy Ecosystem']
      );
      this.targetFov = 56;
    } else if (nextStage === 'STAGE_4_CORE') {
      this.activeGame = null;
      this.runnerRig.root.position.set(1.4, 0, 0.5);
      this.runnerRig.root.rotation.set(0, -0.25, 0);
      this.cipherRig.root.position.set(-1.7, 0, 0.3);
      this.cipherRig.root.rotation.set(0, 0.35, 0);
      this.coreMonument.visible = true;
      this.holoBoard.visible = false;
      this.targetFov = 58;
    } else if (nextStage === 'MINIGAME_1_INTRO' || nextStage === 'MINIGAME_1' || nextStage === 'MINIGAME_1_COMPLETE') {
      this.setupMiniGame1(nextStage === 'MINIGAME_1');
    } else if (nextStage === 'MINIGAME_2_INTRO' || nextStage === 'MINIGAME_2' || nextStage === 'MINIGAME_2_COMPLETE') {
      this.setupMiniGame2(nextStage === 'MINIGAME_2');
    } else if (nextStage === 'MINIGAME_3_INTRO' || nextStage === 'MINIGAME_3' || nextStage === 'MINIGAME_3_COMPLETE') {
      this.setupMiniGame3(nextStage === 'MINIGAME_3');
    }

    this.emitHudSnapshot();
  }

  private updateHoloBoard(heading: string, subline: string, steps: string[]): void {
    const mat = this.holoBoard.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.map = createHoloBoardTexture(heading, subline, steps, this.maxAnisotropy);
    mat.needsUpdate = true;
  }

  private setupMiniGame1(isRunning: boolean): void {
    this.activeGame = 1;
    this.chamberGroup.visible = false;
    this.cipherRig.root.visible = false;
    this.runnerRig.root.visible = true;
    this.runnerRig.root.rotation.set(0, Math.PI, 0); // facing down -Z track
    this.runnerLane = 1;
    this.runnerX = 0;
    this.runnerY = 0;
    this.runnerVy = 0;
    this.runnerRig.root.position.set(0, 0, 0);
    this.targetFov = 62;

    if (isRunning) {
      this.gameTime = 0;
      this.collectedCount = 0;
      this.wrongHits = 0;
      this.spawnCooldown = 0.6;
      this.spawnMG1Wave(-32);
      this.spawnMG1Wave(-56);
    }
  }

  private setupMiniGame2(isRunning: boolean): void {
    this.activeGame = 2;
    this.chamberGroup.visible = false;
    this.cipherRig.root.visible = false;
    this.runnerRig.root.visible = false;
    this.hoverCraft.visible = true;
    this.hoverCraft.rotation.set(0, Math.PI, 0);
    this.driftlineGroup.visible = true;
    this.runnerX = 0;
    this.runnerY = 0;
    this.hoverCraft.position.set(0, 0.15, 0);
    this.effectPortalSpawned = false;
    this.effectPortalZ = -65;
    this.targetFov = 64;

    if (isRunning) {
      this.gameTime = 0;
      this.collectedCount = 0;
      this.wrongHits = 0;
      this.spawnCooldown = 0.5;
      this.spawnMG2Wave(-34);
      this.spawnMG2Wave(-58);
    }
  }

  private setupMiniGame3(isRunning: boolean): void {
    this.activeGame = 3;
    this.chamberGroup.visible = false;
    this.cipherRig.root.visible = false;
    this.runnerRig.root.visible = true;
    this.runnerRig.root.rotation.set(0, Math.PI, 0);
    this.canyonWallGroup.visible = true;
    this.coreMonument.visible = true;
    this.chamberGroup.visible = true;
    this.holoBoard.visible = false;
    this.coreMonument.position.set(0, 1.8, -82);

    this.runnerX = 0;
    this.runnerY = 4.2;
    this.runnerVy = 0;
    this.runnerRig.root.position.set(0, 4.2, 0);
    this.targetFov = 60;

    if (isRunning) {
      this.gameTime = 0;
      this.collectedCount = 0;
      this.wrongHits = 0;
      this.spawnCooldown = 0.9;
      this.spawnMG3Barrier(1, -36);
    }
  }

  private disposeGroupResources(group: THREE.Group): void {
    this.scene.remove(group);
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m) {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          }
        }
      }
    });
  }

  private clearDynamicEntities(): void {
    for (const p of this.packets) this.disposeGroupResources(p.group);
    for (const o of this.obstacles) this.disposeGroupResources(o.group);
    for (const b of this.barriers) this.disposeGroupResources(b.group);
    for (const pt of this.particles) this.scene.remove(pt.mesh);
    this.packets = [];
    this.obstacles = [];
    this.barriers = [];
    this.particles = [];
  }

  // --- Spawners ---
  private spawnMG1Wave(zPos: number): void {
    const neededOrder = Math.min(4, this.collectedCount + 1);
    const lanes = [0, 1, 2];
    // Shuffle lanes deterministically-ish
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    // Lane A: guaranteed needed packet
    const targetSpec = MINIGAME_1_PACKETS[neededOrder - 1];
    this.addPacketEntity(targetSpec.order, targetSpec.shortLabel, targetSpec.wrongOrderHint, lanes[0], zPos, true);

    // Lane B: wrong-order packet to test comprehension!
    const otherOrders = MINIGAME_1_PACKETS.filter((p) => p.order !== neededOrder);
    const distractor = otherOrders[Math.floor(Math.random() * otherOrders.length)];
    this.addPacketEntity(distractor.order, distractor.shortLabel, distractor.wrongOrderHint, lanes[1], zPos - 4, false);

    // Lane C: moving firewall obstacle
    if (Math.random() < 0.85) {
      const obs = createFirewallObstacleModel(2.2, 1.35);
      const laneX = (lanes[2] - 1) * 2.8;
      obs.position.set(laneX, 0, zPos - 2);
      this.scene.add(obs);
      this.obstacles.push({
        lane: lanes[2],
        x: laneX,
        z: zPos - 2,
        oscillatePhase: Math.random() * Math.PI * 2,
        oscillateAmp: Math.random() < 0.45 ? 1.1 : 0,
        group: obs,
        hit: false,
      });
    }
  }

  private spawnMG2Wave(zPos: number): void {
    const neededOrder = Math.min(5, this.collectedCount + 1);
    const targetSpec = MINIGAME_2_NODES[neededOrder - 1];
    const xPosTarget = (Math.random() - 0.5) * 7.2;
    this.addPacketEntity(targetSpec.order, targetSpec.shortLabel, targetSpec.wrongOrderHint, 1, zPos, true, xPosTarget);

    // Also spawn an out-of-order node on the other side
    const otherNodes = MINIGAME_2_NODES.filter((n) => n.order !== neededOrder);
    const distractor = otherNodes[Math.floor(Math.random() * otherNodes.length)];
    const xPosOther = xPosTarget > 0 ? -Math.abs(xPosTarget) - 1.2 : Math.abs(xPosTarget) + 1.2;
    const clampedOther = THREE.MathUtils.clamp(xPosOther, -4.2, 4.2);
    this.addPacketEntity(
      distractor.order,
      distractor.shortLabel,
      distractor.wrongOrderHint,
      1,
      zPos - 6,
      false,
      clampedOther
    );
  }

  private addPacketEntity(
    order: number,
    label: string,
    wrongHint: string,
    lane: number,
    zPos: number,
    isTargetNow: boolean,
    customX?: number
  ): void {
    const x = customX !== undefined ? customX : (lane - 1) * 2.8;
    const visual = createEventPacketModel(order, label, isTargetNow, this.maxAnisotropy);
    visual.group.position.set(x, 0, zPos);
    this.scene.add(visual.group);

    this.packets.push({
      id: this.nextPacketId++,
      order,
      label,
      wrongHint,
      lane,
      x,
      z: zPos,
      group: visual.group,
      crystal: visual.crystal,
      ring: visual.ring,
      collected: false,
    });
  }

  private spawnMG3Barrier(order: number, zPos: number): void {
    const group = new THREE.Group();
    const gapY = 2.6 + Math.random() * 3.4;
    const gapHalfHeight = Math.max(1.35, 1.72 - order * 0.06);

    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.45,
      roughness: 0.25,
      metalness: 0.6,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.4,
      metalness: 0.85,
    });

    // Bottom barrier up to (gapY - gapHalfHeight)
    const bottomHeight = Math.max(0.4, gapY - gapHalfHeight);
    const bottomMesh = new THREE.Mesh(new THREE.BoxGeometry(7.2, bottomHeight, 0.65), beamMat);
    bottomMesh.position.y = bottomHeight / 2;
    group.add(bottomMesh);

    // Top barrier from (gapY + gapHalfHeight) up to 9.5
    const topStart = gapY + gapHalfHeight;
    const topHeight = Math.max(0.5, 9.5 - topStart);
    const topMesh = new THREE.Mesh(new THREE.BoxGeometry(7.2, topHeight, 0.65), beamMat);
    topMesh.position.y = topStart + topHeight / 2;
    group.add(topMesh);

    // Side pylons
    const pylonGeo = new THREE.BoxGeometry(0.5, 9.6, 0.9);
    const pL = new THREE.Mesh(pylonGeo, frameMat);
    pL.position.set(-3.8, 4.8, 0);
    const pR = new THREE.Mesh(pylonGeo, frameMat);
    pR.position.set(3.8, 4.8, 0);
    group.add(pL, pR);

    // Circuit link node floating inside navigable gap
    const nodeCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 0),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.8,
        roughness: 0.15,
        metalness: 0.8,
      })
    );
    nodeCrystal.position.set(0, gapY, 0);
    group.add(nodeCrystal);

    group.position.set(0, 0, zPos);
    this.scene.add(group);

    this.barriers.push({
      order,
      z: zPos,
      gapY,
      gapHalfHeight,
      group,
      nodeCrystal,
      cleared: false,
      bumped: false,
    });
  }

  private spawnBurst(x: number, y: number, z: number, colorType: 'cyan' | 'violet' | 'orange'): void {
    const mat =
      colorType === 'cyan'
        ? this.particleCyanMat
        : colorType === 'violet'
          ? this.particleVioletMat
          : this.particleOrangeMat;
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 7,
        vy: Math.random() * 5 + 1.5,
        vz: (Math.random() - 0.5) * 6,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.25,
      });
    }
  }

  // --- Controls API (Keyboard + On-Screen Touch) ---
  public triggerLaneLeft(): void {
    if (this.paused || this.stage !== 'MINIGAME_1') return;
    if (this.runnerLane > 0) {
      this.runnerLane--;
      soundEngine.playLaneShift();
    }
  }

  public triggerLaneRight(): void {
    if (this.paused || this.stage !== 'MINIGAME_1') return;
    if (this.runnerLane < 2) {
      this.runnerLane++;
      soundEngine.playLaneShift();
    }
  }

  public triggerJump(): void {
    if (this.paused || this.stage !== 'MINIGAME_1') return;
    if (this.runnerY <= 0.08) {
      this.runnerVy = 11.4;
      soundEngine.playJump();
    }
  }

  public setSteerInput(val: number): void {
    this.steerInput = THREE.MathUtils.clamp(val, -1, 1);
  }

  public setThrusterHeld(held: boolean): void {
    if (held && !this.thrusterHeld && this.stage === 'MINIGAME_3' && !this.paused) {
      soundEngine.playThrusterPulse();
    }
    this.thrusterHeld = held;
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Do not intercept typing inside textareas or inputs (Stage 3 Challenge 2)
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;

    if (this.stage === 'MINIGAME_1') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this.triggerLaneLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this.triggerLaneRight();
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.triggerJump();
      }
    } else if (this.stage === 'MINIGAME_2') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this.steerInput = -1;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this.steerInput = 1;
      }
    } else if (this.stage === 'MINIGAME_3') {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.setThrusterHeld(true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (this.stage === 'MINIGAME_2') {
      if (
        (e.code === 'ArrowLeft' || e.code === 'KeyA') &&
        this.steerInput < 0
      ) {
        this.steerInput = 0;
      } else if (
        (e.code === 'ArrowRight' || e.code === 'KeyD') &&
        this.steerInput > 0
      ) {
        this.steerInput = 0;
      }
    } else if (this.stage === 'MINIGAME_3') {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.setThrusterHeld(false);
      }
    }
  }

  // --- Main Loop ---
  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const rawDelta = this.clock.getDelta();
      const dt = Math.min(rawDelta, 0.05);

      if (!this.paused) {
        this.update(dt);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number): void {
    this.elapsed += dt;

    // Subtle idle animations
    this.cipherRig.outerRing.rotation.z = this.elapsed * 0.8;
    this.cipherRig.innerRing.rotation.z = -this.elapsed * 1.25;
    this.cipherRig.avatarGroup.position.y = 0.14 + Math.sin(this.elapsed * 2.2) * 0.04;

    if (this.coreMonument.visible) {
      const orb = this.coreMonument.getObjectByName('coreOrb');
      const r1 = this.coreMonument.getObjectByName('coreRing1');
      const r2 = this.coreMonument.getObjectByName('coreRing2');
      if (orb) orb.rotation.y += dt * 0.6;
      if (r1) r1.rotation.y -= dt * 0.9;
      if (r2) r2.rotation.z += dt * 1.1;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 12 * dt;
      const s = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(s);
    }

    // Shield dome flash
    if (this.shieldFlashTimer > 0) {
      this.shieldFlashTimer = Math.max(0, this.shieldFlashTimer - dt);
      const sm = this.runnerRig.shieldDome.material as THREE.MeshBasicMaterial;
      sm.opacity = (this.shieldFlashTimer / 0.65) * 0.6;
      this.runnerRig.shieldDome.rotation.y += dt * 4;
    } else {
      (this.runnerRig.shieldDome.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // Invulnerability blink
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    }

    // Route update by current stage
    if (this.stage === 'MINIGAME_1') {
      this.updateMiniGame1(dt);
    } else if (this.stage === 'MINIGAME_2') {
      this.updateMiniGame2(dt);
    } else if (this.stage === 'MINIGAME_3') {
      this.updateMiniGame3(dt);
    } else {
      this.updateChamberCamera(dt);
    }

    // Smooth FOV damping
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 5, dt);
    this.camera.updateProjectionMatrix();

    // Sync HUD at ~15fps during active mini-games
    if (this.activeGame !== null) {
      this.hudSyncTimer += dt;
      if (this.hudSyncTimer >= 0.07) {
        this.hudSyncTimer = 0;
        this.emitHudSnapshot();
      }
    }
  }

  private updateChamberCamera(dt: number): void {
    // Gentle hover idle for Runner in chambers
    if (this.runnerRig.root.visible) {
      this.runnerRig.boardGroup.position.y = 0.16 + Math.sin(this.elapsed * 3.0) * 0.03;
      this.runnerRig.bodyGroup.position.y = 0.22 + Math.sin(this.elapsed * 3.0) * 0.03;
    }

    if (this.stage === 'TITLE') {
      _vec3A.set(Math.sin(this.elapsed * 0.28) * 0.8, 2.5, 6.2);
      _vec3B.set(0, 1.35, -0.5);
    } else if (this.stage === 'STAGE_1_I_DO' || this.stage === 'STAGE_2_WE_DO') {
      _vec3A.set(1.6, 2.5, 5.8);
      _vec3B.set(-0.5, 1.6, -2.0);
    } else if (this.stage === 'STAGE_3_YOU_DO') {
      _vec3A.set(0.5, 2.6, 5.8);
      _vec3B.set(-0.4, 1.5, -2.0);
    } else if (this.stage === 'STAGE_4_CORE') {
      _vec3A.set(0, 2.9, 6.8);
      _vec3B.set(0, 2.2, -5.0);
    } else {
      // Intro / complete cards for mini-games
      if (this.activeGame === 3) {
        _vec3A.set(-7.5, 4.8, 7.0);
        _vec3B.set(0, 4.2, -8);
      } else {
        _vec3A.set(0, 3.3, 6.4);
        _vec3B.set(0, 1.3, -8);
      }
    }

    this.camPos.lerp(_vec3A, 1 - Math.exp(-4.5 * dt));
    this.camTarget.lerp(_vec3B, 1 - Math.exp(-5.0 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  private scrollTrackTiles(speed: number, dt: number): void {
    const totalLength = 24 * 5.4;
    for (const tile of this.trackTiles) {
      tile.mesh.position.z += speed * dt;
      tile.strip.position.z = tile.mesh.position.z;

      // Illuminate tile strip when passing under Runner (z near 0)
      if (Math.abs(tile.mesh.position.z) < 2.2) {
        tile.flash = 1.0;
      } else {
        tile.flash = Math.max(0, tile.flash - dt * 1.4);
      }

      const stripMat = tile.strip.material as THREE.MeshBasicMaterial;
      _colorA.setHex(0x1e293b).lerp(
        this.boostTimer > 0 ? _vec3ColorCyan : _vec3ColorViolet,
        tile.flash
      );
      stripMat.color.copy(_colorA);

      if (tile.mesh.position.z > 14) {
        tile.mesh.position.z -= totalLength;
        tile.strip.position.z = tile.mesh.position.z;
      }
    }
  }

  private updateMiniGame1(dt: number): void {
    this.gameTime += dt;
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    this.slowdownTimer = Math.max(0, this.slowdownTimer - dt);

    const speedMult = this.boostTimer > 0 ? 1.32 : this.slowdownTimer > 0 ? 0.58 : 1.0;
    const speed = 15.5 * speedMult;
    this.targetFov = this.boostTimer > 0 ? 68 : this.slowdownTimer > 0 ? 57 : 62;

    this.scrollTrackTiles(speed, dt);

    // Smooth lane & jump physics
    const targetX = (this.runnerLane - 1) * 2.8;
    const prevX = this.runnerX;
    this.runnerX = THREE.MathUtils.damp(this.runnerX, targetX, 14, dt);
    const tiltZ = THREE.MathUtils.clamp((prevX - this.runnerX) * 2.2, -0.35, 0.35);

    if (this.runnerY > 0 || this.runnerVy !== 0) {
      this.runnerY += this.runnerVy * dt;
      this.runnerVy -= 28 * dt;
      if (this.runnerY <= 0) {
        this.runnerY = 0;
        this.runnerVy = 0;
      }
    }

    this.runnerRig.root.position.set(this.runnerX, this.runnerY, 0);
    this.runnerRig.root.rotation.z = THREE.MathUtils.damp(this.runnerRig.root.rotation.z, tiltZ, 12, dt);
    this.contactShadow.position.set(this.runnerX, 0.02, 0);
    this.contactShadow.scale.setScalar(Math.max(0.4, 1 - this.runnerY * 0.2));

    // Spawn waves
    this.spawnCooldown -= dt * speedMult;
    if (this.spawnCooldown <= 0 && this.collectedCount < 4) {
      this.spawnCooldown = 2.4;
      this.spawnMG1Wave(-68);
    }

    // Update & collide packets
    const neededOrder = this.collectedCount + 1;
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.z += speed * dt;
      p.group.position.z = p.z;
      p.crystal.rotation.y += dt * 2.4;
      p.ring.rotation.x += dt * 1.8;

      if (!p.collected && Math.abs(p.z) < 1.2 && Math.abs(p.x - this.runnerX) < 1.25 && this.runnerY < 1.9) {
        p.collected = true;
        this.disposeGroupResources(p.group);
        this.packets.splice(i, 1);

        if (p.order === neededOrder) {
          this.collectedCount++;
          this.boostTimer = 1.4;
          soundEngine.playCorrectPacket();
          this.spawnBurst(this.runnerX, 1.0, 0, 'cyan');
          this.feedbackBanner = {
            type: 'success',
            title: 'Chain Link Locked!',
            message: `${p.label} verified in sequence.`,
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();

          if (this.collectedCount >= 4) {
            soundEngine.playCheckpointSuccess();
            this.callbacks.onMiniGameComplete(1, this.gameTime, this.wrongHits);
            return;
          }
        } else {
          this.wrongHits++;
          this.slowdownTimer = 1.65;
          soundEngine.playWrongOrder();
          this.spawnBurst(this.runnerX, 1.0, 0, 'orange');
          this.feedbackBanner = {
            type: 'warning',
            title: 'Out of Sequence — Slowdown!',
            message: p.wrongHint,
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();
        }
        continue;
      }

      if (p.z > 10) {
        this.disposeGroupResources(p.group);
        this.packets.splice(i, 1);
      }
    }

    // Update & collide firewall obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.z += speed * dt;
      if (o.oscillateAmp > 0) {
        o.oscillatePhase += dt * 2.6;
        o.x = (o.lane - 1) * 2.8 + Math.sin(o.oscillatePhase) * o.oscillateAmp;
      }
      o.group.position.set(o.x, 0, o.z);

      if (
        !o.hit &&
        this.invulnTimer <= 0 &&
        Math.abs(o.z) < 0.9 &&
        Math.abs(o.x - this.runnerX) < 1.15 &&
        this.runnerY < 1.05
      ) {
        o.hit = true;
        this.invulnTimer = 0.8;
        this.shieldFlashTimer = 0.65;
        this.slowdownTimer = 1.1;
        soundEngine.playObstacleBump();
        this.spawnBurst(this.runnerX, 0.9, 0, 'orange');
        this.feedbackBanner = {
          type: 'info',
          title: 'Firewall Shield Bump!',
          message: 'Switch lanes or press Space to jump over firewalls.',
          timestamp: Date.now(),
        };
        this.emitHudSnapshot();
      }

      if (o.z > 10) {
        this.disposeGroupResources(o.group);
        this.obstacles.splice(i, 1);
      }
    }

    // Chase camera
    _vec3A.set(this.runnerX * 0.45, 3.6 + this.runnerY * 0.35, 6.4);
    _vec3B.set(this.runnerX * 0.3, 1.3 + this.runnerY * 0.25, -10);
    this.camPos.lerp(_vec3A, 1 - Math.exp(-8 * dt));
    this.camTarget.lerp(_vec3B, 1 - Math.exp(-8 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  private updateMiniGame2(dt: number): void {
    this.gameTime += dt;
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    this.slowdownTimer = Math.max(0, this.slowdownTimer - dt);

    const speedMult = this.boostTimer > 0 ? 1.45 : this.slowdownTimer > 0 ? 0.55 : 1.0;
    const speed = 16.5 * speedMult;
    this.targetFov = this.boostTimer > 0 ? 70 : this.slowdownTimer > 0 ? 58 : 64;

    this.scrollTrackTiles(speed, dt);

    // Animate driftline ribbons scrolling feel
    for (let i = 0; i < this.driftRibbons.length; i++) {
      this.driftRibbons[i].position.x = Math.sin(this.elapsed * 2 + i) * 0.12;
    }

    // Smooth steering across continuous energy lanes
    this.runnerX = THREE.MathUtils.clamp(this.runnerX + this.steerInput * 8.5 * dt, -4.4, 4.4);
    this.hoverCraft.position.set(this.runnerX, 0.16 + Math.sin(this.elapsed * 4) * 0.04, 0);
    const targetBank = -this.steerInput * 0.28;
    this.hoverCraft.rotation.z = THREE.MathUtils.damp(this.hoverCraft.rotation.z, targetBank, 10, dt);
    this.contactShadow.position.set(this.runnerX, 0.02, 0);

    // Spawn cause nodes until all 5 collected
    if (this.collectedCount < 5) {
      this.spawnCooldown -= dt * speedMult;
      if (this.spawnCooldown <= 0) {
        this.spawnCooldown = 2.15;
        this.spawnMG2Wave(-68);
      }
    } else if (!this.effectPortalSpawned) {
      this.effectPortalSpawned = true;
      this.effectPortalZ = -62;
      this.effectContainerPortal.visible = true;
      this.effectContainerPortal.position.set(0, 0, this.effectPortalZ);
      this.feedbackBanner = {
        type: 'success',
        title: 'All 5 Cause Nodes Locked!',
        message: 'Steer straight into the glowing Effect Container ahead!',
        timestamp: Date.now(),
      };
      this.emitHudSnapshot();
    }

    if (this.effectPortalSpawned) {
      this.effectPortalZ += speed * dt;
      this.effectContainerPortal.position.set(0, 0, this.effectPortalZ);
      this.effectContainerPortal.rotation.z += dt * 0.7;
      if (this.effectPortalZ >= -1.2) {
        soundEngine.playCheckpointSuccess();
        this.callbacks.onMiniGameComplete(2, this.gameTime, this.wrongHits);
        return;
      }
    }

    // Update & collide cause nodes
    const neededOrder = this.collectedCount + 1;
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.z += speed * dt;
      p.group.position.z = p.z;
      p.crystal.rotation.y += dt * 2.5;
      p.ring.rotation.y -= dt * 2.2;

      if (!p.collected && Math.abs(p.z) < 1.4 && Math.abs(p.x - this.runnerX) < 1.45) {
        p.collected = true;
        this.disposeGroupResources(p.group);
        this.packets.splice(i, 1);

        if (p.order === neededOrder) {
          this.collectedCount++;
          this.boostTimer = 2.0;
          soundEngine.playCorrectPacket();
          this.spawnBurst(this.runnerX, 0.8, 0, 'cyan');
          this.feedbackBanner = {
            type: 'success',
            title: 'Driftline Boost!',
            message: `${p.label} intercepted in order!`,
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();
        } else {
          this.wrongHits++;
          this.slowdownTimer = 1.65;
          soundEngine.playWrongOrder();
          this.spawnBurst(this.runnerX, 0.8, 0, 'orange');
          this.feedbackBanner = {
            type: 'warning',
            title: 'Out-of-Sequence Node!',
            message: p.wrongHint,
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();
        }
        continue;
      }

      if (p.z > 10) {
        this.disposeGroupResources(p.group);
        this.packets.splice(i, 1);
      }
    }

    // Chase camera
    _vec3A.set(this.runnerX * 0.42, 3.5, 6.2);
    _vec3B.set(this.runnerX * 0.25, 1.2, -12);
    this.camPos.lerp(_vec3A, 1 - Math.exp(-8 * dt));
    this.camTarget.lerp(_vec3B, 1 - Math.exp(-8 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  private updateMiniGame3(dt: number): void {
    this.gameTime += dt;
    this.boostTimer = Math.max(0, this.boostTimer - dt);

    // Increasing intensity as barriers are cleared
    const speed = 13.5 + this.collectedCount * 1.35 + (this.boostTimer > 0 ? 3.5 : 0);
    this.targetFov = 60 + this.collectedCount * 1.2;

    this.scrollTrackTiles(speed, dt);

    // Gravity flight physics: Hold Space/Tap to ascend, release to descend
    const gravity = -21.0;
    const thrust = 45.0;
    this.runnerVy += (gravity + (this.thrusterHeld ? thrust : 0)) * dt;
    this.runnerVy = THREE.MathUtils.clamp(this.runnerVy, -11.5, 10.5);
    this.runnerY += this.runnerVy * dt;

    if (this.runnerY < 0.75) {
      this.runnerY = 0.75;
      this.runnerVy = Math.max(0, this.runnerVy);
    } else if (this.runnerY > 8.4) {
      this.runnerY = 8.4;
      this.runnerVy = Math.min(0, this.runnerVy);
    }

    this.runnerRig.root.position.set(0, this.runnerY, 0);
    // Subtle pitch on hoverboard climb/dive
    const pitch = THREE.MathUtils.clamp(this.runnerVy * 0.045, -0.35, 0.35);
    this.runnerRig.root.rotation.x = THREE.MathUtils.damp(this.runnerRig.root.rotation.x, pitch, 10, dt);
    this.contactShadow.position.set(0, 0.02, 0);
    this.contactShadow.scale.setScalar(Math.max(0.28, 1 - this.runnerY * 0.09));

    // Approach the Mainframe Core visually
    const targetCoreZ = -82 + this.collectedCount * 12;
    this.coreMonument.position.z = THREE.MathUtils.damp(this.coreMonument.position.z, targetCoreZ, 2.5, dt);

    // Spawn next barrier if none ahead & < 5 cleared
    if (this.barriers.length === 0 && this.collectedCount < 5) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) {
        this.spawnCooldown = 1.2;
        this.spawnMG3Barrier(this.collectedCount + 1, -54);
      }
    }

    // Update & collide cascading firewall barriers
    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];
      b.z += speed * dt;
      b.group.position.z = b.z;
      b.nodeCrystal.rotation.y += dt * 3;

      // Check passage / collision at z near 0
      if (!b.cleared && Math.abs(b.z) < 0.75) {
        const runnerCenterY = this.runnerY + 0.8;
        const inGap = Math.abs(runnerCenterY - b.gapY) <= b.gapHalfHeight + 0.2;

        if (inGap) {
          b.cleared = true;
          b.nodeCrystal.visible = false;
          this.collectedCount++;
          this.boostTimer = 1.1;
          soundEngine.playCorrectPacket();
          this.spawnBurst(0, this.runnerY + 0.8, 0, 'cyan');
          const link = MINIGAME_3_CHAIN_LINKS[this.collectedCount - 1];
          this.feedbackBanner = {
            type: 'success',
            title: `Link ${this.collectedCount}/5 Activated!`,
            message: `${link.shortLabel} — ${link.description}`,
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();

          if (this.collectedCount >= 5) {
            soundEngine.playCheckpointSuccess();
            this.callbacks.onMiniGameComplete(3, this.gameTime, this.wrongHits);
            return;
          }
        } else if (!b.bumped && this.invulnTimer <= 0) {
          // Non-punitive collision feedback
          b.bumped = true;
          this.wrongHits++;
          this.invulnTimer = 1.0;
          this.shieldFlashTimer = 0.65;
          // Gentle nudge toward gap center
          this.runnerVy = runnerCenterY < b.gapY ? 5.5 : -5.5;
          soundEngine.playObstacleBump();
          this.spawnBurst(0, this.runnerY + 0.8, 0, 'orange');
          this.feedbackBanner = {
            type: 'info',
            title: 'Firewall Glancing Hit — Shield Held!',
            message: 'Hold Space or Ascend button to aim for the glowing blue gap!',
            timestamp: Date.now(),
          };
          this.emitHudSnapshot();
        }
      }

      if (b.z > 10) {
        this.disposeGroupResources(b.group);
        this.barriers.splice(i, 1);
      }
    }

    // Angled canyon side/3-quarter view so altitude & upcoming gap are super readable
    _vec3A.set(-8.8, 4.7, 7.6);
    _vec3B.set(0, 4.1, -11);
    this.camPos.lerp(_vec3A, 1 - Math.exp(-6 * dt));
    this.camTarget.lerp(_vec3B, 1 - Math.exp(-6 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  private emitHudSnapshot(): void {
    let totalRequired = 4;
    let nextLabel = '';
    if (this.activeGame === 1) {
      totalRequired = 4;
      const spec = MINIGAME_1_PACKETS[Math.min(3, this.collectedCount)];
      nextLabel = this.collectedCount >= 4 ? 'Chain Complete!' : spec.shortLabel;
    } else if (this.activeGame === 2) {
      totalRequired = 5;
      const spec = MINIGAME_2_NODES[Math.min(4, this.collectedCount)];
      nextLabel =
        this.collectedCount >= 5
          ? 'Enter Effect Container!'
          : spec.shortLabel;
    } else if (this.activeGame === 3) {
      totalRequired = 5;
      const link = MINIGAME_3_CHAIN_LINKS[Math.min(4, this.collectedCount)];
      nextLabel = this.collectedCount >= 5 ? 'Mainframe Core Reached!' : link.shortLabel;
    }

    const progressPercent = Math.min(100, Math.round((this.collectedCount / totalRequired) * 100));

    this.callbacks.onHudUpdate({
      activeGame: this.activeGame,
      collectedCount: this.collectedCount,
      totalRequired,
      nextLabel,
      progressPercent,
      speedMultiplier: this.boostTimer > 0 ? 1.4 : this.slowdownTimer > 0 ? 0.6 : 1.0,
      boostTimer: this.boostTimer,
      slowdownTimer: this.slowdownTimer,
      shieldFlashTimer: this.shieldFlashTimer,
      elapsedSeconds: this.gameTime,
      feedbackBanner: this.feedbackBanner,
    });
  }

  private onResize(): void {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResizeBound);
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

const _vec3ColorCyan = new THREE.Color(0x22d3ee);
const _vec3ColorViolet = new THREE.Color(0xa855f7);
