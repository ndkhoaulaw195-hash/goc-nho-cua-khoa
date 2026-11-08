import { useMemo } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B } from './prims'
import { marbleTiles, rugWeave, woodFloor, woodSlats } from './textures'
import { useStore } from '../store'

export const ROOM = { w: 20, d: 12, h: 4.35 }

export function Room() {
  const darkMode = useStore((s) => s.darkMode)
  const avatarTarget = useStore((s) => s.avatarTarget)
  const cutWalls = useStore((s) => s.cutWalls)
  const extWallColor = darkMode ? '#3a342e' : '#dfd5c7'

  const floorMap = useMemo(() => {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 2.7)
    t.needsUpdate = true
    return t
  }, [])

  const slatMap = useMemo(() => {
    const t = woodSlats().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.5, 1)
    t.needsUpdate = true
    return t
  }, [])

  const marbleMap = useMemo(() => {
    const t = marbleTiles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 2.8)
    t.needsUpdate = true
    return t
  }, [])

  const { w, d, h } = ROOM

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const st = useStore.getState()
    if (st.mode !== 'orbit') return
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -14.8, 9.1)
    const z = THREE.MathUtils.clamp(p.z, -5.1, 5.2)
    st.setAvatarTarget([x, 0, z])
  }

  return (
    <group>
      {/* Nền Studio bao quanh mô hình: TẮT receiveShadow để tuyệt đối không in bóng đen bẩn thỉu của đồ đạc bên ngoài nhà */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} receiveShadow={false}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color={darkMode ? '#0d1017' : '#ece6dd'} roughness={0.98} />
      </mesh>

      {/* Lớp sàn lót kiến trúc màu sáng (từ y = -0.07 đến y = -0.015) ngăn cách hoàn toàn mặt sàn với đế đen */}
      <B p={[-2.8, -0.042, 0]} s={[25.6, 0.055, 12.0]} c={darkMode ? '#3e342b' : '#d8cbb8'} rough={0.85} shadow={false} />

      {/* Bệ móng đen (base plinth) đặt hẳn bên dưới mặt sàn (y < -0.07) để tuyệt đối không Z-fighting với sàn phòng tắm & chân cầu thang */}
      <B p={[-2.8, -0.32, -0.12]} s={[26.08, 0.5, 12.24]} c={darkMode ? '#1c1510' : '#2b1d14'} rough={0.8} shadow={false} />
      <B p={[-2.8, -0.6, -0.12]} s={[26.28, 0.1, 12.44]} c="#18110c" rough={0.85} shadow={false} />

      {/* Mặt sàn gỗ óc chó phòng ngủ & phòng khách (tách biệt hoàn toàn tại x: -10 .. +10, y = 0.0) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleFloorClick}
        onDoubleClick={handleFloorClick}
      >
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          map={floorMap}
          roughness={0.54}
          metalness={0.05}
          color={darkMode ? '#b59e8a' : '#ffffff'}
        />
      </mesh>

      {/* Mặt sàn đá cẩm thạch trắng Carrara của Phòng tắm (tách biệt hoàn toàn tại x: -15.6 .. -10.0, y = 0.0) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-12.8, 0, 0.0]}
        receiveShadow
        onClick={handleFloorClick}
        onDoubleClick={handleFloorClick}
      >
        <planeGeometry args={[5.6, 12.0]} />
        <meshStandardMaterial
          map={marbleMap}
          roughness={0.32}
          metalness={0.12}
          color={darkMode ? '#c4c0b8' : '#ffffff'}
        />
      </mesh>

      {avatarTarget && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[avatarTarget[0], avatarTarget[1] + 0.032, avatarTarget[2]]}>
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
        </mesh>
      )}

      {/* ---------- HỆ THỐNG VÁCH TƯỜNG KIẾN TRÚC ĐỒNG NHẤT MÀU KEM/BE BÊN NGOÀI + TỰ ĐỘNG ẨN TƯỜNG KHI XOAY CAMERA ---------- */}
      {/* 1. Tường sau: Ẩn hoàn toàn khi camera xoay ra phía sau để luôn nhìn thấu nội thất bên trong không bị che khuất */}
      {!cutWalls.back && (
        <>
          <B
            p={[-2.8, h / 2, -6.14]}
            s={[26.08, h, 0.2]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />
          {/* Lớp sơn mặt trong tường sau phòng tắm (x: -15.6 .. -10.0) */}
          <B
            p={[-12.8, h / 2, -6.01]}
            s={[5.6, h, 0.04]}
            c={darkMode ? '#3a3836' : '#ede8e1'}
            rough={0.9}
            shadow={false}
            polyOffset
          />
          {/* Lớp sơn mặt trong tường sau phòng ngủ (x: -10.0 .. -0.8) */}
          <B
            p={[-5.4, h / 2, -6.01]}
            s={[9.2, h, 0.04]}
            c={darkMode ? '#aa9887' : '#e6d6c4'}
            rough={0.92}
            shadow={false}
            polyOffset
          />
          {/* Lớp sơn mặt trong tường sau khu vực bàn máy tính & phòng khách (x: -0.8 .. +10.0) */}
          <B
            p={[4.6, h / 2, -6.01]}
            s={[10.8, h, 0.04]}
            c={darkMode ? '#222327' : '#333438'}
            rough={0.88}
            shadow={false}
            polyOffset
          />
          {/* Cửa sổ lấy sáng trên cao mặt trong phòng tắm */}
          <B p={[-13.8, 3.25, -5.96]} s={[1.65, 0.65, 0.03]} c="#dbeafe" opacity={0.65} rough={0.2} metal={0.3} shadow={false} polyOffset />
          <B p={[-13.8, 3.25, -5.97]} s={[1.72, 0.72, 0.02]} c="#27272a" shadow={false} polyOffset />
          <B p={[-12.8, h - 0.1, -5.94]} s={[5.4, 0.035, 0.04]} c="#fff4dc" emissive="#ffb854" ei={2.2} shadow={false} />
        </>
      )}

      {/* 2. Tường trái phòng tắm: Ẩn hoàn toàn khi camera xoay sang bên trái */}
      {!cutWalls.left && (
        <>
          <B
            p={[-15.72, h / 2, -0.12]}
            s={[0.24, h, 12.24]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />
          <B p={[-15.56, 0.07, 0.0]} s={[0.04, 0.14, 11.9]} c="#8a7968" shadow={false} polyOffset />
          <B p={[-15.56, 3.25, 2.2]} s={[0.03, 0.65, 1.8]} c="#dbeafe" opacity={0.65} rough={0.2} metal={0.3} shadow={false} polyOffset />
          <B p={[-15.57, 3.25, 2.2]} s={[0.02, 0.72, 1.88]} c="#27272a" shadow={false} polyOffset />
        </>
      )}

      {/* 3. Vách ngăn giữa phòng tắm và phòng ngủ (tại x = -10, có ô cửa thông phòng tại z = -3.4) */}
      <B p={[-10.0, h / 2, -5.05]} s={[0.22, h, 1.9]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-9.87, 0.07, -5.05]} s={[0.03, 0.14, 1.9]} c="#3d271a" shadow={false} polyOffset />
      <B p={[-10.0, 3.45, -3.4]} s={[0.22, 1.8, 1.4]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-10.0, h / 2, 1.65]} s={[0.22, h, 8.7]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-9.87, 0.07, 1.65]} s={[0.03, 0.14, 8.7]} c="#3d271a" shadow={false} polyOffset />

      {/* Ốp gỗ lam dọc đầu giường (Walnut Wainscot) + Đèn LED hắt ngang đầu giường */}
      {!cutWalls.back && (
        <>
          <mesh position={[-3.25, 0.72, -d / 2 + 0.06]} receiveShadow>
            <boxGeometry args={[4.9, 1.44, 0.06]} />
            <meshStandardMaterial
              map={slatMap}
              roughness={0.68}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          <B p={[-3.25, 1.45, -d / 2 + 0.07]} s={[4.92, 0.04, 0.08]} c="#4a301e" shadow={false} polyOffset />
          <B
            p={[-3.25, 1.48, -d / 2 + 0.06]}
            s={[4.88, 0.035, 0.04]}
            c="#ffdfa0"
            emissive="#ffae42"
            ei={darkMode ? 2.8 : 1.9}
            shadow={false}
          />
          <B p={[-5.4, h - 0.08, -d / 2 + 0.08]} s={[9.2, 0.16, 0.12]} c={darkMode ? '#b09e8c' : '#ebdccc'} shadow={false} polyOffset />
          <B
            p={[-5.4, h - 0.17, -d / 2 + 0.07]}
            s={[9.1, 0.045, 0.05]}
            c="#ffe2a8"
            emissive="#ffae42"
            ei={darkMode ? 3.0 : 2.1}
            shadow={false}
          />
        </>
      )}

      {/* 4. Tường bên phải: Tự động ẩn khi camera xoay sang bên phải */}
      {!cutWalls.right && (
        <>
          <B
            p={[10.14, h / 2, -0.12]}
            s={[0.2, h, 12.24]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
          />
          <B
            p={[10.01, h / 2, 0.0]}
            s={[0.04, h, 12.0]}
            c={darkMode ? '#202125' : '#2f3034'}
            rough={0.88}
            shadow={false}
            polyOffset
          />
        </>
      )}

      {/* Thảm dệt theo đúng bố cục (nâng lên y = 0.024 và bật polygonOffset chống Z-fighting tuyệt đối) */}
      {/* 1. Thảm lớn dưới giường ngủ */}
      <Rug p={[-2.6, 0, -3.35]} s={[4.2, 4.5]} c={darkMode ? '#8e8a84' : '#c7c2ba'} onDoubleClick={handleFloorClick} />
      {/* 2. Thảm khu vực nhà gỗ thú cưng */}
      <Rug p={[-7.1, 0, 0.35]} s={[3.6, 2.9]} c={darkMode ? '#8a857e' : '#c2bdb5'} onDoubleClick={handleFloorClick} />
      {/* 3. Thảm lớn khu vực Sofa & TV phòng khách */}
      <Rug p={[4.35, 0, 2.35]} s={[6.1, 4.4]} c={darkMode ? '#8e8a84' : '#c7c2ba'} onDoubleClick={handleFloorClick} />
      {/* 4. Thảm tối màu dưới ghế bàn máy tính */}
      <Rug p={[2.85, 0, -4.35]} s={[2.5, 1.8]} c={darkMode ? '#333130' : '#4a4745'} onDoubleClick={handleFloorClick} />
    </group>
  )
}

