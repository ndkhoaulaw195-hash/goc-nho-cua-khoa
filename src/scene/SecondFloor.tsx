import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Sph, RB, RBB } from './prims'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import {
  AUTO_DURATION,
  AUTO_SEQUENCE_GIRL,
  CharacterRoleIndicator,
  computeCharActivityPose,
  getStationEntryForChar,
  stepCharacterWalk,
} from './Characters'
import {
  colorfulBedArt,
  fluffyCreamRug,
  girlPcScreen,
  openBookPages,
  persianTerracottaRug,
  windowSky,
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

function Interact({
  onClick,
  children,
}: {
  hint?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <group
      onClick={
        onClick
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        onClick
          ? () => {
              document.body.style.cursor = 'auto'
            }
          : undefined
      }
    >
      {children}
    </group>
  )
}

export function SecondFloor() {
  return (
    <group>
      <FloorAndBeams />
      <WallsAndDoor />
      <GirlRoomFurniture />
      <IndoorStaircase />
      <GirlfriendAvatar />
    </group>
  )
}

/* ============================================================================
 * 1. SÀN GỖ SỒI THẲNG, HỆ DẦM & LAN CAN KÍNH TAY VỊN SỒI (HỖ TRỢ CLICK ĐI BỘ)
 * ============================================================================ */
function FloorAndBeams() {
  const darkMode = useStore((s) => s.darkMode)
  const palette = getHousePalette(darkMode)
  const Y = FLOOR2_Y
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])

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

  const handleFloor2Click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const st = useStore.getState()
    if (st.mode !== 'orbit') return
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -9.2, 9.2)
    const z = THREE.MathUtils.clamp(p.z, -5.1, 4.3)
    st.setAvatarTarget([x, Y, z])
  }

  return (
    <group>
      {/* 1. Mảng sàn chính Tầng 2 (x: -10 -> +10, z: -6.0 -> +0.18; đồng bộ màu & chất liệu sàn Tầng 1) */}
      <B
        p={[0, Y - 0.135, -2.91]}
        s={[20.0, 0.21, 6.18]}
        c={palette.subFloor}
        rough={0.75}
        shadow={false}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, Y, -2.9]}
        receiveShadow
        onClick={handleFloor2Click}
        onDoubleClick={handleFloor2Click}
      >
        <planeGeometry args={[20.0, 6.2]} />
        <meshStandardMaterial
          map={oakMap1}
          roughness={0.42}
          metalness={0.05}
          color={palette.floorTint}
        />
      </mesh>

      {/* 2. Mảng sàn khu vực giường & ghế lười phía trước-trái (x: -7.7 -> -1.2, z: +0.22 -> +4.8; đồng bộ màu Tầng 1) */}
      <B
        p={[-4.45, Y - 0.135, 2.51]}
        s={[6.5, 0.21, 4.58]}
        c={palette.subFloor}
        rough={0.75}
        shadow={false}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-4.45, Y, 2.5]}
        receiveShadow
        onClick={handleFloor2Click}
        onDoubleClick={handleFloor2Click}
      >
        <planeGeometry args={[6.5, 4.6]} />
        <meshStandardMaterial
          map={oakMap2}
          roughness={0.42}
          metalness={0.05}
          color={palette.floorTint}
        />
      </mesh>

      {/* --- LAN CAN KÍNH TRONG SUỐT TAY VỊN GỖ SỒI (MeshPhysicalMaterial clearcoat sắc nét không gây mờ vật thể phía sau) --- */}
      {/* 1. Lan can ngang mép hành lang thông tầng (x từ -1.2 đến +9.9, tại z = 0.18) */}
      <G p={[4.35, Y, 0.18]}>
        <RBB p={[0, 0.86, 0]} s={[11.1, 0.045, 0.065]} c="#b8ae9f" rough={0.45} radius={0.015} />
        <BB p={[0, 0.0, 0]} s={[11.1, 0.035, 0.05]} c="#9c9283" rough={0.5} />
        <mesh position={[0, 0.44, 0]} material={glassMat}>
          <boxGeometry args={[10.95, 0.82, 0.016]} />
        </mesh>
        {[-5.4, -3.2, -1.0, 1.2, 3.4, 5.4].map((px, i) => (
          <B key={i} p={[px, 0.12, 0]} s={[0.04, 0.2, 0.04]} c="#686662" metal={0.75} rough={0.22} />
        ))}
      </G>

      {/* 2. Lan can dọc mép thông tầng bên trái (x = -1.2, z từ 0.18 đến 4.8) */}
      <G p={[-1.2, Y, 2.5]}>
        <RBB p={[0, 0.86, 0]} s={[0.065, 0.045, 4.6]} c="#b8ae9f" rough={0.45} radius={0.015} />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 4.6]} c="#9c9283" rough={0.5} />
        <mesh position={[0, 0.44, 0]} material={glassMat}>
          <boxGeometry args={[0.016, 0.82, 4.5]} />
        </mesh>
        {[-1.8, 0, 1.8].map((pz, i) => (
          <B key={i} p={[0, 0.12, pz]} s={[0.04, 0.2, 0.04]} c="#686662" metal={0.75} rough={0.22} />
        ))}
      </G>

      {/* 3. Lan can bảo vệ ô cầu thang (tại x = -7.72, z từ 0.45 đến 4.8) */}
      <G p={[-7.72, Y, 2.62]}>
        <RBB p={[0, 0.86, 0]} s={[0.065, 0.045, 4.35]} c="#b8ae9f" rough={0.45} radius={0.015} />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 4.35]} c="#9c9283" rough={0.5} />
        <mesh position={[0, 0.44, 0]} material={glassMat}>
          <boxGeometry args={[0.016, 0.82, 4.25]} />
        </mesh>
        {[-1.6, 0, 1.6].map((pz, i) => (
          <B key={i} p={[0, 0.12, pz]} s={[0.04, 0.2, 0.04]} c="#686662" metal={0.75} rough={0.22} />
        ))}
      </G>

      {/* 4. Lan can bảo vệ mép trước Tầng 2 ngăn rơi xuống Tầng 1 (x: -7.72 -> -1.2, tại z = 4.8) */}
      <G p={[-4.46, Y, 4.8]}>
        <RBB p={[0, 0.86, 0]} s={[6.52, 0.045, 0.065]} c="#b8ae9f" rough={0.45} radius={0.015} />
        <BB p={[0, 0.0, 0]} s={[6.52, 0.035, 0.05]} c="#9c9283" rough={0.5} />
        <mesh position={[0, 0.44, 0]} material={glassMat}>
          <boxGeometry args={[6.38, 0.82, 0.016]} />
        </mesh>
        {[-2.6, -1.3, 0, 1.3, 2.6].map((px, i) => (
          <B key={i} p={[px, 0.12, 0]} s={[0.04, 0.2, 0.04]} c="#686662" metal={0.75} rough={0.22} />
        ))}
      </G>
    </group>
  )
}

function SecondFloorCurtains({ skyMap }: { skyMap: THREE.Texture }) {
  const darkMode = useStore((s) => s.darkMode)
  const curtainsFloor2Open = useStore((s) => s.curtainsFloor2Open)
  const Y = FLOOR2_Y
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const sheerLeftRef = useRef<THREE.Mesh>(null)
  const sheerRightRef = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 7)
    if (leftRef.current) {
      leftRef.current.position.x = THREE.MathUtils.lerp(leftRef.current.position.x, curtainsFloor2Open ? -1.45 : -0.75, k)
      leftRef.current.scale.x = THREE.MathUtils.lerp(leftRef.current.scale.x, curtainsFloor2Open ? 1.0 : 2.0, k)
    }
    if (rightRef.current) {
      rightRef.current.position.x = THREE.MathUtils.lerp(rightRef.current.position.x, curtainsFloor2Open ? 1.45 : 0.75, k)
      rightRef.current.scale.x = THREE.MathUtils.lerp(rightRef.current.scale.x, curtainsFloor2Open ? 1.0 : 2.0, k)
    }
    if (sheerLeftRef.current) {
      sheerLeftRef.current.scale.x = THREE.MathUtils.lerp(sheerLeftRef.current.scale.x, curtainsFloor2Open ? 0.25 : 1.0, k)
    }
    if (sheerRightRef.current) {
      sheerRightRef.current.scale.x = THREE.MathUtils.lerp(sheerRightRef.current.scale.x, curtainsFloor2Open ? 0.25 : 1.0, k)
    }
  })

  return (
    <Interact
      hint="🪟 Rèm cửa Tầng 2"
      onClick={() => useStore.getState().toggleCurtainsFloor2()}
    >
      <G p={[9.94, Y, -2.3]} r={[0, -Math.PI / 2, 0]}>
        {/* Tấm bắt click rộng lớn phủ kín cửa sổ */}
        <mesh position={[0, 2.08, 0.25]}>
          <planeGeometry args={[4.2, 3.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Mặt kính bầu trời nắng ấm / đêm sao */}
        <mesh position={[0, 2.08, 0.012]}>
          <planeGeometry args={[3.5, 3.35]} />
          <meshStandardMaterial
            map={skyMap}
            emissive="#f4efe6"
            emissiveMap={skyMap}
            emissiveIntensity={darkMode ? 0.85 : 1.35}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Khung cửa sổ kem-đá chia ô hiện đại */}
        <B p={[0, 3.72, 0.03]} s={[3.65, 0.08, 0.06]} c="#efebe3" shadow={false} polyOffset />
        <B p={[0, 0.42, 0.03]} s={[3.65, 0.08, 0.09]} c="#efebe3" shadow={false} polyOffset />
        {[-1.78, -0.58, 0.58, 1.78].map((wx, i) => (
          <B key={i} p={[wx, 2.08, 0.03]} s={[0.06, 3.35, 0.05]} c="#efebe3" shadow={false} polyOffset />
        ))}
        <B p={[0, 2.25, 0.03]} s={[3.55, 0.055, 0.05]} c="#efebe3" shadow={false} polyOffset />

        {/* Thanh treo rèm chạy suốt chiều dài cửa sổ */}
        <Cyl p={[0, 3.88, 0.12]} r={[0, 0, Math.PI / 2]} rt={0.022} h={4.1} c="#2c2926" metal={0.45} />

        {/* Lớp rèm voan trắng ngà mỏng xuyên sáng phủ nhẹ toàn khung cửa */}
        <mesh ref={sheerLeftRef} position={[-0.85, 1.91, 0.06]}>
          <boxGeometry args={[1.65, 3.82, 0.025]} />
          <meshStandardMaterial color="#f8f6f2" transparent opacity={0.52} roughness={0.9} />
        </mesh>
        <mesh ref={sheerRightRef} position={[0.85, 1.91, 0.06]}>
          <boxGeometry args={[1.65, 3.82, 0.025]} />
          <meshStandardMaterial color="#f8f6f2" transparent opacity={0.52} roughness={0.9} />
        </mesh>

        {/* Các nếp rèm voan linen xếp ly rủ mềm chạm sàn ở hai bên */}
        <group ref={leftRef} position={[-1.45, 0, 0.12]}>
          {[-0.28, -0.16, -0.04, 0.08, 0.2, 0.32].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.94, 0]}
              rt={0.068}
              rb={0.082}
              h={3.84}
              c={i % 2 ? '#e6e0d5' : '#f4f0e8'}
              seg={12}
              rough={0.92}
              opacity={0.88}
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
              c={i % 2 ? '#e6e0d5' : '#f4f0e8'}
              seg={12}
              rough={0.92}
              opacity={0.88}
            />
          ))}
        </group>
      </G>
    </Interact>
  )
}

/* ============================================================================
 * 2. VÁCH TƯỜNG, LAM GỖ PHÂN KHU & CỬA SỔ KÍNH RÈM VOAN TRẮNG RỦ MỀM XUỐNG SÀN
 * ============================================================================ */
