import * as THREE from 'three';
import { createPacketLabelTexture, createServerTowerTexture } from './textures';

export interface RunnerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  boardGroup: THREE.Group;
  thrusterGlow: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  shieldDome: THREE.Mesh;
}

/**
 * Composite 10-part Explorer Runner on Hoverboard (bottom-center grounded pivot at y = 0).
 * Styled after the reference mockups: cobalt blue tee, glowing C-emblem backpack,
 * neon headphones/visor, and beveled cyan/violet hoverboard.
 */
export function createRunnerModel(): RunnerRig {
  const root = new THREE.Group();

  // Shared calibrated PBR materials (varied roughness >= 0.25 and metalness)
  const armorDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
    metalness: 0.45,
  });
  const cobaltSuitMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.65,
    metalness: 0.12,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.72,
    metalness: 0.02,
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.8,
  });
  const violetGlowMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 1.4,
    roughness: 0.22,
    metalness: 0.75,
  });
  const boardDeckMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.28,
    metalness: 0.85,
  });

  // 1. Hoverboard assembly
  const boardGroup = new THREE.Group();
  boardGroup.position.y = 0.16;

  // Extruded beveled hoverboard deck
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-0.32, -0.75);
  deckShape.lineTo(0.32, -0.75);
  deckShape.lineTo(0.4, 0.45);
  deckShape.lineTo(0.0, 0.92);
  deckShape.lineTo(-0.4, 0.45);
  deckShape.closePath();

  const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  deckGeo.rotateX(Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckGeo, boardDeckMat);
  deckMesh.castShadow = true;
  boardGroup.add(deckMesh);

  // Hoverboard side neon rails
  const railGeo = new THREE.BoxGeometry(0.07, 0.07, 1.35);
  const leftRail = new THREE.Mesh(railGeo, cyanGlowMat);
  leftRail.position.set(-0.39, -0.02, -0.05);
  const rightRail = new THREE.Mesh(railGeo, cyanGlowMat);
  rightRail.position.set(0.39, -0.02, -0.05);
  boardGroup.add(leftRail, rightRail);

  // Rear propulsion thruster core
  const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.22, 16);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterGlow = new THREE.Mesh(thrusterGeo, violetGlowMat);
  thrusterGlow.position.set(0, -0.02, -0.82);
  boardGroup.add(thrusterGlow);

  root.add(boardGroup);

  // 2. Runner Character Body (standing on board)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.22;

  // Boots & Legs (athletic surfer stance)
  const legGeo = new THREE.CapsuleGeometry(0.095, 0.45, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, armorDarkMat);
  leftLeg.position.set(-0.18, 0.34, 0.14);
  leftLeg.rotation.x = 0.12;
  leftLeg.castShadow = true;

  const rightLeg = new THREE.Mesh(legGeo, armorDarkMat);
  rightLeg.position.set(0.18, 0.34, -0.14);
  rightLeg.rotation.x = -0.14;
  rightLeg.castShadow = true;
  bodyGroup.add(leftLeg, rightLeg);

  // Torso (cobalt blue tech tee)
  const torsoGeo = new THREE.BoxGeometry(0.48, 0.62, 0.28);
  const torso = new THREE.Mesh(torsoGeo, cobaltSuitMat);
  torso.position.set(0, 0.92, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Cyber Backpack with glowing purple emblem
  const packGeo = new THREE.BoxGeometry(0.38, 0.48, 0.18);
  const backpack = new THREE.Mesh(packGeo, armorDarkMat);
  backpack.position.set(0, 0.94, -0.22);
  backpack.castShadow = true;
  bodyGroup.add(backpack);

  const emblemRingGeo = new THREE.TorusGeometry(0.1, 0.028, 8, 20, Math.PI * 1.65);
  const emblemRing = new THREE.Mesh(emblemRingGeo, violetGlowMat);
  emblemRing.position.set(0, 0.95, -0.32);
  emblemRing.rotation.z = 0.55;
  bodyGroup.add(emblemRing);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.38, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.34, 0.9, 0.04);
  leftArm.rotation.z = 0.26;
  leftArm.castShadow = true;

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.34, 0.9, 0.04);
  rightArm.rotation.z = -0.26;
  rightArm.castShadow = true;
  bodyGroup.add(leftArm, rightArm);

  // Head + curly hair silhouette + gaming headset
  const headGeo = new THREE.SphereGeometry(0.19, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.42, 0.02);
  head.castShadow = true;
  bodyGroup.add(head);

  const hairGeo = new THREE.SphereGeometry(0.21, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.0 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.46, 0.0);
  bodyGroup.add(hair);

  // Glowing Headset band & earcups
  const earGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 14);
  earGeo.rotateZ(Math.PI / 2);
  const leftEar = new THREE.Mesh(earGeo, cyanGlowMat);
  leftEar.position.set(-0.21, 1.42, 0.02);
  const rightEar = new THREE.Mesh(earGeo, cyanGlowMat);
  rightEar.position.set(0.21, 1.42, 0.02);
  bodyGroup.add(leftEar, rightEar);

  root.add(bodyGroup);

  // Non-punitive energy shield dome (flashes on firewall bump)
  const shieldGeo = new THREE.SphereGeometry(1.15, 20, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0,
    wireframe: true,
    depthWrite: false,
  });
  const shieldDome = new THREE.Mesh(shieldGeo, shieldMat);
  shieldDome.position.y = 1.0;
  root.add(shieldDome);

  return { root, bodyGroup, boardGroup, thrusterGlow, leftArm, rightArm, shieldDome };
}

