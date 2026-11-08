import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Sph } from './prims'
import { GlassCurtainWall } from './GlassCurtainWall'
import {
  AUTO_DURATION,
  AUTO_SEQUENCE_GIRL,
  computeCharActivityPose,
  getStationEntryForChar,
  stepCharacterWalk,
} from './Characters'
import {
  colorfulBedArt,
  fluffyCreamRug,
  girlPcScreen,
  lightOakFloor,
  openBookPages,
  persianTerracottaRug,
  windowSky,
} from './textures'
import { useStore, type Activity } from '../store'
import {
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
  const viewPreset = useStore((s) => s.viewPreset)
  const isFloor1 = viewPreset === 'floor1'

  return (
    <group>
      {!isFloor1 && (
        <>
          <FloorAndBeams />
          <WallsAndDoor />
          <GirlRoomFurniture />
        </>
      )}
      <IndoorStaircase />
      <GirlfriendAvatar hideIfUpstairs={isFloor1} />
    </group>
  )
}

/* ============================================================================
 * 1. SÀN GỖ SỒI THẲNG, HỆ DẦM & LAN CAN KÍNH TAY VỊN SỒI (HỖ TRỢ CLICK ĐI BỘ)
 * ============================================================================ */
function FloorAndBeams() {
  const darkMode = useStore((s) => s.darkMode)
  const Y = FLOOR2_Y

  const oakMap1 = useMemo(() => {
    const t = lightOakFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 2.7)
    t.needsUpdate = true
    return t
  }, [])

  const oakMap2 = useMemo(() => {
    const t = lightOakFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.2, 2.0)
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
      {/* 1. Mảng sàn chính Tầng 2 (x: -10 -> +10, z: -6.0 -> +0.18; mặt trên khối kết cấu hạ xuống Y - 0.03 chống Z-fighting tuyệt đối) */}
      <B
        p={[0, Y - 0.135, -2.91]}
        s={[20.0, 0.21, 6.18]}
        c={darkMode ? '#3d3126' : '#d2b998'}
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
          roughness={0.52}
          color={darkMode ? '#cbb8a3' : '#ffffff'}
        />
      </mesh>

      {/* 2. Mảng sàn khu vực giường & ghế lười phía trước-trái (x: -7.7 -> -1.2, z: +0.22 -> +4.8; tách rời không chồng lấn) */}
      <B
        p={[-4.45, Y - 0.135, 2.51]}
        s={[6.5, 0.21, 4.58]}
        c={darkMode ? '#3d3126' : '#d2b998'}
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
          roughness={0.52}
          color={darkMode ? '#cbb8a3' : '#ffffff'}
        />
      </mesh>

      {/* --- LAN CAN KÍNH TRONG SUỐT TAY VỊN GỖ SỒI --- */}
      {/* 1. Lan can ngang mép hành lang thông tầng (x từ -1.2 đến +9.9, tại z = 0.18) */}
      <G p={[4.35, Y, 0.18]}>
        <BB p={[0, 0.86, 0]} s={[11.1, 0.045, 0.065]} c="#c89d6c" rough={0.4} />
        <BB p={[0, 0.0, 0]} s={[11.1, 0.035, 0.05]} c="#b88c5a" rough={0.5} />
        <B
          p={[0, 0.44, 0]}
          s={[10.95, 0.82, 0.016]}
          c="#f8fafc"
          opacity={0.22}
          rough={0.04}
          metal={0.1}
          shadow={false}
        />
        {[-5.4, -3.2, -1.0, 1.2, 3.4, 5.4].map((px, i) => (
          <B key={i} p={[px, 0.12, 0]} s={[0.04, 0.2, 0.04]} c="#64748b" metal={0.7} />
        ))}
      </G>

      {/* 2. Lan can dọc mép thông tầng bên trái (x = -1.2, z từ 0.18 đến 4.8) */}
      <G p={[-1.2, Y, 2.5]}>
        <BB p={[0, 0.86, 0]} s={[0.065, 0.045, 4.6]} c="#c89d6c" rough={0.4} />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 4.6]} c="#b88c5a" rough={0.5} />
        <B
          p={[0, 0.44, 0]}
          s={[0.016, 0.82, 4.5]}
          c="#f8fafc"
          opacity={0.22}
          rough={0.04}
          metal={0.1}
          shadow={false}
        />
        {[-1.8, 0, 1.8].map((pz, i) => (
          <B key={i} p={[0, 0.12, pz]} s={[0.04, 0.2, 0.04]} c="#64748b" metal={0.7} />
        ))}
      </G>

      {/* 3. Lan can bảo vệ ô cầu thang (tại x = -7.72, z từ 0.45 đến 4.8) */}
      <G p={[-7.72, Y, 2.62]}>
        <BB p={[0, 0.86, 0]} s={[0.065, 0.045, 4.35]} c="#c89d6c" rough={0.4} />
        <BB p={[0, 0.0, 0]} s={[0.05, 0.035, 4.35]} c="#b88c5a" rough={0.5} />
        <B
          p={[0, 0.44, 0]}
          s={[0.016, 0.82, 4.25]}
          c="#f8fafc"
          opacity={0.22}
          rough={0.04}
          metal={0.1}
          shadow={false}
        />
        {[-1.6, 0, 1.6].map((pz, i) => (
          <B key={i} p={[0, 0.12, pz]} s={[0.04, 0.2, 0.04]} c="#64748b" metal={0.7} />
        ))}
      </G>
    </group>
  )
}

/* ============================================================================
 * 2. VÁCH TƯỜNG, LAM GỖ PHÂN KHU & CỬA SỔ KÍNH RÈM VOAN TRẮNG RỦ MỀM XUỐNG SÀN
 * ============================================================================ */