function WallsAndDoor() {
  const darkMode = useStore((s) => s.darkMode)
  const palette = getHousePalette(darkMode)
  const Y = FLOOR2_Y
  const H2 = 4.2
  const skyMap = useMemo(() => windowSky(darkMode), [darkMode])
  const extWallColor = palette.extWall

  return (
    <group>
      {/* 1. Tường sau Tầng 2: Tấm tường bình thường đồng màu với căn phòng (luôn cố định khi xoay) */}
      <B
        p={[0, Y - 0.12 + (H2 + 0.12) / 2, -6.14]}
        s={[20.48, H2 + 0.12, 0.2]}
        c={extWallColor}
        rough={0.9}
        shadow
      />

      {/* Lớp sơn mặt trong cánh trái (Khu giường ngủ: x từ -10.0 đến -1.05) đồng màu phòng ngủ Tầng 1 */}
      <B
        p={[-5.525, Y + H2 / 2, -6.01]}
        s={[8.95, H2, 0.04]}
        c={palette.wallCream}
        rough={0.9}
        shadow={false}
        polyOffset
      />

      {/* 2. Vách lam gỗ sồi thẳng đứng phân khu (ốp nổi mặt trong tại z = -5.96 - dùng chung Geometry/Material) */}
      <WoodSlatsWall H2={H2} />

      {/* 3. Lớp sơn mặt trong cánh phải (Khu bàn học, bàn trang điểm & tủ đồ: x từ -1.05 đến +10.0) đồng màu Tầng 1 */}
      <B
        p={[4.475, Y + H2 / 2, -6.01]}
        s={[11.05, H2, 0.04]}
        c={palette.wallAccent}
        rough={0.9}
        shadow={false}
        polyOffset
      />

      {/* Phào chỉ trần nhà & phào chân tường đồng bộ 2 tầng chạy dọc tường sau */}
      <B p={[0, Y + H2 - 0.08, -5.95]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} shadow={false} polyOffset />
      <B p={[-5.9, Y + 0.07, -5.98]} s={[8.2, 0.14, 0.03]} c={palette.baseboard} shadow={false} polyOffset />
      <B p={[4.85, Y + 0.07, -5.98]} s={[10.3, 0.14, 0.03]} c={palette.baseboard} shadow={false} polyOffset />

      {/* 4. Tường bên trái Tầng 2: Tấm tường bình thường đồng màu với căn phòng (luôn cố định khi xoay) */}
      <B
        p={[-10.14, Y - 0.12 + (H2 + 0.12) / 2, -0.66]}
        s={[0.2, H2 + 0.12, 11.16]}
        c={extWallColor}
        rough={0.9}
        shadow
      />
      <B
        p={[-10.01, Y + H2 / 2, -0.6]}
        s={[0.04, H2, 10.8]}
        c={palette.wallCream}
        rough={0.9}
        shadow={false}
        polyOffset
      />
      {/* Phào trần & phào chân tường bên trái đồng bộ */}
      <B p={[-9.95, Y + H2 - 0.08, -0.6]} s={[0.08, 0.16, 10.8]} c={palette.crownMolding} shadow={false} polyOffset />
      <B p={[-9.98, Y + 0.07, -5.3]} s={[0.03, 0.14, 1.4]} c={palette.baseboard} shadow={false} polyOffset />
      <B p={[-9.98, Y + 0.07, 1.8]} s={[0.03, 0.14, 6.0]} c={palette.baseboard} shadow={false} polyOffset />
      {/* Cửa đôi màu linen kem ốp mặt trong tường trái chạm sát sàn Y */}
      <G p={[-9.95, Y, -2.9]}>
        <BB p={[0, 0, 0]} s={[0.05, 3.45, 3.36]} c="#f2ede4" rough={0.7} shadow={false} polyOffset />
        <B p={[0.03, 1.72, 0]} s={[0.02, 3.35, 0.04]} c="#d8d2c7" shadow={false} polyOffset />
        <B p={[0.04, 1.5, -0.1]} s={[0.025, 0.26, 0.025]} c="#686662" metal={0.75} rough={0.22} shadow={false} />
        <B p={[0.04, 1.5, 0.1]} s={[0.025, 0.26, 0.025]} c="#686662" metal={0.75} rough={0.22} shadow={false} />
      </G>

      {/* 2 Khung tranh nghệ thuật tối giản bên cạnh cửa trái */}
      <G p={[-9.96, Y + 2.2, 0.8]} r={[0, Math.PI / 2, 0]}>
        <B p={[-0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#cfc4b4" shadow={false} polyOffset />
        <B p={[-0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#f4f0e8" shadow={false} polyOffset />
        <Sph p={[-0.45, 0, 0.025]} s={[0.16, 0.24, 0.01]} c="#4b5948" />

        <B p={[0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#cfc4b4" shadow={false} polyOffset />
        <B p={[0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#f4f0e8" shadow={false} polyOffset />
        <Sph p={[0.45, 0, 0.025]} s={[0.17, 0.2, 0.01]} c="#9c9080" />
      </G>

      {/* Cây Bàng Singapore ở góc tường bên trái */}
      <G p={[-9.15, Y, -4.85]}>
        <Cyl p={[0, 0.32, 0]} rt={0.22} rb={0.17} h={0.64} c="#2c2825" shadow />
        <Cyl p={[0, 1.05, 0]} rt={0.032} h={1.35} c="#52483c" />
        {[0.85, 1.15, 1.42, 1.65, 1.85].map((ly, idx) => (
          <group key={idx} position={[0, ly, 0]} rotation={[0, (idx * Math.PI) / 2.5, 0.2]}>
            <Sph p={[0.24, 0, 0]} s={[0.25, 0.04, 0.17]} c="#4b5948" />
          </group>
        ))}
      </G>

      {/* 5. TƯỜNG BÊN PHẢI TẦNG 2: Tấm tường bình thường đồng màu với căn phòng (luôn cố định khi xoay) */}
      <B
        p={[10.14, Y - 0.12 + (H2 + 0.12) / 2, -2.96]}
        s={[0.2, H2 + 0.12, 6.56]}
        c={extWallColor}
        rough={0.9}
        shadow
      />
      <B
        p={[10.01, Y + H2 / 2, -2.9]}
        s={[0.04, H2, 6.2]}
        c={palette.wallAccent}
        rough={0.9}
        shadow={false}
        polyOffset
      />
      {/* Phào chỉ trần & phào chân tường phải đồng bộ 2 tầng */}
      <B p={[9.95, Y + H2 - 0.08, -2.9]} s={[0.08, 0.16, 6.2]} c={palette.crownMolding} shadow={false} polyOffset />
      <B p={[9.98, Y + 0.07, -2.9]} s={[0.03, 0.14, 6.2]} c={palette.baseboard} shadow={false} polyOffset />

      {/* Cửa sổ kính lớn & Rèm voan trắng rủ mềm xuống sàn (click để đóng/mở rèm Tầng 2) */}
      <SecondFloorCurtains skyMap={skyMap} />
    </group>
  )
}

function WoodSlatsWall({ H2 }: { H2: number }) {
  const slatGeom = useMemo(() => new THREE.BoxGeometry(0.048, H2 - 0.04, 0.045), [H2])
  const slatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#696056', roughness: 0.55, metalness: 0.05 }),
    [],
  )

  return (
    <G p={[-1.05, FLOOR2_Y, -5.96]}>
      <B p={[0, H2 / 2, 0]} s={[1.45, H2, 0.05]} c="#4c453e" rough={0.6} shadow={false} polyOffset />
      {Array.from({ length: 15 }, (_, i) => {
        const lx = -0.64 + (i / 14) * 1.28
        return <mesh key={i} position={[lx, H2 / 2, 0.035]} geometry={slatGeom} material={slatMat} />
      })}
    </G>
  )
}

/* ============================================================================
 * 3. CẦU THANG GỖ - THÉP TRONG NHÀ (NHẤP CHUỘT ĐỂ ĐI BỘ LÊN / XUỐNG TỰ NHIÊN)
 * ============================================================================ */
function IndoorStaircase() {
  const steps = 14
  const startZ = 4.7
  const endZ = 0.45
  const totalH = FLOOR2_Y

  // Tái sử dụng chung Geometry & Material cho toàn bộ 14 bậc cầu thang để giảm Draw Calls tối đa
  const stepGeom = useMemo(() => new THREE.BoxGeometry(1.08, 0.065, 0.32), [])
  const stepMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b8ae9f', roughness: 0.45, metalness: 0.05 }),
    [],
  )
  const ledGeom = useMemo(() => new THREE.BoxGeometry(1.04, 0.018, 0.02), [])
  const ledMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f6e9d4', emissive: '#ebd2ab', emissiveIntensity: 0.95 }),
    [],
  )

  const handleStairClick = () => {
    const st = useStore.getState()
    if (st.mode !== 'orbit') return
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

  return (
    <Interact
      hint="🪜 Cầu thang"
      onClick={handleStairClick}
    >
      <G p={[-8.85, 0, 0]}>
        {/* 2 dầm thép đen chịu lực chạy chéo */}
        <mesh position={[-0.45, totalH / 2 - 0.1, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]}>
          <boxGeometry args={[0.07, 0.14, 6.1]} />
          <meshStandardMaterial color="#262421" metalness={0.75} roughness={0.22} />
        </mesh>
        <mesh position={[0.45, totalH / 2 - 0.1, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]}>
          <boxGeometry args={[0.07, 0.14, 6.1]} />
          <meshStandardMaterial color="#262421" metalness={0.75} roughness={0.22} />
        </mesh>

        {/* 14 Bậc thang gỗ sồi ash dùng chung biến Geometry & Material */}
        {Array.from({ length: steps }, (_, i) => {
          const t = (i + 0.5) / steps
          const sy = t * totalH
          const sz = THREE.MathUtils.lerp(startZ, endZ, t)
          return (
            <group key={i} position={[0, sy, sz]}>
              <mesh position={[0, 0, 0]} geometry={stepGeom} material={stepMat} receiveShadow />
              <mesh position={[0, -0.04, 0.14]} geometry={ledGeom} material={ledMat} />
            </group>
          )
        })}

        {/* Tay vịn cầu thang gỗ sồi ash & trụ thép */}
        <mesh position={[0.52, totalH / 2 + 0.82, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]}>
          <boxGeometry args={[0.055, 0.055, 6.15]} />
          <meshStandardMaterial color="#b8ae9f" roughness={0.45} />
        </mesh>
        {[0.08, 0.35, 0.65, 0.92].map((t, idx) => (
          <B
            key={idx}
            p={[0.52, t * totalH + 0.42, THREE.MathUtils.lerp(startZ, endZ, t)]}
            s={[0.035, 0.85, 0.035]}
            c="#262421"
            metal={0.6}
          />
        ))}
      </G>
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
  const userRole = useStore((s) => s.userRole)
  const canUseGirlWardrobe = userRole === 'girl'

  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const creamRugTex = useMemo(() => fluffyCreamRug(), [])
  const persianRugTex = useMemo(() => persianTerracottaRug(), [])
  const bedPaintingTex = useMemo(() => colorfulBedArt(), [])
  const pcScreenTex = useMemo(
    () => girlPcScreen(girlPcState === 'rgb' ? 'rgb' : 'on'),
    [girlPcState],
  )
  const bookTex = useMemo(() => openBookPages(girlBookPage), [girlBookPage])

  return (
    <group>
      {/* Nguồn sáng phản hồi thực tế khi người dùng bật đèn Tầng 2 (gộp theo cụm & chỉ bật ban đêm để giữ 60fps; ban ngày dùng emissive) */}
      {darkMode && (floor2ArchLightOn || girlLampOn) && (
        <pointLight
          position={[-5.0, Y + 1.8, -5.15]}
          intensity={3.0}
          distance={6.2}
          decay={2}
          color="#ebd2ab"
          castShadow={false}
        />
      )}
      {darkMode && (girlShelfLedOn || girlVanityLightOn) && (
        <pointLight
          position={[4.3, Y + 1.9, -4.9]}
          intensity={2.9}
          distance={5.8}
          decay={2}
          color="#f2e0c4"
          castShadow={false}
        />
      )}
      {darkMode && floor2ReadingLampOn && (
        <pointLight
          position={[8.4, Y + 1.65, -0.9]}
          intensity={3.1}
          distance={5.5}
          decay={2}
          color="#e6cba4"
          castShadow={false}
        />
      )}
      {/* =====================================================================
       * A. KHU VỰC GIƯỜNG NGỦ ẤM CÚNG (CHĂN & GỐI CAM ĐẤT, ĐÈN VÒM LED, TRANH ĐA SẮC, THẢM CỔ ĐIỂN)
       * ===================================================================== */}

      {/* 1. Thảm chữ nhật trắng kem dưới gầm giường */}
      <mesh position={[-5.0, Y + 0.022, -3.85]} receiveShadow>
        <boxGeometry args={[3.45, 0.02, 3.65]} />
        <meshStandardMaterial
          color="#ebe5da"
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 2. Hai tấm thảm dệt họa tiết trung tính ở hai bên hông giường */}
      <mesh position={[-7.35, Y + 0.024, -3.55]} receiveShadow>
        <boxGeometry args={[1.08, 0.02, 1.72]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.92}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <mesh position={[-2.65, Y + 0.024, -3.55]} receiveShadow>
        <boxGeometry args={[1.08, 0.02, 1.72]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.92}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 3. Giường ngủ màu kem + Chăn phủ & 2 gối tựa Oat-Taupe đồng bộ */}
      <Interact
        hint="🛏️ Giường ngủ Tầng 2"
        onClick={() => useStore.getState().startActivity('girl_sleep', true)}
      >
        <G p={[-5.0, Y, -3.95]}>
          <RBB p={[0, 0, 0]} s={[2.68, 0.34, 3.18]} c="#ebe6dc" rough={0.9} radius={0.04} shadow />
          <RBB p={[0, 0, -1.48]} s={[2.76, 1.48, 0.22]} c="#f0ebe2" rough={0.9} radius={0.04} shadow />
          <RBB p={[0, 0.34, 0.06]} s={[2.46, 0.26, 2.86]} c="#f7f4ee" rough={0.9} radius={0.05} />
          <RBB p={[0, 0.6, 0.32]} s={[2.48, 0.09, 2.15]} c="#f2ede4" rough={0.92} radius={0.03} shadow={false} />

          {/* Tấm chăn phủ (Throw Blanket) tông Wool Taupe trầm hài hòa */}
          <RBB p={[0, 0.69, 0.85]} s={[2.52, 0.045, 0.82]} c="#7c7268" rough={0.92} radius={0.02} shadow={false} />
          <RBB p={[0, 0.735, 0.68]} s={[2.5, 0.025, 0.16]} c="#8f8479" rough={0.92} radius={0.015} shadow={false} />
          <RBB p={[0, 0.735, 1.02]} s={[2.5, 0.025, 0.16]} c="#6f655c" rough={0.92} radius={0.015} shadow={false} />
          <RBB p={[-1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#786e64" rough={0.92} radius={0.02} shadow={false} />
          <RBB p={[1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#786e64" rough={0.92} radius={0.02} shadow={false} />

          {/* 2 Gối ngủ lớn màu kem ngà */}
          <RBB p={[-0.64, 0.62, -1.16]} s={[0.92, 0.18, 0.44]} r={[0.18, 0, 0]} c="#f5f2eb" rough={0.9} radius={0.04} shadow={false} />
          <RBB p={[0.64, 0.62, -1.16]} s={[0.92, 0.18, 0.44]} r={[0.18, 0, 0]} c="#f5f2eb" rough={0.9} radius={0.04} shadow={false} />

          {/* 2 Chiếc gối tựa tông Taupe đối xứng */}
          <RBB p={[-0.64, 0.64, -0.92]} s={[0.68, 0.16, 0.28]} r={[0.22, 0, 0]} c="#857a6f" rough={0.9} radius={0.04} shadow={false} />
          <RBB p={[0.64, 0.64, -0.92]} s={[0.68, 0.16, 0.28]} r={[0.22, 0, 0]} c="#857a6f" rough={0.9} radius={0.04} shadow={false} />
        </G>
      </Interact>

      {/* 4. DẢI ĐÈN LED HÌNH VÒM CUNG (ARCH LED) & TRANH ĐẦU GIƯỜNG: Click để bật/tắt riêng */}
      <Interact
        hint={floor2ArchLightOn ? '✨ Tắt đèn vòm nghệ thuật' : '✨ Bật đèn vòm nghệ thuật'}
        onClick={() => useStore.getState().toggleFloor2ArchLight()}
      >
        <G p={[-5.0, Y, -5.96]}>
          {/* Dải đèn LED vòm cung phát sáng champagne dịu */}
          <mesh position={[0, 2.25, 0]}>
            <torusGeometry args={[1.62, 0.036, 16, 64, Math.PI]} />
            <meshStandardMaterial
              color="#f6e9d4"
              emissive="#ebd2ab"
              emissiveIntensity={floor2ArchLightOn ? 2.6 : 0.18}
            />
          </mesh>
          {/* 2 chân dải đèn vòm kéo thẳng xuống tới 2 tủ đầu giường */}
          <B
            p={[-1.62, 1.42, 0]}
            s={[0.07, 1.68, 0.05]}
            c="#f6e9d4"
            emissive="#ebd2ab"
            ei={floor2ArchLightOn ? 2.6 : 0.18}
            shadow={false}
          />
          <B
            p={[1.62, 1.42, 0]}
            s={[0.07, 1.68, 0.05]}
            c="#f6e9d4"
            emissive="#ebd2ab"
            ei={floor2ArchLightOn ? 2.6 : 0.18}
            shadow={false}
          />
          {floor2ArchLightOn && (
            <mesh position={[0, 2.25, 0.02]}>
              <planeGeometry args={[3.2, 1.8]} />
              <meshBasicMaterial color="#ebd2ab" transparent opacity={0.14} depthWrite={false} />
            </mesh>
          )}

          {/* Bức tranh khung gỗ trầm treo chính giữa trong lòng vòm đèn */}
          <G p={[0, 2.38, 0.025]}>
            <B p={[0, 0, 0]} s={[1.82, 1.16, 0.045]} c="#4c453e" rough={0.55} polyOffset />
            <mesh position={[0, 0, 0.028]}>
              <planeGeometry args={[1.68, 1.02]} />
              <meshStandardMaterial
                map={bedPaintingTex}
                roughness={0.65}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </G>

          {/* 4 Kệ gỗ nổi nhỏ hai bên vòm đèn với bình gốm kem-đá */}
          {[-2.35, 2.35].map((sx, sideIdx) => (
            <group key={sideIdx} position={[sx, 0, 0]}>
              <BB p={[0, 2.28, 0.1]} s={[0.78, 0.04, 0.22]} c="#b8ae9f" rough={0.55} />
              <Cyl p={[-0.16, 2.42, 0.1]} rt={0.05} rb={0.07} h={0.2} c="#f2ede4" />
              <Sph p={[0.14, 2.38, 0.1]} s={[0.065, 0.065, 0.065]} c="#dfd8cc" />

              <BB p={[0, 2.75, 0.1]} s={[0.78, 0.04, 0.22]} c="#b8ae9f" rough={0.55} />
              <Cyl p={[0.12, 2.89, 0.1]} rt={0.045} rb={0.06} h={0.2} c="#f2ede4" />
              <Cyl p={[-0.14, 2.85, 0.1]} rt={0.05} rb={0.05} h={0.12} c="#786d60" />
            </group>
          ))}
        </G>
      </Interact>

      {/* 5. Hai tủ đầu giường chạm sàn + 2 đèn ngủ chụp tròn phát sáng champagne */}
      {[-6.78, -3.22].map((nx, idx) => (
        <Interact
          key={idx}
          hint="💡 Đèn ngủ"
          onClick={() => useStore.getState().toggleGirlLamp()}
        >
          <G p={[nx, Y, -5.42]}>
            <RBB p={[0, 0, 0]} s={[0.68, 0.58, 0.52]} c="#b8ae9f" rough={0.6} radius={0.03} shadow />
            <B p={[0, 0.3, 0.265]} s={[0.6, 0.015, 0.01]} c="#8f8577" />
            <Sph p={[0, 0.43, 0.27]} s={[0.022, 0.022, 0.022]} c="#a89e90" metal={0.75} rough={0.22} />
            <Sph p={[0, 0.17, 0.27]} s={[0.022, 0.022, 0.022]} c="#a89e90" metal={0.75} rough={0.22} />

            {/* Đèn ngủ chụp tròn phát sáng champagne đặt trên mặt tủ */}
            <Cyl p={[0, 0.64, 0]} rt={0.07} rb={0.095} h={0.12} c="#9c9283" />
            <Sph
              p={[0, 0.78, 0]}
              s={[0.16, 0.15, 0.16]}
              c="#f6e9d4"
              emissive="#ebd2ab"
              ei={girlLampOn ? 2.4 : 0.15}
            />
            {girlLampOn && (
              <mesh position={[0, 0.78, 0]}>
                <sphereGeometry args={[0.22, 16, 12]} />
                <meshBasicMaterial color="#ebd2ab" transparent opacity={0.18} depthWrite={false} />
              </mesh>
            )}
          </G>
        </Interact>
      ))}
      {/* Chậu cây tròn nhỏ bên cạnh tủ đầu giường phải */}
      <G p={[-2.62, Y, -5.42]}>
        <Cyl p={[0, 0.16, 0]} rt={0.13} rb={0.1} h={0.32} c="#f2ede4" />
        <Sph p={[0, 0.38, 0]} s={[0.17, 0.17, 0.17]} c="#4b5948" />
      </G>

      {/* 6. Cụm thảm lông tròn kem + Ghế lười Bouclé + Bàn trà nhỏ phía trước giường */}
      <G p={[-3.55, Y, 1.15]}>
        <mesh position={[0, 0.024, 0]} receiveShadow>
          <cylinderGeometry args={[1.7, 1.7, 0.02, 48]} />
          <meshStandardMaterial
            map={creamRugTex}
            roughness={0.95}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Bàn trà gỗ sồi Ash thấp */}
        <G p={[-0.55, 0, 0.05]}>
          <BB p={[0, 0.3, 0]} s={[0.74, 0.04, 0.42]} c="#b8ae9f" rough={0.55} />
          {[-0.3, 0.3].map((lx, i) =>
            [-0.15, 0.15].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.15, lz]} rt={0.022} h={0.3} c="#9c9283" />
            )),
          )}
          <mesh position={[0.06, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
            <planeGeometry args={[0.26, 0.18]} />
            <meshStandardMaterial map={bookTex} />
          </mesh>
          <Cyl p={[-0.18, 0.37, 0.04]} rt={0.032} rb={0.026} h={0.06} c="#f2ede4" />
        </G>

        {/* Ghế lười tròn Bouclé + Đôn tròn */}
        <Interact
          hint="🛋️ Ghế lười Bouclé"
          onClick={() => useStore.getState().startActivity('girl_lounge', true)}
        >
          <G p={[0.45, 0, 0.05]} r={[0, -0.7, 0]}>
            <Cyl p={[0, 0.03, 0]} rt={0.46} rb={0.48} h={0.06} c="#b8ae9f" rough={0.6} shadow />
            <Cyl p={[0, 0.22, 0]} rt={0.48} rb={0.46} h={0.32} c="#f4f0e8" rough={0.92} shadow />
            <mesh position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.45, 0.47, 0.08, 32]} />
              <meshStandardMaterial color="#ece7de" roughness={0.95} />
            </mesh>

            <group position={[0, 0.42, -0.06]}>
              <mesh position={[0, 0.12, -0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.34, 0.14, 18, 36, Math.PI * 1.15]} />
                <meshStandardMaterial color="#efebe3" roughness={0.92} />
              </mesh>
              <RB p={[0, 0.15, -0.34]} s={[0.62, 0.38, 0.18]} c="#f4f0e8" rough={0.92} radius={0.045} shadow />
              <RB p={[-0.35, 0.08, -0.12]} r={[0, 0.35, 0]} s={[0.16, 0.28, 0.42]} c="#f4f0e8" rough={0.92} radius={0.04} />
              <RB p={[0.35, 0.08, -0.12]} r={[0, -0.35, 0]} s={[0.16, 0.28, 0.42]} c="#f4f0e8" rough={0.92} radius={0.04} />
            </group>

            {/* Gối tựa lưng tông Taupe trầm */}
            <RB p={[0, 0.45, -0.22]} r={[-0.22, 0, 0]} s={[0.36, 0.26, 0.12]} c="#7c7268" rough={0.88} radius={0.035} />
          </G>
        </Interact>
        <G p={[0.68, 0, -0.72]}>
          <Cyl p={[0, 0.025, 0]} rt={0.27} rb={0.28} h={0.05} c="#b8ae9f" rough={0.6} />
          <Cyl p={[0, 0.2, 0]} rt={0.28} rb={0.27} h={0.32} c="#f4f0e8" rough={0.92} shadow />
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.04, 28]} />
            <meshStandardMaterial color="#ece7de" roughness={0.95} />
          </mesh>
        </G>
      </G>

      {/* =====================================================================
       * B. GÓC THỬ ĐỒ (DRESSING ZONE) & GÓC NGHỆ THUẬT - TRƯNG BÀY Ở KHOẢNG TRỐNG GIỮA PHÒNG
       * ===================================================================== */}
      {/* 1. Gương đứng soi toàn thân khung Ash + Thảm lông nhỏ màu kem */}
      <G p={[-2.05, Y, -5.68]} r={[-0.06, 0.08, 0]}>
        <BB p={[0, 0, 0]} s={[0.76, 1.88, 0.05]} c="#b8ae9f" rough={0.5} polyOffset />
        <BB p={[0, 0.05, 0.028]} s={[0.66, 1.78, 0.01]} c="#d4ccc0" metal={0.22} rough={0.18} polyOffset />
        <mesh position={[0, 0.25, 0.036]}>
          <planeGeometry args={[0.64, 0.36]} />
          <meshStandardMaterial
            map={persianRugTex}
            roughness={0.4}
            opacity={0.65}
            transparent
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </G>
      <mesh position={[-2.0, Y + 0.024, -4.92]} receiveShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.02, 36]} />
        <meshStandardMaterial
          map={creamRugTex}
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 2. Giá treo quần áo chữ A đồng bộ trung tính */}
      {canUseGirlWardrobe ? (
        <Interact
          hint="👗 Giá treo trang phục"
          onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
        >
          <G p={[-1.12, Y, -5.32]}>
            {[-0.56, 0.56].map((rx, side) => (
              <group key={side} position={[rx, 0, 0]}>
                <Cyl p={[0, 0.82, -0.14]} r={[0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#9c9283" />
                <Cyl p={[0, 0.82, 0.14]} r={[-0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#9c9283" />
                <B p={[0, 0.16, 0]} s={[0.035, 0.03, 0.52]} c="#9c9283" />
              </group>
            ))}
            <Cyl p={[0, 1.58, 0]} r={[0, 0, Math.PI / 2]} rt={0.016} h={1.24} c="#a89e90" metal={0.8} rough={0.22} />
            <BB p={[0, 0.14, 0]} s={[1.1, 0.03, 0.46]} c="#b8ae9f" rough={0.55} />

            {[
              { x: -0.36, c: '#cfbeba', skirt: '#dfd2cf', h: 0.96 },
              { x: -0.12, c: '#f2ede4', skirt: '#ebe4d8', h: 1.04 },
              { x: 0.12, c: '#a2ae9e', skirt: '#b7c2b3', h: 0.98 },
              { x: 0.36, c: '#cac6c0', skirt: '#dcd8d2', h: 0.92 },
            ].map((dr, idx) => (
              <group key={idx} position={[dr.x, 1.56, 0]}>
                <Cyl p={[0, -0.04, 0]} rt={0.006} h={0.08} c="#a89e90" metal={0.8} />
                <BB p={[0, -0.32, 0]} s={[0.14, 0.42, 0.28]} c={dr.c} rough={0.82} />
                <Cyl p={[0, -0.68, 0]} rt={0.08} rb={0.16} h={dr.h - 0.35} c={dr.skirt} rough={0.85} />
              </group>
            ))}

            <BB p={[-0.34, 0.17, 0.04]} s={[0.2, 0.19, 0.12]} c="#8e8175" rough={0.45} />
            <Cyl p={[-0.34, 0.38, 0.04]} r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.015} c="#a89e90" metal={0.75} />
            <BB p={[-0.08, 0.17, -0.02]} s={[0.22, 0.21, 0.13]} c="#b8ae9f" rough={0.45} />
            <Cyl p={[-0.08, 0.4, -0.02]} r={[Math.PI / 2, 0, 0]} rt={0.06} h={0.015} c="#a89e90" metal={0.75} />
            <BB p={[0.28, 0.17, 0]} s={[0.32, 0.13, 0.26]} c="#ece6db" rough={0.7} />
            <BB p={[0.28, 0.29, 0]} s={[0.33, 0.025, 0.27]} c="#d6cfc4" />
            <BB p={[0.28, 0.315, 0.01]} s={[0.28, 0.11, 0.23]} c="#dbd3ca" rough={0.7} />
            <BB p={[0.28, 0.415, 0.01]} s={[0.29, 0.022, 0.24]} c="#c2b8ae" />
          </G>
        </Interact>
      ) : (
        <G p={[-1.12, Y, -5.32]}>
          {[-0.56, 0.56].map((rx, side) => (
            <group key={side} position={[rx, 0, 0]}>
              <Cyl p={[0, 0.82, -0.14]} r={[0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#9c9283" />
              <Cyl p={[0, 0.82, 0.14]} r={[-0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#9c9283" />
              <B p={[0, 0.16, 0]} s={[0.035, 0.03, 0.52]} c="#9c9283" />
            </group>
          ))}
          <Cyl p={[0, 1.58, 0]} r={[0, 0, Math.PI / 2]} rt={0.016} h={1.24} c="#a89e90" metal={0.8} rough={0.22} />
          <BB p={[0, 0.14, 0]} s={[1.1, 0.03, 0.46]} c="#b8ae9f" rough={0.55} />

          {[
            { x: -0.36, c: '#cfbeba', skirt: '#dfd2cf', h: 0.96 },
            { x: -0.12, c: '#f2ede4', skirt: '#ebe4d8', h: 1.04 },
            { x: 0.12, c: '#a2ae9e', skirt: '#b7c2b3', h: 0.98 },
            { x: 0.36, c: '#cac6c0', skirt: '#dcd8d2', h: 0.92 },
          ].map((dr, idx) => (
            <group key={idx} position={[dr.x, 1.56, 0]}>
              <Cyl p={[0, -0.04, 0]} rt={0.006} h={0.08} c="#a89e90" metal={0.8} />
              <BB p={[0, -0.32, 0]} s={[0.14, 0.42, 0.28]} c={dr.c} rough={0.82} />
              <Cyl p={[0, -0.68, 0]} rt={0.08} rb={0.16} h={dr.h - 0.35} c={dr.skirt} rough={0.85} />
            </group>
          ))}

          <BB p={[-0.34, 0.17, 0.04]} s={[0.2, 0.19, 0.12]} c="#8e8175" rough={0.45} />
          <Cyl p={[-0.34, 0.38, 0.04]} r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.015} c="#a89e90" metal={0.75} />
          <BB p={[-0.08, 0.17, -0.02]} s={[0.22, 0.21, 0.13]} c="#b8ae9f" rough={0.45} />
          <Cyl p={[-0.08, 0.4, -0.02]} r={[Math.PI / 2, 0, 0]} rt={0.06} h={0.015} c="#a89e90" metal={0.75} />
          <BB p={[0.28, 0.17, 0]} s={[0.32, 0.13, 0.26]} c="#ece6db" rough={0.7} />
          <BB p={[0.28, 0.29, 0]} s={[0.33, 0.025, 0.27]} c="#d6cfc4" />
          <BB p={[0.28, 0.315, 0.01]} s={[0.28, 0.11, 0.23]} c="#dbd3ca" rough={0.7} />
          <BB p={[0.28, 0.415, 0.01]} s={[0.29, 0.022, 0.24]} c="#c2b8ae" />
        </G>
      )}

      {/* 3. CHẬU CÂY CẢNH LỚN TÁN LÁ XÒE RỘNG OLIVE TRUNG TÍNH (CHẬU GỐM ĐÁ XÁM) NGĂN CÁCH KHÔNG GIAN */}
      <G p={[0.12, Y, -5.05]}>
        {/* Chậu gốm hình trụ bo tròn màu đá xám */}
        <Cyl p={[0, 0.31, 0]} rt={0.33} rb={0.26} h={0.62} c="#736a60" rough={0.78} shadow />
        <Cyl p={[0, 0.58, 0]} rt={0.29} h={0.03} c="#3a332c" />
        {/* Thân chính & các nhánh cây gỗ */}
        <Cyl p={[0, 1.25, 0]} rt={0.036} rb={0.055} h={1.35} c="#52483c" />
        <Cyl p={[-0.22, 1.52, 0.08]} r={[0.15, 0, 0.52]} rt={0.02} rb={0.03} h={0.72} c="#52483c" />
        <Cyl p={[0.24, 1.46, -0.06]} r={[-0.12, 0, -0.5]} rt={0.02} rb={0.03} h={0.72} c="#52483c" />
        <Cyl p={[0.05, 1.62, 0.22]} r={[0.48, 0, -0.15]} rt={0.018} rb={0.026} h={0.62} c="#52483c" />
        <Cyl p={[-0.08, 1.66, -0.2]} r={[-0.42, 0, 0.2]} rt={0.018} rb={0.026} h={0.58} c="#52483c" />

        {/* Tán lá xòe rộng nhiều tầng tone Olive dịu mắt */}
        {Array.from({ length: 28 }, (_, idx) => {
          const ring = idx < 10 ? 0 : idx < 20 ? 1 : 2
          const count = ring === 0 ? 10 : ring === 1 ? 10 : 8
          const iInRing = ring === 0 ? idx : ring === 1 ? idx - 10 : idx - 20
          const angle = (iInRing / count) * Math.PI * 2 + ring * 0.45
          const radius = ring === 0 ? 0.58 : ring === 1 ? 0.38 : 0.18
          const ly = ring === 0 ? 1.56 + (idx % 3) * 0.1 : ring === 1 ? 1.88 + (idx % 3) * 0.09 : 2.16 + (idx % 2) * 0.08
          const lx = Math.cos(angle) * radius
          const lz = Math.sin(angle) * radius
          const leafColors = ['#445141', '#4d5c4a', '#5b6a56', '#3a4637']
          return (
            <mesh
              key={idx}
              position={[lx, ly, lz]}
              rotation={[Math.sin(angle) * 0.35, -angle, 0.28 + (idx % 3) * 0.12]}
              scale={[0.28, 0.032, 0.19]}
            >
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={leafColors[idx % leafColors.length]} roughness={0.55} />
            </mesh>
          )
        })}
      </G>

      {/* 4. KỆ GỖ THẤP 2 TẦNG (DISPLAY SHELF) TRƯNG BÀY GẤU BÔNG, HỘP QUÀ, LỌ HOA & MÁY PHÁT ĐĨA THAN */}
      <G p={[-0.95, Y, -3.55]}>
          {/* Khung kệ gỗ sồi tro thấp 2 tầng chạm sàn */}
          <BB p={[0, 0.04, 0]} s={[1.48, 0.04, 0.42]} c="#b8ae9f" rough={0.55} />
          <BB p={[0, 0.36, 0]} s={[1.48, 0.04, 0.42]} c="#b8ae9f" rough={0.55} />
          <BB p={[0, 0.68, 0]} s={[1.52, 0.045, 0.44]} c="#c4baa9" rough={0.52} />
          {[-0.7, 0, 0.7].map((sx, idx) => (
            <BB key={idx} p={[sx, 0, 0]} s={[0.04, 0.68, 0.4]} c="#9c9283" rough={0.58} />
          ))}

          {/* --- TẦNG TRÊN: MÁY PHÁT NHẠC ĐĨA THAN (VINYL PLAYER), LỌ HOA & HỘP QUÀ NHỎ --- */}
          {/* Máy phát nhạc đĩa than gỗ óc chó trầm */}
          <G p={[-0.42, 0.725, 0]}>
            <BB p={[0, 0, 0]} s={[0.42, 0.075, 0.34]} c="#4c453e" rough={0.5} />
            {/* Đĩa than đen mờ + nhãn nâu đất trầm */}
            <Cyl p={[-0.03, 0.085, 0]} rt={0.14} h={0.012} c="#252321" rough={0.25} metal={0.3} />
            <Cyl p={[-0.03, 0.093, 0]} rt={0.045} h={0.008} c="#7c6358" />
            {/* Cần đọc đĩa kim loại Champagne Pewter */}
            <Cyl p={[0.14, 0.1, -0.1]} rt={0.022} h={0.03} c="#a89e90" metal={0.8} />
            <B p={[0.08, 0.11, -0.02]} r={[0, -0.42, 0]} s={[0.012, 0.012, 0.2]} c="#a89e90" metal={0.8} />
          </G>

          {/* Lọ hoa gốm kem & hoa khô màu be trung tính */}
          <G p={[0.12, 0.725, -0.02]}>
            <Cyl p={[0, 0.1, 0]} rt={0.055} rb={0.075} h={0.2} c="#f2ede4" rough={0.35} />
            <Sph p={[-0.04, 0.24, 0.02]} s={[0.055, 0.055, 0.055]} c="#dfd4c6" />
            <Sph p={[0.04, 0.26, -0.02]} s={[0.055, 0.055, 0.055]} c="#ebe2d3" />
            <Sph p={[0, 0.28, 0.03]} s={[0.05, 0.05, 0.05]} c="#cfc3b3" />
            <Sph p={[0.02, 0.22, 0.04]} s={[0.06, 0.04, 0.06]} c="#4b5948" />
          </G>

          {/* Hộp quà nhỏ thắt nơ tone cát & linen */}
          <G p={[0.48, 0.725, 0.02]}>
            <BB p={[0, 0, 0]} s={[0.22, 0.14, 0.2]} c="#dfd8cc" rough={0.6} />
            <BB p={[0, 0.13, 0]} s={[0.235, 0.03, 0.215]} c="#b8ae9f" />
            <B p={[0, 0.08, 0]} s={[0.24, 0.16, 0.03]} c="#f4f0e8" />
          </G>

          {/* --- TẦNG DƯỚI: BỘ SƯU TẬP GẤU BÔNG (TEDDY BEARS) & HỘP QUÀ --- */}
          {/* Gấu bông nâu taupe ấm áp ngồi bên trái */}
          <G p={[-0.36, 0.4, 0.04]}>
            <Sph p={[0, 0.09, 0]} s={[0.085, 0.095, 0.075]} c="#786352" rough={0.9} />
            <Sph p={[0, 0.2, 0.01]} s={[0.075, 0.07, 0.07]} c="#786352" rough={0.9} />
            <Sph p={[-0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#5c4b3d" />
            <Sph p={[0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#5c4b3d" />
            <Sph p={[0, 0.19, 0.065]} s={[0.028, 0.022, 0.02]} c="#e6ded2" />
            <Sph p={[-0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#5c4b3d" />
            <Sph p={[0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#5c4b3d" />
            <B p={[0, 0.14, 0.065]} s={[0.06, 0.022, 0.015]} c="#8e766b" />
          </G>
          {/* Gấu bông yến mạch ngồi bên phải */}
          <G p={[0.34, 0.4, 0.04]}>
            <Sph p={[0, 0.085, 0]} s={[0.08, 0.09, 0.07]} c="#ebe3d7" rough={0.9} />
            <Sph p={[0, 0.19, 0.01]} s={[0.07, 0.065, 0.065]} c="#ebe3d7" rough={0.9} />
            <Sph p={[-0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#c8bca9" />
            <Sph p={[0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#c8bca9" />
            <Sph p={[0, 0.18, 0.06]} s={[0.025, 0.02, 0.018]} c="#f6f3ed" />
            <Sph p={[-0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#c8bca9" />
            <Sph p={[0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#c8bca9" />
            <B p={[0, 0.135, 0.06]} s={[0.055, 0.02, 0.015]} c="#9e9284" />
          </G>
          {/* Chồng sách nghệ thuật bìa cứng trung tính ở tầng dưới */}
          <BB p={[-0.36, 0.08, 0]} s={[0.32, 0.045, 0.24]} c="#d6d1c8" />
          <BB p={[-0.36, 0.125, 0]} s={[0.28, 0.04, 0.22]} c="#cfc5b8" />
          <BB p={[0.34, 0.08, 0]} s={[0.3, 0.16, 0.22]} c="#b8c0b4" />
        </G>

      {/* 5. ĐÀN PIANO ĐIỆN MÀU KEM LINEN / GỖ SỒI TRO KÈM GHẾ ĐÔN & GIÁ VẼ TRANH GỖ Ở GIỮA PHÒNG */}
      <G p={[0.15, Y, -1.55]}>
        {/* Thảm yến mạch lót dưới khu vực Đàn Piano & Giá vẽ */}
        <mesh position={[-0.15, 0.022, 0.1]} receiveShadow>
          <boxGeometry args={[2.65, 0.02, 1.55]} />
          <meshStandardMaterial
            color="#ebe5da"
            roughness={0.94}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Đàn Piano điện màu kem linen kết hợp gỗ sồi tro */}
        <Interact
          hint="🎹 Chơi đàn Piano"
          onClick={() => useStore.getState().startActivity('piano', true)}
        >
          <G p={[0.32, 0, -0.08]}>
            {/* 2 Chân trụ màu kem & thanh giằng bàn đạp */}
            <BB p={[-0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#f2ede4" rough={0.5} />
            <BB p={[0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#f2ede4" rough={0.5} />
            <BB p={[0, 0.04, -0.12]} s={[1.28, 0.08, 0.08]} c="#f2ede4" />
            <BB p={[0, 0.18, -0.14]} s={[1.18, 0.48, 0.04]} c="#dfd8cc" />
            {/* 3 Pedal Champagne Pewter */}
            {[-0.08, 0, 0.08].map((px, pi) => (
              <B key={pi} p={[px, 0.05, -0.04]} s={[0.022, 0.02, 0.12]} c="#a89e90" metal={0.8} />
            ))}

            {/* Thân đàn Piano gỗ sồi tro & nắp kem ngà */}
            <BB p={[0, 0.72, 0]} s={[1.38, 0.14, 0.44]} c="#b8ae9f" rough={0.5} />
            <BB p={[0, 0.84, -0.08]} s={[1.38, 0.06, 0.26]} c="#f7f4ee" rough={0.4} />

            {/* Bàn phím 88 phím ngà & phím than nổi khối */}
            <BB p={[0, 0.785, 0.11]} s={[1.22, 0.028, 0.15]} c="#f5f2eb" rough={0.28} />
            {Array.from({ length: 22 }, (_, ki) => {
              if (ki % 7 === 2 || ki % 7 === 6) return null
              const kx = -0.54 + ki * 0.051
              return <BB key={ki} p={[kx, 0.808, 0.075]} s={[0.022, 0.02, 0.09]} c="#252321" rough={0.32} />
            })}

            {/* Giá để bản nhạc bằng gỗ & Bản nhạc đang mở */}
            <B p={[0, 0.99, -0.12]} r={[-0.24, 0, 0]} s={[0.52, 0.24, 0.02]} c="#b8ae9f" rough={0.5} />
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

            {/* Ghế đôn Piano bọc nệm linen êm ái */}
            <G p={[0, 0, 0.48]}>
              <BB p={[0, 0.4, 0]} s={[0.66, 0.075, 0.34]} c="#f4f0e8" rough={0.85} />
              {[-0.28, 0.28].map((lx, i) =>
                [-0.13, 0.13].map((lz, j) => (
                  <Cyl key={`${i}-${j}`} p={[lx, 0.2, lz]} rt={0.022} rb={0.016} h={0.4} c="#b8ae9f" />
                )),
              )}
            </G>
          </G>
        </Interact>

        {/* Giá vẽ tranh gỗ sồi tro (Wooden Easel) đặt khung vải Canvas bên cạnh Đàn Piano */}
        <Interact
          hint="🎨 Vẽ tranh Canvas"
          onClick={() => useStore.getState().startActivity('paint', true)}
        >
          <G p={[-0.86, 0, -0.02]} r={[0, 0.38, 0]}>
            {/* 3 Chân giá vẽ chữ A bằng gỗ sồi tro */}
            <Cyl p={[-0.24, 0.78, 0.08]} r={[-0.12, 0, -0.16]} rt={0.018} rb={0.022} h={1.58} c="#9c9283" />
            <Cyl p={[0.24, 0.78, 0.08]} r={[-0.12, 0, 0.16]} rt={0.018} rb={0.022} h={1.58} c="#9c9283" />
            <Cyl p={[0, 0.74, -0.26]} r={[0.26, 0, 0]} rt={0.018} rb={0.022} h={1.52} c="#877d70" />
            {/* Thanh đỡ tranh ngang & Trụ dọc giữa */}
            <Cyl p={[0, 0.92, 0.06]} r={[-0.12, 0, 0]} rt={0.018} h={1.15} c="#9c9283" />
            <B p={[0, 0.72, 0.14]} r={[-0.12, 0, 0]} s={[0.68, 0.035, 0.08]} c="#877d70" />

            {/* Khung vải Canvas tối giản đặt trên giá vẽ */}
            <G p={[0, 1.06, 0.11]} r={[-0.12, 0, 0]}>
              <B p={[0, 0, 0]} s={[0.64, 0.66, 0.032]} c="#f2ede4" rough={0.8} polyOffset />
              <mesh position={[0, 0, 0.019]}>
                <planeGeometry args={[0.58, 0.6]} />
                <meshStandardMaterial
                  map={bedPaintingTex}
                  roughness={0.75}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              </mesh>
            </G>

            {/* Bảng pha màu & Cốc đựng cọ vẽ đặt trên khay giá vẽ */}
            <Cyl p={[-0.2, 0.78, 0.16]} rt={0.032} rb={0.026} h={0.09} c="#f2ede4" />
            <Cyl p={[-0.2, 0.85, 0.16]} r={[0, 0, 0.2]} rt={0.005} h={0.12} c="#786e64" />
            <Cyl p={[-0.19, 0.85, 0.16]} r={[0, 0, -0.15]} rt={0.005} h={0.12} c="#626c75" />
            <Cyl p={[0.18, 0.745, 0.16]} rt={0.09} rb={0.09} h={0.012} c="#b8ae9f" />
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * C. KỆ SÁCH TREO TƯỜNG 2 TẦNG + LED CHAMPAGNE DỊU + SÁCH TRUNG TÍNH & DÂY THƯỜNG XUÂN OLIVE
       * ===================================================================== */}
      <Interact
        hint="✨ Đèn LED kệ sách"
        onClick={() => useStore.getState().toggleGirlShelfLed()}
      >
        <G p={[3.55, Y, -5.88]}>
          {/* Kệ dưới & thanh LED Champagne dịu */}
          <BB p={[0, 2.38, 0]} s={[5.2, 0.055, 0.28]} c="#b8ae9f" rough={0.5} />
          <B
            p={[0, 2.34, 0.05]}
            s={[5.05, 0.028, 0.05]}
            c="#f6e9d4"
            emissive="#ebd2ab"
            ei={girlShelfLedOn ? 2.4 : 0.15}
            shadow={false}
          />

          {/* Kệ trên & thanh LED Champagne dịu */}
          <BB p={[0, 2.88, 0]} s={[5.2, 0.055, 0.28]} c="#b8ae9f" rough={0.5} />
          {/* Dải LED hắt sáng: Click trực tiếp để bật/tắt */}
          <Interact
            hint={girlShelfLedOn ? '✨ Tắt LED kệ sách' : '✨ Bật LED kệ sách'}
            onClick={() => useStore.getState().toggleGirlShelfLed()}
          >
            <B
              p={[0, 2.84, 0.05]}
              s={[5.05, 0.028, 0.05]}
              c="#f6e9d4"
              emissive="#ebd2ab"
              ei={girlShelfLedOn ? 2.4 : 0.15}
              shadow={false}
            />
          </Interact>

          {/* Mảng hắt sáng Champagne dịu dàng trên tường */}
          {girlShelfLedOn && (
            <mesh position={[0, 2.6, 0.01]}>
              <planeGeometry args={[5.2, 0.95]} />
              <meshBasicMaterial color="#ebd2ab" transparent opacity={0.14} depthWrite={false} />
            </mesh>
          )}

          {/* Sách xếp tone trung tính đồng bộ (linen, cát, taupe, olive, đá xám) trên tầng kệ trên */}
          <group position={[-1.75, 2.935, 0]}>
            {[
              { dx: -0.28, h: 0.26, c: '#f2ede4' },
              { dx: -0.22, h: 0.28, c: '#dfd8cc' },
              { dx: -0.16, h: 0.25, c: '#b8ae9f' },
              { dx: -0.1, h: 0.29, c: '#8e8378' },
              { dx: -0.04, h: 0.26, c: '#616f5a' },
              { dx: 0.02, h: 0.27, c: '#4b5948' },
              { dx: 0.08, h: 0.24, c: '#5b6064' },
              { dx: 0.14, h: 0.28, c: '#3f4346' },
            ].map((bk, i) => (
              <BB key={i} p={[bk.dx, 0, 0]} s={[0.052, bk.h, 0.19]} c={bk.c} rough={0.62} />
            ))}
          </group>

          {/* Sách & đồ decor tone trung tính trên kệ dưới & kệ trên */}
          {[
            { x: -1.65, y: 2.435, colors: ['#cfc5b8', '#b8ae9f', '#8e8378', '#f2ede4'] },
            { x: -0.65, y: 2.435, colors: ['#5b6064', '#6d7276', '#a89f92', '#dfd8cc'] },
            { x: 0.85, y: 2.435, colors: ['#5c6b58', '#b8ae9f', '#82766b', '#494e52'] },
            { x: 1.85, y: 2.435, colors: ['#9a8b82', '#c8beb0', '#5b6064', '#f2ede4'] },
            { x: -0.55, y: 2.935, colors: ['#b8ae9f', '#5c6b58', '#626c75'] },
            { x: 1.15, y: 2.935, colors: ['#7c746c', '#a89d90', '#dfd8cc'] },
          ].map((grp, gi) => (
            <group key={gi} position={[grp.x, grp.y, 0]}>
              {grp.colors.map((col, ci) => (
                <BB
                  key={ci}
                  p={[(ci - 1.5) * 0.062, 0, 0]}
                  s={[0.055, 0.23 + (ci % 2) * 0.03, 0.18]}
                  c={col}
                  rough={0.62}
                />
              ))}
            </group>
          ))}

          {/* 3 Chậu dây thường xuân (ivy) Olive xám dịu rủ xuống từ kệ sách */}
          {[-2.32, -0.05, 2.32].map((vx, i) => (
            <group key={i} position={[vx, 2.935, 0.06]}>
              <Cyl p={[0, 0.08, 0]} rt={0.085} rb={0.065} h={0.16} c="#f2ede4" />
              <Sph p={[0, 0.16, 0]} s={[0.13, 0.09, 0.12]} c="#3f4b3c" />
              {[
                { dy: -0.12, dx: -0.02, s: [0.09, 0.14, 0.06], col: '#4b5948' },
                { dy: -0.28, dx: 0.03, s: [0.085, 0.16, 0.06], col: '#586754' },
                { dy: -0.45, dx: -0.02, s: [0.075, 0.16, 0.05], col: '#677662' },
                { dy: -0.62, dx: 0.02, s: [0.06, 0.15, 0.045], col: '#758470' },
                { dy: -0.76, dx: -0.01, s: [0.045, 0.12, 0.04], col: '#586754' },
              ].map((leaf, j) => (
                <Sph
                  key={j}
                  p={[leaf.dx, leaf.dy, 0.06]}
                  s={leaf.s as V3}
                  c={leaf.col}
                  rough={0.7}
                />
              ))}
            </group>
          ))}
        </G>
      </Interact>

      {/* =====================================================================
       * D. BÀN HỌC, THẢM HỌA TIẾT NÂU ĐỎ & GHẾ XOAY CÔNG THÁI HỌC MÀU ĐEN
       * ===================================================================== */}
      {/* Thảm dệt họa tiết tông nâu đỏ dưới chân bàn học (nâng lên Y + 0.024 + polygonOffset) */}
      <mesh position={[2.25, Y + 0.024, -4.68]} receiveShadow>
        <boxGeometry args={[2.3, 0.02, 1.38]} />
        <meshStandardMaterial
          map={persianRugTex}
          roughness={0.92}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      <Interact
        hint="💻 Bàn máy tính Tầng 2"
        onClick={() => useStore.getState().startActivity('girl_pc', true)}
      >
        <G p={[2.25, Y, -5.2]}>
          {/* Mặt bàn gỗ sồi tro bo góc & 2 chân chữ U màu kem linen */}
          <RBB p={[0, 0.72, 0]} s={[1.62, 0.055, 0.78]} c="#b8ae9f" rough={0.55} radius={0.025} shadow />
          <BB p={[-0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#f2ede4" shadow />
          <BB p={[0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#f2ede4" shadow />
          {/* Vách chắn lửng 2 bên mặt bàn */}
          <RBB p={[-0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#f2ede4" radius={0.015} />
          <RBB p={[0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#f2ede4" radius={0.015} />

          {/* Màn hình rộng */}
          <G p={[0, 0.775, -0.18]}>
            <B p={[0, 0.01, 0]} s={[0.26, 0.02, 0.18]} c="#b8b2a8" metal={0.8} rough={0.22} />
            <B p={[0, 0.14, -0.04]} s={[0.05, 0.26, 0.03]} c="#8e887e" metal={0.8} rough={0.22} />
            <RB p={[0, 0.42, 0]} s={[1.18, 0.66, 0.035]} c="#252321" radius={0.015} shadow />
            <mesh position={[0, 0.42, 0.022]}>
              <planeGeometry args={[1.12, 0.6]} />
              {girlPcState === 'off' ? (
                <meshStandardMaterial
                  color="#141518"
                  roughness={0.2}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              ) : (
                <meshStandardMaterial
                  map={pcScreenTex}
                  emissive={girlPcState === 'rgb' ? '#c8d0d4' : '#e6d8c4'}
                  emissiveMap={pcScreenTex}
                  emissiveIntensity={girlPcState === 'rgb' ? 0.8 : 0.62}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              )}
            </mesh>
          </G>

          {/* 2 Loa & bàn phím */}
          <RBB p={[-0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#2b2926" radius={0.02} />
          <RBB p={[0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#2b2926" radius={0.02} />
          <RBB p={[0, 0.775, 0.12]} s={[0.38, 0.015, 0.13]} c="#f2ede4" radius={0.006} />

          {/* GHẾ XOAY CÔNG THÁI HỌC MÀU THAN ĐÁ */}
          <G p={[0, 0, 0.56]} r={[0, Math.PI + girlChairSpinTick * 0.4, 0]}>
            {/* Chân sao 5 cánh & bánh xe màu than mờ */}
            <Cyl p={[0, 0.22, 0]} rt={0.032} h={0.38} c="#262421" metal={0.75} rough={0.25} />
            {[0, 1, 2, 3, 4].map((ci) => {
              const ang = (ci * Math.PI * 2) / 5
              return (
                <B
                  key={ci}
                  p={[Math.sin(ang) * 0.16, 0.04, Math.cos(ang) * 0.16]}
                  r={[0, ang, 0]}
                  s={[0.035, 0.03, 0.32]}
                  c="#262421"
                />
              )
            })}
            {/* Đệm ngồi, tay vịn & tựa lưng than đá */}
            <RBB p={[0, 0.4, 0]} s={[0.52, 0.075, 0.5]} c="#2d2b28" rough={0.72} radius={0.03} shadow />
            <RBB p={[0, 0.47, -0.22]} s={[0.48, 0.58, 0.065]} c="#2d2b28" rough={0.72} radius={0.03} shadow />
            <RBB p={[-0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#262421" radius={0.015} />
            <RBB p={[0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#262421" radius={0.015} />
          </G>
        </G>
      </Interact>

      {/* =====================================================================
       * E. BÀN TRANG ĐIỂM GỖ SỒI TRO + KHAY NƯỚC HOA, MỸ PHẨM & BÌNH HOA TRUNG TÍNH
       * ===================================================================== */}
      <Interact
        hint="💄 Bàn trang điểm"
        onClick={() => useStore.getState().startActivity('girl_vanity', true)}
      >
        <G p={[4.95, Y, -5.16]}>
          {/* Bàn gỗ sồi tro bo góc & 2 ngăn kéo tay nắm Champagne Pewter */}
          <RBB p={[0, 0.62, 0]} s={[1.6, 0.13, 0.86]} c="#b8ae9f" rough={0.55} radius={0.03} shadow />
          <B p={[-0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#a69c8d" />
          <B p={[0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#a69c8d" />
          <Sph p={[-0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#a89e90" metal={0.8} rough={0.22} />
          <Sph p={[0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#a89e90" metal={0.8} rough={0.22} />

          {[-0.68, 0.68].map((lx, i) =>
            [-0.32, 0.32].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.31, lz]} rt={0.028} rb={0.018} h={0.62} c="#8c8274" shadow />
            )),
          )}

          {/* GƯƠNG TRÒN VIỀN LED CHAMPAGNE DỊU (Click trực tiếp để bật/tắt riêng) */}
          <Interact
            hint={girlVanityLightOn ? '✨ Tắt đèn gương Halo' : '✨ Bật đèn gương Halo'}
            onClick={() => {
              useStore.getState().toggleGirlVanityLight()
            }}
          >
            <G p={[0, 1.32, -0.24]}>
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.52} h={0.038} c="#b8ae9f" />
              <Cyl
                p={[0, 0, 0.016]}
                r={[Math.PI / 2, 0, 0]}
                rt={0.45}
                h={0.02}
                c="#d6cdc2"
                metal={0.22}
                rough={0.18}
              />
              {/* Viền Halo LED Champagne phát sáng dịu nhẹ */}
              <mesh position={[0, 0, 0.028]}>
                <torusGeometry args={[0.48, 0.032, 20, 64]} />
                <meshStandardMaterial
                  color="#f6e9d4"
                  emissive="#ebd2ab"
                  emissiveIntensity={girlVanityLightOn ? 2.6 : 0.25}
                />
              </mesh>
              {girlVanityLightOn && (
                <mesh position={[0, 0, 0.015]}>
                  <circleGeometry args={[0.58, 36]} />
                  <meshBasicMaterial color="#ebd2ab" transparent opacity={0.18} depthWrite={false} />
                </mesh>
              )}
            </G>
          </Interact>

          {/* 1. KHAY NƯỚC HOA VIỀN CHAMPAGNE PEWTER BÊN TRÁI MẶT BÀN */}
          <G p={[-0.48, 0.75, 0.06]}>
            <Cyl p={[0, 0.01, 0]} rt={0.19} rb={0.19} h={0.016} c="#a89e90" metal={0.8} rough={0.22} />
            <Cyl p={[0, 0.019, 0]} rt={0.175} rb={0.175} h={0.008} c="#f2ede4" metal={0.3} rough={0.15} />
            {/* 4 Chai nước hoa thủy tinh mờ trung tính */}
            <BB p={[-0.06, 0.022, -0.04]} s={[0.055, 0.11, 0.035]} c="#e4d8d2" rough={0.22} />
            <Sph p={[-0.06, 0.145, -0.04]} s={[0.02, 0.02, 0.02]} c="#a89e90" metal={0.8} rough={0.22} />
            <Cyl p={[0.05, 0.07, -0.03]} rt={0.032} h={0.095} c="#ebe2ce" rough={0.22} />
            <Cyl p={[0.05, 0.125, -0.03]} rt={0.014} h={0.025} c="#a89e90" metal={0.8} rough={0.22} />
            <Cyl p={[-0.02, 0.065, 0.06]} rt={0.028} h={0.08} c="#d3d5d8" rough={0.22} />
            <BB p={[0.06, 0.022, 0.05]} s={[0.042, 0.085, 0.042]} c="#dfd3c5" rough={0.22} />
          </G>

          {/* 2. HỘP ĐỰNG MỸ PHẨM CHIA NGĂN & CỌ TRANG ĐIỂM */}
          <G p={[0.38, 0.75, -0.02]}>
            <BB p={[0, 0, 0]} s={[0.28, 0.09, 0.18]} c="#f2ede4" rough={0.45} />
            <BB p={[0, 0.045, -0.04]} s={[0.26, 0.06, 0.08]} c="#cfc4b4" />
            {/* Các thỏi son tone gỗ hồng đất dịu */}
            {[-0.08, -0.03, 0.02].map((lx, li) => (
              <Cyl key={li} p={[lx, 0.09, 0.04]} rt={0.012} h={0.065} c={li === 0 ? '#96625c' : li === 1 ? '#a87169' : '#b5847d'} />
            ))}
            {/* Ống cắm cọ trang điểm */}
            <Cyl p={[0.08, 0.08, -0.03]} rt={0.032} h={0.11} c="#a89e90" metal={0.8} rough={0.22} />
            <Cyl p={[0.07, 0.15, -0.03]} r={[0, 0, 0.18]} rt={0.006} h={0.08} c="#e4dad0" />
            <Cyl p={[0.09, 0.15, -0.02]} r={[0, 0, -0.15]} rt={0.006} h={0.08} c="#dbd1c0" />
          </G>

          {/* 3. BÌNH HOA TULIP BE KEM BÊN PHẢI MẶT BÀN */}
          <G p={[0.58, 0.75, 0.14]}>
            <Cyl p={[0, 0.09, 0]} rt={0.052} rb={0.068} h={0.18} c="#f2ede4" rough={0.3} />
            {[
              { dx: -0.025, dz: 0.01, h: 0.25, col: '#dfd2cc', tilt: 0.14 },
              { dx: 0.025, dz: -0.01, h: 0.27, col: '#cbb8b0', tilt: -0.15 },
              { dx: 0, dz: 0.025, h: 0.24, col: '#f4f0e8', tilt: 0.08 },
              { dx: -0.015, dz: -0.025, h: 0.26, col: '#b89c94', tilt: -0.1 },
              { dx: 0.015, dz: 0.018, h: 0.28, col: '#e6dbd4', tilt: 0.05 },
            ].map((tl, ti) => (
              <group key={ti} position={[tl.dx, 0.14, tl.dz]} rotation={[0, 0, tl.tilt]}>
                <Cyl p={[0, tl.h / 2 - 0.06, 0]} rt={0.005} h={tl.h - 0.08} c="#4b5948" />
                <Sph p={[0, tl.h - 0.08, 0]} s={[0.026, 0.038, 0.026]} c={tl.col} rough={0.45} />
              </group>
            ))}
          </G>

          {/* Ghế đôn tròn màu linen ấm */}
          <Cyl p={[0, 0.22, 0.56]} rt={0.25} rb={0.25} h={0.44} c="#f2ede4" rough={0.9} shadow />
        </G>
      </Interact>

      {/* =====================================================================
       * F. TỦ QUẦN ÁO GỖ ÓC CHÓ XÁM CHẠM SÀN, 2 CÁNH KÍNH & ĐÈN LED CHAMPAGNE
       * ===================================================================== */}
      {canUseGirlWardrobe ? (
        <Interact
          hint="👗 Tủ quần áo Bạn Gái"
          onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
        >
          <G p={[7.65, Y, -5.25]}>
            {/* Khung vỏ tủ gỗ óc chó xám trầm chạm đúng mặt sàn tầng 2 */}
            <BB p={[0, 0, -0.52]} s={[2.05, 3.42, 0.06]} c="#36312d" rough={0.62} shadow />
            <RBB p={[-0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#36312d" rough={0.62} radius={0.02} shadow />
            <RBB p={[0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#36312d" rough={0.62} radius={0.02} shadow />
            <BB p={[0, 0, 0]} s={[2.05, 0.12, 1.08]} c="#282421" rough={0.6} />
            <BB p={[0, 3.32, 0]} s={[2.06, 0.1, 1.1]} c="#36312d" rough={0.6} shadow />
            <RBB p={[0, 3.42, 0.02]} s={[2.16, 0.1, 1.16]} c="#25221f" rough={0.55} radius={0.025} shadow />
            <BB p={[0, 0.12, -0.04]} s={[0.045, 3.2, 0.96]} c="#423c36" rough={0.65} />
            <BB p={[0, 0.12, -0.48]} s={[1.9, 3.2, 0.02]} c="#696056" rough={0.75} />

            <BB p={[0, 2.68, -0.02]} s={[1.92, 0.045, 0.96]} c="#4c453e" />
            <BB p={[0, 0.96, -0.02]} s={[1.92, 0.045, 0.96]} c="#4c453e" />
            <BB p={[0, 0.52, -0.02]} s={[1.92, 0.04, 0.96]} c="#4c453e" />

            <BB p={[-0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#eae4da" rough={0.85} />
            <BB p={[0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#d8d1c5" rough={0.85} />

            <Cyl p={[-0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#a89e90" metal={0.8} rough={0.22} />
            <Cyl p={[0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#a89e90" metal={0.8} rough={0.22} />
            {[
              { x: -0.72, h: 1.15, c: '#8c7a6b' },
              { x: -0.5, h: 1.25, c: '#eae4da' },
              { x: -0.28, h: 1.05, c: '#6f7b6d' },
              { x: 0.28, h: 1.2, c: '#f2ede4' },
              { x: 0.5, h: 1.1, c: '#b8ae9f' },
              { x: 0.72, h: 1.22, c: '#d8d0c4' },
            ].map((cl, idx) => (
              <BB
                key={idx}
                p={[cl.x, 2.48 - cl.h, 0.02]}
                s={[0.16, cl.h, 0.46]}
                c={cl.c}
                rough={0.82}
              />
            ))}

            <BB p={[-0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#cfc6b8" />
            <BB p={[0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#bab0a2" />
            <BB p={[-0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#786d60" />
            <BB p={[0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#8c8072" />

            {[-0.48, 0.48].map((lx, idx) => (
              <group key={idx}>
                <B
                  p={[lx, 3.26, 0.22]}
                  s={[0.82, 0.025, 0.04]}
                  c="#f6e9d4"
                  emissive="#ebd2ab"
                  ei={2.2}
                  shadow={false}
                />
                <B
                  p={[lx, 2.64, 0.22]}
                  s={[0.82, 0.025, 0.04]}
                  c="#f6e9d4"
                  emissive="#ebd2ab"
                  ei={2.2}
                  shadow={false}
                />
                <B
                  p={[lx, 0.93, 0.22]}
                  s={[0.82, 0.02, 0.04]}
                  c="#f6e9d4"
                  emissive="#ebd2ab"
                  ei={1.9}
                  shadow={false}
                />
              </group>
            ))}

            {[-0.48, 0.48].map((dx, side) => (
              <group key={side} position={[dx, 0.12, 0.52]}>
                <BB p={[-0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#36312d" />
                <BB p={[0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#36312d" />
                <BB p={[0, 0, 0]} s={[0.95, 0.08, 0.04]} c="#36312d" />
                <BB p={[0, 3.12, 0]} s={[0.95, 0.08, 0.04]} c="#36312d" />
                <mesh position={[0, 1.6, 0]} material={glassMat}>
                  <boxGeometry args={[0.82, 3.04, 0.018]} />
                </mesh>
                <BB
                  p={[side === 0 ? 0.38 : -0.38, 1.35, 0.03]}
                  s={[0.022, 0.48, 0.025]}
                  c="#a89e90"
                  metal={0.8}
                  rough={0.22}
                />
              </group>
            ))}
          </G>
        </Interact>
      ) : (
        <G p={[7.65, Y, -5.25]}>
          {/* Khung vỏ tủ gỗ óc chó xám trầm chạm đúng mặt sàn tầng 2 */}
          <BB p={[0, 0, -0.52]} s={[2.05, 3.42, 0.06]} c="#36312d" rough={0.62} shadow />
          <RBB p={[-0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#36312d" rough={0.62} radius={0.02} shadow />
          <RBB p={[0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#36312d" rough={0.62} radius={0.02} shadow />
          <BB p={[0, 0, 0]} s={[2.05, 0.12, 1.08]} c="#282421" rough={0.6} />
          <BB p={[0, 3.32, 0]} s={[2.06, 0.1, 1.1]} c="#36312d" rough={0.6} shadow />
          <RBB p={[0, 3.42, 0.02]} s={[2.16, 0.1, 1.16]} c="#25221f" rough={0.55} radius={0.025} shadow />
          <BB p={[0, 0.12, -0.04]} s={[0.045, 3.2, 0.96]} c="#423c36" rough={0.65} />
          <BB p={[0, 0.12, -0.48]} s={[1.9, 3.2, 0.02]} c="#696056" rough={0.75} />

          <BB p={[0, 2.68, -0.02]} s={[1.92, 0.045, 0.96]} c="#4c453e" />
          <BB p={[0, 0.96, -0.02]} s={[1.92, 0.045, 0.96]} c="#4c453e" />
          <BB p={[0, 0.52, -0.02]} s={[1.92, 0.04, 0.96]} c="#4c453e" />

          <BB p={[-0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#eae4da" rough={0.85} />
          <BB p={[0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#d8d1c5" rough={0.85} />

          <Cyl p={[-0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#a89e90" metal={0.8} rough={0.22} />
          <Cyl p={[0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#a89e90" metal={0.8} rough={0.22} />
          {[
            { x: -0.72, h: 1.15, c: '#8c7a6b' },
            { x: -0.5, h: 1.25, c: '#eae4da' },
            { x: -0.28, h: 1.05, c: '#6f7b6d' },
            { x: 0.28, h: 1.2, c: '#f2ede4' },
            { x: 0.5, h: 1.1, c: '#b8ae9f' },
            { x: 0.72, h: 1.22, c: '#d8d0c4' },
          ].map((cl, idx) => (
            <BB
              key={idx}
              p={[cl.x, 2.48 - cl.h, 0.02]}
              s={[0.16, cl.h, 0.46]}
              c={cl.c}
              rough={0.82}
            />
          ))}

          <BB p={[-0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#cfc6b8" />
          <BB p={[0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#bab0a2" />
          <BB p={[-0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#786d60" />
          <BB p={[0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#8c8072" />

          {[-0.48, 0.48].map((lx, idx) => (
            <group key={idx}>
              <B
                p={[lx, 3.26, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#f6e9d4"
                emissive="#ebd2ab"
                ei={2.2}
                shadow={false}
              />
              <B
                p={[lx, 2.64, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#f6e9d4"
                emissive="#ebd2ab"
                ei={2.2}
                shadow={false}
              />
              <B
                p={[lx, 0.93, 0.22]}
                s={[0.82, 0.02, 0.04]}
                c="#f6e9d4"
                emissive="#ebd2ab"
                ei={1.9}
                shadow={false}
              />
            </group>
          ))}

          {[-0.48, 0.48].map((dx, side) => (
            <group key={side} position={[dx, 0.12, 0.52]}>
              <BB p={[-0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#36312d" />
              <BB p={[0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#36312d" />
              <BB p={[0, 0, 0]} s={[0.95, 0.08, 0.04]} c="#36312d" />
              <BB p={[0, 3.12, 0]} s={[0.95, 0.08, 0.04]} c="#36312d" />
              <mesh position={[0, 1.6, 0]} material={glassMat}>
                <boxGeometry args={[0.82, 3.04, 0.018]} />
              </mesh>
              <BB
                p={[side === 0 ? 0.38 : -0.38, 1.35, 0.03]}
                s={[0.022, 0.48, 0.025]}
                c="#a89e90"
                metal={0.8}
                rough={0.22}
              />
            </group>
          ))}
        </G>
      )}

      {/* =====================================================================
       * G. GÓC ĐỌC SÁCH SÁT LAN CAN KÍNH BÊN PHẢI (THẢM NÂU, GHẾ DA, BỘ ẤM TRÀ & BÁNH NGỌT, KỆ TẠP CHÍ & MÈO NHỎ NẰM NGỦ)
       * ===================================================================== */}
      <G p={[6.55, Y, -1.28]}>
        {/* 1. Tấm thảm dệt họa tiết tông nâu ấm trải dọc sát lan can kính (y = 0.024 + polygonOffset) */}
        <mesh position={[0, 0.024, 0]} receiveShadow>
          <boxGeometry args={[3.75, 0.02, 1.75]} />
          <meshStandardMaterial
            map={persianRugTex}
            roughness={0.92}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* 2. Ghế bành bọc da màu Taupe khói (Smoked Taupe Leather Armchair) bo góc mềm mại */}
        <Interact
          hint="🪑 Ghế đọc sách"
          onClick={() => useStore.getState().startActivity('girl_nook', true)}
        >
          <G p={[1.18, 0, -0.08]} r={[0, -0.68, 0]}>
            {[-0.36, 0.36].map((lx, i) =>
              [-0.34, 0.34].map((lz, j) => (
                <Cyl key={`${i}-${j}`} p={[lx, 0.12, lz]} rt={0.026} rb={0.016} h={0.24} c="#2c2824" />
              )),
            )}
            <RBB p={[0, 0.22, 0]} s={[0.88, 0.18, 0.84]} c="#66584b" rough={0.54} radius={0.04} shadow />
            <RBB p={[0, 0.38, 0.03]} s={[0.72, 0.12, 0.72]} c="#756658" rough={0.52} radius={0.04} />
            <RBB p={[0, 0.42, -0.34]} r={[-0.18, 0, 0]} s={[0.84, 0.62, 0.16]} c="#66584b" rough={0.54} radius={0.04} shadow />
            <RBB p={[0, 0.48, -0.27]} r={[-0.18, 0, 0]} s={[0.72, 0.26, 0.1]} c="#7a6b5c" rough={0.52} radius={0.03} />
            <RBB p={[0, 0.76, -0.32]} r={[-0.18, 0, 0]} s={[0.72, 0.24, 0.1]} c="#7a6b5c" rough={0.52} radius={0.03} />
            <RBB p={[-0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#706153" rough={0.52} radius={0.03} />
            <RBB p={[0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#706153" rough={0.52} radius={0.03} />
          </G>
        </Interact>

        {/* 3. Đôn gác chân (Ottoman) bọc da Taupe khói bo góc êm ái */}
        <G p={[-0.95, 0, -0.05]} r={[0, 0.25, 0]}>
          {[-0.26, 0.26].map((lx, i) =>
            [-0.2, 0.2].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.1, lz]} rt={0.022} rb={0.015} h={0.2} c="#2c2824" />
            )),
          )}
          <RBB p={[0, 0.18, 0]} s={[0.68, 0.18, 0.54]} c="#6b5d4f" rough={0.52} radius={0.04} shadow />
          <RBB p={[0, 0.34, 0]} s={[0.64, 0.06, 0.5]} c="#78695a" rough={0.5} radius={0.03} />
        </G>

        {/* 4. Bàn trà tròn bằng gỗ + BỘ ẤM TRÀ SỨ & ĐĨA BÁNH NGỌT TRUNG TÍNH */}
        <G p={[0.08, 0, 0.12]}>
          <Cyl p={[0, 0.44, 0]} rt={0.38} rb={0.38} h={0.04} c="#696056" rough={0.55} />
          {[0, 1, 2].map((li) => {
            const ang = (li * Math.PI * 2) / 3 + 0.4
            return (
              <Cyl
                key={li}
                p={[Math.cos(ang) * 0.2, 0.22, Math.sin(ang) * 0.2]}
                rt={0.02}
                rb={0.014}
                h={0.44}
                c="#4c453e"
              />
            )
          })}
          {/* Ấm trà sứ ngà & nắp Champagne Pewter */}
          <Sph p={[-0.1, 0.52, -0.06]} s={[0.075, 0.065, 0.075]} c="#f4f0e8" rough={0.28} />
          <Sph p={[-0.1, 0.585, -0.06]} s={[0.02, 0.018, 0.02]} c="#a89e90" metal={0.78} />
          <Cyl p={[-0.03, 0.53, -0.06]} r={[0, 0, -0.8]} rt={0.012} rb={0.018} h={0.07} c="#f4f0e8" />
          {/* 2 Tách trà nhỏ trên đĩa lót */}
          <Cyl p={[0.06, 0.466, -0.1]} rt={0.052} rb={0.045} h={0.01} c="#ebe5db" />
          <Cyl p={[0.06, 0.495, -0.1]} rt={0.034} rb={0.028} h={0.052} c="#f4f0e8" rough={0.28} />
          <Cyl p={[-0.14, 0.466, 0.1]} rt={0.052} rb={0.045} h={0.01} c="#ebe5db" />
          <Cyl p={[-0.14, 0.495, 0.1]} rt={0.034} rb={0.028} h={0.052} c="#f4f0e8" rough={0.28} />
          {/* Đĩa bánh ngọt / Macaron tone pastel trầm dịu */}
          <Cyl p={[0.1, 0.468, 0.09]} rt={0.1} rb={0.085} h={0.014} c="#f2ede4" rough={0.25} />
          <Sph p={[0.07, 0.49, 0.07]} s={[0.028, 0.018, 0.028]} c="#dfd2cc" />
          <Sph p={[0.13, 0.49, 0.08]} s={[0.028, 0.018, 0.028]} c="#ebe2ce" />
          <Sph p={[0.09, 0.49, 0.13]} s={[0.028, 0.018, 0.028]} c="#b8c2b4" />
          <Cyl p={[0.1, 0.505, 0.04]} rt={0.032} rb={0.028} h={0.042} c="#d8cbb8" />
          <Sph p={[0.1, 0.532, 0.04]} s={[0.018, 0.018, 0.018]} c="#966e65" />
        </G>

        {/* 5. KỆ TẠP CHÍ NHỎ BẰNG GỖ SỒI TRO & DA ĐẶT CẠNH GHẾ BÀNH */}
        <G p={[1.68, 0, -0.52]} r={[0, -0.45, 0]}>
          {[-0.18, 0.18].map((mx, mi) => (
            <group key={mi} position={[mx, 0, 0]}>
              <Cyl p={[0, 0.22, 0]} r={[0.38, 0, 0]} rt={0.014} h={0.48} c="#696056" />
              <Cyl p={[0, 0.22, 0]} r={[-0.38, 0, 0]} rt={0.014} h={0.48} c="#696056" />
            </group>
          ))}
          <B p={[0, 0.24, 0]} s={[0.34, 0.18, 0.22]} c="#b8ae9f" rough={0.8} />
          {/* Các cuốn tạp chí bìa tối giản nhô lên */}
          <B p={[-0.04, 0.31, -0.03]} r={[0.25, 0, 0]} s={[0.22, 0.24, 0.018]} c="#8e766b" />
          <B p={[0.04, 0.32, 0.03]} r={[-0.22, 0, 0]} s={[0.22, 0.25, 0.018]} c="#6b7882" />
          <B p={[0, 0.33, 0]} r={[0.1, 0, 0]} s={[0.22, 0.24, 0.018]} c="#cfc4b4" />
        </G>

        {/* 6. CHÚ MÈO NHỎ NẰM NGỦ TRÊN THẢM (SLEEPING KITTEN) */}
        <SleepingCat p={[-0.34, 0.034, -0.36]} />

        {/* 7. Cây đèn sàn (Floor Lamp) chụp trụ linen phát sáng Champagne ở góc phải: Click bật/tắt riêng */}
        <Interact
          hint={floor2ReadingLampOn ? '💡 Tắt đèn cây đọc sách' : '💡 Bật đèn cây đọc sách'}
          onClick={() => useStore.getState().toggleFloor2ReadingLamp()}
        >
          <G p={[2.18, 0, 0.42]}>
            <Cyl p={[0, 0.025, 0]} rt={0.22} rb={0.24} h={0.05} c="#262421" metal={0.75} rough={0.25} />
            <Cyl p={[0, 0.78, 0]} rt={0.02} rb={0.024} h={1.5} c="#262421" metal={0.75} rough={0.25} />
            <Cyl
              p={[0, 1.56, 0]}
              rt={0.23}
              rb={0.26}
              h={0.42}
              c="#f6e9d4"
              emissive="#ebd2ab"
              ei={floor2ReadingLampOn ? 2.2 : 0.15}
            />
            {floor2ReadingLampOn && (
              <mesh position={[0, 1.45, 0]}>
                <sphereGeometry args={[0.3, 16, 12]} />
                <meshBasicMaterial color="#ebd2ab" transparent opacity={0.16} depthWrite={false} />
              </mesh>
            )}
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * H. TỦ GỖ NHỎ ĐẦU CẦU THANG & GHẾ BĂNG DÀI BỌC NỆM LINEN ÁP SÁT TƯỜNG TRÁI
       * ===================================================================== */}
      <G p={[-7.32, Y, 1.55]}>
        <RBB p={[0, 0, 0]} s={[0.62, 0.84, 1.12]} c="#b8ae9f" rough={0.58} radius={0.03} shadow />
        <B p={[0, 0.42, 0]} s={[0.64, 0.025, 1.08]} c="#9c9283" />
        <Cyl p={[0, 0.91, 0]} rt={0.11} rb={0.085} h={0.14} c="#f2ede4" />
        <Sph p={[0, 1.04, 0]} s={[0.15, 0.12, 0.15]} c="#4b5948" />
      </G>

      {/* Ghế băng dài bọc nệm linen kèm gối tựa taupe hồng đất dịu áp sát tường bên trái */}
      <G p={[-9.52, Y, -2.7]} r={[0, Math.PI / 2, 0]}>
        {/* Đế gỗ sồi tro & thân ghế băng bọc nệm Bouclé bo góc */}
        <RBB p={[0, 0, 0]} s={[1.86, 0.08, 0.54]} c="#b8ae9f" rough={0.55} radius={0.02} shadow />
        <RBB p={[0, 0.08, 0]} s={[1.82, 0.3, 0.52]} c="#ebe5da" rough={0.92} radius={0.035} shadow />
        <RBB p={[0, 0.38, 0]} s={[1.86, 0.09, 0.55]} c="#f4f0e8" rough={0.9} radius={0.03} />
        {/* 2 Tay vịn cuộn tròn hai đầu ghế băng */}
        <Cyl p={[-0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#e4ddd2" rough={0.9} />
        <Cyl p={[0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#e4ddd2" rough={0.9} />
        {/* 3 Gối tựa màu taupe đất dịu (Muted Rosewood / Taupe) dựa vào tường trái */}
        <RBB p={[-0.48, 0.47, -0.14]} r={[0.22, 0.08, 0]} s={[0.42, 0.28, 0.14]} c="#96837c" rough={0.9} radius={0.035} />
        <RBB p={[0, 0.47, -0.15]} r={[0.2, 0, 0]} s={[0.4, 0.26, 0.14]} c="#a8958e" rough={0.9} radius={0.035} />
        <RBB p={[0.48, 0.47, -0.14]} r={[0.22, -0.08, 0]} s={[0.42, 0.28, 0.14]} c="#7e6e68" rough={0.9} radius={0.035} />
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
function GirlfriendAvatar({ hideIfUpstairs: _hideIfUpstairs }: { hideIfUpstairs?: boolean } = {}) {
  const root = useRef<THREE.Group>(null)
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
  const autoIdleTimer = useRef(1.8)
  const autoSeqIdx = useRef(0)
  const lastSpinTick = useRef(girlOutfitSpinTick)
  const spinUntil = useRef(0)
  const lastPosBroadcast = useRef(0)

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
    const st = useStore.getState()

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

    if ((moveX !== 0 || moveZ !== 0) && st.girlActivity !== 'idle') {
      st.startActivity('idle', true, 'girl')
      return
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

    // 1. Chế độ Đứng/Đi bộ tự do đa tầng (Tầng 2 <-> Cầu thang <-> Tầng 1)
    if (st.girlActivity === 'idle') {
      walkWatchdog.current = 0
      let moving = false
      if (isControllingGirl && (moveX !== 0 || moveZ !== 0 || st.avatarTarget)) {
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
        if (moving) autoIdleTimer.current = 4.0
      } else if (st.girlAutoLife) {
        autoIdleTimer.current -= delta
        if (autoIdleTimer.current <= 0) {
          const nextAct = AUTO_SEQUENCE_GIRL[autoSeqIdx.current % AUTO_SEQUENCE_GIRL.length]
          autoSeqIdx.current += 1
          autoIdleTimer.current = 1.6
          if (nextAct === 'pet') {
            st.petDog(autoSeqIdx.current % 2 === 0 ? 'bo' : 'mochi', false, 'girl')
          } else {
            st.startActivity(nextAct, false, 'girl')
          }
          return
        }
      } else {
        walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
      }

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

        const maxDur = AUTO_DURATION[st.girlActivity]
        const isOneShot =
          st.girlActivity === 'drink' ||
          st.girlActivity === 'darts' ||
          st.girlActivity === 'feed'
        if (phaseTimer.current >= maxDur) {
          if (st.isUserInitiated && isOneShot && st.activeChar === 'girl') {
            st.returnOverview()
            return
          } else if (st.girlAutoLife) {
            const nextAct = AUTO_SEQUENCE_GIRL[autoSeqIdx.current % AUTO_SEQUENCE_GIRL.length]
            autoSeqIdx.current += 1
            if (nextAct === 'pet') {
              st.petDog(autoSeqIdx.current % 2 === 0 ? 'bo' : 'mochi', false, 'girl')
            } else {
              st.startActivity(nextAct, false, 'girl')
            }
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
    const isGirlSleeping = (st.girlActivity === 'sleep' || st.girlActivity === 'girl_sleep') && st.girlPhase === 'active'
    if (isGirlSleeping) {
      root.current.rotation.x = -Math.PI / 2
      root.current.rotation.y = -0.05
      root.current.rotation.z = 0
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

    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, headX, k)
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, headY, k)
      head.current.visible = !(st.mode === 'fp' && isControllingGirl)
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
      (st.girlActivity === 'sleep' || st.girlActivity === 'girl_sleep') && st.girlPhase === 'active'
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
  })

  const userRole = useStore((s) => s.userRole)
  const roleOccupancy = useStore((s) => s.roleOccupancy)
  const isGirlClaimed = userRole === 'girl' || Boolean(roleOccupancy?.girl)
  const canControlGirl = !userRole || userRole === 'girl'
  // Bạn Gái chỉ ẩn thân xác khi chính người chơi này đang vào vai Bạn Gái và ở góc nhìn thứ nhất (FP)
  const hideInFp = useStore((s) => s.mode === 'fp') && userRole === 'girl'
  const girlPhase = useStore((s) => s.girlPhase)
  const sleeping = girlActivity === 'sleep' || girlActivity === 'girl_sleep'
  const isGirlSleepingNow = sleeping && girlPhase === 'active'

  return (
    <group
      ref={root}
      position={[-3.9, Y, -0.35]}
      visible={!hideInFp}
      onClick={
        canControlGirl
          ? (e) => {
              e.stopPropagation()
              useStore.getState().setActiveChar('girl')
            }
          : undefined
      }
      onPointerOver={
        canControlGirl
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        canControlGirl
          ? () => {
              document.body.style.cursor = 'auto'
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
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} />
        <group ref={leftKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f2ede4" />
        </group>
      </group>
      <group ref={rightLeg} position={[0.08, 0.56, 0]}>
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} />
        <group ref={rightKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f2ede4" />
        </group>
      </group>

      {/* Chân váy / Đầm */}
      <Cyl p={[0, 0.66, 0]} rt={0.14} rb={0.2} h={0.32} c={outfit.skirt} rough={0.85} />

      {/* Thân áo */}
      <Cyl p={[0, 0.96, 0]} rt={0.135} rb={0.14} h={0.38} c={outfit.jacket} rough={0.8} />
      <B p={[0, 0.97, 0.115]} s={[0.1, 0.34, 0.05]} c={outfit.inner} />

      {/* Tay trái */}
      <group ref={leftArm} position={[-0.18, 1.1, 0]}>
        <Cyl p={[0, -0.18, 0]} rt={0.042} rb={0.036} h={0.36} c={outfit.jacket} />
        <Sph p={[0, -0.38, 0]} s={[0.042, 0.042, 0.042]} c={SKIN} />
      </group>

      {/* Tay phải + Đạo cụ cốc nước / điều khiển TV */}
      <group ref={rightArm} position={[0.18, 1.1, 0]}>
        <Cyl p={[0, -0.18, 0]} rt={0.042} rb={0.036} h={0.36} c={outfit.jacket} />
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
        <Sph p={[0, 0, 0]} s={[0.175, 0.185, 0.175]} c={SKIN} rough={0.65} />
        <Sph p={[0, 0.05, -0.02]} s={[0.19, 0.18, 0.19]} c={HAIR} />
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