/**
 * Upgraded Hover Vehicle for Mini-Game 2: Driftline Chase (7-part sculpted craft).
 */
export function createHoverCraftModel(): THREE.Group {
  const craft = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.85,
  });
  const trimCyanMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.7,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.9,
    roughness: 0.12,
    metalness: 0.9,
  });

  // Main fuselage
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.45, -1.0);
  hullShape.lineTo(0.45, -1.0);
  hullShape.lineTo(0.6, 0.2);
  hullShape.lineTo(0.0, 1.35);
  hullShape.lineTo(-0.6, 0.2);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  hullGeo.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.45;
  hull.castShadow = true;
  craft.add(hull);

  // Canopy visor
  const canopyGeo = new THREE.CapsuleGeometry(0.24, 0.65, 6, 12);
  canopyGeo.rotateX(Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.56, 0.05);
  craft.add(canopy);

  // Side airfoils
  const wingGeo = new THREE.BoxGeometry(0.55, 0.06, 0.75);
  const leftWing = new THREE.Mesh(wingGeo, hullMat);
  leftWing.position.set(-0.72, 0.34, -0.32);
  leftWing.rotation.z = 0.14;
  const rightWing = new THREE.Mesh(wingGeo, hullMat);
  rightWing.position.set(0.72, 0.34, -0.32);
  rightWing.rotation.z = -0.14;
  craft.add(leftWing, rightWing);

  // Twin rear ion thrusters
  const thrGeo = new THREE.CylinderGeometry(0.14, 0.19, 0.35, 16);
  thrGeo.rotateX(Math.PI / 2);
  const thrLeft = new THREE.Mesh(thrGeo, trimCyanMat);
  thrLeft.position.set(-0.28, 0.36, -1.1);
  const thrRight = new THREE.Mesh(thrGeo, trimCyanMat);
  thrRight.position.set(0.28, 0.36, -1.1);
  craft.add(thrLeft, thrRight);

  return craft;
}

export interface CipherRig {
  root: THREE.Group;
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  avatarGroup: THREE.Group;
}

/**
 * Interactive Holographic Mentor Cipher (7-part composite character + holo emitter).
 */
export function createCipherModel(): CipherRig {
  const root = new THREE.Group();

  const emitterMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.85,
  });
  const hoodieMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.65,
    metalness: 0.15,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0xa855f7,
    emissiveIntensity: 1.7,
    roughness: 0.15,
    metalness: 0.9,
  });
  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Base pedestal emitter
  const padGeo = new THREE.CylinderGeometry(0.72, 0.85, 0.14, 24);
  const pad = new THREE.Mesh(padGeo, emitterMat);
  pad.position.y = 0.07;
  root.add(pad);

  const outerRingGeo = new THREE.TorusGeometry(0.75, 0.035, 8, 32);
  outerRingGeo.rotateX(Math.PI / 2);
  const outerRing = new THREE.Mesh(outerRingGeo, visorMat);
  outerRing.position.y = 0.16;
  root.add(outerRing);

  const innerRingGeo = new THREE.TorusGeometry(0.5, 0.025, 8, 28);
  innerRingGeo.rotateX(Math.PI / 2);
  const innerRing = new THREE.Mesh(innerRingGeo, cyanMat);
  innerRing.position.y = 0.19;
  root.add(innerRing);

  // Cipher character body
  const avatarGroup = new THREE.Group();
  avatarGroup.position.y = 0.14;

  const legGeo = new THREE.CapsuleGeometry(0.09, 0.55, 4, 8);
  const legL = new THREE.Mesh(legGeo, emitterMat);
  legL.position.set(-0.14, 0.42, 0);
  const legR = new THREE.Mesh(legGeo, emitterMat);
  legR.position.set(0.14, 0.42, 0);
  avatarGroup.add(legL, legR);

  const torsoGeo = new THREE.BoxGeometry(0.5, 0.68, 0.3);
  const torso = new THREE.Mesh(torsoGeo, hoodieMat);
  torso.position.set(0, 1.06, 0);
  torso.castShadow = true;
  avatarGroup.add(torso);

  // Glowing purple 'C' chest emblem
  const cEmblemGeo = new THREE.TorusGeometry(0.11, 0.03, 8, 20, Math.PI * 1.65);
  const cEmblem = new THREE.Mesh(cEmblemGeo, visorMat);
  cEmblem.position.set(0, 1.08, 0.17);
  cEmblem.rotation.z = 0.55;
  avatarGroup.add(cEmblem);

  // Head + purple cyberpunk visor
  const headGeo = new THREE.SphereGeometry(0.19, 16, 16);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7, metalness: 0.02 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.58, 0);
  avatarGroup.add(head);

  const hairGeo = new THREE.SphereGeometry(0.21, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hair = new THREE.Mesh(hairGeo, hoodieMat);
  hair.position.set(0, 1.62, -0.02);
  avatarGroup.add(hair);

  const visorGeo = new THREE.BoxGeometry(0.32, 0.09, 0.12);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.59, 0.16);
  avatarGroup.add(visor);

  root.add(avatarGroup);

  return { root, outerRing, innerRing, avatarGroup };
}