function WallsAndDoor() {
  const darkMode = useStore((s) => s.darkMode)
  const cutWalls = useStore((s) => s.cutWalls)
  const Y = FLOOR2_Y
  const H2 = 4.2
  const skyMap = useMemo(() => windowSky(darkMode), [darkMode])
  const extWallColor = darkMode ? '#3a342e' : '#dfd5c7'

  return (
    <group>
      {/* 1. Tường sau Tầng 2: Thay thế bằng Vách kính hiện đại khi camera xoay ra phía sau */}
      {!cutWalls.back ? (
        <>
          <B
            p={[0, Y - 0.12 + (H2 + 0.12) / 2, -6.14]}
            s={[20.48, H2 + 0.12, 0.2]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />

          {/* Lớp sơn mặt trong cánh trái (Khu giường ngủ: x từ -10.0 đến -1.05) */}
          <B
            p={[-5.525, Y + H2 / 2, -6.01]}
            s={[8.95, H2, 0.04]}
            c={darkMode ? '#4a3b36' : '#e2cfc2'}
            rough={0.9}
            shadow={false}
            polyOffset
          />

          {/* 2. Vách lam gỗ sồi thẳng đứng phân khu (ốp nổi mặt trong tại z = -5.96) */}
          <G p={[-1.05, Y, -5.96]}>
            <B p={[0, H2 / 2, 0]} s={[1.45, H2, 0.05]} c="#c89b6e" rough={0.6} shadow={false} polyOffset />
            {Array.from({ length: 15 }, (_, i) => {
              const lx = -0.64 + (i / 14) * 1.28
              return <B key={i} p={[lx, H2 / 2, 0.035]} s={[0.048, H2 - 0.04, 0.045]} c="#b08254" rough={0.55} shadow={false} polyOffset />
            })}
          </G>

          {/* 3. Lớp sơn mặt trong cánh phải (Khu bàn học, bàn trang điểm & tủ đồ: x từ -1.05 đến +10.0) */}
          <B
            p={[4.475, Y + H2 / 2, -6.01]}
            s={[11.05, H2, 0.04]}
            c={darkMode ? '#354337' : '#859683'}
            rough={0.9}
            shadow={false}
            polyOffset
          />

          {/* Phào chỉ trần nhà màu trắng kem chạy dọc phía trên tường */}
          <B p={[0, Y + H2 - 0.08, -5.95]} s={[20.0, 0.16, 0.08]} c="#f8f5f0" shadow={false} polyOffset />
        </>
      ) : (
        <GlassCurtainWall pos={[0, Y + H2 / 2, -6.04]} size={[20.48, H2]} orientation="z" numPanels={6} />
      )}

      {/* 4. Tường bên trái Tầng 2: Thay thế bằng Vách kính hiện đại khi camera nhìn sang trái */}
      {!cutWalls.left ? (
        <>
          <B
            p={[-10.14, Y - 0.12 + (H2 + 0.12) / 2, -0.66]}
            s={[0.2, H2 + 0.12, 11.16]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />
          <B
            p={[-10.01, Y + H2 / 2, -0.6]}
            s={[0.04, H2, 10.8]}
            c={darkMode ? '#52443c' : '#e2cfc2'}
            rough={0.9}
            shadow={false}
            polyOffset
          />
          {/* Cửa đôi màu trắng ốp mặt trong tường trái chạm sát sàn Y */}
          <G p={[-9.95, Y, -2.9]}>
            <BB p={[0, 0, 0]} s={[0.05, 3.45, 3.36]} c="#f8f6f2" rough={0.7} shadow={false} polyOffset />
            <B p={[0.03, 1.72, 0]} s={[0.02, 3.35, 0.04]} c="#dcd7d0" shadow={false} polyOffset />
            <B p={[0.04, 1.5, -0.1]} s={[0.025, 0.26, 0.025]} c="#64748b" metal={0.8} shadow={false} />
            <B p={[0.04, 1.5, 0.1]} s={[0.025, 0.26, 0.025]} c="#64748b" metal={0.8} shadow={false} />
          </G>

          {/* 2 Khung tranh nghệ thuật tối giản bên cạnh cửa trái */}
          <G p={[-9.96, Y + 2.2, 0.8]} r={[0, Math.PI / 2, 0]}>
            <B p={[-0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#e2d4c0" shadow={false} polyOffset />
            <B p={[-0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#ffffff" shadow={false} polyOffset />
            <Sph p={[-0.45, 0, 0.025]} s={[0.16, 0.24, 0.01]} c="#15803d" />

            <B p={[0.45, 0, 0]} s={[0.62, 0.84, 0.03]} c="#e2d4c0" shadow={false} polyOffset />
            <B p={[0.45, 0, 0.014]} s={[0.54, 0.76, 0.015]} c="#ffffff" shadow={false} polyOffset />
            <Sph p={[0.45, 0, 0.025]} s={[0.17, 0.2, 0.01]} c="#ca8a04" />
          </G>
        </>
      ) : (
        <GlassCurtainWall pos={[-10.04, Y + H2 / 2, -0.66]} size={[11.16, H2]} orientation="x" numPanels={4} />
      )}

      {/* Cây Bàng Singapore ở góc tường bên trái */}
      <G p={[-9.15, Y, -4.85]}>
        <Cyl p={[0, 0.32, 0]} rt={0.22} rb={0.17} h={0.64} c="#1e1b18" />
        <Cyl p={[0, 1.05, 0]} rt={0.032} h={1.35} c="#5c4028" />
        {[0.85, 1.15, 1.42, 1.65, 1.85].map((ly, idx) => (
          <group key={idx} position={[0, ly, 0]} rotation={[0, (idx * Math.PI) / 2.5, 0.2]}>
            <Sph p={[0.24, 0, 0]} s={[0.25, 0.04, 0.17]} c="#166534" />
          </group>
        ))}
      </G>

      {/* 5. TƯỜNG BÊN PHẢI TẦNG 2: Thay thế bằng Vách kính hiện đại khi camera nhìn sang phải */}
      {!cutWalls.right ? (
        <>
          <B
            p={[10.14, Y - 0.12 + (H2 + 0.12) / 2, -2.96]}
            s={[0.2, H2 + 0.12, 6.56]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />
          <B
            p={[10.01, Y + H2 / 2, -2.9]}
            s={[0.04, H2, 6.2]}
            c={darkMode ? '#354337' : '#859683'}
            rough={0.9}
            shadow={false}
            polyOffset
          />
        </>
      ) : (
        <GlassCurtainWall pos={[10.04, Y + H2 / 2, -2.96]} size={[6.56, H2]} orientation="x" numPanels={3} />
      )}
      {/* Phào chỉ trần tường phải */}
      {!cutWalls.right && (
        <B p={[9.95, Y + H2 - 0.08, -2.9]} s={[0.08, 0.16, 6.2]} c="#f8f5f0" shadow={false} polyOffset />
      )}

      {/* Cửa sổ kính lớn & Rèm voan trắng rủ mềm xuống sàn (click để đóng/mở rèm) */}
      {!cutWalls.right && (
        <Interact onClick={() => useStore.getState().toggleCurtains()}>
          <G p={[9.94, Y, -2.3]} r={[0, -Math.PI / 2, 0]}>
            {/* Tấm bắt click rộng lớn phủ kín cửa sổ */}
            <mesh position={[0, 2.08, 0.2]}>
              <planeGeometry args={[4.2, 3.8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Mặt kính bầu trời nắng ấm / đêm sao */}
            <mesh position={[0, 2.08, 0.012]}>
              <planeGeometry args={[3.5, 3.35]} />
              <meshStandardMaterial
                map={skyMap}
                emissive="#fff8eb"
                emissiveMap={skyMap}
                emissiveIntensity={darkMode ? 0.85 : 1.45}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>

            {/* Khung cửa sổ trắng chia ô hiện đại */}
            <B p={[0, 3.72, 0.03]} s={[3.65, 0.08, 0.06]} c="#f4f1ea" shadow={false} polyOffset />
            <B p={[0, 0.42, 0.03]} s={[3.65, 0.08, 0.09]} c="#f4f1ea" shadow={false} polyOffset />
            {[-1.78, -0.58, 0.58, 1.78].map((wx, i) => (
              <B key={i} p={[wx, 2.08, 0.03]} s={[0.06, 3.35, 0.05]} c="#f4f1ea" shadow={false} polyOffset />
            ))}
            <B p={[0, 2.25, 0.03]} s={[3.55, 0.055, 0.05]} c="#f4f1ea" shadow={false} polyOffset />

            {/* Thanh treo rèm chạy suốt chiều dài cửa sổ */}
            <Cyl p={[0, 3.88, 0.12]} r={[0, 0, Math.PI / 2]} rt={0.022} h={4.1} c="#4a3525" metal={0.4} />

            {/* Lớp rèm voan trắng sheer mỏng xuyên sáng phủ nhẹ toàn khung cửa */}
            <BB p={[-0.85, 0.02, 0.06]} s={[1.65, 3.82, 0.025]} c="#ffffff" opacity={0.48} rough={0.9} shadow={false} />
            <BB p={[0.85, 0.02, 0.06]} s={[1.65, 3.82, 0.025]} c="#ffffff" opacity={0.48} rough={0.9} shadow={false} />

            {/* Các nếp rèm voan trắng kem xếp ly rủ mềm chạm sàn ở hai bên */}
            <group position={[-1.45, 0, 0.12]}>
              {[-0.28, -0.16, -0.04, 0.08, 0.2, 0.32].map((dx, i) => (
                <Cyl
                  key={i}
                  p={[dx, 1.94, 0]}
                  rt={0.068}
                  rb={0.082}
                  h={3.84}
                  c={i % 2 ? '#f5efe6' : '#ffffff'}
                  seg={12}
                  rough={0.92}
                  opacity={0.85}
                />
              ))}
            </group>
            <group position={[1.45, 0, 0.12]}>
              {[-0.32, -0.2, -0.08, 0.04, 0.16, 0.28].map((dx, i) => (
                <Cyl
                  key={i}
                  p={[dx, 1.94, 0]}
                  rt={0.068}
                  rb={0.082}
                  h={3.84}
                  c={i % 2 ? '#f5efe6' : '#ffffff'}
                  seg={12}
                  rough={0.92}
                  opacity={0.85}
                />
              ))}
            </group>
          </G>
        </Interact>
      )}
    </group>
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
        <mesh position={[-0.45, totalH / 2 - 0.1, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.14, 6.1]} />
          <meshStandardMaterial color="#1f2024" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0.45, totalH / 2 - 0.1, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.14, 6.1]} />
          <meshStandardMaterial color="#1f2024" metalness={0.6} roughness={0.35} />
        </mesh>

        {/* 14 Bậc thang gỗ sồi */}
        {Array.from({ length: steps }, (_, i) => {
          const t = (i + 0.5) / steps
          const sy = t * totalH
          const sz = THREE.MathUtils.lerp(startZ, endZ, t)
          return (
            <group key={i} position={[0, sy, sz]}>
              <B p={[0, 0, 0]} s={[1.08, 0.065, 0.32]} c="#c89b6e" rough={0.5} />
              <B p={[0, -0.04, 0.14]} s={[1.04, 0.018, 0.02]} c="#fff3c4" emissive="#fbbf24" ei={1.1} shadow={false} />
            </group>
          )
        })}

        {/* Tay vịn cầu thang gỗ sồi & trụ thép */}
        <mesh position={[0.52, totalH / 2 + 0.82, (startZ + endZ) / 2]} rotation={[0.76, 0, 0]} castShadow>
          <boxGeometry args={[0.055, 0.055, 6.15]} />
          <meshStandardMaterial color="#b8895a" roughness={0.45} />
        </mesh>
        {[0.08, 0.35, 0.65, 0.92].map((t, idx) => (
          <B
            key={idx}
            p={[0.52, t * totalH + 0.42, THREE.MathUtils.lerp(startZ, endZ, t)]}
            s={[0.035, 0.85, 0.035]}
            c="#1f2024"
            metal={0.6}
          />
        ))}
      </G>
    </Interact>
  )
}

/* ============================================================================
 * 4. TOÀN BỘ NỘI THẤT TẦNG 2 NÂNG CẤP THEO HÌNH MẪU ĐÍNH KÈM
 * ============================================================================ */
function GirlRoomFurniture() {
  const Y = FLOOR2_Y
  const girlLampOn = useStore((s) => s.girlLampOn)
  const girlVanityLightOn = useStore((s) => s.girlVanityLightOn)
  const girlShelfLedOn = useStore((s) => s.girlShelfLedOn)
  const girlPcState = useStore((s) => s.girlPcState)
  const girlChairSpinTick = useStore((s) => s.girlChairSpinTick)
  const girlBookPage = useStore((s) => s.girlBookPage)

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
      {/* =====================================================================
       * A. KHU VỰC GIƯỜNG NGỦ ẤM CÚNG (CHĂN & GỐI CAM ĐẤT, ĐÈN VÒM LED, TRANH ĐA SẮC, THẢM CỔ ĐIỂN)
       * ===================================================================== */}

      {/* 1. Thảm chữ nhật trắng kem dưới gầm giường (nâng lên Y + 0.022 + polygonOffset) */}
      <mesh position={[-5.0, Y + 0.022, -3.85]} receiveShadow>
        <boxGeometry args={[3.45, 0.02, 3.65]} />
        <meshStandardMaterial
          color="#f2ece1"
          roughness={0.95}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 2. Hai tấm thảm dệt họa tiết cổ điển tông nâu đỏ ở hai bên hông giường */}
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

      {/* 3. Giường ngủ màu kem + Chăn phủ & 3 gối tựa màu nâu cam đất (Terracotta / Burnt Orange) */}
      <Interact
        hint="🛏️ Giường ngủ Tầng 2"
        onClick={() => useStore.getState().startActivity('girl_sleep', true)}
      >
        <G p={[-5.0, Y, -3.95]}>
          {/* Khung giường bọc nệm kem chạm sàn (BB y = 0) */}
          <BB p={[0, 0, 0]} s={[2.68, 0.34, 3.18]} c="#efeae1" rough={0.85} />
          {/* Đầu giường bọc nệm kem cao */}
          <BB p={[0, 0, -1.48]} s={[2.76, 1.48, 0.22]} c="#f3eee6" rough={0.85} />

          {/* Đệm chính màu trắng kem */}
          <BB p={[0, 0.34, 0.06]} s={[2.46, 0.26, 2.86]} c="#fbf9f5" rough={0.8} />

          {/* Chăn bông màu trắng kem (không tạo bóng tự đổ gây sọc đen) */}
          <BB p={[0, 0.6, 0.32]} s={[2.48, 0.09, 2.15]} c="#f7f3eb" rough={0.85} shadow={false} />

          {/* TẤM CHĂN PHỦ (THROW BLANKET) MÀU NÂU CAM ĐẤT VẮT NGANG CUỐI GIƯỜNG & RỦ XUỐNG 2 BÊN */}
          {/* Phần vắt ngang trên mặt giường */}
          <BB p={[0, 0.69, 0.85]} s={[2.52, 0.045, 0.82]} c="#a84624" rough={0.88} shadow={false} />
          {/* Nếp gấp gợn trên mặt chăn cam đất */}
          <BB p={[0, 0.735, 0.68]} s={[2.5, 0.025, 0.16]} c="#be5430" rough={0.88} shadow={false} />
          <BB p={[0, 0.735, 1.02]} s={[2.5, 0.025, 0.16]} c="#933a1b" rough={0.88} shadow={false} />
          {/* Phần chăn rủ xuống bên hông trái & phải của nệm */}
          <BB p={[-1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#9e4020" rough={0.88} shadow={false} />
          <BB p={[1.26, 0.22, 0.85]} s={[0.05, 0.5, 0.82]} c="#9e4020" rough={0.88} shadow={false} />

          {/* 2 Gối ngủ lớn màu trắng kem phía sau */}
          <BB p={[-0.64, 0.6, -1.08]} s={[0.88, 0.22, 0.42]} r={[0.22, 0, 0]} c="#ffffff" rough={0.8} />
          <BB p={[0.64, 0.6, -1.08]} s={[0.88, 0.22, 0.42]} r={[0.22, 0, 0]} c="#ffffff" rough={0.8} />

          {/* 3 CHIẾC GỐI TỰA MÀU NÂU CAM ĐẤT (TERRACOTTA) TẠO ĐỘ TƯƠNG PHẢN ẤM ÁP */}
          <BB p={[-0.58, 0.62, -0.78]} s={[0.62, 0.24, 0.32]} r={[0.28, 0.04, 0]} c="#b84d27" rough={0.85} />
          <BB p={[0.58, 0.62, -0.78]} s={[0.62, 0.24, 0.32]} r={[0.28, -0.04, 0]} c="#b84d27" rough={0.85} />
          <BB p={[0, 0.61, -0.58]} s={[0.56, 0.19, 0.28]} r={[0.18, 0, 0]} c="#cc6238" rough={0.85} />
        </G>
      </Interact>

      {/* 4. DẢI ĐÈN LED HÌNH VÒM CUNG (ARCH LED) & TRANH ĐA SẮC CHÍNH GIỮA ĐẦU GIƯỜNG */}
      <G p={[-5.0, Y, -5.96]}>
        {/* Dải đèn LED vòm cung phát sáng vàng ấm bao quanh đầu giường */}
        <mesh position={[0, 2.25, 0]}>
          <torusGeometry args={[1.62, 0.036, 16, 64, Math.PI]} />
          <meshStandardMaterial
            color="#fff8dc"
            emissive="#ffaa28"
            emissiveIntensity={girlLampOn ? 3.8 : 0.4}
          />
        </mesh>
        {/* 2 chân dải đèn vòm kéo thẳng xuống tới 2 tủ đầu giường */}
        <B
          p={[-1.62, 1.42, 0]}
          s={[0.07, 1.68, 0.05]}
          c="#fff8dc"
          emissive="#ffaa28"
          ei={girlLampOn ? 3.8 : 0.4}
          shadow={false}
        />
        <B
          p={[1.62, 1.42, 0]}
          s={[0.07, 1.68, 0.05]}
          c="#fff8dc"
          emissive="#ffaa28"
          ei={girlLampOn ? 3.8 : 0.4}
          shadow={false}
        />
        {girlLampOn && (
          <pointLight position={[0, 2.4, 0.45]} color="#ffaa33" intensity={1.45} distance={5.5} />
        )}

        {/* Bức tranh khung gỗ nhiều màu sắc treo chính giữa trong lòng vòm đèn */}
        <G p={[0, 2.38, 0.025]}>
          {/* Khung gỗ nâu ấm */}
          <B p={[0, 0, 0]} s={[1.82, 1.16, 0.045]} c="#6e472b" rough={0.55} polyOffset />
          {/* Mặt tranh đa sắc */}
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

        {/* 4 Kệ gỗ nổi nhỏ hai bên vòm đèn với bình gốm trắng */}
        {[-2.35, 2.35].map((sx, sideIdx) => (
          <group key={sideIdx} position={[sx, 0, 0]}>
            <BB p={[0, 2.28, 0.1]} s={[0.78, 0.04, 0.22]} c="#c89b6e" rough={0.55} />
            <Cyl p={[-0.16, 2.42, 0.1]} rt={0.05} rb={0.07} h={0.2} c="#ffffff" />
            <Sph p={[0.14, 2.38, 0.1]} s={[0.065, 0.065, 0.065]} c="#f5ebe0" />

            <BB p={[0, 2.75, 0.1]} s={[0.78, 0.04, 0.22]} c="#c89b6e" rough={0.55} />
            <Cyl p={[0.12, 2.89, 0.1]} rt={0.045} rb={0.06} h={0.2} c="#ffffff" />
            <Cyl p={[-0.14, 2.85, 0.1]} rt={0.05} rb={0.05} h={0.12} c="#d97706" />
          </group>
        ))}
      </G>

      {/* 5. Hai tủ đầu giường chạm sàn + 2 đèn ngủ chụp tròn phát sáng vàng ấm */}
      {[-6.78, -3.22].map((nx, idx) => (
        <Interact
          key={idx}
          hint="💡 Đèn ngủ"
          onClick={() => useStore.getState().toggleGirlLamp()}
        >
          <G p={[nx, Y, -5.42]}>
            {/* Tủ đầu giường chạm đúng mặt sàn (BB p[1] = 0) */}
            <BB p={[0, 0, 0]} s={[0.68, 0.58, 0.52]} c="#d4a373" rough={0.6} />
            <B p={[0, 0.3, 0.265]} s={[0.6, 0.015, 0.01]} c="#b08254" />
            <Sph p={[0, 0.43, 0.27]} s={[0.022, 0.022, 0.022]} c="#d4af37" rough={0.3} />
            <Sph p={[0, 0.17, 0.27]} s={[0.022, 0.022, 0.022]} c="#d4af37" rough={0.3} />

            {/* Đèn ngủ chụp tròn phát sáng vàng ấm đặt trên mặt tủ (y = 0.58) */}
            <Cyl p={[0, 0.64, 0]} rt={0.07} rb={0.095} h={0.12} c="#c89b6e" />
            <Sph
              p={[0, 0.78, 0]}
              s={[0.16, 0.15, 0.16]}
              c="#fffbeb"
              emissive="#ffaa28"
              ei={girlLampOn ? 3.2 : 0.15}
            />
          </G>
        </Interact>
      ))}
      {/* Chậu cây tròn nhỏ bên cạnh tủ đầu giường phải */}
      <G p={[-2.62, Y, -5.42]}>
        <Cyl p={[0, 0.16, 0]} rt={0.13} rb={0.1} h={0.32} c="#ffffff" />
        <Sph p={[0, 0.38, 0]} s={[0.17, 0.17, 0.17]} c="#16a34a" />
      </G>

      {/* 6. Cụm thảm lông tròn trắng + Ghế lười trắng Bouclé + Bàn trà nhỏ phía trước giường */}
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

        {/* Bàn trà gỗ sồi thấp */}
        <G p={[-0.55, 0, 0.05]}>
          <BB p={[0, 0.3, 0]} s={[0.74, 0.04, 0.42]} c="#c89b6e" rough={0.55} />
          {[-0.3, 0.3].map((lx, i) =>
            [-0.15, 0.15].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.15, lz]} rt={0.022} h={0.3} c="#b08254" />
            )),
          )}
          <mesh position={[0.06, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
            <planeGeometry args={[0.26, 0.18]} />
            <meshStandardMaterial map={bookTex} />
          </mesh>
          <Cyl p={[-0.18, 0.37, 0.04]} rt={0.032} rb={0.026} h={0.06} c="#ffffff" />
        </G>

        {/* Ghế lười tròn trắng Bouclé + Đôn tròn */}
        <Interact
          hint="🛋️ Ghế lười Bouclé"
          onClick={() => useStore.getState().startActivity('girl_lounge', true)}
        >
          <G p={[0.45, 0, 0.05]} r={[0, -0.7, 0]}>
            <Cyl p={[0, 0.21, 0]} rt={0.52} rb={0.48} h={0.42} c="#f5f0ea" rough={0.95} />
            <mesh position={[0, 0.48, -0.18]} rotation={[0.1, 0, 0]}>
              <cylinderGeometry args={[0.52, 0.52, 0.42, 32, 1, false, Math.PI * 0.75, Math.PI * 1.5]} />
              <meshStandardMaterial color="#f5f0ea" roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
            <Sph p={[0, 0.45, -0.12]} s={[0.4, 0.24, 0.22]} c="#eae3d8" rough={0.95} />
          </G>
        </Interact>
        <Cyl p={[0.68, 0.2, -0.72]} rt={0.28} rb={0.28} h={0.4} c="#f5f0ea" rough={0.95} />
      </G>

      {/* =====================================================================
       * B. GÓC THỬ ĐỒ (DRESSING ZONE) & GÓC NGHỆ THUẬT - TRƯNG BÀY Ở KHOẢNG TRỐNG GIỮA PHÒNG
       * ===================================================================== */}
      {/* 1. Gương đứng soi toàn thân có khung gỗ sồi chạm sàn + Thảm lông nhỏ màu kem phía trước gương */}
      <G p={[-2.05, Y, -5.68]} r={[-0.06, 0.08, 0]}>
        <BB p={[0, 0, 0]} s={[0.76, 1.88, 0.05]} c="#c89b6e" rough={0.5} polyOffset />
        <BB p={[0, 0.05, 0.028]} s={[0.66, 1.78, 0.01]} c="#d6cdc2" metal={0.22} rough={0.18} polyOffset />
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
      {/* Thảm lông nhỏ màu kem trước gương toàn thân */}
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

      {/* 2. Giá treo quần áo chữ A bằng gỗ/đồng (A-Frame Garment Rack) treo 4 bộ váy màu Pastel + Túi xách & Hộp giày */}
      <Interact
        hint="👗 Giá treo váy Pastel"
        onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
      >
        <G p={[-1.12, Y, -5.32]}>
          {/* Khung chữ A hai bên bằng gỗ sồi ấm */}
          {[-0.56, 0.56].map((rx, side) => (
            <group key={side} position={[rx, 0, 0]}>
              <Cyl p={[0, 0.82, -0.14]} r={[0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#b8895a" />
              <Cyl p={[0, 0.82, 0.14]} r={[-0.17, 0, 0]} rt={0.02} rb={0.024} h={1.66} c="#b8895a" />
              <B p={[0, 0.16, 0]} s={[0.035, 0.03, 0.52]} c="#b8895a" />
            </group>
          ))}
          {/* Thanh suốt treo đồ bằng đồng ánh kim (Brass Rail) */}
          <Cyl p={[0, 1.58, 0]} r={[0, 0, Math.PI / 2]} rt={0.016} h={1.24} c="#d4af37" metal={0.85} rough={0.2} />
          {/* Kệ gỗ dưới đáy để túi xách & hộp giày */}
          <BB p={[0, 0.14, 0]} s={[1.1, 0.03, 0.46]} c="#d4a373" rough={0.55} />

          {/* 4 Bộ váy màu Pastel (Hồng phấn, Kem, Xanh bơ, Tím Lavender) treo trên móc đồng */}
          {[
            { x: -0.36, c: '#f9a8d4', skirt: '#fbcfe8', h: 0.96 }, // Hồng phấn
            { x: -0.12, c: '#fdf8f0', skirt: '#f5ebe0', h: 1.04 }, // Kem sữa
            { x: 0.12, c: '#a7c4a0', skirt: '#bbf7d0', h: 0.98 }, // Xanh bơ (Sage/Avocado)
            { x: 0.36, c: '#ddd6fe', skirt: '#ede9fe', h: 0.92 }, // Tím Pastel
          ].map((dr, idx) => (
            <group key={idx} position={[dr.x, 1.56, 0]}>
              {/* Móc áo đồng */}
              <Cyl p={[0, -0.04, 0]} rt={0.006} h={0.08} c="#d4af37" metal={0.85} />
              {/* Thân váy trên & tà váy xòe mềm mại */}
              <BB p={[0, -0.32, 0]} s={[0.14, 0.42, 0.28]} c={dr.c} rough={0.82} />
              <Cyl p={[0, -0.68, 0]} rt={0.08} rb={0.16} h={dr.h - 0.35} c={dr.skirt} rough={0.85} />
            </group>
          ))}

          {/* 2 Túi xách thời trang & 2 Hộp giày đặt trên kệ dưới */}
          {/* Túi xách hồng phấn */}
          <BB p={[-0.34, 0.17, 0.04]} s={[0.2, 0.19, 0.12]} c="#f472b6" rough={0.45} />
          <Cyl p={[-0.34, 0.38, 0.04]} r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.015} c="#d4af37" metal={0.8} />
          {/* Túi xách da kem/camel */}
          <BB p={[-0.08, 0.17, -0.02]} s={[0.22, 0.21, 0.13]} c="#d4a373" rough={0.45} />
          <Cyl p={[-0.08, 0.4, -0.02]} r={[Math.PI / 2, 0, 0]} rt={0.06} h={0.015} c="#d4af37" metal={0.8} />
          {/* 2 Hộp giày xếp chồng */}
          <BB p={[0.28, 0.17, 0]} s={[0.32, 0.13, 0.26]} c="#f5ebe0" rough={0.7} />
          <BB p={[0.28, 0.29, 0]} s={[0.33, 0.025, 0.27]} c="#e5d5c3" />
          <BB p={[0.28, 0.315, 0.01]} s={[0.28, 0.11, 0.23]} c="#fbcfe8" rough={0.7} />
          <BB p={[0.28, 0.415, 0.01]} s={[0.29, 0.022, 0.24]} c="#f9a8d4" />
        </G>
      </Interact>

      {/* 3. CHẬU CÂY CẢNH LỚN TÁN LÁ XÒE RỘNG XANH MƯỚT (CHẬU GỐM NÂU XÁM) NGĂN CÁCH KHÔNG GIAN */}
      <G p={[0.12, Y, -5.05]}>
        {/* Chậu gốm hình trụ bo tròn màu nâu xám */}
        <Cyl p={[0, 0.31, 0]} rt={0.33} rb={0.26} h={0.62} c="#7a6a5e" rough={0.78} />
        <Cyl p={[0, 0.58, 0]} rt={0.29} h={0.03} c="#3e2c20" />
        {/* Thân chính & các nhánh cây gỗ */}
        <Cyl p={[0, 1.25, 0]} rt={0.036} rb={0.055} h={1.35} c="#5c4028" />
        <Cyl p={[-0.22, 1.52, 0.08]} r={[0.15, 0, 0.52]} rt={0.02} rb={0.03} h={0.72} c="#5c4028" />
        <Cyl p={[0.24, 1.46, -0.06]} r={[-0.12, 0, -0.5]} rt={0.02} rb={0.03} h={0.72} c="#5c4028" />
        <Cyl p={[0.05, 1.62, 0.22]} r={[0.48, 0, -0.15]} rt={0.018} rb={0.026} h={0.62} c="#5c4028" />
        <Cyl p={[-0.08, 1.66, -0.2]} r={[-0.42, 0, 0.2]} rt={0.018} rb={0.026} h={0.58} c="#5c4028" />

        {/* Tán lá xòe rộng nhiều tầng dạng lá dẹt tự nhiên */}
        {Array.from({ length: 28 }, (_, idx) => {
          const ring = idx < 10 ? 0 : idx < 20 ? 1 : 2
          const count = ring === 0 ? 10 : ring === 1 ? 10 : 8
          const iInRing = ring === 0 ? idx : ring === 1 ? idx - 10 : idx - 20
          const angle = (iInRing / count) * Math.PI * 2 + ring * 0.45
          const radius = ring === 0 ? 0.58 : ring === 1 ? 0.38 : 0.18
          const ly = ring === 0 ? 1.56 + (idx % 3) * 0.1 : ring === 1 ? 1.88 + (idx % 3) * 0.09 : 2.16 + (idx % 2) * 0.08
          const lx = Math.cos(angle) * radius
          const lz = Math.sin(angle) * radius
          const leafColors = ['#2e6f32', '#3b873e', '#489c4b', '#255c28']
          return (
            <mesh
              key={idx}
              position={[lx, ly, lz]}
              rotation={[Math.sin(angle) * 0.35, -angle, 0.28 + (idx % 3) * 0.12]}
              scale={[0.28, 0.032, 0.19]}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={leafColors[idx % leafColors.length]} roughness={0.55} />
            </mesh>
          )
        })}
      </G>

      {/* 4. KỆ GỖ THẤP 2 TẦNG (DISPLAY SHELF) TRƯNG BÀY GẤU BÔNG, HỘP QUÀ, LỌ HOA & MÁY PHÁT ĐĨA THAN */}
      <Interact
        hint="🎶 Máy đĩa than & Gấu bông"
        onClick={() => useStore.getState().notify('🎶 Đĩa than Vinyl đang phát bản nhạc Acoustic êm dịu')}
      >
        <G p={[-0.95, Y, -3.55]}>
          {/* Khung kệ gỗ sồi thấp 2 tầng chạm sàn */}
          <BB p={[0, 0.04, 0]} s={[1.48, 0.04, 0.42]} c="#c89b6e" rough={0.55} />
          <BB p={[0, 0.36, 0]} s={[1.48, 0.04, 0.42]} c="#c89b6e" rough={0.55} />
          <BB p={[0, 0.68, 0]} s={[1.52, 0.045, 0.44]} c="#d4a373" rough={0.52} />
          {[-0.7, 0, 0.7].map((sx, idx) => (
            <BB key={idx} p={[sx, 0, 0]} s={[0.04, 0.68, 0.4]} c="#b08254" rough={0.58} />
          ))}

          {/* --- TẦNG TRÊN: MÁY PHÁT NHẠC ĐĨA THAN (VINYL PLAYER), LỌ HOA & HỘP QUÀ NHỎ --- */}
          {/* Máy phát nhạc đĩa than cổ điển */}
          <G p={[-0.42, 0.725, 0]}>
            <BB p={[0, 0, 0]} s={[0.42, 0.075, 0.34]} c="#7c4a27" rough={0.5} />
            {/* Đĩa than đen bóng + nhãn đỏ ở tâm */}
            <Cyl p={[-0.03, 0.085, 0]} rt={0.14} h={0.012} c="#18181b" rough={0.2} metal={0.3} />
            <Cyl p={[-0.03, 0.093, 0]} rt={0.045} h={0.008} c="#e11d48" />
            {/* Cần đọc đĩa kim loại mạ vàng */}
            <Cyl p={[0.14, 0.1, -0.1]} rt={0.022} h={0.03} c="#d4af37" metal={0.85} />
            <B p={[0.08, 0.11, -0.02]} r={[0, -0.42, 0]} s={[0.012, 0.012, 0.2]} c="#d4af37" metal={0.85} />
          </G>

          {/* Lọ hoa gốm kem & Hoa cúc/tulip pastel */}
          <G p={[0.12, 0.725, -0.02]}>
            <Cyl p={[0, 0.1, 0]} rt={0.055} rb={0.075} h={0.2} c="#f8fafc" rough={0.3} />
            <Sph p={[-0.04, 0.24, 0.02]} s={[0.055, 0.055, 0.055]} c="#f472b6" />
            <Sph p={[0.04, 0.26, -0.02]} s={[0.055, 0.055, 0.055]} c="#fde047" />
            <Sph p={[0, 0.28, 0.03]} s={[0.05, 0.05, 0.05]} c="#fb923c" />
            <Sph p={[0.02, 0.22, 0.04]} s={[0.06, 0.04, 0.06]} c="#22c55e" />
          </G>

          {/* Hộp quà nhỏ thắt nơ trên mặt kệ */}
          <G p={[0.48, 0.725, 0.02]}>
            <BB p={[0, 0, 0]} s={[0.22, 0.14, 0.2]} c="#fbcfe8" rough={0.6} />
            <BB p={[0, 0.13, 0]} s={[0.235, 0.03, 0.215]} c="#f472b6" />
            <B p={[0, 0.08, 0]} s={[0.24, 0.16, 0.03]} c="#fff1f2" />
          </G>

          {/* --- TẦNG DƯỚI: BỘ SƯU TẬP GẤU BÔNG (TEDDY BEARS) & HỘP QUÀ --- */}
          {/* Gấu bông nâu ấm áp ngồi bên trái */}
          <G p={[-0.36, 0.4, 0.04]}>
            <Sph p={[0, 0.09, 0]} s={[0.085, 0.095, 0.075]} c="#9c6644" rough={0.9} />
            <Sph p={[0, 0.2, 0.01]} s={[0.075, 0.07, 0.07]} c="#9c6644" rough={0.9} />
            <Sph p={[-0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#7f5539" />
            <Sph p={[0.055, 0.255, 0]} s={[0.026, 0.026, 0.02]} c="#7f5539" />
            <Sph p={[0, 0.19, 0.065]} s={[0.028, 0.022, 0.02]} c="#ede0d4" />
            <Sph p={[-0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#7f5539" />
            <Sph p={[0.06, 0.04, 0.06]} s={[0.03, 0.03, 0.045]} c="#7f5539" />
            <B p={[0, 0.14, 0.065]} s={[0.06, 0.022, 0.015]} c="#e11d48" />
          </G>
          {/* Gấu bông kem trắng ngồi bên phải */}
          <G p={[0.34, 0.4, 0.04]}>
            <Sph p={[0, 0.085, 0]} s={[0.08, 0.09, 0.07]} c="#f5ebe0" rough={0.9} />
            <Sph p={[0, 0.19, 0.01]} s={[0.07, 0.065, 0.065]} c="#f5ebe0" rough={0.9} />
            <Sph p={[-0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#d5bdaf" />
            <Sph p={[0.05, 0.24, 0]} s={[0.024, 0.024, 0.018]} c="#d5bdaf" />
            <Sph p={[0, 0.18, 0.06]} s={[0.025, 0.02, 0.018]} c="#ffffff" />
            <Sph p={[-0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#d5bdaf" />
            <Sph p={[0.055, 0.04, 0.055]} s={[0.028, 0.028, 0.04]} c="#d5bdaf" />
            <B p={[0, 0.135, 0.06]} s={[0.055, 0.02, 0.015]} c="#f472b6" />
          </G>
          {/* Chồng sách nghệ thuật ở tầng dưới */}
          <BB p={[-0.36, 0.08, 0]} s={[0.32, 0.045, 0.24]} c="#e2e8f0" />
          <BB p={[-0.36, 0.125, 0]} s={[0.28, 0.04, 0.22]} c="#fed7aa" />
          <BB p={[0.34, 0.08, 0]} s={[0.3, 0.16, 0.22]} c="#d8f3dc" />
        </G>
      </Interact>

      {/* 5. ĐÀN PIANO ĐIỆN MÀU TRẮNG / GỖ SÁNG KÈM GHẾ ĐÔN NỆM TRẮNG & GIÁ VẼ TRANH GỖ (WOODEN EASEL) Ở GIỮA PHÒNG */}
      <G p={[0.15, Y, -1.55]}>
        {/* Thảm kem lót dưới khu vực Đàn Piano & Giá vẽ (nâng lên y = 0.022 + polygonOffset) */}
        <mesh position={[-0.15, 0.022, 0.1]} receiveShadow>
          <boxGeometry args={[2.65, 0.02, 1.55]} />
          <meshStandardMaterial
            color="#f5efe6"
            roughness={0.94}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Đàn Piano điện màu trắng kem kết hợp gỗ sồi sáng */}
        <Interact
          hint="🎹 Đàn Piano"
          onClick={() => {
            const st = useStore.getState()
            st.setAvatarTarget([0.45, Y, -0.95])
            st.notify('🎹 Tiếng đàn Piano ngân vang dịu dàng khắp căn phòng...')
          }}
        >
          <G p={[0.32, 0, -0.08]}>
            {/* 2 Chân trụ gỗ sồi sáng & thanh giằng bàn đạp */}
            <BB p={[-0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#f8f6f2" rough={0.5} />
            <BB p={[0.62, 0, 0]} s={[0.08, 0.74, 0.42]} c="#f8f6f2" rough={0.5} />
            <BB p={[0, 0.04, -0.12]} s={[1.28, 0.08, 0.08]} c="#f8f6f2" />
            <BB p={[0, 0.18, -0.14]} s={[1.18, 0.48, 0.04]} c="#e8dfd3" />
            {/* 3 Пеdal (Bàn đạp mạ vàng đồng) */}
            {[-0.08, 0, 0.08].map((px, pi) => (
              <B key={pi} p={[px, 0.05, -0.04]} s={[0.022, 0.02, 0.12]} c="#d4af37" metal={0.85} />
            ))}

            {/* Thân đàn Piano gỗ sồi sáng & nắp trắng tinh tế */}
            <BB p={[0, 0.72, 0]} s={[1.38, 0.14, 0.44]} c="#d4a373" rough={0.5} />
            <BB p={[0, 0.84, -0.08]} s={[1.38, 0.06, 0.26]} c="#fbfaf8" rough={0.4} />

            {/* Bàn phím 88 phím trắng & phím đen nổi khối */}
            <BB p={[0, 0.785, 0.11]} s={[1.22, 0.028, 0.15]} c="#ffffff" rough={0.25} />
            {Array.from({ length: 22 }, (_, ki) => {
              if (ki % 7 === 2 || ki % 7 === 6) return null
              const kx = -0.54 + ki * 0.051
              return <BB key={ki} p={[kx, 0.808, 0.075]} s={[0.022, 0.02, 0.09]} c="#18181b" rough={0.3} />
            })}

            {/* Giá để bản nhạc bằng gỗ & Bản nhạc đang mở */}
            <B p={[0, 0.99, -0.12]} r={[-0.24, 0, 0]} s={[0.52, 0.24, 0.02]} c="#c89b6e" rough={0.5} />
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

            {/* Ghế đôn Piano bọc nệm trắng êm ái */}
            <G p={[0, 0, 0.48]}>
              <BB p={[0, 0.4, 0]} s={[0.66, 0.075, 0.34]} c="#fbf9f5" rough={0.85} />
              {[-0.28, 0.28].map((lx, i) =>
                [-0.13, 0.13].map((lz, j) => (
                  <Cyl key={`${i}-${j}`} p={[lx, 0.2, lz]} rt={0.022} rb={0.016} h={0.4} c="#d4a373" />
                )),
              )}
            </G>
          </G>
        </Interact>

        {/* Giá vẽ tranh gỗ (Wooden Easel) đặt khung vải Canvas đầy màu sắc bên cạnh Đàn Piano */}
        <Interact
          hint="🎨 Giá vẽ tranh Canvas"
          onClick={() => useStore.getState().notify('🎨 Bức tranh sơn dầu đầy sắc màu đang được hoàn thiện')}
        >
          <G p={[-0.86, 0, -0.02]} r={[0, 0.38, 0]}>
            {/* 3 Chân giá vẽ chữ A bằng gỗ sồi ấm */}
            <Cyl p={[-0.24, 0.78, 0.08]} r={[-0.12, 0, -0.16]} rt={0.018} rb={0.022} h={1.58} c="#b8895a" />
            <Cyl p={[0.24, 0.78, 0.08]} r={[-0.12, 0, 0.16]} rt={0.018} rb={0.022} h={1.58} c="#b8895a" />
            <Cyl p={[0, 0.74, -0.26]} r={[0.26, 0, 0]} rt={0.018} rb={0.022} h={1.52} c="#a47548" />
            {/* Thanh đỡ tranh ngang & Trụ dọc giữa */}
            <Cyl p={[0, 0.92, 0.06]} r={[-0.12, 0, 0]} rt={0.018} h={1.15} c="#b8895a" />
            <B p={[0, 0.72, 0.14]} r={[-0.12, 0, 0]} s={[0.68, 0.035, 0.08]} c="#a47548" />

            {/* Khung vải Canvas nghệ thuật đầy màu sắc đặt trên giá vẽ */}
            <G p={[0, 1.06, 0.11]} r={[-0.12, 0, 0]}>
              <B p={[0, 0, 0]} s={[0.64, 0.66, 0.032]} c="#f8f5f0" rough={0.8} polyOffset />
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

            {/* Bảng pha màu (Wooden Palette) & Cốc đựng cọ vẽ đặt trên khay giá vẽ */}
            <Cyl p={[-0.2, 0.78, 0.16]} rt={0.032} rb={0.026} h={0.09} c="#f1f5f9" />
            <Cyl p={[-0.2, 0.85, 0.16]} r={[0, 0, 0.2]} rt={0.005} h={0.12} c="#ef4444" />
            <Cyl p={[-0.19, 0.85, 0.16]} r={[0, 0, -0.15]} rt={0.005} h={0.12} c="#3b82f6" />
            <Cyl p={[0.18, 0.745, 0.16]} rt={0.09} rb={0.09} h={0.012} c="#d4a373" />
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * C. KỆ SÁCH TREO TƯỜNG 2 TẦNG + LED VÀNG ẤM HẮT SÁNG + SÁCH ĐA SẮC & DÂY THƯỜNG XUÂN
       * ===================================================================== */}
      <Interact
        hint="✨ Đèn LED kệ sách"
        onClick={() => useStore.getState().toggleGirlShelfLed()}
      >
        <G p={[3.55, Y, -5.88]}>
          {/* Kệ dưới & thanh LED vàng ấm */}
          <BB p={[0, 2.38, 0]} s={[5.2, 0.055, 0.28]} c="#c89b6e" rough={0.5} />
          <B
            p={[0, 2.34, 0.05]}
            s={[5.05, 0.028, 0.05]}
            c="#fffbeb"
            emissive="#ffaa22"
            ei={girlShelfLedOn ? 3.6 : 0.15}
            shadow={false}
          />

          {/* Kệ trên & thanh LED vàng ấm */}
          <BB p={[0, 2.88, 0]} s={[5.2, 0.055, 0.28]} c="#c89b6e" rough={0.5} />
          <B
            p={[0, 2.84, 0.05]}
            s={[5.05, 0.028, 0.05]}
            c="#fffbeb"
            emissive="#ffaa22"
            ei={girlShelfLedOn ? 3.6 : 0.15}
            shadow={false}
          />

          {/* PointLights tạo hiệu ứng hắt sáng vàng ấm rực rỡ xuống mảng tường xanh Sage */}
          {girlShelfLedOn && (
            <>
              <pointLight position={[-1.4, 2.25, 0.25]} color="#ffaa28" intensity={1.1} distance={3.2} />
              <pointLight position={[1.4, 2.25, 0.25]} color="#ffaa28" intensity={1.1} distance={3.2} />
            </>
          )}

          {/* Sách xếp đa sắc nổi bật (đỏ, cam, vàng, xanh lá, xanh dương, tím) trên tầng kệ trên */}
          <group position={[-1.75, 2.935, 0]}>
            {[
              { dx: -0.28, h: 0.26, c: '#ef4444' },
              { dx: -0.22, h: 0.28, c: '#f97316' },
              { dx: -0.16, h: 0.25, c: '#eab308' },
              { dx: -0.1, h: 0.29, c: '#22c55e' },
              { dx: -0.04, h: 0.26, c: '#3b82f6' },
              { dx: 0.02, h: 0.27, c: '#8b5cf6' },
              { dx: 0.08, h: 0.24, c: '#ec4899' },
              { dx: 0.14, h: 0.28, c: '#14b8a6' },
            ].map((bk, i) => (
              <BB key={i} p={[bk.dx, 0, 0]} s={[0.052, bk.h, 0.19]} c={bk.c} rough={0.6} />
            ))}
          </group>

          {/* Sách & đồ decor trên kệ dưới & kệ trên */}
          {[
            { x: -1.65, y: 2.435, colors: ['#f97316', '#eab308', '#ef4444', '#ffffff'] },
            { x: -0.65, y: 2.435, colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#fde047'] },
            { x: 0.85, y: 2.435, colors: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'] },
            { x: 1.85, y: 2.435, colors: ['#ec4899', '#f97316', '#3b82f6', '#ffffff'] },
            { x: -0.55, y: 2.935, colors: ['#f59e0b', '#10b981', '#3b82f6'] },
            { x: 1.15, y: 2.935, colors: ['#8b5cf6', '#ec4899', '#eab308'] },
          ].map((grp, gi) => (
            <group key={gi} position={[grp.x, grp.y, 0]}>
              {grp.colors.map((col, ci) => (
                <BB
                  key={ci}
                  p={[(ci - 1.5) * 0.062, 0, 0]}
                  s={[0.055, 0.23 + (ci % 2) * 0.03, 0.18]}
                  c={col}
                  rough={0.6}
                />
              ))}
            </group>
          ))}

          {/* 3 Chậu dây thường xuân (ivy) xanh mướt rủ xuống từ kệ sách */}
          {[-2.32, -0.05, 2.32].map((vx, i) => (
            <group key={i} position={[vx, 2.935, 0.06]}>
              <Cyl p={[0, 0.08, 0]} rt={0.085} rb={0.065} h={0.16} c="#f8fafc" />
              <Sph p={[0, 0.16, 0]} s={[0.13, 0.09, 0.12]} c="#166534" />
              {[
                { dy: -0.12, dx: -0.02, s: [0.09, 0.14, 0.06], col: '#15803d' },
                { dy: -0.28, dx: 0.03, s: [0.085, 0.16, 0.06], col: '#16a34a' },
                { dy: -0.45, dx: -0.02, s: [0.075, 0.16, 0.05], col: '#22c55e' },
                { dy: -0.62, dx: 0.02, s: [0.06, 0.15, 0.045], col: '#4ade80' },
                { dy: -0.76, dx: -0.01, s: [0.045, 0.12, 0.04], col: '#16a34a' },
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
          {/* Mặt bàn gỗ sồi & 2 chân chữ U màu trắng */}
          <BB p={[0, 0.72, 0]} s={[1.62, 0.055, 0.78]} c="#d4a373" rough={0.55} />
          <BB p={[-0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#f8fafc" />
          <BB p={[0.74, 0, 0]} s={[0.06, 0.72, 0.74]} c="#f8fafc" />
          {/* Vách chắn lửng 2 bên mặt bàn */}
          <BB p={[-0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#f8fafc" />
          <BB p={[0.76, 0.75, 0]} s={[0.04, 0.24, 0.72]} c="#f8fafc" />

          {/* Màn hình rộng */}
          <G p={[0, 0.775, -0.18]}>
            <B p={[0, 0.01, 0]} s={[0.26, 0.02, 0.18]} c="#cbd5e1" metal={0.6} />
            <B p={[0, 0.14, -0.04]} s={[0.05, 0.26, 0.03]} c="#94a3b8" metal={0.6} />
            <B p={[0, 0.42, 0]} s={[1.18, 0.66, 0.035]} c="#1e293b" />
            <mesh position={[0, 0.42, 0.022]}>
              <planeGeometry args={[1.12, 0.6]} />
              {girlPcState === 'off' ? (
                <meshStandardMaterial
                  color="#0f172a"
                  roughness={0.2}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              ) : (
                <meshStandardMaterial
                  map={pcScreenTex}
                  emissive={girlPcState === 'rgb' ? '#38bdf8' : '#f472b6'}
                  emissiveMap={pcScreenTex}
                  emissiveIntensity={girlPcState === 'rgb' ? 0.85 : 0.65}
                  polygonOffset
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              )}
            </mesh>
          </G>

          {/* 2 Loa & bàn phím */}
          <BB p={[-0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#1e2024" />
          <BB p={[0.56, 0.775, -0.14]} s={[0.12, 0.2, 0.12]} c="#1e2024" />
          <BB p={[0, 0.775, 0.12]} s={[0.38, 0.015, 0.13]} c="#f1f5f9" />

          {/* GHẾ XOAY CÔNG THÁI HỌC MÀU ĐEN TẠO ĐỘ TƯƠNG PHẢN SẮC NÉT */}
          <G p={[0, 0, 0.56]} r={[0, Math.PI + girlChairSpinTick * 0.4, 0]}>
            {/* Chân sao 5 cánh & bánh xe màu đen */}
            <Cyl p={[0, 0.22, 0]} rt={0.032} h={0.38} c="#18191c" metal={0.5} />
            {[0, 1, 2, 3, 4].map((ci) => {
              const ang = (ci * Math.PI * 2) / 5
              return (
                <B
                  key={ci}
                  p={[Math.sin(ang) * 0.16, 0.04, Math.cos(ang) * 0.16]}
                  r={[0, ang, 0]}
                  s={[0.035, 0.03, 0.32]}
                  c="#18191c"
                />
              )
            })}
            {/* Đệm ngồi, tay vịn & tựa lưng màu đen chạm đúng trục ghế */}
            <BB p={[0, 0.4, 0]} s={[0.52, 0.075, 0.5]} c="#1f2126" rough={0.7} />
            <BB p={[0, 0.47, -0.22]} s={[0.48, 0.58, 0.065]} c="#1f2126" rough={0.7} />
            <BB p={[-0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#18191c" />
            <BB p={[0.27, 0.47, -0.02]} s={[0.04, 0.18, 0.28]} c="#18191c" />
          </G>
        </G>
      </Interact>

      {/* =====================================================================
       * E. BÀN TRANG ĐIỂM NÂNG CẤP LỚN HƠN 25% + KHAY NƯỚC HOA, HỘP MỸ PHẨM & BÌNH HOA TULIP HỒNG
       * ===================================================================== */}
      <Interact
        hint="💄 Bàn trang điểm"
        onClick={() => useStore.getState().startActivity('girl_vanity', true)}
      >
        <G p={[4.95, Y, -5.16]}>
          {/* Bàn gỗ sồi lớn hơn 25% (1.60m x 0.86m) & 2 ngăn kéo tay nắm đồng */}
          <BB p={[0, 0.62, 0]} s={[1.6, 0.13, 0.86]} c="#d4a373" rough={0.55} />
          <B p={[-0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#c89b6e" />
          <B p={[0.36, 0.685, 0.435]} s={[0.68, 0.085, 0.015]} c="#c89b6e" />
          <Sph p={[-0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#d4af37" rough={0.3} />
          <Sph p={[0.36, 0.685, 0.45]} s={[0.022, 0.022, 0.022]} c="#d4af37" rough={0.3} />

          {[-0.68, 0.68].map((lx, i) =>
            [-0.32, 0.32].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.31, lz]} rt={0.028} rb={0.018} h={0.62} c="#b08254" />
            )),
          )}

          {/* GƯƠNG TRÒN VIỀN LED TRẮNG ẤM LỚN HƠN 25% (rt = 0.52) */}
          <G p={[0, 1.32, -0.24]}>
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.52} h={0.038} c="#c89b6e" />
            <Cyl
              p={[0, 0, 0.016]}
              r={[Math.PI / 2, 0, 0]}
              rt={0.45}
              h={0.02}
              c="#d6cdc2"
              metal={0.22}
              rough={0.18}
            />
            {/* Viền Halo LED trắng ấm phát sáng rõ nét */}
            <mesh position={[0, 0, 0.028]}>
              <torusGeometry args={[0.48, 0.032, 20, 64]} />
              <meshStandardMaterial
                color="#fffdf7"
                emissive="#ffdfa0"
                emissiveIntensity={girlVanityLightOn ? 4.2 : 0.25}
              />
            </mesh>
          </G>

          {/* 1. KHAY NƯỚC HOA VIỀN ĐỒNG (PERFUME TRAY) BÊN TRÁI MẶT BÀN */}
          <G p={[-0.48, 0.75, 0.06]}>
            <Cyl p={[0, 0.01, 0]} rt={0.19} rb={0.19} h={0.016} c="#d4af37" metal={0.85} rough={0.2} />
            <Cyl p={[0, 0.019, 0]} rt={0.175} rb={0.175} h={0.008} c="#f8fafc" metal={0.5} rough={0.1} />
            {/* 4 Chai nước hoa cao cấp nhiều kiểu dáng */}
            <BB p={[-0.06, 0.022, -0.04]} s={[0.055, 0.11, 0.035]} c="#fbcfe8" rough={0.2} />
            <Sph p={[-0.06, 0.145, -0.04]} s={[0.02, 0.02, 0.02]} c="#d4af37" metal={0.9} />
            <Cyl p={[0.05, 0.07, -0.03]} rt={0.032} h={0.095} c="#fde68a" rough={0.2} />
            <Cyl p={[0.05, 0.125, -0.03]} rt={0.014} h={0.025} c="#d4af37" metal={0.9} />
            <Cyl p={[-0.02, 0.065, 0.06]} rt={0.028} h={0.08} c="#ddd6fe" rough={0.2} />
            <BB p={[0.06, 0.022, 0.05]} s={[0.042, 0.085, 0.042]} c="#fed7aa" rough={0.2} />
          </G>

          {/* 2. HỘP ĐỰNG MỸ PHẨM CHIA NGĂN (COSMETICS ORGANIZER) & CỌ TRANG ĐIỂM */}
          <G p={[0.38, 0.75, -0.02]}>
            <BB p={[0, 0, 0]} s={[0.28, 0.09, 0.18]} c="#f8f5f0" rough={0.4} />
            <BB p={[0, 0.045, -0.04]} s={[0.26, 0.06, 0.08]} c="#e2d4c0" />
            {/* Các thỏi son & lọ kem nền */}
            {[-0.08, -0.03, 0.02].map((lx, li) => (
              <Cyl key={li} p={[lx, 0.09, 0.04]} rt={0.012} h={0.065} c={li === 0 ? '#e11d48' : li === 1 ? '#f43f5e' : '#ec4899'} />
            ))}
            {/* Ống cắm cọ trang điểm */}
            <Cyl p={[0.08, 0.08, -0.03]} rt={0.032} h={0.11} c="#d4af37" metal={0.75} />
            <Cyl p={[0.07, 0.15, -0.03]} r={[0, 0, 0.18]} rt={0.006} h={0.08} c="#fbcfe8" />
            <Cyl p={[0.09, 0.15, -0.02]} r={[0, 0, -0.15]} rt={0.006} h={0.08} c="#fde047" />
          </G>

          {/* 3. BÌNH HOA TULIP HỒNG (PINK TULIP VASE) BÊN PHẢI MẶT BÀN */}
          <G p={[0.58, 0.75, 0.14]}>
            <Cyl p={[0, 0.09, 0]} rt={0.052} rb={0.068} h={0.18} c="#ffffff" rough={0.25} />
            {[
              { dx: -0.025, dz: 0.01, h: 0.25, col: '#f472b6', tilt: 0.14 },
              { dx: 0.025, dz: -0.01, h: 0.27, col: '#ec4899', tilt: -0.15 },
              { dx: 0, dz: 0.025, h: 0.24, col: '#fbcfe8', tilt: 0.08 },
              { dx: -0.015, dz: -0.025, h: 0.26, col: '#f43f5e', tilt: -0.1 },
              { dx: 0.015, dz: 0.018, h: 0.28, col: '#f9a8d4', tilt: 0.05 },
            ].map((tl, ti) => (
              <group key={ti} position={[tl.dx, 0.14, tl.dz]} rotation={[0, 0, tl.tilt]}>
                <Cyl p={[0, tl.h / 2 - 0.06, 0]} rt={0.005} h={tl.h - 0.08} c="#16a34a" />
                <Sph p={[0, tl.h - 0.08, 0]} s={[0.026, 0.038, 0.026]} c={tl.col} rough={0.4} />
              </group>
            ))}
          </G>

          {/* Ghế đôn tròn màu trắng kem */}
          <Cyl p={[0, 0.22, 0.56]} rt={0.25} rb={0.25} h={0.44} c="#f5f0ea" rough={0.9} />
        </G>
      </Interact>

      {/* =====================================================================
       * F. TỦ QUẦN ÁO GỖ NÂU TRẦM (DARK WALNUT) CHẠM SÀN, 2 CÁNH KÍNH TRONG SUỐT & ĐÈN LED ẤM
       * ===================================================================== */}
      <Interact
        hint="👗 Tủ quần áo"
        onClick={() => useStore.getState().startActivity('girl_wardrobe', true)}
      >
        <G p={[7.65, Y, -5.25]}>
          {/* Khung vỏ tủ gỗ nâu trầm (Dark Walnut) chạm đúng mặt sàn tầng 2 (BB p[1] = 0) */}
          <BB p={[0, 0, -0.52]} s={[2.05, 3.42, 0.06]} c="#3b2314" rough={0.62} />
          <BB p={[-0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#3b2314" rough={0.62} />
          <BB p={[0.99, 0, 0]} s={[0.07, 3.42, 1.08]} c="#3b2314" rough={0.62} />
          <BB p={[0, 0, 0]} s={[2.05, 0.12, 1.08]} c="#2e1a0e" rough={0.6} />
          <BB p={[0, 3.32, 0]} s={[2.06, 0.1, 1.1]} c="#3b2314" rough={0.6} />
          <BB p={[0, 3.42, 0.02]} s={[2.16, 0.1, 1.16]} c="#2a170c" rough={0.55} />
          <BB p={[0, 0.12, -0.04]} s={[0.045, 3.2, 0.96]} c="#4a2c1a" rough={0.65} />
          <BB p={[0, 0.12, -0.48]} s={[1.9, 3.2, 0.02]} c="#7c4f30" rough={0.75} />

          <BB p={[0, 2.68, -0.02]} s={[1.92, 0.045, 0.96]} c="#5c3822" />
          <BB p={[0, 0.96, -0.02]} s={[1.92, 0.045, 0.96]} c="#5c3822" />
          <BB p={[0, 0.52, -0.02]} s={[1.92, 0.04, 0.96]} c="#5c3822" />

          <BB p={[-0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#e8dfd3" rough={0.85} />
          <BB p={[0.48, 2.73, -0.05]} s={[0.58, 0.34, 0.65]} c="#d9cfc3" rough={0.85} />

          <Cyl p={[-0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#d4af37" metal={0.8} />
          <Cyl p={[0.48, 2.52, 0.02]} r={[0, 0, Math.PI / 2]} rt={0.016} h={0.88} c="#d4af37" metal={0.8} />
          {[
            { x: -0.72, h: 1.15, c: '#b84d27' },
            { x: -0.5, h: 1.25, c: '#eae4da' },
            { x: -0.28, h: 1.05, c: '#7d977d' },
            { x: 0.28, h: 1.2, c: '#f3eee6' },
            { x: 0.5, h: 1.1, c: '#d4a373' },
            { x: 0.72, h: 1.22, c: '#e5d5c3' },
          ].map((cl, idx) => (
            <BB
              key={idx}
              p={[cl.x, 2.48 - cl.h, 0.02]}
              s={[0.16, cl.h, 0.46]}
              c={cl.c}
              rough={0.82}
            />
          ))}

          <BB p={[-0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#d6c5b3" />
          <BB p={[0.48, 0.56, 0]} s={[0.52, 0.22, 0.55]} c="#c2ab94" />
          <BB p={[-0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#8c6d53" />
          <BB p={[0.48, 0.14, 0]} s={[0.54, 0.26, 0.55]} c="#a38367" />

          {[-0.48, 0.48].map((lx, idx) => (
            <group key={idx}>
              <B
                p={[lx, 3.26, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#fffbeb"
                emissive="#ffaa28"
                ei={3.5}
                shadow={false}
              />
              <B
                p={[lx, 2.64, 0.22]}
                s={[0.82, 0.025, 0.04]}
                c="#fffbeb"
                emissive="#ffaa28"
                ei={3.5}
                shadow={false}
              />
              <B
                p={[lx, 0.93, 0.22]}
                s={[0.82, 0.02, 0.04]}
                c="#fffbeb"
                emissive="#ffaa28"
                ei={3.0}
                shadow={false}
              />
            </group>
          ))}
          <pointLight position={[0, 2.2, 0.35]} color="#ffaa33" intensity={1.35} distance={3.8} />

          {[-0.48, 0.48].map((dx, side) => (
            <group key={side} position={[dx, 0.12, 0.52]}>
              <BB p={[-0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#3b2314" />
              <BB p={[0.44, 0, 0]} s={[0.07, 3.2, 0.04]} c="#3b2314" />
              <BB p={[0, 0, 0]} s={[0.95, 0.08, 0.04]} c="#3b2314" />
              <BB p={[0, 3.12, 0]} s={[0.95, 0.08, 0.04]} c="#3b2314" />
              <BB
                p={[0, 0.08, 0]}
                s={[0.82, 3.04, 0.018]}
                c="#fff8eb"
                opacity={0.22}
                rough={0.06}
                metal={0.1}
                shadow={false}
              />
              <BB
                p={[side === 0 ? 0.38 : -0.38, 1.35, 0.03]}
                s={[0.022, 0.48, 0.025]}
                c="#d4af37"
                metal={0.85}
                rough={0.2}
              />
            </group>
          ))}
        </G>
      </Interact>

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

        {/* 2. Ghế bành bọc da màu nâu bò (Caramel Leather Armchair) xoay chéo hướng vào trong */}
        <Interact
          hint="🪑 Ghế đọc sách"
          onClick={() => useStore.getState().startActivity('girl_nook', true)}
        >
          <G p={[1.18, 0, -0.08]} r={[0, -0.68, 0]}>
            {[-0.36, 0.36].map((lx, i) =>
              [-0.34, 0.34].map((lz, j) => (
                <Cyl key={`${i}-${j}`} p={[lx, 0.12, lz]} rt={0.026} rb={0.016} h={0.24} c="#271c15" />
              )),
            )}
            <BB p={[0, 0.22, 0]} s={[0.88, 0.18, 0.84]} c="#b86224" rough={0.48} />
            <BB p={[0, 0.38, 0.03]} s={[0.72, 0.12, 0.72]} c="#c9702e" rough={0.45} />
            <BB p={[0, 0.42, -0.34]} r={[-0.18, 0, 0]} s={[0.84, 0.62, 0.16]} c="#b86224" rough={0.48} />
            <BB p={[0, 0.48, -0.27]} r={[-0.18, 0, 0]} s={[0.72, 0.26, 0.1]} c="#cf7634" rough={0.44} />
            <BB p={[0, 0.76, -0.32]} r={[-0.18, 0, 0]} s={[0.72, 0.24, 0.1]} c="#cf7634" rough={0.44} />
            <BB p={[-0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#c26828" rough={0.46} />
            <BB p={[0.4, 0.36, 0.02]} s={[0.14, 0.26, 0.78]} c="#c26828" rough={0.46} />
          </G>
        </Interact>

        {/* 3. Đôn gác chân (Ottoman) bọc da màu nâu bò đồng bộ */}
        <G p={[-0.95, 0, -0.05]} r={[0, 0.25, 0]}>
          {[-0.26, 0.26].map((lx, i) =>
            [-0.2, 0.2].map((lz, j) => (
              <Cyl key={`${i}-${j}`} p={[lx, 0.1, lz]} rt={0.022} rb={0.015} h={0.2} c="#271c15" />
            )),
          )}
          <BB p={[0, 0.18, 0]} s={[0.68, 0.18, 0.54]} c="#c46b2b" rough={0.46} />
          <BB p={[0, 0.34, 0]} s={[0.64, 0.06, 0.5]} c="#d17736" rough={0.44} />
        </G>

        {/* 4. Bàn trà tròn bằng gỗ + BỘ ẤM TRÀ SỨ & ĐĨA BÁNH NGỌT MACARON */}
        <G p={[0.08, 0, 0.12]}>
          <Cyl p={[0, 0.44, 0]} rt={0.38} rb={0.38} h={0.04} c="#7c5335" rough={0.55} />
          {[0, 1, 2].map((li) => {
            const ang = (li * Math.PI * 2) / 3 + 0.4
            return (
              <Cyl
                key={li}
                p={[Math.cos(ang) * 0.2, 0.22, Math.sin(ang) * 0.2]}
                rt={0.02}
                rb={0.014}
                h={0.44}
                c="#4a301e"
              />
            )
          })}
          {/* Ấm trà sứ trắng kem & nắp vàng đồng */}
          <Sph p={[-0.1, 0.52, -0.06]} s={[0.075, 0.065, 0.075]} c="#fffbeb" rough={0.25} />
          <Sph p={[-0.1, 0.585, -0.06]} s={[0.02, 0.018, 0.02]} c="#d4af37" metal={0.8} />
          <Cyl p={[-0.03, 0.53, -0.06]} r={[0, 0, -0.8]} rt={0.012} rb={0.018} h={0.07} c="#fffbeb" />
          {/* 2 Tách trà nhỏ trên đĩa lót */}
          <Cyl p={[0.06, 0.466, -0.1]} rt={0.052} rb={0.045} h={0.01} c="#f5ebe0" />
          <Cyl p={[0.06, 0.495, -0.1]} rt={0.034} rb={0.028} h={0.052} c="#fffbeb" rough={0.25} />
          <Cyl p={[-0.14, 0.466, 0.1]} rt={0.052} rb={0.045} h={0.01} c="#f5ebe0" />
          <Cyl p={[-0.14, 0.495, 0.1]} rt={0.034} rb={0.028} h={0.052} c="#fffbeb" rough={0.25} />
          {/* Đĩa bánh ngọt / Macaron Pastel */}
          <Cyl p={[0.1, 0.468, 0.09]} rt={0.1} rb={0.085} h={0.014} c="#ffffff" rough={0.2} />
          <Sph p={[0.07, 0.49, 0.07]} s={[0.028, 0.018, 0.028]} c="#f472b6" />
          <Sph p={[0.13, 0.49, 0.08]} s={[0.028, 0.018, 0.028]} c="#fde047" />
          <Sph p={[0.09, 0.49, 0.13]} s={[0.028, 0.018, 0.028]} c="#86efac" />
          <Cyl p={[0.1, 0.505, 0.04]} rt={0.032} rb={0.028} h={0.042} c="#fed7aa" />
          <Sph p={[0.1, 0.532, 0.04]} s={[0.018, 0.018, 0.018]} c="#e11d48" />
        </G>

        {/* 5. KỆ TẠP CHÍ NHỎ BẰNG GỖ & DA (MAGAZINE RACK) ĐẶT CẠNH GHẾ BÀNH */}
        <G p={[1.68, 0, -0.52]} r={[0, -0.45, 0]}>
          {[-0.18, 0.18].map((mx, mi) => (
            <group key={mi} position={[mx, 0, 0]}>
              <Cyl p={[0, 0.22, 0]} r={[0.38, 0, 0]} rt={0.014} h={0.48} c="#7c5335" />
              <Cyl p={[0, 0.22, 0]} r={[-0.38, 0, 0]} rt={0.014} h={0.48} c="#7c5335" />
            </group>
          ))}
          <B p={[0, 0.24, 0]} s={[0.34, 0.18, 0.22]} c="#d4a373" rough={0.8} />
          {/* Các cuốn tạp chí thời trang nhô lên */}
          <B p={[-0.04, 0.31, -0.03]} r={[0.25, 0, 0]} s={[0.22, 0.24, 0.018]} c="#f43f5e" />
          <B p={[0.04, 0.32, 0.03]} r={[-0.22, 0, 0]} s={[0.22, 0.25, 0.018]} c="#38bdf8" />
          <B p={[0, 0.33, 0]} r={[0.1, 0, 0]} s={[0.22, 0.24, 0.018]} c="#fde047" />
        </G>

        {/* 6. CHÚ MÈO NHỎ NẰM NGỦ TRÊN THẢM (SLEEPING KITTEN) */}
        <SleepingCat p={[-0.34, 0.034, -0.36]} />

        {/* 7. Cây đèn sàn (Floor Lamp) chụp trụ màu kem phát sáng vàng ấm ở góc phải */}
        <Interact
          hint="💡 Đèn sàn"
          onClick={() => useStore.getState().toggleGirlLamp()}
        >
          <G p={[2.18, 0, 0.42]}>
            <Cyl p={[0, 0.025, 0]} rt={0.22} rb={0.24} h={0.05} c="#1e2024" metal={0.5} />
            <Cyl p={[0, 0.78, 0]} rt={0.02} rb={0.024} h={1.5} c="#1e2024" metal={0.6} />
            <Cyl
              p={[0, 1.56, 0]}
              rt={0.23}
              rb={0.26}
              h={0.42}
              c="#fff7e2"
              emissive="#ffaa2b"
              ei={girlLampOn ? 2.8 : 0.15}
            />
            {girlLampOn && (
              <pointLight position={[0, 1.45, 0]} color="#ffaa33" intensity={1.15} distance={4.2} />
            )}
          </G>
        </Interact>
      </G>

      {/* =====================================================================
       * H. TỦ GỖ NHỎ ĐẦU CẦU THANG & GHẾ BĂNG DÀI BỌC NỆM KEM (STORAGE BENCH) ÁP SÁT TƯỜNG TRÁI
       * ===================================================================== */}
      <G p={[-7.32, Y, 1.55]}>
        <BB p={[0, 0, 0]} s={[0.62, 0.84, 1.12]} c="#c89b6e" rough={0.58} />
        <B p={[0, 0.42, 0]} s={[0.64, 0.025, 1.08]} c="#b08254" />
        <Cyl p={[0, 0.91, 0]} rt={0.11} rb={0.085} h={0.14} c="#f8fafc" />
        <Sph p={[0, 1.04, 0]} s={[0.15, 0.12, 0.15]} c="#15803d" />
      </G>

      {/* Ghế băng dài bọc nệm kem (Storage Bench) kèm gối tựa hồng đất áp sát tường bên trái (gần cửa trắng & đầu cầu thang) */}
      <Interact
        hint="🛋️ Ghế băng nệm kem"
        onClick={() => {
          const st = useStore.getState()
          st.setAvatarTarget([-8.65, Y, -2.7])
          st.notify('🛋️ Ghế băng dài bọc nệm Bouclé kem êm ái')
        }}
      >
        <G p={[-9.52, Y, -2.7]} r={[0, Math.PI / 2, 0]}>
          {/* Đế gỗ sồi ấm áp & thân ghế băng bọc nệm kem Bouclé */}
          <BB p={[0, 0, 0]} s={[1.86, 0.08, 0.54]} c="#b8895a" rough={0.55} />
          <BB p={[0, 0.08, 0]} s={[1.82, 0.3, 0.52]} c="#f5efe6" rough={0.92} />
          <BB p={[0, 0.38, 0]} s={[1.86, 0.09, 0.55]} c="#fbf9f5" rough={0.9} />
          {/* 2 Tay vịn cuộn tròn hai đầu ghế băng */}
          <Cyl p={[-0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#f3ece2" rough={0.9} />
          <Cyl p={[0.84, 0.5, 0]} r={[Math.PI / 2, 0, 0]} rt={0.085} h={0.52} c="#f3ece2" rough={0.9} />
          {/* 3 Gối tựa màu hồng đất (Dusty Rose / Terracotta) dựa vào tường trái */}
          <BB p={[-0.48, 0.47, -0.14]} r={[0.22, 0.08, 0]} s={[0.42, 0.28, 0.14]} c="#d9777f" rough={0.85} />
          <BB p={[0, 0.47, -0.15]} r={[0.2, 0, 0]} s={[0.4, 0.26, 0.14]} c="#e29587" rough={0.85} />
          <BB p={[0.48, 0.47, -0.14]} r={[0.22, -0.08, 0]} s={[0.42, 0.28, 0.14]} c="#c86454" rough={0.85} />
        </G>
      </Interact>
    </group>
  )
}

/* ---------- Chú mèo nhỏ nằm cuộn tròn ngủ ngoan trên thảm góc đọc sách ---------- */
function SleepingCat({ p }: { p: V3 }) {
  const bodyRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!bodyRef.current) return
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.035
    bodyRef.current.scale.set(1, s, 1)
  })
  return (
    <Interact
      hint="🐱 Mèo con đang ngủ"
      onClick={() => useStore.getState().notify('🐱 Meo~ Chú mèo nhỏ khẽ cựa mình ngủ tiếp...')}
    >
      <group position={p} rotation={[0, 0.65, 0]}>
        <group ref={bodyRef}>
          {/* Thân mèo cam/kem cuộn tròn ấm áp */}
          <Sph p={[0, 0.075, 0]} s={[0.17, 0.085, 0.14]} c="#f59e0b" rough={0.85} />
          <Sph p={[0.02, 0.08, 0.02]} s={[0.13, 0.078, 0.11]} c="#fbbf24" rough={0.85} />
          {/* Đầu mèo gối lên chân trước */}
          <Sph p={[0.12, 0.095, 0.05]} s={[0.085, 0.075, 0.08]} c="#f59e0b" rough={0.85} />
          {/* Mõm trắng kem & Mũi hồng */}
          <Sph p={[0.18, 0.08, 0.07]} s={[0.04, 0.032, 0.04]} c="#fffbeb" />
          <Sph p={[0.21, 0.088, 0.075]} s={[0.012, 0.01, 0.012]} c="#f472b6" />
          {/* 2 Tai mèo hình chóp nhọn */}
          <mesh position={[0.11, 0.165, 0.01]} rotation={[0.15, 0, -0.2]}>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
          <mesh position={[0.14, 0.165, 0.09]} rotation={[-0.15, 0, -0.2]}>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
          {/* Đuôi mèo vắt cong quanh mình */}
          <Cyl p={[-0.14, 0.045, 0.06]} r={[Math.PI / 2, 0, -0.6]} rt={0.022} rb={0.018} h={0.22} c="#d97706" />
          <Sph p={[-0.06, 0.045, 0.14]} s={[0.024, 0.02, 0.024]} c="#fffbeb" />
        </group>
      </group>
    </Interact>
  )
}

/* ============================================================================
 * 5. NHÂN VẬT BẠN GÁI (GIRLFRIEND AVATAR – ĐI BỘ ĐA TẦNG & DÙNG CHUNG TẤT CẢ ĐỒ ĐẠC)
 * ============================================================================ */
function GirlfriendAvatar({ hideIfUpstairs }: { hideIfUpstairs?: boolean }) {
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
        )

        // CHỐNG KẸT (Anti-stuck watchdog): tới sát 0.45m hoặc quá 4.2s tự động vào phase entering
        if ((distToEntry < 0.45 && distFloorY < 0.3) || walkWatchdog.current > 4.2) {
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
        const pNorm = Math.min(1, phaseTimer.current / 0.35)
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

        if (phaseTimer.current >= 0.35) {
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
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, rotX, k)

    const rotDiff = Math.atan2(
      Math.sin(rotY - root.current.rotation.y),
      Math.cos(rotY - root.current.rotation.y),
    )
    root.current.rotation.y += rotDiff * k

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

  const isHiddenByFloor1 = Boolean(hideIfUpstairs && walkFloorY.current > 2.0)
  const sleeping = girlActivity === 'sleep' || girlActivity === 'girl_sleep'

  return (
    <group
      ref={root}
      position={[-3.9, Y, -0.35]}
      visible={!isHiddenByFloor1}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().setActiveChar('girl')
      }}
    >
      {/* Bong bóng ngủ Zzz */}
      <group ref={zzzRef} position={[0, 1.55, 0.2]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial color="#fbcfe8" emissive="#f472b6" emissiveIntensity={1.1} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* Hai chân có khớp gối để ngồi/quỳ mượt mà */}
      <group ref={leftLeg} position={[-0.08, 0.56, 0]}>
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} />
        <group ref={leftKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f8fafc" />
        </group>
      </group>
      <group ref={rightLeg} position={[0.08, 0.56, 0]}>
        <Cyl p={[0, -0.14, 0]} rt={0.05} rb={0.044} h={0.26} c={SKIN} />
        <group ref={rightKnee} position={[0, -0.28, 0]}>
          <Cyl p={[0, -0.12, 0]} rt={0.044} rb={0.04} h={0.22} c={outfit.sock} />
          <BB p={[0, -0.28, 0.03]} s={[0.095, 0.06, 0.16]} c="#f8fafc" />
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
          <meshStandardMaterial color="#fce7f3" roughness={0.3} />
        </mesh>
        <mesh ref={remoteRef} position={[0.02, -0.41, 0.05]} visible={false}>
          <boxGeometry args={[0.036, 0.016, 0.1]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} />
        </mesh>
      </group>

      {/* Quyển sách đang mở khi đọc sách */}
      <group ref={bookRef} position={[0, 0.92, 0.25]} rotation={[-0.45, 0, 0]} visible={false}>
        <mesh position={[0, 0, -0.006]} castShadow>
          <boxGeometry args={[0.36, 0.24, 0.012]} />
          <meshStandardMaterial color="#831843" roughness={0.7} />
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

        {/* Mắt (nhắm khi ngủ), má hồng & kính cận */}
        <Sph p={[-0.06, 0.01, 0.162]} s={[0.018, sleeping ? 0.004 : 0.022, 0.01]} c="#18181b" />
        <Sph p={[0.06, 0.01, 0.162]} s={[0.018, sleeping ? 0.004 : 0.022, 0.01]} c="#18181b" />
        <Sph p={[-0.095, -0.03, 0.15]} s={[0.028, 0.016, 0.01]} c="#f472b6" />
        <Sph p={[0.095, -0.03, 0.15]} s={[0.028, 0.016, 0.01]} c="#f472b6" />

        {!sleeping && (
          <>
            <mesh position={[-0.062, 0.01, 0.17]}>
              <torusGeometry args={[0.038, 0.0045, 8, 24]} />
              <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh position={[0.062, 0.01, 0.17]}>
              <torusGeometry args={[0.038, 0.0045, 8, 24]} />
              <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.25} />
            </mesh>
            <B p={[0, 0.01, 0.17]} s={[0.045, 0.006, 0.006]} c="#b45309" />
          </>
        )}
      </group>
    </group>
  )
}