function Rug({
  p,
  s,
  c,
  onDoubleClick,
}: {
  p: [number, number, number]
  s: [number, number]
  c: string
  onDoubleClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  const map = useMemo(() => rugWeave(c), [c])
  return (
    <mesh position={[p[0], 0.024, p[2]]} receiveShadow onClick={onDoubleClick} onDoubleClick={onDoubleClick}>
      <boxGeometry args={[s[0], 0.02, s[1]]} />
      <meshStandardMaterial
        map={map}
        roughness={0.96}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}

export function Lights() {
  const darkMode = useStore((s) => s.darkMode)
  const lampOn = useStore((s) => s.lampOn)
  const curtainsOpen = useStore((s) => s.curtainsOpen)
  const pcState = useStore((s) => s.pcState)
  const tvOn = useStore((s) => s.tvOn)

  return (
    <>
      <hemisphereLight
        args={[
          darkMode ? '#3b4d7a' : '#fff6ea',
          darkMode ? '#1a1410' : '#6e523c',
          darkMode ? 0.35 : 0.88,
        ]}
      />
      <ambientLight intensity={darkMode ? 0.22 : 0.36} color={darkMode ? '#9cb4ff' : '#ffeedd'} />

      {/* Ánh sáng mặt trời chính tạo bóng đổ mềm mại như studio 3D */}
      <directionalLight
        position={[-9, 22, 16]}
        intensity={darkMode ? 0.45 : 1.8}
        color={darkMode ? '#8da8ff' : '#fff2df'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-14}
        shadow-camera-near={2}
        shadow-camera-far={50}
        shadow-bias={-0.0015}
        shadow-normalBias={0.06}
      />

      {/* Ánh sáng phụ phía sau-trái giúp mặt ngoài tường sau & tường trái sáng rõ đều màu */}
      <directionalLight
        position={[-16, 14, -20]}
        intensity={darkMode ? 0.18 : 0.75}
        color={darkMode ? '#8da8ff' : '#fff6eb'}
      />
      <pointLight
        position={[9.1, 2.3, -1.0]}
        intensity={curtainsOpen ? (darkMode ? 2.2 : 6.5) : 1.2}
        distance={11}
        color={darkMode ? '#8ab4ff' : '#fff5e4'}
      />

      {/* Đèn LED hắt trần & đầu giường ấm áp (luôn toả ánh vàng ấm như ảnh mẫu) */}
      <pointLight
        position={[-5.2, 3.85, -4.8]}
        intensity={darkMode ? 5.5 : 3.6}
        distance={8}
        color="#ffbe66"
      />
      <pointLight
        position={[-2.6, 1.65, -4.9]}
        intensity={darkMode ? 4.8 : 3.2}
        distance={6}
        color="#ffb85c"
      />

      {/* Đèn ngủ trên tab đầu giường & đèn bàn góc phải */}
      <pointLight
        position={[-0.65, 1.15, -5.35]}
        intensity={darkMode ? 5.2 : 3.4}
        distance={5.5}
        color="#ffbe64"
      />
      <pointLight
        position={[7.55, 1.25, -5.35]}
        intensity={darkMode ? 5.0 : 3.4}
        distance={6}
        color="#ffbe64"
      />

      {/* Đèn rọi tranh hướng dương & 3 khung ảnh kỷ niệm */}
      <pointLight
        position={[1.5, 3.6, -5.1]}
        intensity={darkMode ? 4.2 : 2.8}
        distance={5.5}
        color="#ffd285"
      />

      {/* Đèn cây đứng góc phải trước (bật/tắt được) */}
      {lampOn && (
        <pointLight
          position={[8.75, 1.95, 3.45]}
          intensity={darkMode ? 9.5 : 5.5}
          distance={8.5}
          color="#ffbe64"
        />
      )}

      {pcState !== 'off' && (
        <pointLight
          position={[2.85, 1.55, -4.5]}
          intensity={darkMode ? 4.5 : 2.4}
          distance={5}
          color={pcState === 'rgb' ? '#d946ef' : '#9cc7ff'}
        />
      )}

      {tvOn && (
        <pointLight
          position={[4.15, 1.45, 0.85]}
          intensity={darkMode ? 6.0 : 2.8}
          distance={6}
          color="#818cf8"
        />
      )}

      {/* Đèn trần phòng tắm sang trọng & Đèn gương LED */}
      <pointLight
        position={[-12.8, 3.4, -2.5]}
        intensity={darkMode ? 4.8 : 2.8}
        distance={7.5}
        color="#fff1db"
      />
      <pointLight
        position={[-12.4, 2.2, -5.2]}
        intensity={darkMode ? 3.8 : 2.2}
        distance={4.5}
        color="#ffe8c2"
      />
    </>
  )
}
