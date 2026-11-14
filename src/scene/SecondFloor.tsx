import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Interact, Sph, RB, RBB } from './prims'
import {
  isOccluderHit,
  isOrbitDragging,
  isValidClick,
  isZoneInteractive,
  registerOccluderMesh,
} from './raycastRegistry'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { WallAttached, isWallCutByCamera } from './ArchitectureShell'
import {
  AUTO_DURATION,
  CharacterRoleIndicator,
  computeCharActivityPose,
  getStationEntryForChar,
  stepCharacterWalk,
} from './Characters'
import { isBlocked, isBlockedTier2 } from './Furniture'
import {
  executeInteraction,
  pickUtilityAutoTarget,
  type InteractionMeta,
} from './interactionEngine'
import {
  aoContactShadow,
  aoLinearFalloff,
  colorfulBedArt,
  fluffyCreamRug,
  girlPcScreen,
  openBookPages,
  persianTerracottaRug,
  woodFloor,
} from './textures'
import { useStore, type Activity } from '../store'
import { broadcastPosSync, REMOTE_ACTORS } from '../presence'
import {
  getHousePalette,
  GIRL_OUTFITS,
  LIVE_ACTORS,
  type V3,
} from '../data/config'

export const FLOOR2_Y = 4.35
const NOOP_RAYCAST = () => {}

const UNIT_BOX_GEOM = new THREE.BoxGeometry(1, 1, 1)
const SLAT_MAT = new THREE.MeshStandardMaterial({ color: '#5E7487', roughness: 0.58, metalness: 0.05 })
const LOUVER_INSTANCE_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.04 })
const SLAT_COLOR = new THREE.Color('#5E7487')
const OAK_COLOR = new THREE.Color('#C4AF97')

const STAIR_STEP_GEOM = new THREE.BoxGeometry(1.06, 0.075, 0.36)
const STAIR_STEP_MAT = new THREE.MeshStandardMaterial({ color: '#D8C7B2', roughness: 0.48, metalness: 0.04 })
const STAIR_CLEAT_GEOM = new THREE.BoxGeometry(1.08, 0.032, 0.14)
const STAIR_CLEAT_MAT = new THREE.MeshStandardMaterial({ color: '#2B2D2F', roughness: 0.4, metalness: 0.45 })
const STAIR_RIB_GEOM = new THREE.BoxGeometry(0.98, 0.012, 0.016)
const STAIR_RIB_MAT = new THREE.MeshStandardMaterial({ color: '#2B2D2F', roughness: 0.45, metalness: 0.35 })
const STAIR_LED_GEOM = new THREE.BoxGeometry(1.02, 0.016, 0.02)
const STAIR_LED_MAT = new THREE.MeshStandardMaterial({ color: '#FFAE52', emissive: '#FFAE52', emissiveIntensity: 1.5 })
const STAIR_POST_MAT = new THREE.MeshStandardMaterial({ color: '#2B2D2F', roughness: 0.35, metalness: 0.5 })
const STAIR_STRINGER_MAT = new THREE.MeshStandardMaterial({ color: '#2B2D2F', roughness: 0.4, metalness: 0.45 })
const STAIR_OAK_TRIM_MAT = new THREE.MeshStandardMaterial({ color: '#C4AF97', roughness: 0.48 })
const STAIR_RAIL_OAK_MAT = new THREE.MeshStandardMaterial({ color: '#D8C7B2', roughness: 0.48 })
const STAIR_CLIP_MAT = new THREE.MeshStandardMaterial({ color: '#C4AF97', roughness: 0.52 })

const F2_LEAF_GEOM = new THREE.SphereGeometry(1, 12, 8)
const F2_LEAF_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65 })
const F2_LEAF_COLORS = [new THREE.Color('#566E4C'), new THREE.Color('#6F8763')]

export function SecondFloor() {
  const viewPreset = useStore((s) => s.viewPreset)
  const showFloor2 = viewPreset !== 'floor1'
  const floor2Ref = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!floor2Ref.current) return
    floor2Ref.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        if (obj.userData?.noRaycast) {
          ;(obj as THREE.Mesh).raycast = NOOP_RAYCAST
          return
        }
        const isInst = Boolean((obj as THREE.InstancedMesh).isInstancedMesh)
        ;(obj as THREE.Mesh).raycast = showFloor2
          ? isInst
            ? THREE.InstancedMesh.prototype.raycast
            : THREE.Mesh.prototype.raycast
          : NOOP_RAYCAST
      }
    })
  }, [showFloor2])

  return (
    <group>
      <group ref={floor2Ref} visible={showFloor2}>
        <FloorAndBeams showFloor2={showFloor2} />
        <WallsAndDoor showFloor2={showFloor2} />
        <GirlRoomFurniture />
        <IndoorStaircase />
      </group>
      <GirlfriendAvatar hideIfUpstairs={!showFloor2} />
    </group>
  )
}

/* ============================================================================
 * 1. SÀN KHỐI ĐẶC TẦNG 2 (0.3 UNITS), HỆ PHÀO CHỈ & BAN CÔNG KÍNH MẶT TIỀN
 * ============================================================================ */