export function createServerTower(height: number, accentHex: string, maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();
  const tex = createServerTowerTexture(maxAnisotropy, accentHex);

  const bodyGeo = new THREE.BoxGeometry(2.2, height, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.42,
    metalness: 0.75,
    emissive: new THREE.Color(accentHex),
    emissiveMap: tex,
    emissiveIntensity: 0.55,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = height / 2;
  group.add(body);

  // Crown beacon cap
  const capGeo = new THREE.BoxGeometry(2.4, 0.35, 2.4);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.9,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = height + 0.18;
  group.add(cap);

  const stripGeo = new THREE.BoxGeometry(2.46, 0.12, 2.46);
  const stripMat = new THREE.MeshBasicMaterial({ color: accentHex });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.y = height + 0.18;
  group.add(strip);

  return group;
}

export interface PacketVisual {
  group: THREE.Group;
  crystal: THREE.Mesh;
  ring: THREE.Mesh;
}

export function createEventPacketModel(
  orderNum: number,
  label: string,
  isTargetNow: boolean,
  maxAnisotropy: number
): PacketVisual {
  const group = new THREE.Group();
  const accentHex = isTargetNow ? '#22d3ee' : '#a855f7';
  const colorNum = isTargetNow ? 0x22d3ee : 0xa855f7;

  // Floating holographic event card above crystal
  const labelTex = createPacketLabelTexture(orderNum, label, accentHex, maxAnisotropy);
  const cardGeo = new THREE.PlaneGeometry(2.15, 1.08);
  const cardMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardMesh.position.y = 1.65;
  group.add(cardMesh);

  // Magma-energy crystal core
  const crystalGeo = new THREE.OctahedronGeometry(0.42, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: colorNum,
    emissive: colorNum,
    emissiveIntensity: isTargetNow ? 1.6 : 0.85,
    roughness: 0.18,
    metalness: 0.75,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 0.65;
  group.add(crystal);

  // Orbiting containment ring
  const ringGeo = new THREE.TorusGeometry(0.58, 0.04, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: colorNum });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.65;
  group.add(ring);

  return { group, crystal, ring };
}

export function createFirewallObstacleModel(width: number = 2.4, height: number = 1.45): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.35,
    metalness: 0.85,
  });
  const laserMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.7,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.88,
  });

  // Left & Right pylons
  const pylonGeo = new THREE.BoxGeometry(0.24, height, 0.28);
  const leftPylon = new THREE.Mesh(pylonGeo, frameMat);
  leftPylon.position.set(-width / 2, height / 2, 0);
  const rightPylon = new THREE.Mesh(pylonGeo, frameMat);
  rightPylon.position.set(width / 2, height / 2, 0);
  group.add(leftPylon, rightPylon);

  // Energy barrier bars
  const barGeo = new THREE.BoxGeometry(width - 0.18, 0.14, 0.12);
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(barGeo, laserMat);
    bar.position.y = 0.32 + i * 0.42;
    group.add(bar);
  }

  return group;
}

export function createCoreMonumentModel(): THREE.Group {
  const core = new THREE.Group();

  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.9,
  });
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x22d3ee,
    emissiveIntensity: 2.0,
    roughness: 0.1,
    metalness: 0.8,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0xa855f7,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.85,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 0.6, 24), pedestalMat);
  base.position.y = 0.3;
  core.add(base);

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), orbMat);
  orb.position.y = 4.2;
  orb.name = 'coreOrb';
  core.add(orb);

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 10, 48), ringMat);
  ring1.position.y = 4.2;
  ring1.name = 'coreRing1';
  core.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.08, 10, 48), orbMat);
  ring2.position.y = 4.2;
  ring2.rotation.x = Math.PI / 3;
  ring2.name = 'coreRing2';
  core.add(ring2);

  return core;
}
