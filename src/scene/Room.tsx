import { useMemo } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B } from './prims'
import { houseDropShadow, marbleTiles, rugWeave, woodFloor, woodSlats } from './textures'
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

  const dropShadowMap = useMemo(() => houseDropShadow(), [])

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
      {/* Bóng đổ studio mềm mại dưới đáy bệ móng giúp ngôi nhà 3D nổi khối vững chãi trên nền Radial Gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.8, -0.665, -0.12]}>
        <planeGeometry args={[30.5, 16.5]} />
        <meshBasicMaterial
          map={dropShadowMap}
          transparent
          opacity={darkMode ? 0.55 : 0.34}
          depthWrite={false}
        />
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

      {/* ---------- HỆ THỐNG TẤM TƯỜNG KIẾN TRÚC BÌNH THƯỜNG ĐỒNG MÀU VỚI CĂN PHÒNG (LUÔN CỐ ĐỊNH KHI XOAY) ---------- */}
      {/* 1. Tường sau: Chạy suốt toàn bộ chiều dài căn nhà từ phòng tắm đến phòng khách */}
      <B
        p={[-2.8, h / 2, -6.14]}
        s={[26.08, h, 0.2]}
        c={extWallColor}
        rough={0.9}
        shadow
      />
      {/* Lớp sơn mặt trong tường sau phòng tắm (x: -15.6 .. -10.0) đồng màu với phòng tắm */}
      <B
        p={[-12.8, h / 2, -6.01]}
        s={[5.6, h, 0.04]}
        c={darkMode ? '#3e3a34' : '#f5f0e8'}
        rough={0.88}
        shadow={false}
        polyOffset
      />
      {/* Lớp sơn mặt trong tường sau phòng ngủ (x: -10.0 .. -0.8) đồng màu phòng ngủ */}
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

      {/* 2. Tường bên trái phòng tắm: Tấm tường bình thường đồng màu với căn phòng */}
      <B
        p={[-15.72, h / 2, -0.12]}
        s={[0.24, h, 12.24]}
        c={extWallColor}
        rough={0.9}
        shadow
      />
      {/* Lớp sơn mặt trong tường trái phòng tắm đồng màu phòng tắm */}
      <B
        p={[-15.56, h / 2, 0.0]}
        s={[0.04, h, 11.9]}
        c={darkMode ? '#3e3a34' : '#f5f0e8'}
        rough={0.88}
        shadow={false}
        polyOffset
      />
      <B p={[-15.54, 0.07, 0.0]} s={[0.04, 0.14, 11.9]} c="#8a7968" shadow={false} polyOffset />

      {/* 3. Vách ngăn giữa phòng tắm và phòng ngủ (tại x = -10, có ô cửa thông phòng tại z = -3.4) */}
      <B p={[-10.0, h / 2, -5.05]} s={[0.22, h, 1.9]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow />
      <B p={[-9.87, 0.07, -5.05]} s={[0.03, 0.14, 1.9]} c="#3d271a" shadow={false} polyOffset />
      <B p={[-10.0, 3.45, -3.4]} s={[0.22, 1.8, 1.4]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow />
      <B p={[-10.0, h / 2, 1.65]} s={[0.22, h, 8.7]} c={darkMode ? '#a59382' : '#e4d4c2'} rough={0.92} shadow />
      <B p={[-9.87, 0.07, 1.65]} s={[0.03, 0.14, 8.7]} c="#3d271a" shadow={false} polyOffset />

      {/* Ốp gỗ lam dọc đầu giường (Walnut Wainscot) + Đèn LED hắt ngang đầu giường */}
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

      {/* 4. Tường bên phải: Tấm tường bình thường đồng màu với căn phòng */}
      <B
        p={[10.14, h / 2, -0.12]}
        s={[0.2, h, 12.24]}
        c={extWallColor}
        rough={0.9}
        shadow
      />
      <B
        p={[10.01, h / 2, 0.0]}
        s={[0.04, h, 12.0]}
        c={darkMode ? '#202125' : '#2f3034'}
        rough={0.88}
        shadow={false}
        polyOffset
      />

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
  const weather = useStore((s) => s.weather)
  const graphicMode = useStore((s) => s.graphicMode)
  const lampOn = useStore((s) => s.lampOn)
  const floor1HeadboardLedOn = useStore((s) => s.floor1HeadboardLedOn)
  const tvOn = useStore((s) => s.tvOn)
  const pcState = useStore((s) => s.pcState)
  const shadowResolution = graphicMode === 'hd' ? 2048 : 1024

  // Tùy chỉnh màu sắc & cường độ theo chế độ thời tiết (Nắng ấm / Hoàng hôn / Mưa / Đêm)
  const hemiSky = darkMode
    ? '#1e2538'
    : weather === 'sunset'
      ? '#fde68a'
      : weather === 'rain'
        ? '#94a3b8'
        : '#fff6ea'
  const hemiGround = darkMode
    ? '#08090e'
    : weather === 'sunset'
      ? '#7c2d12'
      : weather === 'rain'
        ? '#334155'
        : '#5c4532'
  const hemiIntensity = darkMode ? 0.10 : weather === 'sunset' ? 0.72 : weather === 'rain' ? 0.48 : 0.62

  const sunColor = darkMode
    ? '#5872a8'
    : weather === 'sunset'
      ? '#fb923c'
      : weather === 'rain'
        ? '#cbd5e1'
        : '#fff2df'
  const sunIntensity = darkMode
    ? 0.12
    : weather === 'sunset'
      ? 1.95
      : weather === 'rain'
        ? 0.78
        : 1.75
  const sunPos: [number, number, number] = weather === 'sunset' ? [-14, 16, 20] : [-10, 24, 17]

  const ambientColor = darkMode
    ? '#1a2238'
    : weather === 'sunset'
      ? '#fed7aa'
      : weather === 'rain'
        ? '#94a3b8'
        : '#ffeedd'
  const ambientIntensity = darkMode
    ? 0.04
    : weather === 'sunset'
      ? 0.32
      : weather === 'rain'
        ? 0.38
        : 0.24

  return (
    <>
      <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Ánh sáng mặt trời chính: khung shadow camera ôm khít ngôi nhà, mapSize 2048x2048 cực nét, bias chuẩn */}
      <directionalLight
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[shadowResolution, shadowResolution]}
        shadow-camera-left={-16.5}
        shadow-camera-right={11.5}
        shadow-camera-top={13.5}
        shadow-camera-bottom={-10.5}
        shadow-camera-near={4}
        shadow-camera-far={44}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />

      {/* Ánh sáng phụ phía sau-trái giúp mặt ngoài tường sau & tường trái sáng rõ đều màu */}
      <directionalLight
        position={[-16, 14, -20]}
        intensity={darkMode ? 0.04 : 0.55}
        color={darkMode ? '#5872a8' : '#fff6eb'}
      />

      {/* 3 PointLight bao quát 3 vùng kiến trúc chính không đổ bóng (castShadow = false) để tối ưu GPU */}
      {/* 1. Vùng Tầng 1: phòng ngủ & phòng khách ấm áp */}
      <pointLight
        position={[-1.2, 3.3, -0.5]}
        intensity={darkMode ? 0.45 : 1.15}
        distance={14}
        decay={2}
        color={darkMode ? '#8da8ff' : '#ffeed4'}
        castShadow={false}
      />

      {/* 2. Vùng Tầng 2: phòng ngủ & góc làm việc trên gác */}
      <pointLight
        position={[0.2, 7.6, -1.0]}
        intensity={darkMode ? 0.40 : 1.05}
        distance={13}
        decay={2}
        color={darkMode ? '#8da8ff' : '#fff1db'}
        castShadow={false}
      />

      {/* 3. Vùng Phòng tắm Master: đá cẩm thạch trắng sáng trong trẻo */}
      <pointLight
        position={[-12.8, 3.3, -0.5]}
        intensity={darkMode ? 0.35 : 1.1}
        distance={9}
        decay={2}
        color={darkMode ? '#a5b4fc' : '#fff5eb'}
        castShadow={false}
      />

      {/* Đèn tương tác chủ động Tầng 1 (castShadow = false để không gây lag nhưng vẫn phản hồi ánh sáng chân thực khi bật/tắt) */}
      {lampOn && (
        <pointLight
          position={[8.75, 1.85, 0.95]}
          intensity={darkMode ? 5.2 : 2.8}
          distance={6.5}
          decay={2}
          color="#ffb155"
          castShadow={false}
        />
      )}
      {floor1HeadboardLedOn && (
        <pointLight
          position={[-3.25, 1.75, -5.2]}
          intensity={darkMode ? 3.2 : 1.6}
          distance={5.2}
          decay={2}
          color="#ffae42"
          castShadow={false}
        />
      )}
      {tvOn && graphicMode === 'hd' && (
        <pointLight
          position={[8.9, 1.65, 2.35]}
          intensity={darkMode ? 1.8 : 0.85}
          distance={4.2}
          decay={2}
          color="#7cc4ff"
          castShadow={false}
        />
      )}
      {pcState !== 'off' && graphicMode === 'hd' && (
        <pointLight
          position={[2.85, 1.35, -5.1]}
          intensity={darkMode ? 1.4 : 0.65}
          distance={3.2}
          decay={2}
          color={pcState === 'rgb' ? '#c084fc' : '#60a5fa'}
          castShadow={false}
        />
      )}
    </>
  )
}