function FloorAndBeams({ showFloor2 }: { showFloor2: boolean }) {
  const darkMode = useStore((s) => s.darkMode)
  const palette = getHousePalette(darkMode)
  const Y = FLOOR2_Y
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const slabsRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!showFloor2 || !slabsRef.current) return
    return registerOccluderMesh(slabsRef.current, 'slab')
  }, [showFloor2])

  const oakMap1 = useMemo(() => {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 1.4)
    t.needsUpdate = true
    return t
  }, [])

  const oakMap2 = useMemo(() => {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.46, 1.035)
    t.needsUpdate = true
    return t
  }, [])

  const oakMapBalcony = useMemo(() => {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.46, 0.28)
    t.needsUpdate = true
    return t
  }, [])

  const slabEdgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.subFloor,
        roughness: 0.78,
        metalness: 0.02,
      }),
    [palette.subFloor],
  )

  const slabBottomMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.wallCream,
        roughness: 0.88,
        metalness: 0.0,
      }),
    [palette.wallCream],
  )

  const oakTopMat1 = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: oakMap1,
        roughness: 0.48,
        metalness: 0.04,
        color: palette.floorTint,
      }),
    [oakMap1, palette.floorTint],
  )

  const oakTopMat2 = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: oakMap2,
        roughness: 0.48,
        metalness: 0.04,
        color: palette.floorTint,
      }),
    [oakMap2, palette.floorTint],
  )

  const balconyTopMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: oakMapBalcony,
        roughness: 0.54,
        metalness: 0.03,
        color: darkMode ? '#B8AE9E' : '#EAE2D6',
      }),
    [oakMapBalcony, darkMode],
  )

  useEffect(() => {
    return () => {
      oakMap1.dispose()
      oakMap2.dispose()
      oakMapBalcony.dispose()
    }
  }, [oakMap1, oakMap2, oakMapBalcony])

  useEffect(() => () => slabEdgeMat.dispose(), [slabEdgeMat])
  useEffect(() => () => slabBottomMat.dispose(), [slabBottomMat])
  useEffect(() => () => oakTopMat1.dispose(), [oakTopMat1])
  useEffect(() => () => oakTopMat2.dispose(), [oakTopMat2])
  useEffect(() => () => balconyTopMat.dispose(), [balconyTopMat])

  const slabMats1 = useMemo(
    () => [slabEdgeMat, slabEdgeMat, oakTopMat1, slabBottomMat, slabEdgeMat, slabEdgeMat],
    [slabEdgeMat, oakTopMat1, slabBottomMat],
  )
  const slabMats2 = useMemo(
    () => [slabEdgeMat, slabEdgeMat, oakTopMat2, slabBottomMat, slabEdgeMat, slabEdgeMat],
    [slabEdgeMat, oakTopMat2, slabBottomMat],
  )
  const slabMatsBalcony = useMemo(
    () => [slabEdgeMat, slabEdgeMat, balconyTopMat, slabBottomMat, slabEdgeMat, slabEdgeMat],
    [slabEdgeMat, balconyTopMat, slabBottomMat],
  )

  const handleFloor2Click = (e: ThreeEvent<MouseEvent>) => {
    if (!isValidClick(e.clientX, e.clientY)) return
    const st = useStore.getState()
    if (st.mode !== 'orbit' && st.mode !== 'fp') return
    if (!isZoneInteractive('interior_f2', st)) return
    if (st.mode === 'orbit' && st.viewPreset === 'floor1') return
    const first = e.intersections?.[0]
    const isGhostThrough =
      st.mode === 'orbit' &&
      st.wallMode === 'ghost' &&
      first?.object.userData?.occluderKind !== 'slab'
    if (first && first.object !== e.object && isOccluderHit(first.object) && !isGhostThrough) return
    e.stopPropagation()
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -10.2, 9.2)
    const z = THREE.MathUtils.clamp(p.z, -5.1, 4.3)
    const ctrlChar = st.userRole || st.activeChar
    if (st.dynamicSeatTarget?.char === ctrlChar || (ctrlChar === 'boy' ? st.boyActivity !== 'idle' : st.girlActivity !== 'idle')) {
      st.clearCharacterPosture(ctrlChar)
    }
    st.setAvatarTarget([x, Y, z])
  }

  return (
    <group>
      <group ref={slabsRef}>
        {/* 1. Sàn khối đặc chính Tầng 2 (BoxGeometry dày 0.3: y = FLOOR2_Y - 0.30 .. FLOOR2_Y, x: -10..+10, z: -6.0..+0.18) */}
        <mesh
          position={[0, Y - 0.15, -2.91]}
          material={slabMats1}
          castShadow
          receiveShadow
          onClick={showFloor2 ? handleFloor2Click : undefined}
          onDoubleClick={showFloor2 ? handleFloor2Click : undefined}
        >
          <boxGeometry args={[20.0, 0.3, 6.18]} />
        </mesh>

        {/* 2. Sàn khối đặc khu vực giường & ghế lười phía trước-trái (BoxGeometry dày 0.3: x: -7.7..-1.2, z: +0.18..+4.80) */}
        <mesh
          position={[-4.45, Y - 0.15, 2.49]}
          material={slabMats2}
          castShadow
          receiveShadow
          onClick={showFloor2 ? handleFloor2Click : undefined}
          onDoubleClick={showFloor2 ? handleFloor2Click : undefined}
        >
          <boxGeometry args={[6.5, 0.3, 4.62]} />
        </mesh>

        {/* 3. Sàn khối đặc Ban công kính Tầng 2 mặt tiền (BoxGeometry dày 0.3: x: -7.7..-1.2, z: +4.80..+5.98) */}
        <mesh
          position={[-4.45, Y - 0.15, 5.39]}
          material={slabMatsBalcony}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[6.5, 0.3, 1.18]} />
        </mesh>
      </group>

      {/* Nẹp ngưỡng gỗ sồi chuyển tiếp ra Ban công mặt tiền tại z = 4.80 */}
      <B p={[-4.45, Y + 0.006, 4.8]} s={[6.5, 0.012, 0.08]} c="#C4AF97" rough={0.48} shadow />

      {/* Phào chỉ kiến trúc bọc mép dầm sàn Tầng 2 hướng thông tầng & cầu thang */}
      <B p={[4.39, Y - 0.15, 0.193]} s={[11.18, 0.28, 0.026]} c={palette.crownMolding} rough={0.75} shadow />
      <B p={[-8.84, Y - 0.15, 0.193]} s={[2.28, 0.28, 0.026]} c={palette.crownMolding} rough={0.75} shadow />
      <B p={[-1.187, Y - 0.15, 3.08]} s={[0.026, 0.28, 5.8]} c={palette.crownMolding} rough={0.75} shadow />
      <B p={[-7.713, Y - 0.15, 3.08]} s={[0.026, 0.28, 5.8]} c={palette.crownMolding} rough={0.75} shadow />
      <B p={[-4.45, Y - 0.15, 5.985]} s={[6.52, 0.28, 0.024]} c={palette.crownMolding} rough={0.75} shadow />

      {/* Ambient Occlusion (AO) Tầng 2 tại các góc tường, gầm giường, tủ & góc đọc sách */}
      <Floor2AmbientOcclusion darkMode={darkMode} />

      {/* --- LAN CAN KÍNH CƯỜNG LỰC TAY VỊN GỖ SỒI & TRỤ CHARCOAL (#2B2D2F) --- */}
      {/* 1. Lan can ngang mép hành lang thông tầng (x: -1.20 -> +9.98, tại z = 0.18 nối khít tường phải) */}
      <G p={[4.39, Y, 0.18]}>
        <RBB p={[0, 0.86, 0]} s={[11.18, 0.045, 0.065]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[11.18, 0.035, 0.05]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[11.06, 0.82, 0.016]} />
        </mesh>
        {[-5.45, -3.25, -1.05, 1.15, 3.35, 5.54].map((px, i) => (
          <B key={i} p={[px, 0.43, 0]} s={[0.04, 0.86, 0.04]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        ))}
      </G>

      {/* 2. Lan can dọc mép thông tầng bên phải ban công (x = -1.2, z: 0.18 -> 5.95 nối khít tường trước) */}
      <G p={[-1.2, Y, 3.065]}>
        <RBB p={[0, 0.86, 0]} s={[0.065, 0.045, 5.77]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 5.77]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[0.016, 0.82, 5.66]} />
        </mesh>
        {[-2.85, -1.42, 0, 1.42, 2.85].map((pz, i) => (
          <B key={i} p={[0, 0.43, pz]} s={[0.04, 0.86, 0.04]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        ))}
      </G>

      {/* 3. Lan can bảo vệ ô cầu thang (x = -7.72, chia 2 đoạn chừa lối mở z: 2.10..4.10 nối cầu kính ra Sân thượng) */}
      <G p={[-7.72, Y, 1.14]}>
        <RBB p={[0, 0.86, 0]} s={[0.065, 0.045, 1.92]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 1.92]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[0.016, 0.82, 1.84]} />
        </mesh>
        {[-0.92, 0.0, 0.92].map((pz, i) => (
          <B key={i} p={[0, 0.43, pz]} s={[0.04, 0.86, 0.04]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        ))}
      </G>
      <G p={[-7.72, Y, 5.025]}>
        <RBB p={[0, 0.86, 0]} s={[0.065, 0.045, 1.85]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 1.85]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[0.016, 0.82, 1.77]} />
        </mesh>
        {[-0.88, 0.0, 0.88].map((pz, i) => (
          <B key={i} p={[0, 0.43, pz]} s={[0.04, 0.86, 0.04]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        ))}
      </G>

      {/* Cầu kính cường lực bắc ngang ô thang nối phòng ngủ Tầng 2 ra cửa lùa Sân thượng (x: -10.02..-7.72, z: 2.10..4.10) */}
      <G p={[-8.87, Y, 3.1]}>
        <mesh
          position={[0, -0.028, 0]}
          material={glassMat}
          receiveShadow
          onClick={showFloor2 ? handleFloor2Click : undefined}
          onDoubleClick={showFloor2 ? handleFloor2Click : undefined}
        >
          <boxGeometry args={[2.3, 0.055, 2.0]} />
        </mesh>
        <B p={[0, -0.03, -0.99]} s={[2.32, 0.065, 0.05]} c="#2B2D2F" metal={0.45} rough={0.38} shadow />
        <B p={[0, -0.03, 0.99]} s={[2.32, 0.065, 0.05]} c="#2B2D2F" metal={0.45} rough={0.38} shadow />
        <B p={[1.13, 0.005, 0]} s={[0.06, 0.012, 2.0]} c="#C4AF97" rough={0.48} />
        <B p={[-1.13, 0.005, 0]} s={[0.06, 0.012, 2.0]} c="#C4AF97" rough={0.48} />
        {[-1.0, 1.0].map((lz, idx) => (
          <G key={idx} p={[0, 0, lz]}>
            <RBB p={[0, 0.86, 0]} s={[2.3, 0.045, 0.06]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
            <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
              <boxGeometry args={[2.22, 0.82, 0.016]} />
            </mesh>
            <B p={[0, 0.43, 0]} s={[0.04, 0.86, 0.04]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
          </G>
        ))}
      </G>

      {/* 3b. Lan can kính an toàn chiếu nghỉ đầu cầu thang Tầng 2 (nối liền tay vịn cầu thang tại x = -9.41 & -8.29) */}
      <G p={[-9.695, Y, 0.18]}>
        <RBB p={[0, 0.86, 0]} s={[0.57, 0.045, 0.065]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[0.57, 0.035, 0.05]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[0.51, 0.82, 0.016]} />
        </mesh>
        <B p={[-0.265, 0.43, 0]} s={[0.042, 0.86, 0.042]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        <B p={[0.285, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
      </G>
      <G p={[-8.005, Y, 0.18]}>
        <RBB p={[0, 0.86, 0]} s={[0.57, 0.045, 0.065]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[0.57, 0.035, 0.05]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[0.51, 0.82, 0.016]} />
        </mesh>
        <B p={[-0.285, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        <B p={[0.265, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
      </G>

      {/* 4. Cổng kính ngăn khu lửng & lối mở rộng bước ra Ban công tại z = 4.80 */}
      <G p={[-6.785, Y, 4.8]}>
        <RBB p={[0, 0.86, 0]} s={[1.87, 0.045, 0.065]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[1.87, 0.035, 0.05]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[1.78, 0.82, 0.016]} />
        </mesh>
        <B p={[0.91, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
      </G>
      <G p={[-2.125, Y, 4.8]}>
        <RBB p={[0, 0.86, 0]} s={[1.85, 0.045, 0.065]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[1.85, 0.035, 0.05]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[1.76, 0.82, 0.016]} />
        </mesh>
        <B p={[-0.9, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
      </G>

      {/* 5. Lan can kính chính Ban công Tầng 2 mặt tiền (x: -7.72 -> -1.20, tại z = 5.93 sát tường bao z = +6.0) */}
      <G p={[-4.46, Y, 5.93]}>
        <RBB p={[0, 0.86, 0]} s={[6.54, 0.05, 0.07]} c="#D8C7B2" rough={0.48} radius={0.015} shadow />
        <BB p={[0, 0.0, 0]} s={[6.54, 0.04, 0.055]} c="#C4AF97" rough={0.52} shadow />
        <mesh position={[0, 0.44, 0]} material={glassMat} receiveShadow>
          <boxGeometry args={[6.42, 0.82, 0.016]} />
        </mesh>
        {[-3.24, -1.62, 0, 1.62, 3.24].map((px, i) => (
          <B key={i} p={[px, 0.43, 0]} s={[0.045, 0.86, 0.045]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
        ))}
      </G>

      {/* Bồn cây kiến trúc & đèn lồng ấm trên Ban công Tầng 2 */}
      {[-7.08, -1.84].map((bx, idx) => (
        <G key={idx} p={[bx, Y, 5.45]}>
          <BB p={[0, 0, 0]} s={[0.88, 0.34, 0.42]} c="#2B2D2F" rough={0.55} shadow />
          <BB p={[0, 0.34, 0]} s={[0.82, 0.03, 0.36]} c="#4A423B" rough={0.85} />
          {[-0.24, 0, 0.24].map((lx, j) => (
            <Sph
              key={j}
              p={[lx, 0.46 + (j % 2) * 0.07, 0]}
              s={[0.17, 0.16, 0.15]}
              c={j % 2 === 0 ? '#566E4C' : '#6F8763'}
              rough={0.72}
              shadow={false}
            />
          ))}
          <B p={[idx === 0 ? 0.56 : -0.56, 0.14, 0.16]} s={[0.14, 0.28, 0.14]} c="#2B2D2F" metal={0.45} rough={0.35} shadow />
          <B
            p={[idx === 0 ? 0.56 : -0.56, 0.15, 0.16]}
            s={[0.09, 0.16, 0.09]}
            c="#FFAE52"
            emissive="#FFAE52"
            ei={darkMode ? 1.5 : 0.45}
            shadow={false}
          />
        </G>
      ))}
    </group>
  )
}

function Floor2AmbientOcclusion({ darkMode }: { darkMode: boolean }) {
  const linearTex = useMemo(() => aoLinearFalloff(), [])
  const contactTex = useMemo(() => aoContactShadow(), [])
  const cornerOpacity = darkMode ? 0.34 : 0.24
  const underOpacity = darkMode ? 0.56 : 0.46
  const Y = FLOOR2_Y

  return (
    <group>
      {/* Góc tường sau Tầng 2 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y + 0.005, -5.75]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[20.0, 0.55]} />
        <meshBasicMaterial map={linearTex} transparent opacity={cornerOpacity} depthWrite={false} />
      </mesh>
      {/* Góc tường trái Tầng 2 */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-9.75, Y + 0.005, -0.6]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[10.8, 0.5]} />
        <meshBasicMaterial map={linearTex} transparent opacity={cornerOpacity} depthWrite={false} />
      </mesh>
      {/* Góc tường phải Tầng 2 */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[9.75, Y + 0.005, -2.9]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[6.2, 0.5]} />
        <meshBasicMaterial map={linearTex} transparent opacity={cornerOpacity} depthWrite={false} />
      </mesh>
      {/* AO dưới gầm giường Tầng 2 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.0, Y + 0.036, -3.95]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[3.15, 3.65]} />
        <meshBasicMaterial map={contactTex} transparent opacity={underOpacity} depthWrite={false} />
      </mesh>
      {/* AO dưới bàn học & bàn trang điểm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.25, Y + 0.036, -5.15]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[2.0, 1.1]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.95, Y + 0.012, -5.1]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[1.95, 1.15]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.38} depthWrite={false} />
      </mesh>
      {/* AO dưới tủ quần áo Tầng 2 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.65, Y + 0.009, -5.1]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[2.45, 1.45]} />
        <meshBasicMaterial map={contactTex} transparent opacity={underOpacity} depthWrite={false} />
      </mesh>
      {/* AO dưới cụm đọc sách & ghế bành góc phải */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.7, Y + 0.036, -1.35]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[1.25, 1.2]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* AO dưới ghế Bouclé giữa phòng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.1, Y + 0.036, 1.15]} raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.38} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SecondFloorCurtains() {
  const curtainsFloor2Open = useStore((s) => s.curtainsFloor2Open)
  const Y = FLOOR2_Y
  const groupRef = useRef<THREE.Group>(null)
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const sheerLeftRef = useRef<THREE.Group>(null)
  const sheerRightRef = useRef<THREE.Group>(null)

  useFrame(({ camera }, dt) => {
    const st = useStore.getState() as Omit<ReturnType<typeof useStore.getState>, 'wallMode'> & {
      wallMode: 'full' | 'cutaway' | 'ghost'
      nearInteriorOpen?: boolean
    }
    if (groupRef.current) {
      const rightCut =
        st.mode === 'orbit' &&
        (st.wallMode === 'cutaway' ||
          st.wallMode === 'ghost' ||
          Boolean(st.nearInteriorOpen) ||
          st.viewPreset === 'floor1' ||
          st.viewPreset === 'floor2') &&
        isWallCutByCamera(camera.position, [1, 0, 0])
      groupRef.current.visible = !rightCut
    }
    const keepSheerClosed =
      st.mode === 'fp' ||
      (st.mode === 'orbit' &&
        st.viewPreset === 'overview' &&
        st.wallMode === 'full' &&
        !st.nearInteriorOpen)
    const k = 1 - Math.exp(-dt * 7)
    if (leftRef.current) {
      leftRef.current.position.x = THREE.MathUtils.lerp(leftRef.current.position.x, curtainsFloor2Open ? -1.45 : -0.75, k)
      leftRef.current.scale.x = THREE.MathUtils.lerp(leftRef.current.scale.x, curtainsFloor2Open ? 1.0 : 2.0, k)
    }
    if (rightRef.current) {
      rightRef.current.position.x = THREE.MathUtils.lerp(rightRef.current.position.x, curtainsFloor2Open ? 1.45 : 0.75, k)
      rightRef.current.scale.x = THREE.MathUtils.lerp(rightRef.current.scale.x, curtainsFloor2Open ? 1.0 : 2.0, k)
    }
    const sheerScale = keepSheerClosed ? 1.0 : curtainsFloor2Open ? 0.35 : 1.0
    if (sheerLeftRef.current) {
      sheerLeftRef.current.scale.x = THREE.MathUtils.lerp(sheerLeftRef.current.scale.x, sheerScale, k)
    }
    if (sheerRightRef.current) {
      sheerRightRef.current.scale.x = THREE.MathUtils.lerp(sheerRightRef.current.scale.x, sheerScale, k)
    }
  })

  return (
    <group ref={groupRef}>
      <Interact
        zone="interior_f2"
        hint="🪟 Rèm cửa Tầng 2"
        onClick={() => useStore.getState().toggleCurtainsFloor2()}
      >
      <G p={[9.94, Y, -2.3]} r={[0, -Math.PI / 2, 0]}>
        {/* Tấm bắt click rộng lớn phủ kín cửa sổ */}
        <mesh position={[0, 2.08, 0.25]}>
          <planeGeometry args={[4.2, 3.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Thanh treo rèm chạy suốt chiều dài cửa sổ (khớp cửa sổ 3D trong suốt từ ArchitectureShell) */}
        <Cyl p={[0, 3.88, 0.12]} r={[0, 0, Math.PI / 2]} rt={0.022} h={4.1} c="#2B2D2F" metal={0.45} />

        {/* Lớp rèm voan mỏng xuyên sáng phủ kín 100% khung kính */}
        <group ref={sheerLeftRef} position={[-1.84, 0, 0.06]}>
          <mesh position={[0.93, 1.94, 0]}>
            <boxGeometry args={[1.88, 3.88, 0.02]} />
            <meshStandardMaterial color="#F4F0E8" transparent opacity={0.44} roughness={0.92} />
          </mesh>
        </group>
        <group ref={sheerRightRef} position={[1.84, 0, 0.06]}>
          <mesh position={[-0.93, 1.94, 0]}>
            <boxGeometry args={[1.88, 3.88, 0.02]} />
            <meshStandardMaterial color="#F4F0E8" transparent opacity={0.44} roughness={0.92} />
          </mesh>
        </group>

        {/* Các nếp rèm vải xếp ly lì ở hai bên */}
        <group ref={leftRef} position={[-1.45, 0, 0.12]}>
          {[-0.28, -0.16, -0.04, 0.08, 0.2, 0.32].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.94, 0]}
              rt={0.068}
              rb={0.082}
              h={3.84}
              c={i % 2 ? '#D6D1C9' : '#EFECE6'}
              seg={12}
              rough={0.85}
              opacity={0.9}
            />
          ))}
        </group>
        <group ref={rightRef} position={[1.45, 0, 0.12]}>
          {[-0.32, -0.2, -0.08, 0.04, 0.16, 0.28].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.94, 0]}
              rt={0.068}
              rb={0.082}
              h={3.84}
              c={i % 2 ? '#D6D1C9' : '#EFECE6'}
              seg={12}
              rough={0.85}
              opacity={0.9}
            />
          ))}
        </group>
      </G>
    </Interact>
    </group>
  )
}

/* ============================================================================
 * 2. VÁCH NGĂN NỘI THẤT 0.15, LAM GỖ PHÂN KHU & CỬA SỔ KÍNH RÈM VOAN (KHÔNG TRÙNG TƯỜNG BAO)
 * ============================================================================ */
function WallsAndDoor({ showFloor2 }: { showFloor2: boolean }) {
  const Y = FLOOR2_Y
  const H2 = 4.2

  return (
    <group>
      {/* 1. Vách lam Slate Blue & vách ngăn nội thất Tầng 2 dày 0.15 units tại x = -1.05 */}
      <WoodSlatsWall H2={H2} showFloor2={showFloor2} />

      {/* Cửa đôi & 2 khung tranh ốp tường trái — ẩn đồng bộ khi tường trái Tầng 2 hạ/mờ */}
      <WallAttached normal={[-1, 0, 0]} floor={2}>
        {/* Cửa đôi màu Slate Blue (#5E7487) viền Matte Charcoal (#2B2D2F) ốp tường trái */}
        <G p={[-9.95, Y, -2.9]}>
          <BB p={[0, 0, 0]} s={[0.05, 3.55, 3.44]} c="#2B2D2F" rough={0.6} shadow={false} polyOffset />
          <BB p={[0.015, 0, 0]} s={[0.045, 3.42, 3.3]} c="#5E7487" rough={0.75} shadow={false} polyOffset />
          <B p={[0.04, 1.72, 0]} s={[0.02, 3.35, 0.03]} c="#4A5E6F" shadow={false} polyOffset />
          <B p={[0.048, 1.5, -0.1]} s={[0.025, 0.26, 0.025]} c="#2B2D2F" metal={0.5} rough={0.35} shadow={false} />
          <B p={[0.048, 1.5, 0.1]} s={[0.025, 0.26, 0.025]} c="#2B2D2F" metal={0.5} rough={0.35} shadow={false} />
        </G>

        {/* 2 Khung tranh nghệ thuật tối giản bên cạnh cửa trái */}
        <G p={[-9.96, Y + 2.2, 0.8]} r={[0, Math.PI / 2, 0]}>
          <B p={[-0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#2B2D2F" shadow={false} polyOffset />
          <B p={[-0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#EFECE6" shadow={false} polyOffset />
          <Sph p={[-0.45, 0, 0.025]} s={[0.16, 0.24, 0.01]} c="#566E4C" />

          <B p={[0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#2B2D2F" shadow={false} polyOffset />
          <B p={[0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#EFECE6" shadow={false} polyOffset />
          <Sph p={[0.45, 0, 0.025]} s={[0.17, 0.2, 0.01]} c="#C4834E" />
        </G>
      </WallAttached>

      {/* Cây Bàng Singapore ở góc tường bên trái */}
      <G p={[-9.15, Y, -4.85]}>
        <Cyl p={[0, 0.32, 0]} rt={0.22} rb={0.17} h={0.64} c="#2B2D2F" rough={0.65} shadow />
        <Cyl p={[0, 1.05, 0]} rt={0.032} h={1.35} c="#4A423B" />
        {[0.85, 1.15, 1.42, 1.65, 1.85].map((ly, idx) => (
          <group key={idx} position={[0, ly, 0]} rotation={[0, (idx * Math.PI) / 2.5, 0.2]}>
            <Sph p={[0.24, 0, 0]} s={[0.25, 0.04, 0.17]} c={idx % 2 === 0 ? '#566E4C' : '#6F8763'} />
          </group>
        ))}
      </G>

      {/* Rèm voan trắng rủ mềm xuống sàn bên cửa sổ Tầng 2 (click để đóng/mở rèm) */}
      <SecondFloorCurtains />
    </group>
  )
}

function WoodSlatsWall({ H2, showFloor2 }: { H2: number; showFloor2: boolean }) {
  const darkMode = useStore((s) => s.darkMode)
  const palette = getHousePalette(darkMode)
  const wallSlatsRef = useRef<THREE.InstancedMesh>(null)
  const louversRef = useRef<THREE.InstancedMesh>(null)
  const backWallRef = useRef<THREE.Group>(null)
  const partWallRef = useRef<THREE.Group>(null)
  const portalWallRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!showFloor2) return
    const cleanups: Array<() => void> = []
    if (backWallRef.current) cleanups.push(registerOccluderMesh(backWallRef.current, 'wall'))
    if (partWallRef.current) cleanups.push(registerOccluderMesh(partWallRef.current, 'wall'))
    if (portalWallRef.current) cleanups.push(registerOccluderMesh(portalWallRef.current, 'wall'))
    return () => {
      for (const fn of cleanups) fn()
    }
  }, [showFloor2])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    if (wallSlatsRef.current) {
      scale.set(0.048, H2 - 0.04, 0.045)
      for (let i = 0; i < 15; i++) {
        pos.set(-0.64 + (i / 14) * 1.28, H2 / 2, 0.082)
        m.compose(pos, quat, scale)
        wallSlatsRef.current.setMatrixAt(i, m)
      }
      wallSlatsRef.current.instanceMatrix.needsUpdate = true
      wallSlatsRef.current.computeBoundingSphere()
    }
    if (louversRef.current) {
      scale.set(0.11, H2 - 1.56, 0.048)
      for (let i = 0; i < 7; i++) {
        pos.set(0, 1.4 + (H2 - 1.56) / 2, -0.42 + (i / 6) * 0.84)
        m.compose(pos, quat, scale)
        louversRef.current.setMatrixAt(i, m)
        louversRef.current.setColorAt(i, i % 2 === 0 ? SLAT_COLOR : OAK_COLOR)
      }
      louversRef.current.instanceMatrix.needsUpdate = true
      if (louversRef.current.instanceColor) louversRef.current.instanceColor.needsUpdate = true
      louversRef.current.computeBoundingSphere()
    }
  }, [H2])

  return (
    <group>
      {/* 1. Mảng lam gỗ ốp tường sau dày 0.15 tại x = -1.05, z = -5.92 (sát mặt trong -6.00) */}
      <G p={[-1.05, FLOOR2_Y, -5.92]}>
        <group ref={backWallRef}>
          <B p={[0, H2 / 2, 0]} s={[1.45, H2, 0.15]} c="#4A5E6F" rough={0.65} shadow />
        </group>
        <instancedMesh
          ref={wallSlatsRef}
          args={[UNIT_BOX_GEOM, SLAT_MAT, 15]}
          castShadow={false}
          receiveShadow
        />
      </G>

      {/* 2. Vách ngăn lửng nội thất Tầng 2 dày 0.15 units tại x = -1.05 (z: -4.90..-3.90, nằm gọn trong vùng nội thất không chắn NAV_NODES_TIER2) */}
      <G p={[-1.05, FLOOR2_Y, -4.4]}>
        <group ref={partWallRef}>
          {/* Thân vách dưới đặc 0.15 units (y: 0..1.35) */}
          <BB p={[0, 0, 0]} s={[0.15, 1.35, 1.0]} c="#4A5E6F" rough={0.72} shadow />
          <BB p={[-0.072, 0, 0]} s={[0.012, 1.35, 0.99]} c={palette.wallCream} rough={0.85} shadow={false} />
          <BB p={[0.072, 0, 0]} s={[0.012, 1.35, 0.99]} c={palette.wallAccent} rough={0.85} shadow={false} />
          {/* Nẹp gỗ sồi mặt trên vách lửng */}
          <BB p={[0, 1.35, 0]} s={[0.18, 0.045, 1.02]} c="#D8C7B2" rough={0.48} shadow />
          {/* Len chân tường 2 mặt vách ngăn */}
          <B p={[-0.082, 0.07, 0]} s={[0.02, 0.14, 1.0]} c={palette.baseboard} shadow={false} polyOffset />
          <B p={[0.082, 0.07, 0]} s={[0.02, 0.14, 1.0]} c={palette.baseboard} shadow={false} polyOffset />
          {/* Dầm đỉnh & phào trần vách ngăn */}
          <B p={[0, H2 - 0.08, 0]} s={[0.15, 0.16, 1.0]} c="#4A5E6F" rough={0.68} shadow />
        </group>
        {/* Hệ lam gỗ thông thoáng phía trên vách lửng (y: 1.40 .. H2 - 0.16) */}
        <instancedMesh
          ref={louversRef}
          args={[UNIT_BOX_GEOM, LOUVER_INSTANCE_MAT, 7]}
          castShadow={false}
          receiveShadow
        />
      </G>

      {/* 3. Khung cổng thông thoáng dày 0.15 units (z: -3.90 .. +0.18) nối vách ngăn ra mép thông tầng */}
      <G p={[-1.05, FLOOR2_Y, 0]}>
        <group ref={portalWallRef}>
          {/* Dầm cổng trên cao (y: H2 - 0.42 .. H2), giữ thông thoáng hoàn toàn lối đi bên dưới */}
          <B p={[0, H2 - 0.21, -1.86]} s={[0.15, 0.42, 4.08]} c="#4A5E6F" rough={0.68} shadow />
          <B p={[-0.082, H2 - 0.08, -1.86]} s={[0.02, 0.16, 4.08]} c={palette.crownMolding} shadow={false} />
          <B p={[0.082, H2 - 0.08, -1.86]} s={[0.02, 0.16, 4.08]} c={palette.crownMolding} shadow={false} />
          <B p={[0, H2 - 0.425, -1.86]} s={[0.16, 0.03, 4.08]} c="#D8C7B2" rough={0.48} shadow />
          <B p={[0, H2 - 0.445, -1.86]} s={[0.04, 0.015, 3.85]} c="#FFAE52" emissive="#FFAE52" ei={darkMode ? 1.5 : 0.45} shadow={false} />
          {/* Trụ cổng 0.15 x 0.15 neo gọn ngay mép lan can thông tầng z = +0.105 (không vướng NAV_NODES_TIER2) */}
          <BB p={[0, 0, 0.105]} s={[0.15, H2 - 0.42, 0.15]} c="#2B2D2F" rough={0.55} metal={0.25} shadow />
          <B p={[0, 0.07, 0.105]} s={[0.165, 0.14, 0.165]} c={palette.baseboard} shadow={false} />
        </group>
      </G>
    </group>
  )
}

/* ============================================================================
 * 3. CẦU THANG GỖ - THÉP & LAN CAN KÍNH LIỀN MẠCH (NHẤP CHUỘT ĐỂ ĐI BỘ LÊN / XUỐNG)
 * ============================================================================ */
function IndoorStaircase() {
  const darkMode = useStore((s) => s.darkMode)
  const isOrbitMode = useStore((s) => s.mode === 'orbit')
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const steps = 14
  const startZ = 4.7
  const endZ = 0.18
  const totalH = FLOOR2_Y

  // Hình học dầm stringer nối khít từ sàn Tầng 1 (y = 0.06, z = 4.70) lên mép dầm sàn Tầng 2 (y = FLOOR2_Y - 0.15, z = 0.18)
  const stringerY0 = 0.06
  const stringerY1 = FLOOR2_Y - 0.15
  const stringerDy = stringerY1 - stringerY0
  const stringerDz = startZ - endZ
  const stringerLen = Math.hypot(stringerDy, stringerDz)
  const stringerPitch = Math.atan2(stringerDy, stringerDz)
  const stringerMidY = (stringerY0 + stringerY1) / 2
  const stringerMidZ = (startZ + endZ) / 2

  // Hình học tay vịn & lan can kính dốc nối khít lên lan can chiếu nghỉ Tầng 2 (y = FLOOR2_Y + 0.86, z = 0.18)
  const railY0 = 0.92
  const railY1 = FLOOR2_Y + 0.86
  const railDy = railY1 - railY0
  const railLen = Math.hypot(railDy, stringerDz)
  const railPitch = Math.atan2(railDy, stringerDz)
  const railMidY = (railY0 + railY1) / 2

  // Tái sử dụng InstancedMesh & Material cấp module cho 14 bậc thang, 14 nẹp, 28 gân nổi, 14 LED và 10 trụ lan can
  const stepsInstRef = useRef<THREE.InstancedMesh>(null)
  const cleatsInstRef = useRef<THREE.InstancedMesh>(null)
  const ribsInstRef = useRef<THREE.InstancedMesh>(null)
  const ledsInstRef = useRef<THREE.InstancedMesh>(null)
  const postsInstRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const unitScale = new THREE.Vector3(1, 1, 1)
    const postScale = new THREE.Vector3()

    let ribIdx = 0
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / (steps + 1)
      const syTop = t * totalH
      const sz = THREE.MathUtils.lerp(startZ, endZ, t)
      const baseY = syTop - 0.0375

      if (stepsInstRef.current) {
        pos.set(0, baseY, sz)
        m.compose(pos, quat, unitScale)
        stepsInstRef.current.setMatrixAt(i, m)
      }
      if (cleatsInstRef.current) {
        pos.set(0, baseY - 0.052, sz)
        m.compose(pos, quat, unitScale)
        cleatsInstRef.current.setMatrixAt(i, m)
      }
      if (ribsInstRef.current) {
        pos.set(0, baseY + 0.043, sz + 0.11)
        m.compose(pos, quat, unitScale)
        ribsInstRef.current.setMatrixAt(ribIdx++, m)
        pos.set(0, baseY + 0.043, sz + 0.145)
        m.compose(pos, quat, unitScale)
        ribsInstRef.current.setMatrixAt(ribIdx++, m)
      }
      if (ledsInstRef.current) {
        pos.set(0, baseY - 0.044, sz + 0.155)
        m.compose(pos, quat, unitScale)
        ledsInstRef.current.setMatrixAt(i, m)
      }
    }

    if (postsInstRef.current) {
      let postIdx = 0
      const sides = [-0.56, 0.56]
      const stops = [0, 0.25, 0.5, 0.75, 1]
      for (const hx of sides) {
        for (const t of stops) {
          const pyBot = stringerY0 + t * stringerDy
          const pyTop = railY0 + t * railDy
          pos.set(hx, (pyBot + pyTop) / 2, THREE.MathUtils.lerp(startZ, endZ, t))
          postScale.set(0.04, pyTop - pyBot, 0.04)
          m.compose(pos, quat, postScale)
          postsInstRef.current.setMatrixAt(postIdx++, m)
        }
      }
    }

    for (const ref of [stepsInstRef, cleatsInstRef, ribsInstRef, ledsInstRef, postsInstRef]) {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true
        ref.current.computeBoundingSphere()
      }
    }
  }, [isOrbitMode, steps, totalH, startZ, endZ, stringerY0, stringerDy, railY0, railDy])

  const handleStairClick = () => {
    const st = useStore.getState()
    if (st.mode !== 'orbit' || st.viewPreset === 'floor1') return
    // Nếu nhân vật đang điều khiển ở Tầng 2 thì đi xuống Tầng 1, ngược lại đi lên Tầng 2
    const charFloorY =
      st.activeChar === 'girl' ? LIVE_ACTORS.girlPos[1] : LIVE_ACTORS.khoaFloorY
    const curTargetY = st.avatarTarget ? st.avatarTarget[1] : charFloorY
    if (curTargetY > 2.0) {
      st.setAvatarTarget([-8.85, 0, 5.15])
      st.notify('🚶 Xuống Tầng 1')
    } else {
      st.setAvatarTarget([-6.8, FLOOR2_Y, 1.2])
      st.notify('🚶 Lên Tầng 2')
    }
  }

  const stairContent = (
    <G p={[-8.85, 0, 0]}>
        {/* 2 dầm đỡ chéo (stringer) thép Matte Charcoal ốp gỗ sồi nối khít từ sàn Tầng 1 (y=0) lên mép dầm sàn Tầng 2 (y=FLOOR2_Y-0.15) */}
        {[-0.56, 0.56].map((sx, sIdx) => (
          <group key={sIdx}>
            <mesh
              position={[sx, stringerMidY, stringerMidZ]}
              rotation={[stringerPitch, 0, 0]}
              scale={[0.06, 0.18, stringerLen]}
              geometry={UNIT_BOX_GEOM}
              material={STAIR_STRINGER_MAT}
              castShadow
              receiveShadow
            />
            {/* Chỉ gỗ sồi trang trí dọc má ngoài dầm */}
            <mesh
              position={[sx + (sIdx === 0 ? -0.036 : 0.036), stringerMidY, stringerMidZ]}
              rotation={[stringerPitch, 0, 0]}
              scale={[0.014, 0.085, stringerLen]}
              geometry={UNIT_BOX_GEOM}
              material={STAIR_OAK_TRIM_MAT}
              castShadow={false}
              receiveShadow
            />
            {/* Bản mã thép neo khít chân dầm trên sàn Tầng 1 (y = 0) */}
            <B p={[sx, 0.02, startZ]} s={[0.12, 0.04, 0.22]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
            {/* Bản mã thép neo khít đầu dầm vào mép dầm sàn Tầng 2 (y = FLOOR2_Y - 0.15, z = 0.18) */}
            <B p={[sx, stringerY1, endZ]} s={[0.1, 0.24, 0.08]} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
          </group>
        ))}

        {/* 14 Bậc thang gỗ sồi + 14 nẹp thép + 28 gân nổi chống trượt + 14 đèn LED dưới mũi bậc (InstancedMesh) */}
        <instancedMesh ref={stepsInstRef} args={[STAIR_STEP_GEOM, STAIR_STEP_MAT, steps]} castShadow receiveShadow />
        <instancedMesh ref={cleatsInstRef} args={[STAIR_CLEAT_GEOM, STAIR_CLEAT_MAT, steps]} castShadow={false} receiveShadow />
        <instancedMesh ref={ribsInstRef} args={[STAIR_RIB_GEOM, STAIR_RIB_MAT, steps * 2]} castShadow={false} receiveShadow />
        <instancedMesh ref={ledsInstRef} args={[STAIR_LED_GEOM, STAIR_LED_MAT, steps]} castShadow={false} />
        <instancedMesh ref={postsInstRef} args={[UNIT_BOX_GEOM, STAIR_POST_MAT, 10]} castShadow={false} receiveShadow />

        {/* Tay vịn gỗ sồi & lan can kính cường lực 2 bên nối liền mạch lên lan can kính chiếu nghỉ Tầng 2 tại z = 0.18 */}
        {[-0.56, 0.56].map((hx, sideIdx) => (
          <group key={sideIdx}>
            {/* Tay vịn gỗ sồi dốc nối khít (y=0.92 -> y=FLOOR2_Y+0.86) */}
            <mesh
              position={[hx, railMidY, stringerMidZ]}
              rotation={[railPitch, 0, 0]}
              scale={[0.06, 0.045, railLen]}
              geometry={UNIT_BOX_GEOM}
              material={STAIR_RAIL_OAK_MAT}
              castShadow
              receiveShadow
            />
            {/* Thanh nẹp kẹp kính dưới */}
            <mesh
              position={[hx, railMidY - 0.74, stringerMidZ]}
              rotation={[railPitch, 0, 0]}
              scale={[0.045, 0.035, railLen]}
              geometry={UNIT_BOX_GEOM}
              material={STAIR_CLIP_MAT}
              castShadow={false}
              receiveShadow
            />
            {/* Tấm kính cường lực dốc dọc cầu thang */}
            <mesh
              position={[hx, railMidY - 0.37, stringerMidZ]}
              rotation={[railPitch, 0, 0]}
              scale={[0.016, 0.7, railLen - 0.1]}
              geometry={UNIT_BOX_GEOM}
              material={glassMat}
              receiveShadow
            />
          </group>
        ))}
      </G>
  )

  if (!isOrbitMode) return stairContent

  return (
    <Interact
      zone="interior_f2"
      hint="🪜 Cầu thang"
      onClick={handleStairClick}
    >
      {stairContent}
    </Interact>
  )
}

/* ============================================================================
 * 4. TOÀN BỘ NỘI THẤT TẦNG 2 ĐỒNG BỘ TONE TRUNG TÍNH
 * ============================================================================ */
function GirlRoomFurniture() {
  const Y = FLOOR2_Y
  const darkMode = useStore((s) => s.darkMode)
  const girlLampOn = useStore((s) => s.girlLampOn)
  const girlVanityLightOn = useStore((s) => s.girlVanityLightOn)
  const girlShelfLedOn = useStore((s) => s.girlShelfLedOn)
  const floor2ArchLightOn = useStore((s) => s.floor2ArchLightOn)
  const floor2ReadingLampOn = useStore((s) => s.floor2ReadingLampOn)
  const girlPcState = useStore((s) => s.girlPcState)
  const girlChairSpinTick = useStore((s) => s.girlChairSpinTick)
  const girlBookPage = useStore((s) => s.girlBookPage)

  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const creamRugTex = useMemo(() => fluffyCreamRug(), [])
  const persianRugTex = useMemo(() => persianTerracottaRug(), [])
  const bedPaintingTex = useMemo(() => colorfulBedArt(), [])
  const pcScreenTex = useMemo(
    () => girlPcScreen(girlPcState === 'rgb' ? 'rgb' : 'on'),
    [girlPcState],
  )
  const bookTex = useMemo(() => openBookPages(girlBookPage), [girlBookPage])
  const treeLeavesRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!treeLeavesRef.current) return
    const m = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const euler = new THREE.Euler()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3(0.28, 0.032, 0.19)
    for (let idx = 0; idx < 28; idx++) {
      const ring = idx < 10 ? 0 : idx < 20 ? 1 : 2
      const count = ring === 0 ? 10 : ring === 1 ? 10 : 8
      const iInRing = ring === 0 ? idx : ring === 1 ? idx - 10 : idx - 20
      const angle = (iInRing / count) * Math.PI * 2 + ring * 0.45
      const radius = ring === 0 ? 0.58 : ring === 1 ? 0.38 : 0.18
      const ly = ring === 0 ? 1.56 + (idx % 3) * 0.1 : ring === 1 ? 1.88 + (idx % 3) * 0.09 : 2.16 + (idx % 2) * 0.08
      pos.set(Math.cos(angle) * radius, ly, Math.sin(angle) * radius)
      euler.set(Math.sin(angle) * 0.35, -angle, 0.28 + (idx % 3) * 0.12)
      quat.setFromEuler(euler)
      m.compose(pos, quat, scale)
      treeLeavesRef.current.setMatrixAt(idx, m)
      treeLeavesRef.current.setColorAt(idx, F2_LEAF_COLORS[idx % F2_LEAF_COLORS.length])
    }
    treeLeavesRef.current.instanceMatrix.needsUpdate = true
    if (treeLeavesRef.current.instanceColor) treeLeavesRef.current.instanceColor.needsUpdate = true
    treeLeavesRef.current.computeBoundingSphere()
  }, [])

  return (
    <group>
      {/* =====================================================================
       * A. KHU VỰC GIƯỜNG NGỦ (GREIGE #EFECE6/#B7AFA5 + CAMEL & RUST #C4834E/#9E6338 + VÒM LED #FFAE52)
       * ===================================================================== */}

      {/* 1. Thảm chữ nhật trung tính (#B6B7B5) dưới gầm giường */}
      <mesh position={[-5.0, Y + 0.022, -3.85]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <boxGeometry args={[3.45, 0.02, 3.65]} />
        <meshStandardMaterial
          color="#B6B7B5"
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 2. Hai tấm thảm dệt họa tiết trung tính (#8E908F / #B6B7B5) hai bên hông giường */}
      <mesh position={[-7.35, Y + 0.024, -3.55]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <boxGeometry args={[1.08, 0.02, 1.72]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <mesh position={[-2.65, Y + 0.024, -3.55]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <boxGeometry args={[1.08, 0.02, 1.72]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 3. Giường ngủ Greige #B7AFA5 + Ga #EFECE6 + Chăn & gối điểm nhấn ấm #C4834E / #9E6338 */}
      <Interact
        zone="interior_f2"
        hint="🛏️ Giường ngủ Tầng 2"
        onClick={() => useStore.getState().startActivity('girl_sleep', true)}
      >
        <G p={[-5.0, Y, -3.95]}>
          <RBB p={[0, 0, 0]} s={[2.68, 0.34, 3.18]} c="#B7AFA5" rough={0.78} radius={0.04} shadow />
          <RBB p={[0, 0, -1.48]} s={[2.76, 1.48, 0.22]} c="#B7AFA5" rough={0.82} radius={0.04} shadow />
          <RBB p={[0, 0.34, 0.06]} s={[2.46, 0.26, 2.86]} c="#EFECE6" rough={0.85} radius={0.05} />
          <RBB p={[0, 0.6, 0.32]} s={[2.48, 0.09, 2.15]} c="#EFECE6" rough={0.85} radius={0.03} shadow={false} />

          {/* Tấm chăn phủ (Throw Blanket) điểm nhấn ấm Camel #C4834E & Nâu gỉ #9E6338 */}
          <RBB p={[0, 0.69, 0.85]} s={[2.52, 0.045, 0.82]} c="#C4834E" rough={0.85} radius={0.02} shadow={false} />
          <RBB p={[0, 0.735, 0.68]} s={[2.5, 0.025, 0.16]} c="#C4834E" rough={0.85} radius={0.015} shadow={false} />
          <RBB p={[0, 0.735, 1.02]} s={[2.5, 0.025, 0.16]} c="#9E6338" rough={0.85} radius={0.015} shadow={false} />
          <RBB p={[-1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#C4834E" rough={0.85} radius={0.02} shadow={false} />
          <RBB p={[1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#9E6338" rough={0.85} radius={0.02} shadow={false} />

          {/* 2 Gối ngủ lớn trắng kem ấm */}
          <RBB p={[-0.64, 0.62, -1.16]} s={[0.92, 0.18, 0.44]} r={[0.18, 0, 0]} c="#EFECE6" rough={0.85} radius={0.04} shadow={false} />
          <RBB p={[0.64, 0.62, -1.16]} s={[0.92, 0.18, 0.44]} r={[0.18, 0, 0]} c="#EFECE6" rough={0.85} radius={0.04} shadow={false} />

          {/* 2 Chiếc gối tựa Camel & Rust đối xứng */}
          <RBB p={[-0.64, 0.64, -0.92]} s={[0.68, 0.16, 0.28]} r={[0.22, 0, 0]} c="#C4834E" rough={0.85} radius={0.04} shadow={false} />
          <RBB p={[0.64, 0.64, -0.92]} s={[0.68, 0.16, 0.28]} r={[0.22, 0, 0]} c="#9E6338" rough={0.85} radius={0.04} shadow={false} />
        </G>
      </Interact>

      {/* 4. DẢI ĐÈN LED HÌNH VÒM CUNG (ARCH LED) #FFAE52 & TRANH ĐẦU GIƯỜNG */}
      <Interact
        zone="interior_f2"
        hint={floor2ArchLightOn ? '✨ Tắt đèn vòm nghệ thuật' : '✨ Bật đèn vòm nghệ thuật'}
        onClick={() => useStore.getState().toggleFloor2ArchLight()}
      >
        <G p={[-5.0, Y, -5.96]}>
          {/* Dải đèn LED vòm cung phát sáng vàng ấm 3000K #FFAE52 */}
          <mesh position={[0, 2.25, 0]}>
            <torusGeometry args={[1.62, 0.036, 16, 64, Math.PI]} />
            <meshStandardMaterial
              color={floor2ArchLightOn ? '#FFAE52' : '#D6D1C9'}
              emissive={floor2ArchLightOn ? '#FFAE52' : '#000000'}
              emissiveIntensity={floor2ArchLightOn ? 1.65 : 0}
            />
          </mesh>
          <B
            p={[-1.62, 1.42, 0]}
            s={[0.07, 1.68, 0.05]}
            c={floor2ArchLightOn ? '#FFAE52' : '#D6D1C9'}
            emissive={floor2ArchLightOn ? '#FFAE52' : '#000000'}
            ei={floor2ArchLightOn ? 1.65 : 0}
            shadow={false}
          />
          <B
            p={[1.62, 1.42, 0]}
            s={[0.07, 1.68, 0.05]}
            c={floor2ArchLightOn ? '#FFAE52' : '#D6D1C9'}
            emissive={floor2ArchLightOn ? '#FFAE52' : '#000000'}
            ei={floor2ArchLightOn ? 1.65 : 0}
            shadow={false}
          />
          {floor2ArchLightOn && (
            <mesh position={[0, 2.25, 0.02]}>
              <planeGeometry args={[3.2, 1.8]} />
              <meshBasicMaterial color="#FFAE52" transparent opacity={0.14} depthWrite={false} />
            </mesh>
          )}

          {/* Bức tranh khung Matte Charcoal #2B2D2F */}
          <G p={[0, 2.38, 0.025]}>
            <B p={[0, 0, 0]} s={[1.82, 1.16, 0.045]} c="#2B2D2F" rough={0.55} polyOffset />
            <mesh position={[0, 0, 0.028]}>
              <planeGeometry args={[1.68, 1.02]} />
              <meshStandardMaterial
                map={bedPaintingTex}
                roughness={0.8}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </G>

          {/* 4 Kệ gỗ Warm Taupe/Greige hai bên vòm đèn với bình gốm */}
          {[-2.35, 2.35].map((sx, sideIdx) => (
            <group key={sideIdx} position={[sx, 0, 0]}>
              <BB p={[0, 2.28, 0.1]} s={[0.78, 0.04, 0.22]} c="#B7AFA5" rough={0.55} />
              <Cyl p={[-0.16, 2.42, 0.1]} rt={0.05} rb={0.07} h={0.2} c="#EFECE6" />
              <Sph p={[0.14, 2.38, 0.1]} s={[0.065, 0.065, 0.065]} c="#D6D1C9" />

              <BB p={[0, 2.75, 0.1]} s={[0.78, 0.04, 0.22]} c="#B7AFA5" rough={0.55} />
              <Cyl p={[0.12, 2.89, 0.1]} rt={0.045} rb={0.06} h={0.2} c="#EFECE6" />
              <Cyl p={[-0.14, 2.85, 0.1]} rt={0.05} rb={0.05} h={0.12} c="#C4834E" />
            </group>
          ))}
        </G>
      </Interact>

      {/* 5. Hai tủ đầu giường Greige #B7AFA5 + tay nắm #2B2D2F + đèn ngủ #FFAE52 */}
      {[-6.78, -3.22].map((nx, idx) => (
        <Interact
          key={idx}
          zone="interior_f2"
          hint="💡 Đèn ngủ"
          onClick={() => useStore.getState().toggleGirlLamp()}
        >
          <G p={[nx, Y, -5.42]}>
            <RBB p={[0, 0, 0]} s={[0.68, 0.58, 0.52]} c="#B7AFA5" rough={0.58} radius={0.03} shadow />
            <B p={[0, 0.3, 0.265]} s={[0.6, 0.015, 0.01]} c="#2B2D2F" />
            <Sph p={[0, 0.43, 0.27]} s={[0.022, 0.022, 0.022]} c="#2B2D2F" metal={0.45} rough={0.35} />
            <Sph p={[0, 0.17, 0.27]} s={[0.022, 0.022, 0.022]} c="#2B2D2F" metal={0.45} rough={0.35} />

            <Cyl p={[0, 0.64, 0]} rt={0.07} rb={0.095} h={0.12} c="#2B2D2F" />
            <Sph
              p={[0, 0.78, 0]}
              s={[0.16, 0.15, 0.16]}
              c={girlLampOn ? '#FFAE52' : '#D6D1C9'}
              emissive={girlLampOn ? '#FFAE52' : '#000000'}
              ei={girlLampOn ? 1.65 : 0}
            />
            {girlLampOn && (
              <mesh position={[0, 0.78, 0]}>
                <sphereGeometry args={[0.22, 16, 12]} />
                <meshBasicMaterial color="#FFAE52" transparent opacity={0.18} depthWrite={false} />
              </mesh>
            )}
          </G>
        </Interact>
      ))}
      {/* Chậu cây tròn nhỏ bên cạnh tủ đầu giường phải */}
      <G p={[-2.62, Y, -5.42]}>
        <Cyl p={[0, 0.16, 0]} rt={0.13} rb={0.1} h={0.32} c="#EFECE6" />
        <Sph p={[0, 0.38, 0]} s={[0.17, 0.17, 0.17]} c="#566E4C" />
      </G>

      {/* 6. Cụm thảm tròn trung tính #B6B7B5 + Ghế lười Bouclé #EFECE6 + Bàn trà gỗ sồi #D8C7B2 */}
      <G p={[-3.55, Y, 1.15]}>
        <mesh position={[0, 0.024, 0]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
          <cylinderGeometry args={[1.7, 1.7, 0.02, 48]} />
          <meshStandardMaterial
            map={creamRugTex}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Bàn trà gỗ sồi sáng */}
        <G p={[-0.55, 0, 0.05]}>
          <BB p={[0, 0.3, 0]} s={[0.74, 0.04, 0.42]} c="#D8C7B2" rough={0.5} />
          {[-0.3, 0.3].map((lx, i) =>
            [-0.15, 0.15].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.15, lz]} rt={0.022} h={0.3} c="#2B2D2F" />
            )),
          )}
          <mesh position={[0.06, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
            <planeGeometry args={[0.26, 0.18]} />
            <meshStandardMaterial map={bookTex} roughness={0.85} />
          </mesh>
          <Cyl p={[-0.18, 0.37, 0.04]} rt={0.032} rb={0.026} h={0.06} c="#EFECE6" />
        </G>

        {/* Ghế lười tròn Bouclé + Đôn tròn */}
        <Interact
          zone="interior_f2"
          hint="🛋️ Ghế lười Bouclé"
          onClick={() => useStore.getState().startActivity('girl_lounge', true)}
        >
          <G p={[0.45, 0, 0.05]} r={[0, -0.7, 0]}>
            <Cyl p={[0, 0.03, 0]} rt={0.46} rb={0.48} h={0.06} c="#B7AFA5" rough={0.55} shadow />
            <Cyl p={[0, 0.22, 0]} rt={0.48} rb={0.46} h={0.32} c="#EFECE6" rough={0.85} shadow />
            <mesh position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.45, 0.47, 0.08, 32]} />
              <meshStandardMaterial color="#D6D1C9" roughness={0.85} />
            </mesh>

            <group position={[0, 0.42, -0.06]}>
              <mesh position={[0, 0.12, -0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.34, 0.14, 18, 36, Math.PI * 1.15]} />
                <meshStandardMaterial color="#EFECE6" roughness={0.85} />
              </mesh>
              <RB p={[0, 0.15, -0.34]} s={[0.62, 0.38, 0.18]} c="#EFECE6" rough={0.85} radius={0.045} shadow />
              <RB p={[-0.35, 0.08, -0.12]} r={[0, 0.35, 0]} s={[0.16, 0.28, 0.42]} c="#EFECE6" rough={0.85} radius={0.04} />
              <RB p={[0.35, 0.08, -0.12]} r={[0, -0.35, 0]} s={[0.16, 0.28, 0.42]} c="#EFECE6" rough={0.85} radius={0.04} />
            </group>

            {/* Gối tựa điểm nhấn ấm Camel #C4834E */}
            <RB p={[0, 0.45, -0.22]} r={[-0.22, 0, 0]} s={[0.36, 0.26, 0.12]} c="#C4834E" rough={0.85} radius={0.035} />
          </G>
        </Interact>
        <G p={[0.68, 0, -0.72]}>
          <Cyl p={[0, 0.025, 0]} rt={0.27} rb={0.28} h={0.05} c="#B7AFA5" rough={0.55} />
          <Cyl p={[0, 0.2, 0]} rt={0.28} rb={0.27} h={0.32} c="#EFECE6" rough={0.85} shadow />
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.04, 28]} />
            <meshStandardMaterial color="#D6D1C9" roughness={0.85} />
          </mesh>
        </G>
      </G>

      {/* =====================================================================
       * B. GÓC THỬ ĐỒ & GÓC NGHỆ THUẬT - TRƯNG BÀY Ở KHOẢNG TRỐNG GIỮA PHÒNG
       * ===================================================================== */}
      {/* 1. Gương đứng soi toàn thân khung Matte Charcoal #2B2D2F */}
      <G p={[-2.05, Y, -5.68]} r={[-0.06, 0.08, 0]}>
        <BB p={[0, 0, 0]} s={[0.76, 1.88, 0.05]} c="#2B2D2F" rough={0.5} polyOffset />
        <BB p={[0, 0.05, 0.028]} s={[0.66, 1.78, 0.01]} c="#D6D1C9" metal={0.25} rough={0.14} polyOffset />
        <mesh position={[0, 0.25, 0.036]}>
          <planeGeometry args={[0.64, 0.36]} />
          <meshStandardMaterial
            map={persianRugTex}
            roughness={0.4}
            opacity={0.5}
            transparent
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </G>
      <mesh position={[-2.0, Y + 0.024, -4.92]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <cylinderGeometry args={[0.58, 0.58, 0.02, 36]} />
        <meshStandardMaterial
          map={creamRugTex}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 2. Giá treo quần áo chữ A khung Matte Charcoal #2B2D2F & gỗ #B7AFA5 */}
      <Interact
        zone="interior_f2"
        hint="👗 Giá treo trang phục"
        onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
      >
        <G p={[-1.12, Y, -5.32]}>
          {[-0.56, 0.56].map((rx, side) => (
            <group key={side} position={[rx, 0, 0]}>
              <Cyl p={[0, 0.82, -0.14]} r={[0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#2B2D2F" />
              <Cyl p={[0, 0.82, 0.14]} r={[-0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#2B2D2F" />
              <B p={[0, 0.16, 0]} s={[0.035, 0.03, 0.52]} c="#2B2D2F" />
            </group>
          ))}
          <Cyl p={[0, 1.58, 0]} r={[0, 0, Math.PI / 2]} rt={0.016} h={1.24} c="#2B2D2F" metal={0.55} rough={0.3} />
          <BB p={[0, 0.14, 0]} s={[1.1, 0.03, 0.46]} c="#B7AFA5" rough={0.52} />

          {[
            { x: -0.36, c: '#C4834E', skirt: '#9E6338', h: 0.96 },
            { x: -0.12, c: '#EFECE6', skirt: '#D6D1C9', h: 1.04 },
            { x: 0.12, c: '#5E7487', skirt: '#4A5E6F', h: 0.98 },
            { x: 0.36, c: '#566E4C', skirt: '#6F8763', h: 0.92 },
          ].map((dr, idx) => (
            <group key={idx} position={[dr.x, 1.56, 0]}>
              <Cyl p={[0, -0.04, 0]} rt={0.006} h={0.08} c="#2B2D2F" metal={0.5} />
              <BB p={[0, -0.32, 0]} s={[0.14, 0.42, 0.28]} c={dr.c} rough={0.85} />
              <Cyl p={[0, -0.68, 0]} rt={0.08} rb={0.16} h={dr.h - 0.35} c={dr.skirt} rough={0.85} />
            </group>
          ))}

          <BB p={[-0.34, 0.17, 0.04]} s={[0.2, 0.19, 0.12]} c="#9E6338" rough={0.55} />
          <Cyl p={[-0.34, 0.38, 0.04]} r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.015} c="#2B2D2F" metal={0.5} />
          <BB p={[-0.08, 0.17, -0.02]} s={[0.22, 0.21, 0.13]} c="#B7AFA5" rough={0.55} />
          <Cyl p={[-0.08, 0.4, -0.02]} r={[Math.PI / 2, 0, 0]} rt={0.06} h={0.015} c="#2B2D2F" metal={0.5} />
          <BB p={[0.28, 0.17, 0]} s={[0.32, 0.13, 0.26]} c="#EFECE6" rough={0.75} />
          <BB p={[0.28, 0.29, 0]} s={[0.33, 0.025, 0.27]} c="#D6D1C9" />
          <BB p={[0.28, 0.315, 0.01]} s={[0.28, 0.11, 0.23]} c="#D6D1C9" rough={0.75} />
          <BB p={[0.28, 0.415, 0.01]} s={[0.29, 0.022, 0.24]} c="#B7AFA5" />
        </G>
      </Interact>

      {/* 3. CHẬU CÂY CẢNH LỚN TÁN LÁ MUTED SAGE / OLIVE (#566E4C & #6F8763) */}
      <G p={[0.12, Y, -5.05]}>
        <Cyl p={[0, 0.31, 0]} rt={0.33} rb={0.26} h={0.62} c="#B7AFA5" rough={0.78} shadow />
        <Cyl p={[0, 0.58, 0]} rt={0.29} h={0.03} c="#2B2D2F" />
        <Cyl p={[0, 1.25, 0]} rt={0.036} rb={0.055} h={1.35} c="#4A423B" />
        <Cyl p={[-0.22, 1.52, 0.08]} r={[0.15, 0, 0.52]} rt={0.02} rb={0.03} h={0.72} c="#4A423B" />
        <Cyl p={[0.24, 1.46, -0.06]} r={[-0.12, 0, -0.5]} rt={0.02} rb={0.03} h={0.72} c="#4A423B" />
        <Cyl p={[0.05, 1.62, 0.22]} r={[0.48, 0, -0.15]} rt={0.018} rb={0.026} h={0.62} c="#4A423B" />
        <Cyl p={[-0.08, 1.66, -0.2]} r={[-0.42, 0, 0.2]} rt={0.018} rb={0.026} h={0.58} c="#4A423B" />

        <instancedMesh ref={treeLeavesRef} args={[F2_LEAF_GEOM, F2_LEAF_MAT, 28]} castShadow={false} receiveShadow />
      </G>

      {/* 4. KỆ GỖ THẤP 2 TẦNG WARM TAUPE #B7AFA5 + ĐĨA THAN & GẤU BÔNG */}
      <G p={[-0.95, Y, -3.55]}>
          <BB p={[0, 0.04, 0]} s={[1.48, 0.04, 0.42]} c="#B7AFA5" rough={0.52} />
          <BB p={[0, 0.36, 0]} s={[1.48, 0.04, 0.42]} c="#B7AFA5" rough={0.52} />
          <BB p={[0, 0.68, 0]} s={[1.52, 0.045, 0.44]} c="#D8C7B2" rough={0.5} />
          {[-0.7, 0, 0.7].map((sx, idx) => (
            <BB key={idx} p={[sx, 0, 0]} s={[0.04, 0.68, 0.4]} c="#2B2D2F" rough={0.45} />
          ))}

          <G p={[-0.42, 0.725, 0]}>
            <BB p={[0, 0, 0]} s={[0.42, 0.075, 0.34]} c="#C4AF97" rough={0.5} />
            <Cyl p={[-0.03, 0.085, 0]} rt={0.14} h={0.012} c="#2B2D2F" rough={0.28} metal={0.3} />
            <Cyl p={[-0.03, 0.093, 0]} rt={0.045} h={0.008} c="#C4834E" />
            <Cyl p={[0.14, 0.1, -0.1]} rt={0.022} h={0.03} c="#2B2D2F" metal={0.5} />
            <B p={[0.08, 0.11, -0.02]} r={[0, -0.42, 0]} s={[0.012, 0.012, 0.2]} c="#2B2D2F" metal={0.5} />
          </G>

          <G p={[0.12, 0.725, -0.02]}>
            <Cyl p={[0, 0.1, 0]} rt={0.055} rb={0.075} h={0.2} c="#EFECE6" rough={0.35} />
            <Sph p={[-0.04, 0.24, 0.02]} s={[0.055, 0.055, 0.055]} c="#C4834E" />
            <Sph p={[0.04, 0.26, -0.02]} s={[0.055, 0.055, 0.055]} c="#EFECE6" />
            <Sph p={[0, 0.28, 0.03]} s={[0.05, 0.05, 0.05]} c="#D6D1C9" />
            <Sph p={[0.02, 0.22, 0.04]} s={[0.06, 0.04, 0.06]} c="#566E4C" />
          </G>

          <G p={[0.48, 0.725, 0.02]}>
            <BB p={[0, 0, 0]} s={[0.22, 0.14, 0.2]} c="#EFECE6" rough={0.65} />
            <BB p={[0, 0.13, 0]} s={[0.235, 0.03, 0.215]} c="#C4834E" />
            <B p={[0, 0.08, 0]} s={[0.24, 0.16, 0.03]} c="#9E6338" />
          </G>

          <G p={[-0.36, 0.4, 0.04]}>
            <Sph p={[0, 0.09, 0]} s={[0.085, 0.095, 0.075]} c="#9E6338" rough={0.85} />
            <Sph p={[0, 0.2, 0.01]} s={[0.075, 0.07, 0.07]} c="#9E6338" rough={0.85} />
            <Sph p={[-0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#C4834E" />
            <Sph p={[0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#C4834E" />
            <Sph p={[0, 0.19, 0.065]} s={[0.028, 0.022, 0.02]} c="#EFECE6" />
            <Sph p={[-0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#C4834E" />
            <Sph p={[0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#C4834E" />
            <B p={[0, 0.14, 0.065]} s={[0.06, 0.022, 0.015]} c="#5E7487" />
          </G>
          <G p={[0.34, 0.4, 0.04]}>
            <Sph p={[0, 0.085, 0]} s={[0.08, 0.09, 0.07]} c="#EFECE6" rough={0.85} />
            <Sph p={[0, 0.19, 0.01]} s={[0.07, 0.065, 0.065]} c="#EFECE6" rough={0.85} />
            <Sph p={[-0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#D6D1C9" />
            <Sph p={[0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#D6D1C9" />
            <Sph p={[0, 0.18, 0.06]} s={[0.025, 0.02, 0.018]} c="#EFECE6" />
            <Sph p={[-0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#D6D1C9" />
            <Sph p={[0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#D6D1C9" />
            <B p={[0, 0.135, 0.06]} s={[0.055, 0.02, 0.015]} c="#C4834E" />
          </G>
          <BB p={[-0.36, 0.08, 0]} s={[0.32, 0.045, 0.24]} c="#D6D1C9" />
          <BB p={[-0.36, 0.125, 0]} s={[0.28, 0.04, 0.22]} c="#B7AFA5" />
          <BB p={[0.34, 0.08, 0]} s={[0.3, 0.16, 0.22]} c="#5E7487" />
      </G>

      {/* 5. ĐÀN PIANO & GIÁ VẼ TRANH */}
      <G p={[0.15, Y, -1.55]}>
        <mesh position={[-0.15, 0.022, 0.1]} receiveShadow>
          <boxGeometry args={[2.65, 0.02, 1.55]} />
          <meshStandardMaterial
            color="#B6B7B5"
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        <Interact
          zone="interior_f2"
          hint="🎹 Chơi đàn Piano"
          onClick={() => useStore.getState().startActivity('piano', true)}
        >
          <G p={[0.32, 0, -0.08]}>
            <BB p={[-0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#EFECE6" rough={0.55} />
            <BB p={[0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#EFECE6" rough={0.55} />
            <BB p={[0, 0.04, -0.12]} s={[1.28, 0.08, 0.08]} c="#EFECE6" />
            <BB p={[0, 0.18, -0.14]} s={[1.18, 0.48, 0.04]} c="#D6D1C9" />
            {[-0.08, 0, 0.08].map((px, pi) => (
              <B key={pi} p={[px, 0.05, -0.04]} s={[0.022, 0.02, 0.12]} c="#2B2D2F" metal={0.5} />
            ))}

            <BB p={[0, 0.72, 0]} s={[1.38, 0.14, 0.44]} c="#B7AFA5" rough={0.52} />
            <BB p={[0, 0.84, -0.08]} s={[1.38, 0.06, 0.26]} c="#EFECE6" rough={0.48} />

            <BB p={[0, 0.785, 0.11]} s={[1.22, 0.028, 0.15]} c="#EFECE6" rough={0.3} />
            {Array.from({ length: 22 }, (_, ki) => {
              if (ki % 7 === 2 || ki % 7 === 6) return null
              const kx = -0.54 + ki * 0.051
              return <BB key={ki} p={[kx, 0.808, 0.075]} s={[0.022, 0.02, 0.09]} c="#2B2D2F" rough={0.35} />
            })}

            <B p={[0, 0.99, -0.12]} r={[-0.24, 0, 0]} s={[0.52, 0.24, 0.02]} c="#B7AFA5" rough={0.5} />
            <mesh position={[0, 0.995, -0.105]} rotation={[-0.24, 0, 0]}>
              <planeGeometry args={[0.42, 0.2]} />
              <meshStandardMaterial
                map={bookTex}
                roughness={0.85}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>

            <G p={[0, 0, 0.48]}>
              <BB p={[0, 0.4, 0]} s={[0.66, 0.075, 0.34]} c="#EFECE6" rough={0.85} />
              {[-0.28, 0.28].map((lx, i) =>
                [-0.13, 0.13].map((lz, j) => (
                  <Cyl key={`${i}-${j}`} p={[lx, 0.2, lz]} rt={0.022} rb={0.016} h={0.4} c="#B7AFA5" />
                )),
              )}
            </G>
          </G>
        </Interact>

        <Interact
          zone="interior_f2"
          hint="🎨 Vẽ tranh Canvas"
          onClick={() => useStore.getState().startActivity('paint', true)}
        >
          <G p={[-0.86, 0, -0.02]} r={[0, 0.38, 0]}>
            <Cyl p={[-0.24, 0.78, 0.08]} r={[-0.12, 0, -0.16]} rt={0.018} rb={0.022} h={1.58} c="#C4AF97" />
            <Cyl p={[0.24, 0.78, 0.08]} r={[-0.12, 0, 0.16]} rt={0.018} rb={0.022} h={1.58} c="#C4AF97" />
            <Cyl p={[0, 0.74, -0.26]} r={[0.26, 0, 0]} rt={0.018} rb={0.022} h={1.52} c="#C4AF97" />
            <Cyl p={[0, 0.92, 0.06]} r={[-0.12, 0, 0]} rt={0.018} h={1.15} c="#C4AF97" />
            <B p={[0, 0.72, 0.14]} r={[-0.12, 0, 0]} s={[0.68, 0.035, 0.08]} c="#B7AFA5" />

            <G p={[0, 1.06, 0.11]} r={[-0.12, 0, 0]}>
              <B p={[0, 0, 0]} s={[0.64, 0.66, 0.032]} c="#2B2D2F" rough={0.6} polyOffset />
              <mesh position={[0, 0, 0.019]}>
                <planeGeometry args={[0.58, 0.6]} />
                <meshStandardMaterial
                  map={bedPaintingTex}
                  roughness={0.8}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              </mesh>
            </G>

            <Cyl p={[-0.2, 0.78, 0.16]} rt={0.032} rb={0.026} h={0.09} c="#EFECE6" />
            <Cyl p={[-0.2, 0.85, 0.16]} r={[0, 0, 0.2]} rt={0.005} h={0.12} c="#9E6338" />
            <Cyl p={[-0.19, 0.85, 0.16]} r={[0, 0, -0.15]} rt={0.005} h={0.12} c="#5E7487" />
            <Cyl p={[0.18, 0.745, 0.16]} rt={0.09} rb={0.09} h={0.012} c="#D8C7B2" />
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * C. KỆ SÁCH TREO TƯỜNG 2 TẦNG + LED VÀNG ẤM 3000K #FFAE52 + CÂY RỦ #566E4C/#6F8763
       * ===================================================================== */}
      <Interact
        zone="interior_f2"
        hint={girlShelfLedOn ? '✨ Tắt đèn LED kệ sách' : '✨ Bật đèn LED kệ sách'}
        onClick={() => useStore.getState().toggleGirlShelfLed()}
      >
        <G p={[3.55, Y, -5.85]}>
          <BB p={[0, 2.38, 0]} s={[5.2, 0.055, 0.28]} c="#B7AFA5" rough={0.5} />
          <B
            p={[0, 2.34, 0.05]}
            s={[5.05, 0.028, 0.05]}
            c={girlShelfLedOn ? '#FFAE52' : '#D6D1C9'}
            emissive={girlShelfLedOn ? '#FFAE52' : '#000000'}
            ei={girlShelfLedOn ? 1.6 : 0}
            shadow={false}
          />

          <BB p={[0, 2.88, 0]} s={[5.2, 0.055, 0.28]} c="#B7AFA5" rough={0.5} />
          <B
            p={[0, 2.84, 0.05]}
            s={[5.05, 0.028, 0.05]}
            c={girlShelfLedOn ? '#FFAE52' : '#D6D1C9'}
            emissive={girlShelfLedOn ? '#FFAE52' : '#000000'}
            ei={girlShelfLedOn ? 1.6 : 0}
            shadow={false}
          />

          {girlShelfLedOn && (
            <mesh position={[0, 2.6, 0.01]}>
              <planeGeometry args={[5.2, 0.95]} />
              <meshBasicMaterial color="#FFAE52" transparent opacity={0.14} depthWrite={false} />
            </mesh>
          )}

          <group position={[-1.75, 2.935, 0]}>
            {[
              { dx: -0.28, h: 0.26, c: '#EFECE6' },
              { dx: -0.22, h: 0.28, c: '#D6D1C9' },
              { dx: -0.16, h: 0.25, c: '#B7AFA5' },
              { dx: -0.1, h: 0.29, c: '#C4834E' },
              { dx: -0.04, h: 0.26, c: '#6F8763' },
              { dx: 0.02, h: 0.27, c: '#566E4C' },
              { dx: 0.08, h: 0.24, c: '#5E7487' },
              { dx: 0.14, h: 0.28, c: '#4A5E6F' },
            ].map((bk, i) => (
              <BB key={i} p={[bk.dx, 0, 0]} s={[0.052, bk.h, 0.19]} c={bk.c} rough={0.72} />
            ))}
          </group>

          {[
            { x: -1.65, y: 2.435, colors: ['#D6D1C9', '#B7AFA5', '#C4834E', '#EFECE6'] },
            { x: -0.65, y: 2.435, colors: ['#5E7487', '#4A5E6F', '#B7AFA5', '#D6D1C9'] },
            { x: 0.85, y: 2.435, colors: ['#566E4C', '#B7AFA5', '#9E6338', '#4A5E6F'] },
            { x: 1.85, y: 2.435, colors: ['#C4834E', '#D8C7B2', '#5E7487', '#EFECE6'] },
            { x: -0.55, y: 2.935, colors: ['#B7AFA5', '#566E4C', '#4A5E6F'] },
            { x: 1.15, y: 2.935, colors: ['#9E6338', '#C4AF97', '#D6D1C9'] },
          ].map((grp, gi) => (
            <group key={gi} position={[grp.x, grp.y, 0]}>
              {grp.colors.map((col, ci) => (
                <BB
                  key={ci}
                  p={[(ci - 1.5) * 0.062, 0, 0]}
                  s={[0.055, 0.23 + (ci % 2) * 0.03, 0.18]}
                  c={col}
                  rough={0.72}
                />
              ))}
            </group>
          ))}

          {[-2.32, -0.05, 2.32].map((vx, i) => (
            <group key={i} position={[vx, 2.935, 0.06]}>
              <Cyl p={[0, 0.08, 0]} rt={0.085} rb={0.065} h={0.16} c="#EFECE6" />
              <Sph p={[0, 0.16, 0]} s={[0.13, 0.09, 0.12]} c="#566E4C" />
              {[
                { dy: -0.12, dx: -0.02, s: [0.09, 0.14, 0.06], col: '#566E4C' },
                { dy: -0.28, dx: 0.03, s: [0.085, 0.16, 0.06], col: '#6F8763' },
                { dy: -0.45, dx: -0.02, s: [0.075, 0.16, 0.05], col: '#566E4C' },
                { dy: -0.62, dx: 0.02, s: [0.06, 0.15, 0.045], col: '#6F8763' },
                { dy: -0.76, dx: -0.01, s: [0.045, 0.12, 0.04], col: '#566E4C' },
              ].map((leaf, j) => (
                <Sph
                  key={j}
                  p={[leaf.dx, leaf.dy, 0.06]}
                  s={leaf.s as V3}
                  c={leaf.col}
                  rough={0.72}
                />
              ))}
            </group>
          ))}
        </G>
      </Interact>

      {/* =====================================================================
       * D. BÀN HỌC WARM TAUPE (#B7AFA5), CHÂN CHARCOAL (#2B2D2F), GHẾ SLATE BLUE (#5E7487)
       * ===================================================================== */}
      {/* Thảm dệt họa tiết trung tính (#8E908F / #B6B7B5) dưới bàn học */}
      <mesh position={[2.25, Y + 0.024, -4.68]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
        <boxGeometry args={[2.3, 0.02, 1.38]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      <Interact
        zone="interior_f2"
        hint="💻 Bàn máy tính Tầng 2"
        onClick={() => useStore.getState().startActivity('girl_pc', true)}
      >
        <G p={[2.25, Y, -5.2]}>
          {/* Mặt bàn Warm Taupe/Greige #B7AFA5 & Chân bàn Matte Charcoal #2B2D2F */}
          <RBB p={[0, 0.72, 0]} s={[1.62, 0.055, 0.78]} c="#B7AFA5" rough={0.52} radius={0.025} shadow />
          <BB p={[-0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#2B2D2F" rough={0.45} shadow />
          <BB p={[0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#2B2D2F" rough={0.45} shadow />
          <RBB p={[-0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#B7AFA5" radius={0.015} />
          <RBB p={[0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#B7AFA5" radius={0.015} />

          {/* Màn hình rộng viền Matte Charcoal #2B2D2F + sáng vàng ấm đồng bộ */}
          <G p={[0, 0.775, -0.18]}>
            <B p={[0, 0.01, 0]} s={[0.26, 0.02, 0.18]} c="#2B2D2F" metal={0.45} rough={0.35} />
            <B p={[0, 0.14, -0.04]} s={[0.05, 0.26, 0.03]} c="#2B2D2F" metal={0.45} rough={0.35} />
            <RB p={[0, 0.42, 0]} s={[1.18, 0.66, 0.035]} c="#2B2D2F" radius={0.015} shadow />
            <mesh position={[0, 0.42, 0.022]}>
              <planeGeometry args={[1.12, 0.6]} />
              {girlPcState === 'off' ? (
                <meshStandardMaterial
                  color="#1B1D1F"
                  roughness={0.22}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              ) : (
                <meshStandardMaterial
                  map={pcScreenTex}
                  emissive="#FFD7A3"
                  emissiveMap={pcScreenTex}
                  emissiveIntensity={0.68}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              )}
            </mesh>
          </G>

          {/* 2 Loa Matte Charcoal & bàn phím #EFECE6 */}
          <RBB p={[-0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#2B2D2F" radius={0.02} />
          <RBB p={[0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#2B2D2F" radius={0.02} />
          <RBB p={[0, 0.775, 0.12]} s={[0.38, 0.015, 0.13]} c="#EFECE6" radius={0.006} />

          {/* GHẾ LÀM VIỆC SLATE BLUE (#5E7487 / #4A5E6F) CHÂN MATTE CHARCOAL (#2B2D2F) */}
          <G p={[0, 0, 0.56]} r={[0, Math.PI + girlChairSpinTick * 0.4, 0]}>
            <Cyl p={[0, 0.22, 0]} rt={0.032} h={0.38} c="#2B2D2F" metal={0.45} rough={0.35} />
            {[0, 1, 2, 3, 4].map((ci) => {
              const ang = (ci * Math.PI * 2) / 5
              return (
                <B
                  key={ci}
                  p={[Math.sin(ang) * 0.16, 0.04, Math.cos(ang) * 0.16]}
                  r={[0, ang, 0]}
                  s={[0.035, 0.03, 0.32]}
                  c="#2B2D2F"
                />
              )
            })}
            <RBB p={[0, 0.4, 0]} s={[0.52, 0.075, 0.5]} c="#5E7487" rough={0.85} radius={0.03} shadow />
            <RBB p={[0, 0.47, -0.22]} s={[0.48, 0.58, 0.065]} c="#4A5E6F" rough={0.85} radius={0.03} shadow />
            <RBB p={[-0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#2B2D2F" radius={0.015} />
            <RBB p={[0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#2B2D2F" radius={0.015} />
          </G>
        </G>
      </Interact>

      {/* =====================================================================
       * E. BÀN TRANG ĐIỂM WARM TAUPE (#B7AFA5) + ĐÈN GƯƠNG HALO #FFAE52
       * ===================================================================== */}
      <Interact
        zone="interior_f2"
        hint="💄 Bàn trang điểm"
        onClick={() => useStore.getState().startActivity('girl_vanity', true)}
      >
        <G p={[4.95, Y, -5.16]}>
          <RBB p={[0, 0.62, 0]} s={[1.6, 0.13, 0.86]} c="#B7AFA5" rough={0.55} radius={0.03} shadow />
          <B p={[-0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#D6D1C9" />
          <B p={[0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#D6D1C9" />
          <Sph p={[-0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#2B2D2F" metal={0.45} rough={0.35} />
          <Sph p={[0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#2B2D2F" metal={0.45} rough={0.35} />

          {[-0.68, 0.68].map((lx, i) =>
            [-0.32, 0.32].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.31, lz]} rt={0.028} rb={0.018} h={0.62} c="#2B2D2F" shadow />
            )),
          )}

          {/* GƯƠNG TRÒN VIỀN LED VÀNG ẤM #FFAE52 */}
          <Interact
            zone="interior_f2"
            hint={girlVanityLightOn ? '✨ Tắt đèn gương Halo' : '✨ Bật đèn gương Halo'}
            onClick={() => {
              useStore.getState().toggleGirlVanityLight()
            }}
          >
            <G p={[0, 1.32, -0.24]}>
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.52} h={0.038} c="#2B2D2F" />
              <Cyl
                p={[0, 0, 0.016]}
                r={[Math.PI / 2, 0, 0]}
                rt={0.45}
                h={0.02}
                c="#E5E4E0"
                metal={0.25}
                rough={0.14}
              />
              <mesh position={[0, 0, 0.028]}>
                <torusGeometry args={[0.48, 0.032, 20, 64]} />
                <meshStandardMaterial
                  color={girlVanityLightOn ? '#FFAE52' : '#D6D1C9'}
                  emissive={girlVanityLightOn ? '#FFAE52' : '#000000'}
                  emissiveIntensity={girlVanityLightOn ? 1.65 : 0}
                />
              </mesh>
              {girlVanityLightOn && (
                <mesh position={[0, 0, 0.015]}>
                  <circleGeometry args={[0.58, 36]} />
                  <meshBasicMaterial color="#FFAE52" transparent opacity={0.18} depthWrite={false} />
                </mesh>
              )}
            </G>
          </Interact>

          {/* 1. KHAY NƯỚC HOA */}
          <G p={[-0.48, 0.75, 0.06]}>
            <Cyl p={[0, 0.01, 0]} rt={0.19} rb={0.19} h={0.016} c="#2B2D2F" metal={0.45} rough={0.35} />
            <Cyl p={[0, 0.019, 0]} rt={0.175} rb={0.175} h={0.008} c="#EFECE6" metal={0.2} rough={0.2} />
            <BB p={[-0.06, 0.022, -0.04]} s={[0.055, 0.11, 0.035]} c="#C4834E" rough={0.25} />
            <Sph p={[-0.06, 0.145, -0.04]} s={[0.02, 0.02, 0.02]} c="#2B2D2F" metal={0.5} />
            <Cyl p={[0.05, 0.07, -0.03]} rt={0.032} h={0.095} c="#EFECE6" rough={0.25} />
            <Cyl p={[0.05, 0.125, -0.03]} rt={0.014} h={0.025} c="#2B2D2F" metal={0.5} />
            <Cyl p={[-0.02, 0.065, 0.06]} rt={0.028} h={0.08} c="#D6D1C9" rough={0.25} />
            <BB p={[0.06, 0.022, 0.05]} s={[0.042, 0.085, 0.042]} c="#D8C7B2" rough={0.25} />
          </G>

          {/* 2. HỘP ĐỰNG MỸ PHẨM */}
          <G p={[0.38, 0.75, -0.02]}>
            <BB p={[0, 0, 0]} s={[0.28, 0.09, 0.18]} c="#EFECE6" rough={0.5} />
            <BB p={[0, 0.045, -0.04]} s={[0.26, 0.06, 0.08]} c="#B7AFA5" />
            {[-0.08, -0.03, 0.02].map((lx, li) => (
              <Cyl key={li} p={[lx, 0.09, 0.04]} rt={0.012} h={0.065} c={li === 0 ? '#9E6338' : li === 1 ? '#C4834E' : '#B7AFA5'} />
            ))}
            <Cyl p={[0.08, 0.08, -0.03]} rt={0.032} h={0.11} c="#2B2D2F" metal={0.45} />
            <Cyl p={[0.07, 0.15, -0.03]} r={[0, 0, 0.18]} rt={0.006} h={0.08} c="#D6D1C9" />
            <Cyl p={[0.09, 0.15, -0.02]} r={[0, 0, -0.15]} rt={0.006} h={0.08} c="#EFECE6" />
          </G>

          {/* 3. BÌNH HOA TULIP */}
          <G p={[0.58, 0.75, 0.14]}>
            <Cyl p={[0, 0.09, 0]} rt={0.052} rb={0.068} h={0.18} c="#EFECE6" rough={0.35} />
            {[
              { dx: -0.025, dz: 0.01, h: 0.25, col: '#EFECE6', tilt: 0.14 },
              { dx: 0.025, dz: -0.01, h: 0.27, col: '#C4834E', tilt: -0.15 },
              { dx: 0, dz: 0.025, h: 0.24, col: '#EFECE6', tilt: 0.08 },
              { dx: -0.015, dz: -0.025, h: 0.26, col: '#9E6338', tilt: -0.1 },
              { dx: 0.015, dz: 0.018, h: 0.28, col: '#D6D1C9', tilt: 0.05 },
            ].map((tl, ti) => (
              <group key={ti} position={[tl.dx, 0.14, tl.dz]} rotation={[0, 0, tl.tilt]}>
                <Cyl p={[0, tl.h / 2 - 0.06, 0]} rt={0.005} h={tl.h - 0.08} c="#566E4C" />
                <Sph p={[0, tl.h - 0.08, 0]} s={[0.026, 0.038, 0.026]} c={tl.col} rough={0.5} />
              </group>
            ))}
          </G>

          {/* Ghế đôn tròn màu Slate Grey #8E908F / #B6B7B5 */}
          <Cyl p={[0, 0.22, 0.56]} rt={0.25} rb={0.25} h={0.44} c="#8E908F" rough={0.85} shadow />
        </G>
      </Interact>

      {/* =====================================================================
       * F. TỦ QUẦN ÁO WARM TAUPE/GREIGE (#B7AFA5) + TAY NẮM CHARCOAL (#2B2D2F) + LED #FFAE52
       * ===================================================================== */}
      <Interact
        zone="interior_f2"
        hint="👗 Tủ quần áo Bạn Gái"
        onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
      >
        <G p={[7.65, Y, -5.25]}>
          {/* Khung vỏ tủ Warm Taupe/Greige #B7AFA5 */}
          <BB p={[0, 0, -0.52]} s={[2.05, 3.42, 0.06]} c="#B7AFA5" rough={0.62} shadow />
          <RBB p={[-0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#B7AFA5" rough={0.62} radius={0.02} shadow />
          <RBB p={[0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#B7AFA5" rough={0.62} radius={0.02} shadow />
          <BB p={[0, 0, 0]} s={[2.05, 0.12, 1.08]} c="#2B2D2F" rough={0.55} />
          <BB p={[0, 3.32, 0]} s={[2.06, 0.1, 1.1]} c="#B7AFA5" rough={0.6} shadow />
          <RBB p={[0, 3.42, 0.02]} s={[2.16, 0.1, 1.16]} c="#D6D1C9" rough={0.58} radius={0.025} shadow />
          <BB p={[0, 0.12, -0.04]} s={[0.045, 3.2, 0.96]} c="#D6D1C9" rough={0.65} />
          <BB p={[0, 0.12, -0.48]} s={[1.9, 3.2, 0.02]} c="#EFECE6" rough={0.75} />

          <BB p={[0, 2.68, -0.02]} s={[1.92, 0.045, 0.96]} c="#D6D1C9" />
          <BB p={[0, 0.96, -0.02]} s={[1.92, 0.045, 0.96]} c="#D6D1C9" />
          <BB p={[0, 0.52, -0.02]} s={[1.92, 0.04, 0.96]} c="#D6D1C9" />

          <BB p={[-0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#EFECE6" rough={0.85} />
          <BB p={[0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#D6D1C9" rough={0.85} />

          <Cyl p={[-0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#2B2D2F" metal={0.5} rough={0.35} />
          <Cyl p={[0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#2B2D2F" metal={0.5} rough={0.35} />
          {[
            { x: -0.72, h: 1.15, c: '#C4834E' },
            { x: -0.5, h: 1.25, c: '#EFECE6' },
            { x: -0.28, h: 1.05, c: '#5E7487' },
            { x: 0.28, h: 1.2, c: '#EFECE6' },
            { x: 0.5, h: 1.1, c: '#B7AFA5' },
            { x: 0.72, h: 1.22, c: '#4A5E6F' },
          ].map((cl, idx) => (
            <BB
              key={idx}
              p={[cl.x, 2.48 - cl.h, 0.02]}
              s={[0.16, cl.h, 0.46]}
              c={cl.c}
              rough={0.85}
            />
          ))}

          <BB p={[-0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#D6D1C9" />
          <BB p={[0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#B7AFA5" />
          <BB p={[-0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#C4834E" />
          <BB p={[0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#9E6338" />

          {[-0.48, 0.48].map((lx, idx) => (
            <group key={idx}>
              <B
                p={[lx, 3.26, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#FFAE52"
                emissive="#FFAE52"
                ei={1.5}
                shadow={false}
              />
              <B
                p={[lx, 2.64, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#FFAE52"
                emissive="#FFAE52"
                ei={1.5}
                shadow={false}
              />
              <B
                p={[lx, 0.93, 0.22]}
                s={[0.82, 0.02, 0.04]}
                c="#FFAE52"
                emissive="#FFAE52"
                ei={1.5}
                shadow={false}
              />
            </group>
          ))}

          {[-0.48, 0.48].map((dx, side) => (
            <group key={side} position={[dx, 0.12, 0.52]}>
              <BB p={[-0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#B7AFA5" />
              <BB p={[0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#B7AFA5" />
              <BB p={[0, 0, 0]} s={[0.95, 0.08, 0.04]} c="#B7AFA5" />
              <BB p={[0, 3.12, 0]} s={[0.95, 0.08, 0.04]} c="#B7AFA5" />
              <mesh position={[0, 1.6, 0]} material={glassMat}>
                <boxGeometry args={[0.82, 3.04, 0.018]} />
              </mesh>
              <BB
                p={[side === 0 ? 0.38 : -0.38, 1.35, 0.03]}
                s={[0.025, 0.72, 0.025]}
                c="#2B2D2F"
                metal={0.45}
                rough={0.35}
              />
            </group>
          ))}
        </G>
      </Interact>

      {/* =====================================================================
       * G. GÓC ĐỌC SÁCH SÁT LAN CAN KÍNH BÊN PHẢI (SLATE BLUE #5E7487 + ĐÈN #FFD7A3)
       * ===================================================================== */}
      <G p={[6.55, Y, -1.28]}>
        <mesh position={[0, 0.024, 0]} receiveShadow raycast={NOOP_RAYCAST} userData={{ noRaycast: true }}>
          <boxGeometry args={[3.75, 0.02, 1.75]} />
          <meshStandardMaterial
            map={persianRugTex}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* 2. Ghế bành Slate Blue (#5E7487 / #4A5E6F) chân Matte Charcoal (#2B2D2F) */}
        <Interact
          zone="interior_f2"
          hint="🪑 Ghế đọc sách"
          onClick={() => useStore.getState().startActivity('girl_nook', true)}
        >
          <G p={[1.18, 0, -0.08]} r={[0, -0.68, 0]}>
            {[-0.36, 0.36].map((lx, i) =>
              [-0.34, 0.34].map((lz, j) => (
                <Cyl key={`${i}-${j}`} p={[lx, 0.12, lz]} rt={0.026} rb={0.016} h={0.24} c="#2B2D2F" />
              )),
            )}
            <RBB p={[0, 0.22, 0]} s={[0.88, 0.18, 0.84]} c="#4A5E6F" rough={0.85} radius={0.04} shadow />
            <RBB p={[0, 0.38, 0.03]} s={[0.72, 0.12, 0.72]} c="#5E7487" rough={0.85} radius={0.04} />
            <RBB p={[0, 0.42, -0.34]} r={[-0.18, 0, 0]} s={[0.84, 0.62, 0.16]} c="#4A5E6F" rough={0.85} radius={0.04} shadow />
            <RBB p={[0, 0.48, -0.27]} r={[-0.18, 0, 0]} s={[0.72, 0.26, 0.1]} c="#5E7487" rough={0.85} radius={0.03} />
            <RBB p={[0, 0.76, -0.32]} r={[-0.18, 0, 0]} s={[0.72, 0.24, 0.1]} c="#C4834E" rough={0.85} radius={0.03} />
            <RBB p={[-0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#5E7487" rough={0.85} radius={0.03} />
            <RBB p={[0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#5E7487" rough={0.85} radius={0.03} />
          </G>
        </Interact>

        {/* 3. Đôn gác chân (Ottoman) Slate Blue */}
        <G p={[-0.95, 0, -0.05]} r={[0, 0.25, 0]}>
          {[-0.26, 0.26].map((lx, i) =>
            [-0.2, 0.2].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.1, lz]} rt={0.022} rb={0.015} h={0.2} c="#2B2D2F" />
            )),
          )}
          <RBB p={[0, 0.18, 0]} s={[0.68, 0.18, 0.54]} c="#5E7487" rough={0.85} radius={0.04} shadow />
          <RBB p={[0, 0.34, 0]} s={[0.64, 0.06, 0.5]} c="#4A5E6F" rough={0.85} radius={0.03} />
        </G>

        {/* 4. Bàn trà tròn gỗ sồi sáng & bộ trà gốm */}
        <G p={[0.08, 0, 0.12]}>
          <Cyl p={[0, 0.44, 0]} rt={0.38} rb={0.38} h={0.04} c="#D8C7B2" rough={0.5} />
          {[0, 1, 2].map((li) => {
            const ang = (li * Math.PI * 2) / 3 + 0.4
            return (
              <Cyl
                key={li}
                p={[Math.cos(ang) * 0.2, 0.22, Math.sin(ang) * 0.2]}
                rt={0.02}
                rb={0.014}
                h={0.44}
                c="#2B2D2F"
              />
            )
          })}
          <Sph p={[-0.1, 0.52, -0.06]} s={[0.075, 0.065, 0.075]} c="#EFECE6" rough={0.35} />
          <Sph p={[-0.1, 0.585, -0.06]} s={[0.02, 0.018, 0.02]} c="#2B2D2F" metal={0.5} />
          <Cyl p={[-0.03, 0.53, -0.06]} r={[0, 0, -0.8]} rt={0.012} rb={0.018} h={0.07} c="#EFECE6" />
          <Cyl p={[0.06, 0.466, -0.1]} rt={0.052} rb={0.045} h={0.01} c="#D6D1C9" />
          <Cyl p={[0.06, 0.495, -0.1]} rt={0.034} rb={0.028} h={0.052} c="#EFECE6" rough={0.35} />
          <Cyl p={[-0.14, 0.466, 0.1]} rt={0.052} rb={0.045} h={0.01} c="#D6D1C9" />
          <Cyl p={[-0.14, 0.495, 0.1]} rt={0.034} rb={0.028} h={0.052} c="#EFECE6" rough={0.35} />
          <Cyl p={[0.1, 0.468, 0.09]} rt={0.1} rb={0.085} h={0.014} c="#EFECE6" rough={0.3} />
          <Sph p={[0.07, 0.49, 0.07]} s={[0.028, 0.018, 0.028]} c="#C4834E" />
          <Sph p={[0.13, 0.49, 0.08]} s={[0.028, 0.018, 0.028]} c="#EFECE6" />
          <Sph p={[0.09, 0.49, 0.13]} s={[0.028, 0.018, 0.028]} c="#6F8763" />
          <Cyl p={[0.1, 0.505, 0.04]} rt={0.032} rb={0.028} h={0.042} c="#D8C7B2" />
          <Sph p={[0.1, 0.532, 0.04]} s={[0.018, 0.018, 0.018]} c="#9E6338" />
        </G>

        {/* 5. Kệ tạp chí Warm Taupe & Slate Blue */}
        <G p={[1.68, 0, -0.52]} r={[0, -0.45, 0]}>
          {[-0.18, 0.18].map((mx, mi) => (
            <group key={mi} position={[mx, 0, 0]}>
              <Cyl p={[0, 0.22, 0]} r={[0.38, 0, 0]} rt={0.014} h={0.48} c="#2B2D2F" />
              <Cyl p={[0, 0.22, 0]} r={[-0.38, 0, 0]} rt={0.014} h={0.48} c="#2B2D2F" />
            </group>
          ))}
          <B p={[0, 0.24, 0]} s={[0.34, 0.18, 0.22]} c="#B7AFA5" rough={0.78} />
          <B p={[-0.04, 0.31, -0.03]} r={[0.25, 0, 0]} s={[0.22, 0.24, 0.018]} c="#C4834E" />
          <B p={[0.04, 0.32, 0.03]} r={[-0.22, 0, 0]} s={[0.22, 0.25, 0.018]} c="#5E7487" />
          <B p={[0, 0.33, 0]} r={[0.1, 0, 0]} s={[0.22, 0.24, 0.018]} c="#EFECE6" />
        </G>

        {/* 6. CHÚ MÈO NHỎ NẰM NGỦ */}
        <SleepingCat p={[-0.34, 0.034, -0.36]} />

        {/* 7. Cây đèn sàn (Floor Lamp) Matte Charcoal phát sáng vàng ấm #FFAE52 */}
        <Interact
          zone="interior_f2"
          hint={floor2ReadingLampOn ? '💡 Tắt đèn cây đọc sách' : '💡 Bật đèn cây đọc sách'}
          onClick={() => useStore.getState().toggleFloor2ReadingLamp()}
        >
          <G p={[2.18, 0, 0.42]}>
            <Cyl p={[0, 0.025, 0]} rt={0.22} rb={0.24} h={0.05} c="#2B2D2F" metal={0.45} rough={0.35} />
            <Cyl p={[0, 0.78, 0]} rt={0.02} rb={0.024} h={1.5} c="#2B2D2F" metal={0.45} rough={0.35} />
            <Cyl
              p={[0, 1.56, 0]}
              rt={0.23}
              rb={0.26}
              h={0.42}
              c={floor2ReadingLampOn ? '#FFAE52' : '#D6D1C9'}
              emissive={floor2ReadingLampOn ? '#FFAE52' : '#000000'}
              ei={floor2ReadingLampOn ? 1.65 : 0}
            />
            {floor2ReadingLampOn && (
              <mesh position={[0, 1.45, 0]}>
                <sphereGeometry args={[0.3, 16, 12]} />
                <meshBasicMaterial color="#FFAE52" transparent opacity={0.16} depthWrite={false} />
              </mesh>
            )}
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * H. TỦ GỖ NHỎ ĐẦU CẦU THANG & GHẾ BĂNG DÀI ÁP SÁT TƯỜNG TRÁI
       * ===================================================================== */}
      <G p={[-7.32, Y, 1.55]}>
        <RBB p={[0, 0, 0]} s={[0.62, 0.84, 1.12]} c="#B7AFA5" rough={0.55} radius={0.03} shadow />
        <B p={[0, 0.42, 0]} s={[0.64, 0.025, 1.08]} c="#C4AF97" />
        <Cyl p={[0, 0.91, 0]} rt={0.11} rb={0.085} h={0.14} c="#EFECE6" />
        <Sph p={[0, 1.04, 0]} s={[0.15, 0.12, 0.15]} c="#566E4C" />
      </G>

      <G p={[-9.52, Y, -2.7]} r={[0, Math.PI / 2, 0]}>
        <RBB p={[0, 0, 0]} s={[1.86, 0.08, 0.54]} c="#B7AFA5" rough={0.55} radius={0.02} shadow />
        <RBB p={[0, 0.08, 0]} s={[1.82, 0.3, 0.52]} c="#D6D1C9" rough={0.85} radius={0.035} shadow />
        <RBB p={[0, 0.38, 0]} s={[1.86, 0.09, 0.55]} c="#EFECE6" rough={0.85} radius={0.03} />
        <Cyl p={[-0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#EFECE6" rough={0.85} />
        <Cyl p={[0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#EFECE6" rough={0.85} />
        <RBB p={[-0.48, 0.47, -0.14]} r={[0.22, 0.08, 0]} s={[0.42, 0.28, 0.14]} c="#C4834E" rough={0.85} radius={0.035} />
        <RBB p={[0, 0.47, -0.15]} r={[0.2, 0, 0]} s={[0.4, 0.26, 0.14]} c="#9E6338" rough={0.85} radius={0.035} />
        <RBB p={[0.48, 0.47, -0.14]} r={[0.22, -0.08, 0]} s={[0.42, 0.28, 0.14]} c="#5E7487" rough={0.85} radius={0.035} />
      </G>
    </group>
  )
}

/* ---------- Chú mèo nhỏ màu kem yến mạch nằm cuộn tròn ngủ ngoan ---------- */
function SleepingCat({ p }: { p: V3 }) {
  const bodyRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!bodyRef.current) return
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.035
    bodyRef.current.scale.set(1, s, 1)
  })
  return (
    <group position={p} rotation={[0, 0.65, 0]}>
      <group ref={bodyRef}>
        {/* Thân mèo kem yến mạch dịu cuộn tròn ấm áp */}
        <Sph p={[0, 0.075, 0]} s={[0.17, 0.085, 0.14]} c="#dfd3c0" rough={0.85} />
        <Sph p={[0.02, 0.08, 0.02]} s={[0.13, 0.078, 0.11]} c="#e8dfd0" rough={0.85} />
        {/* Đầu mèo gối lên chân trước */}
        <Sph p={[0.12, 0.095, 0.05]} s={[0.085, 0.075, 0.08]} c="#dfd3c0" rough={0.85} />
        {/* Mõm ngà & mũi hồng phấn dịu */}
        <Sph p={[0.18, 0.08, 0.07]} s={[0.04, 0.032, 0.04]} c="#f4eee4" />
        <Sph p={[0.21, 0.088, 0.075]} s={[0.012, 0.01, 0.012]} c="#c9a39d" />
        {/* 2 Tai mèo hình chóp nhọn */}
        <mesh position={[0.11, 0.165, 0.01]} rotation={[0.15, 0, -0.2]}>
          <coneGeometry args={[0.028, 0.055, 4]} />
          <meshStandardMaterial color="#baa993" roughness={0.8} />
        </mesh>
        <mesh position={[0.14, 0.165, 0.09]} rotation={[-0.15, 0, -0.2]}>
          <coneGeometry args={[0.028, 0.055, 4]} />
          <meshStandardMaterial color="#baa993" roughness={0.8} />
        </mesh>
        {/* Đuôi mèo vắt cong quanh mình */}
        <Cyl p={[-0.14, 0.045, 0.06]} r={[Math.PI / 2, 0, -0.6]} rt={0.022} rb={0.018} h={0.22} c="#baa993" />
        <Sph p={[-0.06, 0.045, 0.14]} s={[0.024, 0.02, 0.024]} c="#f4eee4" />
      </group>
    </group>
  )
}

/* ============================================================================
 * 5. NHÂN VẬT BẠN GÁI (GIRLFRIEND AVATAR – ĐI BỘ ĐA TẦNG & DÙNG CHUNG TẤT CẢ ĐỒ ĐẠC)
 * ============================================================================ */
const GIRL_ORIENT_Y_AXIS = new THREE.Vector3(0, 1, 0)
const GIRL_ORIENT_QUAT = new THREE.Quaternion()
const GIRL_ORIENT_EULER = new THREE.Euler()

function GirlfriendAvatar({ hideIfUpstairs = false }: { hideIfUpstairs?: boolean } = {}) {
  const root = useRef<THREE.Group>(null)
  const hideIfUpstairsRef = useRef(hideIfUpstairs)
  hideIfUpstairsRef.current = hideIfUpstairs
  const head = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const leftKnee = useRef<THREE.Group>(null)
  const rightKnee = useRef<THREE.Group>(null)
  const zzzRef = useRef<THREE.Group>(null)
  const cupRef = useRef<THREE.Mesh>(null)
  const remoteRef = useRef<THREE.Mesh>(null)
  const bookRef = useRef<THREE.Group>(null)

  const Y = FLOOR2_Y
  const SKIN = '#f3cbb2'
  const HAIR = '#2b1b12'

  const girlActivity = useStore((s) => s.girlActivity)
  const girlOutfitId = useStore((s) => s.girlOutfitId)
  const girlOutfitSpinTick = useStore((s) => s.girlOutfitSpinTick)
  const girlBookPage = useStore((s) => s.girlBookPage)

  const keys = useRef<Record<string, boolean>>({})
  const walkPos = useRef<[number, number]>([-3.9, -0.35])
  const walkFloorY = useRef(FLOOR2_Y)
  const walkYaw = useRef(-0.15)
  const walkPhase = useRef(0)

  const prevGirlAct = useRef<Activity>(girlActivity)
  const phaseTimer = useRef(0)
  const walkWatchdog = useRef(0)
  const autoNextTimer = useRef(2.2)
  const autoTargetMeta = useRef<InteractionMeta | null>(null)
  const autoRecentIds = useRef<string[]>([])
  const autoEnjoyTimer = useRef(0)
  const activeEnjoyDur = useRef(0)
  const orientTargetYaw = useRef<number | null>(null)
  const orientUntil = useRef(0)
  const lastOrientTick = useRef(0)
  const wasDynamicSeated = useRef(false)
  const seatSavedStandPos = useRef<[number, number] | null>(null)
  const seatSavedStandFloorY = useRef<number>(FLOOR2_Y)
  const lastSpinTick = useRef(girlOutfitSpinTick)
  const spinUntil = useRef(0)
  const lastPosBroadcast = useRef(0)
  const lastSpawnTick = useRef(0)

  const outfit = useMemo(
    () => GIRL_OUTFITS.find((o) => o.id === girlOutfitId) || GIRL_OUTFITS[0],
    [girlOutfitId],
  )
  const bookTex = useMemo(() => openBookPages(girlBookPage), [girlBookPage])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame(({ clock }, dt) => {
    if (!root.current) return
    const st = useStore.getState() as ReturnType<typeof useStore.getState> & {
      fpPerspective?: 'eye' | 'third'
      walkthroughSpawn?: { space: string; pos: V3; yaw: number; tick: number } | null
    }

    const isControllingGirlNow = (st.userRole || st.activeChar) === 'girl'
    const isFpEyeNow = st.mode === 'fp' && (st.fpPerspective ?? 'third') === 'eye'
    const spawn = st.walkthroughSpawn
    if (spawn && spawn.tick !== lastSpawnTick.current) {
      lastSpawnTick.current = spawn.tick
      if (isControllingGirlNow) {
        walkPos.current = [spawn.pos[0], spawn.pos[2]]
        walkFloorY.current = spawn.pos[1]
        walkYaw.current = spawn.yaw
        walkPhase.current = 0
        autoTargetMeta.current = null
        autoEnjoyTimer.current = 0
        activeEnjoyDur.current = 0
        orientTargetYaw.current = null
        orientUntil.current = 0
        wasDynamicSeated.current = false
        seatSavedStandPos.current = null
        walkWatchdog.current = 0
        phaseTimer.current = 0
        prevGirlAct.current = 'idle'
        st.setAutoIntent('girl', null)
        st.clearCharacterPosture('girl')
        root.current.position.set(spawn.pos[0], spawn.pos[1], spawn.pos[2])
        root.current.rotation.set(0, spawn.yaw, 0)
        root.current.visible = !(isFpEyeNow && st.userRole === 'girl') && !Boolean(hideIfUpstairsRef.current && spawn.pos[1] > 2.0)
        if (head.current) head.current.visible = !isFpEyeNow
        LIVE_ACTORS.girlPos = [spawn.pos[0], spawn.pos[1], spawn.pos[2]]
        LIVE_ACTORS.girlYaw = spawn.yaw
        LIVE_ACTORS.girlWorldPos = [spawn.pos[0], spawn.pos[1], spawn.pos[2]]
        if (st.girlActivity !== 'idle') {
          st.startActivity('idle', true, 'girl')
        }
        if (st.avatarTarget) {
          st.setAvatarTarget(null)
        }
        return
      }
    }

    const t = clock.elapsedTime
    const delta = Math.min(dt, 0.05)
    const k = 1 - Math.exp(-delta * 9)

    if (prevGirlAct.current !== st.girlActivity) {
      if (prevGirlAct.current !== 'idle') {
        const entry = getStationEntryForChar(prevGirlAct.current, 'girl')
        walkPos.current = [entry.entryX, entry.entryZ]
        walkFloorY.current = entry.floorY
      }
      prevGirlAct.current = st.girlActivity
      phaseTimer.current = 0
    }

    if (girlOutfitSpinTick !== lastSpinTick.current) {
      lastSpinTick.current = girlOutfitSpinTick
      spinUntil.current = t + 0.95
    }

    const kb = keys.current
    const isControllingGirl = (st.userRole || st.activeChar) === 'girl'
    let moveZ = 0
    let moveX = 0
    if (st.mode === 'orbit' && isControllingGirl) {
      moveZ = (kb.KeyS || kb.ArrowDown ? 1 : 0) - (kb.KeyW || kb.ArrowUp ? 1 : 0)
      moveX = (kb.KeyD || kb.ArrowRight ? 1 : 0) - (kb.KeyA || kb.ArrowLeft ? 1 : 0)
    } else if (st.mode === 'fp' && isControllingGirl) {
      const f = (kb.KeyW || kb.ArrowUp ? 1 : 0) - (kb.KeyS || kb.ArrowDown ? 1 : 0)
      const r = (kb.KeyD || kb.ArrowRight ? 1 : 0) - (kb.KeyA || kb.ArrowLeft ? 1 : 0)
      if (f !== 0 || r !== 0) {
        const cosY = Math.cos(LIVE_ACTORS.fpYaw)
        const sinY = Math.sin(LIVE_ACTORS.fpYaw)
        moveX = -sinY * f + cosY * r
        moveZ = -cosY * f - sinY * r
      }
    }

    const oc = st.orientCommand
    if (oc && oc.char === 'girl' && oc.tick !== lastOrientTick.current) {
      lastOrientTick.current = oc.tick
      orientTargetYaw.current = oc.yaw
      orientUntil.current = t + 0.65
    }

    const dynSeat = st.dynamicSeatTarget
    const isGirlDynamicSeated = Boolean(dynSeat && dynSeat.char === 'girl')
    if (isGirlDynamicSeated && !wasDynamicSeated.current) {
      seatSavedStandPos.current = [walkPos.current[0], walkPos.current[1]]
      seatSavedStandFloorY.current = walkFloorY.current
      autoEnjoyTimer.current = 10 + Math.random() * 5
    } else if (!isGirlDynamicSeated && wasDynamicSeated.current) {
      const saved = seatSavedStandPos.current
      if (saved) {
        const blocked =
          seatSavedStandFloorY.current <= 0.1
            ? isBlocked(saved[0], saved[1], 0.28)
            : seatSavedStandFloorY.current >= 2.0
              ? isBlockedTier2(saved[0], saved[1], 0.28)
              : false
        if (!blocked) {
          walkPos.current = [saved[0], saved[1]]
          walkFloorY.current = seatSavedStandFloorY.current
        }
        seatSavedStandPos.current = null
      }
      autoNextTimer.current = 1.2
    }
    wasDynamicSeated.current = isGirlDynamicSeated

    if (moveX !== 0 || moveZ !== 0) {
      orientTargetYaw.current = null
      orientUntil.current = 0
      if (st.girlActivity !== 'idle' || isGirlDynamicSeated) {
        st.clearCharacterPosture('girl')
        return
      }
    }

    let pos: V3 = [walkPos.current[0], walkFloorY.current, walkPos.current[1]]
    let rotY = walkYaw.current
    let rotX = 0
    let lArmX = -0.22
    let lArmZ = 0.08
    let rArmX = -0.22
    let rArmZ = -0.08
    let lHipX = 0
    let rHipX = 0
    let rHipZ = 0
    let lKneeX = 0
    let rKneeX = 0
    let headX = 0
    let headY = 0
    let showCup = false
    let showRemote = false
    let showBook = false

    // 1. Chế độ Đứng/Đi bộ tự do đa tầng (Tầng 2 <-> Cầu thang <-> Tầng 1 <-> Sân vườn) & Dynamic Seat
    if (st.girlActivity === 'idle') {
      let moving = false
      if (isGirlDynamicSeated && dynSeat) {
        if (isControllingGirl && st.avatarTarget) {
          st.clearCharacterPosture('girl')
          return
        }
        walkWatchdog.current = 0
        autoTargetMeta.current = null
        walkPhase.current = 0
        pos = [dynSeat.pos[0], dynSeat.pos[1], dynSeat.pos[2]]
        rotY = dynSeat.yaw
        if (dynSeat.pose === 'lie') {
          rotX = -Math.PI / 2
          lArmX = -0.15
          lArmZ = 0.2
          rArmX = -0.15
          rArmZ = -0.2
          lHipX = 0.04
          rHipX = -0.04
          headX = 0.06
        } else if (dynSeat.pose === 'recline') {
          lHipX = -1.18
          rHipX = -1.18
          lKneeX = 0.85
          rKneeX = 0.85
          lArmX = -0.45
          rArmX = -0.45
          lArmZ = 0.14
          rArmZ = -0.14
          headX = -0.08 + Math.sin(t * 0.7) * 0.04
        } else {
          lHipX = -1.42
          rHipX = -1.42
          lKneeX = 1.38
          rKneeX = 1.38
          lArmX = -0.52
          rArmX = -0.52
          lArmZ = 0.1
          rArmZ = -0.1
          headY = Math.sin(t * 0.8) * 0.14
          showCup = Math.sin(t * 0.25) > 0.35
        }
        if (st.girlAutoLife) {
          autoEnjoyTimer.current -= delta
          if (autoEnjoyTimer.current <= 0) {
            st.clearCharacterPosture('girl')
            autoNextTimer.current = 1.2
          }
        }
      } else if (isControllingGirl && (moveX !== 0 || moveZ !== 0 || st.avatarTarget)) {
        walkWatchdog.current = 0
        autoTargetMeta.current = null
        if (st.autoIntent?.girl) st.setAutoIntent('girl', null)
        moving = stepCharacterWalk(
          walkPos,
          walkFloorY,
          walkYaw,
          walkPhase,
          moveX,
          moveZ,
          Boolean(kb.ShiftLeft || kb.ShiftRight),
          st.avatarTarget,
          () => st.setAvatarTarget(null),
          delta,
          [LIVE_ACTORS.khoaPos[0], LIVE_ACTORS.khoaPos[1]],
          LIVE_ACTORS.khoaFloorY,
        )
        if (moving) autoNextTimer.current = 3.5
      } else if (st.girlAutoLife) {
        const autoMeta = autoTargetMeta.current
        if (autoMeta) {
          walkWatchdog.current += delta
          const [tx, ty, tz] = autoMeta.standOffset
          const distStand = Math.hypot(walkPos.current[0] - tx, walkPos.current[1] - tz)
          const distCenter = Math.hypot(
            walkPos.current[0] - autoMeta.center[0],
            walkPos.current[1] - autoMeta.center[2],
          )
          const sameFloor = Math.abs(walkFloorY.current - ty) < 0.35
          const midStair = walkFloorY.current > 0.1 && walkFloorY.current < FLOOR2_Y - 0.1

          if (!midStair && sameFloor && (distStand < 0.55 || (distCenter < 1.4 && distStand < 1.8))) {
            autoRecentIds.current = [autoMeta.id, ...autoRecentIds.current].slice(0, 6)
            autoTargetMeta.current = null
            walkWatchdog.current = 0
            st.setAutoIntent('girl', null)
            activeEnjoyDur.current = 10 + Math.random() * 5
            autoEnjoyTimer.current = activeEnjoyDur.current
            autoNextTimer.current = 1.2
            executeInteraction(autoMeta, { forChar: 'girl', fromAuto: true })
            return
          } else if (walkWatchdog.current >= 25.0) {
            autoRecentIds.current = [autoMeta.id, ...autoRecentIds.current].slice(0, 6)
            autoTargetMeta.current = null
            walkWatchdog.current = 0
            st.setAutoIntent('girl', null)
            autoNextTimer.current = 1.0
          } else {
            moving = stepCharacterWalk(
              walkPos,
              walkFloorY,
              walkYaw,
              walkPhase,
              0,
              0,
              false,
              autoMeta.standOffset,
              () => {},
              delta,
              [LIVE_ACTORS.khoaPos[0], LIVE_ACTORS.khoaPos[1]],
              LIVE_ACTORS.khoaFloorY,
            )
          }
        } else {
          walkWatchdog.current = 0
          walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
          autoNextTimer.current -= delta
          if (autoNextTimer.current <= 0) {
            const nextMeta = pickUtilityAutoTarget('girl', st.darkMode, autoRecentIds.current)
            if (nextMeta) {
              autoTargetMeta.current = nextMeta
              st.setAutoIntent('girl', {
                icon: nextMeta.icon,
                label: nextMeta.label,
                targetId: nextMeta.id,
              })
              autoNextTimer.current = 1.2
            } else {
              st.setAutoIntent('girl', null)
              autoNextTimer.current = 2.0
            }
          }
        }
      } else {
        if (st.autoIntent?.girl) st.setAutoIntent('girl', null)
        autoTargetMeta.current = null
        walkWatchdog.current = 0
        walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
      }

      if (!isGirlDynamicSeated) {
        if (moving) {
          const s = Math.sin(walkPhase.current)
          const swing = s * 0.52
          const bob = Math.abs(Math.cos(walkPhase.current)) * 0.032
          pos = [walkPos.current[0], walkFloorY.current + bob, walkPos.current[1]]
          rotY = walkYaw.current
          lHipX = swing
          rHipX = -swing
          lKneeX = Math.max(0, -swing * 0.65)
          rKneeX = Math.max(0, swing * 0.65)
          lArmX = -0.22 - swing * 0.65
          rArmX = -0.22 + swing * 0.65
          headY = Math.sin(t * 1.5) * 0.05
        } else {
          pos = [walkPos.current[0], walkFloorY.current, walkPos.current[1]]
          rotY = walkYaw.current
          headY = Math.sin(t * 1.1) * 0.12
          rArmX = -0.22 + Math.sin(t * 1.6) * 0.05
          lArmX = -0.22 - Math.sin(t * 1.6) * 0.05
        }
      }
    } else {
      // 2. Đi bộ đa tầng (leo/xuống cầu thang) và sử dụng mọi đồ vật trong nhà
      const entry = getStationEntryForChar(st.girlActivity, 'girl')

      if (st.girlPhase === 'walking') {
        const targetV3: V3 = [entry.entryX, entry.floorY, entry.entryZ]
        walkWatchdog.current += delta
        const distToEntry = Math.hypot(walkPos.current[0] - entry.entryX, walkPos.current[1] - entry.entryZ)
        const distFloorY = Math.abs(walkFloorY.current - entry.floorY)

        const moving = stepCharacterWalk(
          walkPos,
          walkFloorY,
          walkYaw,
          walkPhase,
          0,
          0,
          false,
          targetV3,
          () => {
            walkPos.current = [entry.entryX, entry.entryZ]
            walkFloorY.current = entry.floorY
            walkYaw.current = entry.entryYaw
            phaseTimer.current = 0
            walkWatchdog.current = 0
            st.setActivityPhase('entering', 'girl')
          },
          delta,
          [LIVE_ACTORS.khoaPos[0], LIVE_ACTORS.khoaPos[1]],
          LIVE_ACTORS.khoaFloorY,
        )

        // Chỉ khi nhân vật đã đi bộ đến thật sát vị trí đích (< 0.22m và cùng tầng) mới chuyển sang phase vào vị trí
        if (distToEntry < 0.22 && distFloorY < 0.25) {
          walkPos.current = [entry.entryX, entry.entryZ]
          walkFloorY.current = entry.floorY
          walkYaw.current = entry.entryYaw
          phaseTimer.current = 0
          walkWatchdog.current = 0
          st.setActivityPhase('entering', 'girl')
        } else if (walkWatchdog.current > 25.0) {
          walkPos.current = [entry.entryX, entry.entryZ]
          walkFloorY.current = entry.floorY
          walkYaw.current = entry.entryYaw
          phaseTimer.current = 0
          walkWatchdog.current = 0
          st.setActivityPhase('entering', 'girl')
        }
        const s = Math.sin(walkPhase.current)
        const swing = moving ? s * 0.54 : 0
        const bob = moving ? Math.abs(Math.cos(walkPhase.current)) * 0.034 : 0
        pos = [walkPos.current[0], walkFloorY.current + bob, walkPos.current[1]]
        rotY = walkYaw.current
        lHipX = swing
        rHipX = -swing
        lKneeX = Math.max(0, -swing * 0.68)
        rKneeX = Math.max(0, swing * 0.68)
        lArmX = -0.22 - swing * 0.65
        rArmX = -0.22 + swing * 0.65
      } else if (st.girlPhase === 'entering') {
        phaseTimer.current += delta
        const enterDur = 0.75
        const pNorm = THREE.MathUtils.smoothstep(phaseTimer.current, 0, enterDur)
        const pose = computeCharActivityPose(
          st.girlActivity,
          'girl',
          'entering',
          pNorm,
          t,
          phaseTimer.current,
          spinUntil.current,
        )
        pos = pose.pos
        rotX = pose.rotX
        rotY = pose.rotY
        lHipX = pose.lHipX
        rHipX = pose.rHipX
        rHipZ = pose.rHipZ
        lKneeX = pose.lKneeX
        rKneeX = pose.rKneeX
        lArmX = pose.lArmX
        lArmZ = pose.lArmZ
        rArmX = pose.rArmX
        rArmZ = pose.rArmZ
        headX = pose.headX
        headY = pose.headY
        showCup = pose.showCup
        showRemote = pose.showRemote
        showBook = pose.showBook

        if (phaseTimer.current >= enterDur) {
          phaseTimer.current = 0
          st.setActivityPhase('active', 'girl')
        }
      } else {
        phaseTimer.current += delta
        const pose = computeCharActivityPose(
          st.girlActivity,
          'girl',
          'active',
          1,
          t,
          phaseTimer.current,
          spinUntil.current,
        )
        pos = pose.pos
        rotX = pose.rotX
        rotY = pose.rotY
        lHipX = pose.lHipX
        rHipX = pose.rHipX
        rHipZ = pose.rHipZ
        lKneeX = pose.lKneeX
        rKneeX = pose.rKneeX
        lArmX = pose.lArmX
        lArmZ = pose.lArmZ
        rArmX = pose.rArmX
        rArmZ = pose.rArmZ
        headX = pose.headX
        headY = pose.headY
        showCup = pose.showCup
        showRemote = pose.showRemote
        showBook = pose.showBook

        const isOneShot =
          st.girlActivity === 'drink' ||
          st.girlActivity === 'darts' ||
          st.girlActivity === 'feed'
        if (!isOneShot && activeEnjoyDur.current <= 0) {
          activeEnjoyDur.current = 10 + Math.random() * 5
        }
        const maxDur = isOneShot ? AUTO_DURATION[st.girlActivity] : activeEnjoyDur.current
        if (phaseTimer.current >= maxDur) {
          if (st.isUserInitiated && isOneShot && st.activeChar === 'girl') {
            activeEnjoyDur.current = 0
            st.returnOverview()
            return
          } else if (st.girlAutoLife) {
            activeEnjoyDur.current = 0
            autoNextTimer.current = 1.0
            st.startActivity('idle', false, 'girl')
            return
          }
        }
      }
    }

    if (t < spinUntil.current && st.girlActivity !== 'girl_wardrobe') {
      rotY += (1 - (spinUntil.current - t) / 0.95) * Math.PI * 2
    }

    root.current.position.x = THREE.MathUtils.lerp(root.current.position.x, pos[0], k)
    root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, pos[1], k)
    root.current.position.z = THREE.MathUtils.lerp(root.current.position.z, pos[2], k)
    const isGirlSleeping =
      ((st.girlActivity === 'sleep' || st.girlActivity === 'girl_sleep') && st.girlPhase === 'active') ||
      (isGirlDynamicSeated && dynSeat?.pose === 'lie')
    if (isGirlSleeping) {
      root.current.rotation.x = -Math.PI / 2
      root.current.rotation.y = isGirlDynamicSeated && dynSeat ? dynSeat.yaw : -0.05
      root.current.rotation.z = 0
    } else if (
      orientTargetYaw.current !== null &&
      t < orientUntil.current &&
      !isGirlDynamicSeated &&
      st.girlActivity === 'idle'
    ) {
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, rotX, k)
      GIRL_ORIENT_QUAT.setFromAxisAngle(GIRL_ORIENT_Y_AXIS, orientTargetYaw.current)
      root.current.quaternion.slerp(GIRL_ORIENT_QUAT, Math.min(1, delta * 12))
      GIRL_ORIENT_EULER.setFromQuaternion(root.current.quaternion, 'YXZ')
      walkYaw.current = GIRL_ORIENT_EULER.y
    } else {
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, rotX, k)
      const rotDiff = Math.atan2(
        Math.sin(rotY - root.current.rotation.y),
        Math.cos(rotY - root.current.rotation.y),
      )
      root.current.rotation.y += rotDiff * k
    }

    LIVE_ACTORS.girlPos = [
      root.current.position.x,
      walkFloorY.current,
      root.current.position.z,
    ]
    LIVE_ACTORS.girlYaw = root.current.rotation.y
    LIVE_ACTORS.girlWorldPos = [
      root.current.position.x,
      root.current.position.y,
      root.current.position.z,
    ]

    // Đồng bộ tọa độ thời gian thực của Bạn Gái:
    if (st.userRole === 'girl') {
      const now = performance.now()
      const interval = st.girlPhase === 'walking' ? 320 : 850
      if (now - lastPosBroadcast.current > interval) {
        lastPosBroadcast.current = now
        broadcastPosSync(
          'girl',
          LIVE_ACTORS.girlWorldPos,
          LIVE_ACTORS.girlYaw,
          st.girlActivity,
          st.girlPhase,
          st.girlOutfitId,
        )
      }
    } else if (st.roleOccupancy?.girl) {
      // Đối phương đang điều khiển Bạn Gái từ xa: lerp mượt mà để cả 2 máy luôn cùng thời điểm
      const remote = REMOTE_ACTORS.girl
      if (remote && remote.lastSeen > 0) {
        const dx = remote.pos[0] - walkPos.current[0]
        const dz = remote.pos[2] - walkPos.current[1]
        const dist = Math.hypot(dx, dz)
        if (dist > 0.35) {
          const lerpK = Math.min(1, delta * 5.0)
          walkPos.current[0] += dx * lerpK
          walkPos.current[1] += dz * lerpK
          walkFloorY.current = THREE.MathUtils.lerp(walkFloorY.current, remote.pos[1], lerpK)
          walkYaw.current = remote.yaw
        }
      }
    }

    const isFpEye = st.mode === 'fp' && (st.fpPerspective ?? 'third') === 'eye'
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, headX, k)
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, headY, k)
      head.current.visible = !(isFpEye && isControllingGirl)
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, lArmX, k)
      leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, lArmZ, k)
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, rArmX, k)
      rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, rArmZ, k)
    }
    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, lHipX, k)
    if (rightLeg.current) {
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, rHipX, k)
      rightLeg.current.rotation.z = THREE.MathUtils.lerp(rightLeg.current.rotation.z, rHipZ, k)
    }
    if (leftKnee.current) leftKnee.current.rotation.x = THREE.MathUtils.lerp(leftKnee.current.rotation.x, lKneeX, k)
    if (rightKnee.current) rightKnee.current.rotation.x = THREE.MathUtils.lerp(rightKnee.current.rotation.x, rKneeX, k)

    if (cupRef.current) cupRef.current.visible = showCup
    if (remoteRef.current) remoteRef.current.visible = showRemote
    if (bookRef.current) bookRef.current.visible = showBook

    const isSleepingLying =
      ((st.girlActivity === 'sleep' || st.girlActivity === 'girl_sleep') && st.girlPhase === 'active') ||
      (isGirlDynamicSeated && dynSeat?.pose === 'lie')
    if (zzzRef.current) {
      zzzRef.current.visible = isSleepingLying
      if (isSleepingLying) {
        zzzRef.current.children.forEach((c, i) => {
          const phase = (t * 0.55 + i * 0.33) % 1
          c.position.z = 0.28 + phase * 0.52
          c.position.x = 0.06 + Math.sin(t * 2 + i) * 0.05
          const s = (1 - Math.abs(phase - 0.5) * 1.6) * (0.03 + i * 0.011)
          c.scale.setScalar(Math.max(0.005, s))
        })
      }
    }

    const hideInFpNow = isFpEye && st.userRole === 'girl'
    const hideUpstairsNow = Boolean(hideIfUpstairsRef.current && walkFloorY.current > 2.0)
    root.current.visible = !hideInFpNow && !hideUpstairsNow
  })

  const userRole = useStore((s) => s.userRole)
  const roleOccupancy = useStore((s) => s.roleOccupancy)
  const fpPerspective = useStore((s) => (s as typeof s & { fpPerspective?: 'eye' | 'third' }).fpPerspective ?? 'third')
  const isGirlClaimed = userRole === 'girl' || Boolean(roleOccupancy?.girl)
  const canControlGirl = !userRole || userRole === 'girl'
  // Bạn Gái chỉ ẩn thân xác khi chính người chơi này đang vào vai Bạn Gái ở góc nhìn Tầm mắt (eye)
  const hideInFp = useStore((s) => s.mode === 'fp') && fpPerspective === 'eye' && userRole === 'girl'
  const hideUpstairs = Boolean(hideIfUpstairs && walkFloorY.current > 2.0)
  const girlPhase = useStore((s) => s.girlPhase)
  const sleeping = girlActivity === 'sleep' || girlActivity === 'girl_sleep'
  const isGirlSleepingNow = sleeping && girlPhase === 'active'
  const getGirlZone = () => {
    if (walkFloorY.current > 2.0) return 'interior_f2' as const
    const [gx, gz] = walkPos.current
    if (Math.abs(gx) <= 10.1 && gz >= -6.1 && gz <= 6.1) return 'interior_f1' as const
    return 'exterior' as const
  }

  return (
    <group
      ref={root}
      position={[-3.9, Y, -0.35]}
      visible={!hideInFp && !hideUpstairs}
      onClick={
        canControlGirl
          ? (e) => {
              if (!isValidClick(e.clientX, e.clientY)) return
              if (hideIfUpstairsRef.current && walkFloorY.current > 2.0) return
              if (!isZoneInteractive(getGirlZone())) return
              e.stopPropagation()
              useStore.getState().setActiveChar('girl')
            }
          : undefined
      }
      onPointerOver={
        canControlGirl
          ? (e) => {
              if (isOrbitDragging()) return
              if (hideIfUpstairsRef.current && walkFloorY.current > 2.0) return
              if (!isZoneInteractive(getGirlZone())) return
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
              useStore.getState().setHoverHint('👩 Linh (Click để điều khiển)')
            }
          : undefined
      }
      onPointerOut={
        canControlGirl
          ? () => {
              document.body.style.cursor = 'auto'
              useStore.getState().setHoverHint(null)
            }
          : undefined
      }
    >
      {/* Chấm tròn nhỏ phát sáng trên đầu: Xanh khi có người chơi, Đỏ khi trống / Auto (ẩn khi ngủ) */}
      <CharacterRoleIndicator isControlled={isGirlClaimed} y={1.76} visible={!isGirlSleepingNow} />

      {/* Bong bóng ngủ Zzz */}
      <group ref={zzzRef} position={[0, 1.55, 0.2]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial color="#f3dfc0" emissive="#d8be98" emissiveIntensity={1.0} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* Hai chân có khớp gối để ngồi/quỳ mượt mà */}
      <group ref={leftLeg} position={[-0.08, 0.56, 0]}>
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} shadow />
        <group ref={leftKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} shadow />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f2ede4" shadow />
        </group>
      </group>
      <group ref={rightLeg} position={[0.08, 0.56, 0]}>
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} shadow />
        <group ref={rightKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} shadow />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f2ede4" shadow />
        </group>
      </group>

      {/* Chân váy / Đầm */}
      <Cyl p={[0, 0.66, 0]} rt={0.14} rb={0.2} h={0.32} c={outfit.skirt} rough={0.85} shadow />

      {/* Thân áo */}
      <Cyl p={[0, 0.96, 0]} rt={0.135} rb={0.14} h={0.38} c={outfit.jacket} rough={0.8} shadow />
      <B p={[0, 0.97, 0.115]} s={[0.1, 0.34, 0.05]} c={outfit.inner} />

      {/* Tay trái */}
      <group ref={leftArm} position={[-0.18, 1.1, 0]}>
        <Cyl p={[0, -0.18, 0]} rt={0.042} rb={0.036} h={0.36} c={outfit.jacket} shadow />
        <Sph p={[0, -0.38, 0]} s={[0.042, 0.042, 0.042]} c={SKIN} />
      </group>

      {/* Tay phải + Đạo cụ cốc nước / điều khiển TV */}
      <group ref={rightArm} position={[0.18, 1.1, 0]}>
        <Cyl p={[0, -0.18, 0]} rt={0.042} rb={0.036} h={0.36} c={outfit.jacket} shadow />
        <Sph p={[0, -0.38, 0]} s={[0.042, 0.042, 0.042]} c={SKIN} />
        <mesh ref={cupRef} position={[0.02, -0.41, 0.05]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <cylinderGeometry args={[0.034, 0.028, 0.085, 14]} />
          <meshStandardMaterial color="#f2ede4" roughness={0.35} />
        </mesh>
        <mesh ref={remoteRef} position={[0.02, -0.41, 0.05]} visible={false}>
          <boxGeometry args={[0.036, 0.016, 0.1]} />
          <meshStandardMaterial color="#252321" roughness={0.4} />
        </mesh>
      </group>

      {/* Quyển sách đang mở khi đọc sách */}
      <group ref={bookRef} position={[0, 0.92, 0.25]} rotation={[-0.45, 0, 0]} visible={false}>
        <mesh position={[0, 0, -0.006]} castShadow>
          <boxGeometry args={[0.36, 0.24, 0.012]} />
          <meshStandardMaterial color="#5c544b" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.34, 0.22]} />
          <meshStandardMaterial map={bookTex} roughness={0.88} />
        </mesh>
      </group>

      {/* Cổ & Đầu */}
      <Cyl p={[0, 1.18, 0]} rt={0.048} rb={0.052} h={0.09} c={SKIN} />
      <group ref={head} position={[0, 1.35, 0]}>
        <Sph p={[0, 0, 0]} s={[0.175, 0.185, 0.175]} c={SKIN} rough={0.65} shadow />
        <Sph p={[0, 0.05, -0.02]} s={[0.19, 0.18, 0.19]} c={HAIR} shadow />
        <Sph p={[0, 0.11, 0.09]} s={[0.16, 0.075, 0.09]} c={HAIR} />
        <Cyl p={[-0.14, -0.1, -0.02]} rt={0.05} rb={0.035} h={0.36} c={HAIR} />
        <Cyl p={[0.14, -0.1, -0.02]} rt={0.05} rb={0.035} h={0.36} c={HAIR} />
        <B p={[0, -0.1, -0.12]} s={[0.28, 0.36, 0.08]} c={HAIR} />

        {/* Mắt (nhắm khi ngủ), má hồng dịu & kính cận */}
        <Sph p={[-0.06, 0.01, 0.162]} s={[0.018, sleeping ? 0.004 : 0.022, 0.01]} c="#22201e" />
        <Sph p={[0.06, 0.01, 0.162]} s={[0.018, sleeping ? 0.004 : 0.022, 0.01]} c="#22201e" />
        <Sph p={[-0.095, -0.03, 0.15]} s={[0.028, 0.016, 0.01]} c="#d4a8a1" />
        <Sph p={[0.095, -0.03, 0.15]} s={[0.028, 0.016, 0.01]} c="#d4a8a1" />

        {!sleeping && (
          <>
            <mesh position={[-0.062, 0.01, 0.17]}>
              <torusGeometry args={[0.038, 0.0045, 8, 24]} />
              <meshStandardMaterial color="#9a9083" metalness={0.72} roughness={0.26} />
            </mesh>
            <mesh position={[0.062, 0.01, 0.17]}>
              <torusGeometry args={[0.038, 0.0045, 8, 24]} />
              <meshStandardMaterial color="#9a9083" metalness={0.72} roughness={0.26} />
            </mesh>
            <B p={[0, 0.01, 0.17]} s={[0.045, 0.006, 0.006]} c="#9a9083" />
          </>
        )}
      </group>
    </group>
  )
}
