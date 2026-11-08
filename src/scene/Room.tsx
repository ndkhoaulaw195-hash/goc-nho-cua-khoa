import { useMemo } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B } from './prims'
import { GlassCurtainWall } from './GlassCurtainWall'
import { marbleTiles, rugWeave, woodFloor, woodSlats } from './textures'
import { useStore } from '../store'

export const ROOM = { w: 20, d: 12, h: 4.35 }

function Interact({
  hint,
  onClick,
  children,
}: {
  hint: string
  onClick: (e: ThreeEvent<MouseEvent>) => void
  children: React.ReactNode
}) {
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        useStore.setState({ hoverHint: hint })
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
        useStore.setState({ hoverHint: null })
      }}
    >
      {children}
    </group>
  )
}

export function Room() {
  const darkMode = useStore((s) => s.darkMode)
  const avatarTarget = useStore((s) => s.avatarTarget)
  const cutWalls = useStore((s) => s.cutWalls)
  const floor1HeadboardLedOn = useStore((s) => s.floor1HeadboardLedOn)
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
          roughness={0.42}
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

      {/* ---------- HỆ THỐNG VÁCH TƯỜNG KIẾN TRÚC: HIỂN THỊ TƯỜNG ĐẶC KHI NHÌN TỪ TRONG, VÁCH KÍNH HIỆN ĐẠI KHI CẮT LÁT ---------- */}
      {/* 1. Tường sau: Phòng tắm lắp vách kính mờ nguyên khối kiến trúc, phòng khách/ngủ giữ tường be ấm cúng */}
      {!cutWalls.back ? (
        <>
          {/* Tường sau khu vực phòng ngủ & phòng khách (x: -10.0 .. +10.48) */}
          <B
            p={[0.24, h / 2, -6.14]}
            s={[20.48, h, 0.2]}
            c={extWallColor}
            rough={0.9}
            shadow={false}
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
          {/* Vách kính mờ mặt sau phòng tắm (x: -15.6 .. -10.0): Che chắn sang trọng, đồng bộ với vách trước và vách trái */}
          <GlassCurtainWall pos={[-12.8, h / 2, -6.0]} size={[5.6, h]} orientation="z" />
          <B p={[-12.8, h - 0.06, -5.98]} s={[5.4, 0.035, 0.04]} c="#fff4dc" emissive="#ffb854" ei={2.2} shadow={false} />
        </>
      ) : (
        <GlassCurtainWall pos={[-2.8, h / 2, -6.04]} size={[26.08, h]} orientation="z" numPanels={8} />
      )}

      {/* 2. Tường trái phòng tắm: Thay thế bằng Vách kính hiện đại khi camera nhìn từ bên trái */}
      {!cutWalls.left ? (
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
      ) : (
        <GlassCurtainWall pos={[-15.6, h / 2, -0.12]} size={[12.24, h]} orientation="x" numPanels={4} />
      )}

      {/* 3. Vách ngăn giữa phòng tắm và phòng ngủ (tại x = -10, có ô cửa thông phòng tại z = -3.4) */}
      <B p={[-10.0, h / 2, -5.05]} s={[0.22, h, 1.9]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-9.87, 0.07, -5.05]} s={[0.03, 0.14, 1.9]} c="#3d271a" shadow={false} polyOffset />
      <B p={[-10.0, 3.45, -3.4]} s={[0.22, 1.8, 1.4]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-10.0, h / 2, 1.65]} s={[0.22, h, 8.7]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow={false} />
      <B p={[-9.87, 0.07, 1.65]} s={[0.03, 0.14, 8.7]} c="#3d271a" shadow={false} polyOffset />

      {/* 3b. Vách kính mặt trước phòng tắm: Che chắn mặt cắt phía trước phòng tắm kín đáo, thẩm mỹ, kính mờ nhìn thấu bên trong */}
      <GlassCurtainWall pos={[-12.8, h / 2, 6.0]} size={[5.6, h]} orientation="z" />

      {/* 3c. Trần kính mờ nóc phòng tắm (Glass Skylight Ceiling): Che chắn nóc phòng tắm tinh tế, mờ mờ nhìn thấu bên trong */}
      <group position={[-12.8, h, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.6, 12.0]} />
          <meshStandardMaterial
            color="#d8edfb"
            transparent
            opacity={0.16}
            roughness={0.12}
            metalness={0.15}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <B p={[0, 0.02, -6.0]} s={[5.64, 0.04, 0.05]} c="#1e2024" metal={0.8} rough={0.3} shadow={false} />
        <B p={[0, 0.02, 6.0]} s={[5.64, 0.04, 0.05]} c="#1e2024" metal={0.8} rough={0.3} shadow={false} />
        <B p={[-2.8, 0.02, 0]} s={[0.05, 0.04, 12.0]} c="#1e2024" metal={0.8} rough={0.3} shadow={false} />
        <B p={[2.8, 0.02, 0]} s={[0.05, 0.04, 12.0]} c="#1e2024" metal={0.8} rough={0.3} shadow={false} />
      </group>

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
          {/* Dải đèn LED hắt ngang đầu giường: Click trực tiếp để bật/tắt */}
          <Interact
            hint={floor1HeadboardLedOn ? '✨ Tắt đèn LED đầu giường' : '✨ Bật đèn LED đầu giường'}
            onClick={() => useStore.getState().toggleFloor1HeadboardLed()}
          >
            <B
              p={[-3.25, 1.48, -d / 2 + 0.06]}
              s={[4.88, 0.035, 0.04]}
              c={floor1HeadboardLedOn ? '#ffdfa0' : '#4a301e'}
              emissive={floor1HeadboardLedOn ? '#ffae42' : '#000000'}
              ei={floor1HeadboardLedOn ? (darkMode ? 2.8 : 1.9) : 0}
              shadow={false}
            />
          </Interact>
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

      {/* 4. Tường bên phải: Thay thế bằng Vách kính hiện đại khi camera xoay sang bên phải */}
      {!cutWalls.right ? (
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
      ) : (
        <GlassCurtainWall pos={[10.04, h / 2, -0.12]} size={[12.24, h]} orientation="x" numPanels={6} />
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
  const graphicMode = useStore((s) => s.graphicMode)
  const shadowResolution = graphicMode === 'hd' ? 2048 : 1024

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

      {/* Ánh sáng mặt trời chính: khung shadow camera ôm khít ngôi nhà, mapSize 2048x2048 cực nét, bias chuẩn */}
      <directionalLight
        position={[-9, 22, 16]}
        intensity={darkMode ? 0.45 : 1.85}
        color={darkMode ? '#8da8ff' : '#fff2df'}
        castShadow
        shadow-mapSize={[shadowResolution, shadowResolution]}
        shadow-camera-left={-16}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-12}
        shadow-camera-near={2}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />

      {/* Ánh sáng phụ phía sau-trái giúp mặt ngoài tường sau & tường trái sáng rõ đều màu */}
      <directionalLight
        position={[-16, 14, -20]}
        intensity={darkMode ? 0.18 : 0.75}
        color={darkMode ? '#8da8ff' : '#fff6eb'}
      />

      {/* 3 PointLight bao quát 3 vùng kiến trúc chính không đổ bóng (castShadow = false) để tối ưu GPU */}
      {/* 1. Vùng Tầng 1: phòng ngủ & phòng khách ấm áp */}
      <pointLight
        position={[-1.2, 3.2, -0.5]}
        intensity={darkMode ? 3.2 : 1.8}
        distance={14}
        decay={2}
        color={darkMode ? '#8da8ff' : '#ffeed4'}
        castShadow={false}
      />

      {/* 2. Vùng Tầng 2: phòng ngủ & góc làm việc trên gác */}
      <pointLight
        position={[0.2, 7.5, -1.0]}
        intensity={darkMode ? 3.0 : 1.6}
        distance={13}
        decay={2}
        color={darkMode ? '#8da8ff' : '#fff1db'}
        castShadow={false}
      />

      {/* 3. Vùng Phòng tắm Master: đá cẩm thạch trắng sáng trong trẻo */}
      <pointLight
        position={[-12.8, 3.2, -0.5]}
        intensity={darkMode ? 2.6 : 1.5}
        distance={9}
        decay={2}
        color={darkMode ? '#a5b4fc' : '#fff5eb'}
        castShadow={false}
      />
    </>
  )
}
