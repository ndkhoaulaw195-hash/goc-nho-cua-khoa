import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ArchitecturalTree, HedgeRow } from './Botanicals'
import { B, BB, Cyl, G, RBB, Sph } from './prims'
import { outdoorWoodDeck, travertineStone, whitePebbles } from './textures'
import type { V3 } from '../data/config'

/**
 * Quy hoạch Cảnh quan Biệt thự Nghỉ dưỡng (Resort Courtyard & Pool Landscaping)
 * Gồm: Đế nền đá mở rộng, Tường rào lam gỗ bao quanh, Lối vào đá bước nổi trên hồ nước + LED hắt gầm,
 * Hồ bơi vô cực mini + Sundeck ghế tắm nắng, Khu Lounge Firepit ngoài trời + Sỏi trắng, Cây xanh đa tầng & Uplight.
 */
export function LuxuryLandscaping({
  darkMode,
  onYardClick,
}: {
  darkMode: boolean
  onYardClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const lawnColor = darkMode ? '#2C3D28' : '#4C6442'
  const lawnAccent = darkMode ? '#34482F' : '#5B7450'
  const patioDark = darkMode ? '#252930' : '#3A3F47'
  const stoneBorder = darkMode ? '#4B5058' : '#8D8982'
  const plinthColor = '#1E2126'
  const earthDeep = darkMode ? '#1A1816' : '#322C26'
  const soilColor = darkMode ? '#25201C' : '#42382F'

  const travertineMap = useMemo(() => {
    const t = travertineStone().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.5, 1.2)
    t.needsUpdate = true
    return t
  }, [])

  const pebbleMap = useMemo(() => {
    const t = whitePebbles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.8, 5.2)
    t.needsUpdate = true
    return t
  }, [])

  const pebbleWideMap = useMemo(() => {
    const t = whitePebbles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 3.2)
    t.needsUpdate = true
    return t
  }, [])

  const deckMap = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 4.0)
    t.needsUpdate = true
    return t
  }, [])

  const sideWalkDeckMap = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.6, 5.5)
    t.needsUpdate = true
    return t
  }, [])

  const pondWaterMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: darkMode ? '#1F5C6E' : '#318DA1',
        roughness: 0.08,
        metalness: 0.14,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      }),
    [darkMode],
  )

  const poolWaterMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: darkMode ? '#1B8DA8' : '#2AC0D4',
        roughness: 0.1,
        metalness: 0.12,
        clearcoat: 0.95,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
      }),
    [darkMode],
  )

  const flameRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!flameRef.current) return
    const t = clock.elapsedTime
    flameRef.current.children.forEach((child, idx) => {
      const s = 0.92 + Math.sin(t * 7.5 + idx * 1.9) * 0.16
      child.scale.set(1, s, 1)
    })
  })

  const yardClickHandler = onYardClick
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onYardClick(e)
      }
    : undefined

  return (
    <group>
      {/* =====================================================================
       * 1. NỀN ĐẤT MỞ RỘNG & ĐẾ VIỀN ĐÁ TỐI MÀU (x: -22.4..+17.2, z: -10.2..+16.2)
       * ===================================================================== */}
      <B p={[-2.6, -1.42, 3.0]} s={[40.4, 0.22, 27.2]} c={plinthColor} rough={0.85} shadow={false} />
      <B p={[-2.6, -0.82, 3.0]} s={[39.8, 0.98, 26.6]} c={earthDeep} rough={0.94} shadow={false} />
      <B p={[-2.6, -0.34, 3.0]} s={[39.6, 0.1, 26.4]} c={soilColor} rough={0.92} shadow={false} />

      {/* Viền ốp đá tối màu bao quanh 4 cạnh bệ khuôn viên biệt thự */}
      <B p={[-2.6, -0.25, -10.12]} s={[40.0, 0.22, 0.24]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[-2.6, -0.25, 16.12]} s={[40.0, 0.22, 0.24]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[-22.48, -0.25, 3.0]} s={[0.24, 0.22, 26.48]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[17.28, -0.25, 3.0]} s={[0.24, 0.22, 26.48]} c={plinthColor} rough={0.78} shadow={false} />

      {/* Chân tường móng đá bao quanh chu vi sàn Tầng 1 (y: -0.30..0.00) */}
      <B p={[-2.8, -0.15, -6.14]} s={[26.16, 0.3, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-2.8, -0.15, 6.14]} s={[26.16, 0.3, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-15.74, -0.15, 0]} s={[0.28, 0.3, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[10.14, -0.15, 0]} s={[0.28, 0.3, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />

      {/* =====================================================================
       * 2. THẢM CỎ CẢNH QUAN PHÂN VÙNG RÕ RÀNG (top y = -0.20)
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        {/* Cỏ sân sau (z: -10.0..-6.28) */}
        <B p={[-2.6, -0.245, -8.14]} s={[39.5, 0.09, 3.72]} c={lawnColor} rough={0.88} />
        {/* Cỏ hông trái (x: -22.35..-15.88, z: -6.28..+7.1) + dải ngoài Firepit (x: -22.35..-17.3, z: +7.1..+16.0) */}
        <B p={[-19.12, -0.245, 0.41]} s={[6.47, 0.09, 13.38]} c={lawnColor} rough={0.88} />
        <B p={[-19.82, -0.245, 11.55]} s={[5.05, 0.09, 8.9]} c={lawnAccent} rough={0.88} />
        {/* Dải đệm cỏ giữa khu Firepit & Lối đi hồ nước (x: -5.3..-3.75, z: +7.1..+16.0) & dải trước Firepit (z: +14.8..+16.0) */}
        <B p={[-4.52, -0.245, 11.55]} s={[1.55, 0.09, 8.9]} c={lawnColor} rough={0.88} />
        <B p={[-11.3, -0.245, 15.4]} s={[12.0, 0.09, 1.2]} c={lawnColor} rough={0.88} />
        {/* Dải cỏ hông phải & viền trước hồ bơi (x: +13.4..+17.15, z: -6.28..+7.2) + dải ngoài hồ bơi + trước hồ bơi */}
        <B p={[15.27, -0.245, 0.46]} s={[3.75, 0.09, 13.48]} c={lawnColor} rough={0.88} />
        <B p={[16.0, -0.245, 11.6]} s={[2.3, 0.09, 8.8]} c={lawnAccent} rough={0.88} />
        <B p={[8.0, -0.245, 15.05]} s={[14.0, 0.09, 1.9]} c={lawnColor} rough={0.88} />
        {/* Dải thảm cỏ nhỏ sát hông nhà trước cửa sổ phòng tắm trái & lối đi */}
        <B p={[-10.5, -0.245, 6.72]} s={[10.8, 0.09, 0.88]} c={lawnAccent} rough={0.88} />
        <B p={[-1.4, -0.245, 15.75]} s={[4.7, 0.09, 0.5]} c={lawnColor} rough={0.88} />
      </group>

      {/* =====================================================================
       * 3. LỐI VÀO CHÍNH — ĐÁ BƯỚC DẠO NỔI TRÊN MẶT NƯỚC & SỎI TRẮNG
       * (x: -3.75 .. +0.95, z: +6.28 .. +15.55, thẳng trục pivot door x = -1.40)
       * ===================================================================== */}
      {/* Dải sỏi trắng hai bên hồ nước cảnh quan */}
      <group onClick={yardClickHandler}>
        <B p={[-3.34, -0.24, 10.92]} s={[0.82, 0.08, 9.28]} map={pebbleMap} c={darkMode ? '#9C9890' : '#FFFFFF'} rough={0.92} />
        <B p={[0.54, -0.24, 10.92]} s={[0.82, 0.08, 9.28]} map={pebbleMap} c={darkMode ? '#9C9890' : '#FFFFFF'} rough={0.92} />
      </group>
      {/* Viền đá tối ngăn mép hồ nước */}
      <B p={[-2.92, -0.215, 10.92]} s={[0.08, 0.11, 9.28]} c={patioDark} rough={0.7} />
      <B p={[0.12, -0.215, 10.92]} s={[0.08, 0.11, 9.28]} c={patioDark} rough={0.7} />
      <B p={[-1.4, -0.215, 15.52]} s={[3.12, 0.11, 0.1]} c={patioDark} rough={0.7} />

      {/* Đáy hồ đá sẫm & Mặt nước phản chiếu tĩnh lặng */}
      <B p={[-1.4, -0.31, 10.9]} s={[2.98, 0.04, 9.2]} c="#182026" rough={0.85} />
      <mesh position={[-1.4, -0.205, 10.9]} rotation={[-Math.PI / 2, 0, 0]} material={pondWaterMat}>
        <planeGeometry args={[2.96, 9.16]} />
      </mesh>

      {/* Bệ sảnh chính rộng nổi trên mặt nước (Porch Landing y = -0.01) */}
      <FloatingTravertineStep
        pos={[-1.4, -0.055, 7.06]}
        size={[3.4, 0.09, 1.56]}
        tex={travertineMap}
        darkMode={darkMode}
        onClick={yardClickHandler}
      />
      {/* 5 phiến đá bước dạo Travertine khổ rộng xếp giật cấp nổi trên mặt nước */}
      {[
        { z: 8.5, y: -0.09, w: 2.55, d: 1.05 },
        { z: 9.85, y: -0.12, w: 2.55, d: 1.05 },
        { z: 11.2, y: -0.145, w: 2.55, d: 1.05 },
        { z: 12.55, y: -0.165, w: 2.55, d: 1.05 },
        { z: 14.05, y: -0.178, w: 2.8, d: 1.32 },
      ].map((step, i) => (
        <FloatingTravertineStep
          key={i}
          pos={[-1.4, step.y, step.z]}
          size={[step.w, 0.075, step.d]}
          tex={travertineMap}
          darkMode={darkMode}
          onClick={yardClickHandler}
        />
      ))}

      {/* Cụm cuội đá trang trí tự nhiên rải trên nền sỏi trắng cạnh bậc nước */}
      {[
        [-3.32, -0.18, 8.0, 0.14],
        [-3.42, -0.18, 10.6, 0.11],
        [-3.28, -0.18, 13.4, 0.15],
        [0.52, -0.18, 9.1, 0.13],
        [0.62, -0.18, 12.1, 0.16],
        [0.48, -0.18, 14.2, 0.12],
      ].map(([rx, ry, rz, rad], idx) => (
        <Sph key={`peb-${idx}`} p={[rx, ry, rz]} s={[rad, rad * 0.55, rad * 0.85]} c={darkMode ? '#7C7872' : '#E8E4DC'} rough={0.88} shadow />
      ))}

      {/* =====================================================================
       * 4. SÂN BÊN PHẢI — HỒ BƠI VÔ CỰC MINI & SUNDECK GỖ NGOÀI TRỜI
       * (Wooden Deck: x: +1.1..+5.55, z: +6.3..+14.1 | Pool: x: +5.8..+14.85, z: +7.1..+13.95)
       * ===================================================================== */}
      {/* Đường dạo gỗ sườn phải chạy dọc tường phòng khách nối ra Sundeck */}
      <group onClick={yardClickHandler}>
        <B p={[11.82, -0.21, 0.45]} s={[3.08, 0.07, 13.5]} map={sideWalkDeckMap} c={darkMode ? '#A28E7A' : '#FFFFFF'} rough={0.72} />

        {/* Sàn gỗ Sundeck ngoài trời cạnh hồ bơi */}
        <B p={[3.35, -0.19, 10.22]} s={[4.5, 0.08, 7.8]} map={deckMap} c={darkMode ? '#A28E7A' : '#FFFFFF'} rough={0.68} />
        <B p={[3.35, -0.215, 14.16]} s={[4.5, 0.05, 0.1]} c="#2B2D2F" rough={0.6} />
      </group>

      {/* 2 Ghế tắm nắng cao cấp + Bàn trà nhỏ trên Sundeck */}
      {[9.0, 11.45].map((lz, idx) => (
        <SunLounger key={idx} pos={[3.15, -0.15, lz]} darkMode={darkMode} />
      ))}
      <G p={[3.3, -0.15, 10.22]}>
        <Cyl p={[0, 0.16, 0]} rt={0.1} rb={0.14} h={0.32} c="#2B2D2F" metal={0.45} />
        <Cyl p={[0, 0.34, 0]} rt={0.36} rb={0.35} h={0.04} c={darkMode ? '#8D877E' : '#EAE4DA'} rough={0.35} shadow />
        <Cyl p={[-0.08, 0.42, 0.05]} rt={0.04} rb={0.032} h={0.12} c="#566E4C" opacity={0.8} />
        <Cyl p={[0.1, 0.42, -0.06]} rt={0.04} rb={0.032} h={0.12} c="#C4834E" opacity={0.85} />
      </G>

      {/* Hồ bơi vô cực mini (Mini Infinity Pool: x: +5.75..+14.85, z: +7.1..+13.95) */}
      <group>
        {/* Đáy & 4 thành lòng hồ bơi ốp gạch mosaic xanh ngọc sẫm */}
        <B p={[10.3, -0.78, 10.52]} s={[8.9, 0.06, 6.65]} c={darkMode ? '#0F3744' : '#1A5B70'} rough={0.35} />
        {/* Thành bắc & tây cao ngang coping */}
        <B p={[10.3, -0.42, 7.22]} s={[9.1, 0.72, 0.24]} c={darkMode ? '#144454' : '#1E6A82'} rough={0.35} />
        <B p={[5.82, -0.42, 10.52]} s={[0.24, 0.72, 6.8]} c={darkMode ? '#144454' : '#1E6A82'} rough={0.35} />
        {/* Mép tràn vô cực (Infinity Weir Edge) phía Nam & phía Đông với rãnh thu nước sẫm */}
        <B p={[10.32, -0.46, 13.72]} s={[9.0, 0.64, 0.16]} c="#22262C" rough={0.28} />
        <B p={[14.72, -0.46, 10.48]} s={[0.16, 0.64, 6.64]} c="#22262C" rough={0.28} />
        <B p={[10.35, -0.32, 13.92]} s={[9.2, 0.26, 0.28]} c="#181B20" rough={0.4} />
        <B p={[14.92, -0.32, 10.55]} s={[0.28, 0.26, 6.95]} c="#181B20" rough={0.4} />

        {/* Viền đá Travertine sáng màu ở thành Bắc & Tây nối liền Sundeck */}
        <B p={[10.35, -0.145, 7.15]} s={[9.25, 0.07, 0.42]} map={travertineMap} c={darkMode ? '#8D877E' : '#F4F1EA'} rough={0.5} shadow />
        <B p={[5.76, -0.145, 10.52]} s={[0.42, 0.07, 6.88]} map={travertineMap} c={darkMode ? '#8D877E' : '#F4F1EA'} rough={0.5} shadow />

        {/* Mặt nước hồ bơi xanh ngọc trong suốt có độ bóng phản chiếu (roughness: 0.1, transparent: true) */}
        <mesh position={[10.3, -0.175, 10.52]} rotation={[-Math.PI / 2, 0, 0]} material={poolWaterMat}>
          <planeGeometry args={[8.75, 6.42]} />
        </mesh>

        {/* Bậc thang inox lên xuống hồ bơi sát Sundeck */}
        <G p={[6.05, -0.14, 8.2]}>
          <Cyl p={[0, 0.16, -0.24]} rt={0.022} h={0.52} c="#D6D1C9" metal={0.85} rough={0.2} />
          <Cyl p={[0, 0.16, 0.24]} rt={0.022} h={0.52} c="#D6D1C9" metal={0.85} rough={0.2} />
          <B p={[0.04, -0.18, 0]} s={[0.08, 0.025, 0.48]} c="#D6D1C9" metal={0.8} rough={0.22} />
          <B p={[0.04, -0.38, 0]} s={[0.08, 0.025, 0.48]} c="#D6D1C9" metal={0.8} rough={0.22} />
        </G>

        {/* Đèn LED âm dưới lòng hồ bơi (3 đèn phát sáng dưới nước vào ban đêm) */}
        {[7.6, 10.3, 13.0].map((px, idx) => (
          <B
            key={`pool-led-${idx}`}
            p={[px, -0.45, 7.36]}
            s={[0.52, 0.12, 0.04]}
            c={darkMode ? '#9AEBFF' : '#DDF6FA'}
            emissive="#7CE6FF"
            ei={darkMode ? 2.6 : 0.2}
            shadow={false}
          />
        ))}
        {darkMode && (
          <>
            <pointLight position={[8.2, -0.05, 10.2]} intensity={2.2} distance={8.5} decay={2} color="#7CE6FF" castShadow={false} />
            <pointLight position={[12.4, -0.05, 10.8]} intensity={2.0} distance={8.5} decay={2} color="#7CE6FF" castShadow={false} />
          </>
        )}
      </group>

      {/* =====================================================================
       * 5. SÂN BÊN TRÁI — GÓC THƯ GIÃN FIREPIT NGOÀI TRỜI & SỎI TRẮNG
       * (Terace: x: -17.3..-5.3, z: +7.15..+14.8)
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        {/* Khung sỏi trắng rải bao quanh sàn đá tối màu */}
        <B p={[-11.3, -0.23, 10.98]} s={[12.0, 0.06, 7.65]} map={pebbleWideMap} c={darkMode ? '#98948C' : '#FFFFFF'} rough={0.92} />
        {/* Nền sân lát đá tối màu khu Lounge Firepit */}
        <B p={[-11.3, -0.195, 11.0]} s={[10.5, 0.06, 6.2]} c={patioDark} rough={0.76} shadow />
        {/* Đá bước dạo nối từ Firepit Lounge sang lối vào chính (z = 11.2) */}
        <B p={[-5.15, -0.18, 11.2]} s={[1.15, 0.05, 1.3]} map={travertineMap} c={darkMode ? '#8D877E' : '#F4F1EA'} rough={0.62} />
      </group>

      {/* Bồn cây xây dọc chân tường phía trước cánh trái (z = 6.72) */}
      <G p={[-10.4, -0.2, 6.72]}>
        <BB p={[0, 0, 0]} s={[10.6, 0.42, 0.84]} c={stoneBorder} rough={0.78} shadow />
        <BB p={[0, 0.38, 0]} s={[10.2, 0.06, 0.68]} c={soilColor} rough={0.94} />
        <HedgeRow pos={[0, 0.42, 0]} length={10.0} orientation="x" height={0.54} darkMode={darkMode} />
      </G>

      {/* Ghế băng dài chữ L (L-Shaped Outdoor Lounge) quay vào bàn Firepit */}
      <G p={[-11.6, -0.16, 11.1]}>
        {/* Nhánh ghế Bắc (lưng hướng nhà, mặt hướng Firepit) */}
        <RBB p={[0.35, 0, -1.85]} s={[4.6, 0.32, 0.92]} c="#9E6B43" rough={0.6} radius={0.03} shadow />
        <RBB p={[0.35, 0.32, -1.82]} s={[4.45, 0.16, 0.82]} c="#EFECE6" rough={0.86} radius={0.04} shadow />
        <RBB p={[0.35, 0.48, -2.18]} s={[4.45, 0.42, 0.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow />
        {/* Nhánh ghế Tây */}
        <RBB p={[-1.48, 0, 0.25]} s={[0.92, 0.32, 3.3]} c="#9E6B43" rough={0.6} radius={0.03} shadow />
        <RBB p={[-1.45, 0.32, 0.25]} s={[0.82, 0.16, 3.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow />
        <RBB p={[-1.82, 0.48, 0.25]} s={[0.2, 0.42, 3.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow />
        {/* Gối tựa điểm nhấn ấm Cam đất & Nâu gỉ */}
        {[-1.1, 0.3, 1.7].map((px, i) => (
          <RBB key={`fp-p1-${i}`} p={[px, 0.56, -1.96]} r={[0.2, 0, 0]} s={[0.46, 0.36, 0.14]} c={i % 2 ? '#9E6338' : '#C4834E'} rough={0.88} radius={0.04} />
        ))}
        {[-0.4, 0.9].map((pz, i) => (
          <RBB key={`fp-p2-${i}`} p={[-1.62, 0.56, pz]} r={[0, 0, -0.2]} s={[0.14, 0.36, 0.46]} c={i % 2 ? '#C4834E' : '#9E6338'} rough={0.88} radius={0.04} />
        ))}
      </G>

      {/* Bàn Lò sưởi ngoài trời hiện đại (Outdoor Firepit phát ánh sáng cam ấm) */}
      <G p={[-10.95, -0.16, 11.2]}>
        <RBB p={[0, 0, 0]} s={[1.65, 0.42, 1.18]} c="#2B303A" rough={0.58} radius={0.04} shadow />
        <RBB p={[0, 0.42, 0]} s={[1.72, 0.05, 1.24]} c={darkMode ? '#4B5058' : '#D6D1C9'} rough={0.42} radius={0.02} shadow />
        {/* Khay đá nham thạch & vỉ kính chắn gió */}
        <B p={[0, 0.45, 0]} s={[0.88, 0.05, 0.44]} c="#1A1C20" rough={0.95} />
        <B p={[0, 0.47, 0]} s={[0.78, 0.04, 0.34]} c="#FF7A2F" emissive="#FF6A1A" ei={darkMode ? 2.4 : 0.75} />
        {/* Ngọn lửa cam ấm bập bùng */}
        <group ref={flameRef} position={[0, 0.52, 0]}>
          {[-0.22, -0.07, 0.09, 0.24].map((fx, i) => (
            <mesh key={i} position={[fx, 0.05, (i % 2 ? 0.04 : -0.04)]}>
              <coneGeometry args={[0.065, 0.22 + (i % 2) * 0.06, 6]} />
              <meshStandardMaterial
                color="#FFB347"
                emissive="#FF7A2F"
                emissiveIntensity={darkMode ? 3.2 : 1.1}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
        {darkMode && (
          <pointLight position={[0, 0.85, 0]} intensity={2.7} distance={8.5} decay={2} color="#FF8C3B" castShadow={false} />
        )}
      </G>

      {/* =====================================================================
       * 6. HỆ TƯỜNG RÀO THẤP KẾT HỢP THANH LAM HIỆN ĐẠI (Hông trái, Sau & Hông phải)
       * ===================================================================== */}
      <SlattedPerimeterFence pos={[-22.12, -0.2, 2.95]} length={25.8} orientation="z" darkMode={darkMode} />
      <SlattedPerimeterFence pos={[16.92, -0.2, 2.95]} length={25.8} orientation="z" darkMode={darkMode} />
      <SlattedPerimeterFence pos={[-2.6, -0.2, -9.95]} length={39.1} orientation="x" darkMode={darkMode} />

      {/* =====================================================================
       * 7. CÂY XANH KIẾN TRÚC ĐA TẦNG & HÀNG BỤI CÂY CẮT TỈA SÁT TƯỜNG
       * ===================================================================== */}
      <ArchitecturalTree pos={[-19.6, -0.2, 11.4]} scale={1.18} rotationY={0.4} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[-19.4, -0.2, -4.6]} scale={1.04} rotationY={1.8} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[15.3, -0.2, 4.2]} scale={1.12} rotationY={2.5} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[15.1, -0.2, -6.4]} scale={0.96} rotationY={0.9} darkMode={darkMode} />
      <ArchitecturalTree pos={[-6.8, -0.2, -8.2]} scale={0.98} rotationY={3.1} darkMode={darkMode} />
      <ArchitecturalTree pos={[5.2, -0.2, -8.4]} scale={1.06} rotationY={1.3} darkMode={darkMode} />

      {/* Hàng bụi cây cắt tỉa sát chân hàng rào & tường bên */}
      <HedgeRow pos={[-21.5, -0.2, 2.8]} length={16.5} orientation="z" height={0.58} darkMode={darkMode} />
      <HedgeRow pos={[16.3, -0.2, 2.4]} length={17.5} orientation="z" height={0.56} darkMode={darkMode} />
      <HedgeRow pos={[-2.6, -0.2, -9.35]} length={36.0} orientation="x" height={0.54} darkMode={darkMode} />
      <HedgeRow pos={[13.9, -0.2, 14.95]} length={3.2} orientation="x" height={0.46} darkMode={darkMode} />

      {/* =====================================================================
       * 8. ĐÈN TRỤ LỐI ĐI (BOLLARD LIGHTS) & ĐÈN HẮT NGƯỢC TƯỜNG LAM GỖ (UPLIGHTS)
       * ===================================================================== */}
      {[
        [-3.32, -0.18, 9.2],
        [0.52, -0.18, 9.2],
        [-3.32, -0.18, 12.1],
        [0.52, -0.18, 12.1],
        [-3.32, -0.18, 14.9],
        [0.52, -0.18, 14.9],
        [-6.2, -0.16, 13.8],
        [-16.1, -0.16, 13.8],
        [1.8, -0.15, 13.6],
      ].map(([bx, by, bz], idx) => (
        <BollardLight key={idx} pos={[bx, by, bz]} darkMode={darkMode} />
      ))}

      {/* Đèn hắt âm sàn chiếu ngược lên mảng lam gỗ mặt tiền (Vertical Teak Uplights) */}
      {[-2.85, -0.15, 0.55].map((ux, idx) => (
        <G key={`facade-up-${idx}`} p={[ux, -0.18, 6.52]}>
          <Cyl rt={0.095} rb={0.105} h={0.04} c="#1C1E22" metal={0.6} rough={0.35} />
          <Cyl
            p={[0, 0.024, 0]}
            rt={0.068}
            rb={0.068}
            h={0.015}
            c={darkMode ? '#FFD7A3' : '#DCD8CF'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.8 : 0.08}
          />
        </G>
      ))}
      {darkMode && (
        <>
          {/* Ánh sáng hắt ấm từ lối vào hồ nước & đèn hắt ngược mảng lam gỗ trung tâm */}
          <pointLight position={[-1.4, 0.65, 11.4]} intensity={1.7} distance={7.5} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[-0.15, 1.35, 6.85]} intensity={2.6} distance={7.5} decay={1.8} color="#FFE0B5" castShadow={false} />
          <pointLight position={[-2.85, 1.35, 6.85]} intensity={2.0} distance={6.5} decay={1.8} color="#FFE0B5" castShadow={false} />
        </>
      )}
    </group>
  )
}

function FloatingTravertineStep({
  pos,
  size,
  tex,
  darkMode,
  onClick,
}: {
  pos: V3
  size: V3
  tex: THREE.Texture
  darkMode: boolean
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const [w, h, d] = size
  return (
    <group position={pos} onClick={onClick}>
      {/* Bệ đỡ âm tối ẩn dưới gầm bậc đá tạo hiệu ứng phiến đá bay nổi trên mặt nước */}
      <B p={[0, -h * 0.85, 0]} s={[w - 0.36, h * 0.9, d - 0.32]} c="#1A1D22" rough={0.85} />
      {/* Phiến đá Travertine khổ rộng */}
      <B
        p={[0, 0, 0]}
        s={[w, h, d]}
        map={tex}
        c={darkMode ? '#969087' : '#FFFFFF'}
        rough={0.58}
        shadow
      />
      {/* Dải đèn LED vàng ấm hắt ngầm dưới viền gầm bậc đá */}
      <B
        p={[0, -h * 0.52, 0]}
        s={[w - 0.14, 0.018, d - 0.12]}
        c="#FFD7A3"
        emissive="#FFD7A3"
        ei={darkMode ? 2.2 : 0.08}
        shadow={false}
      />
    </group>
  )
}

function SunLounger({ pos, darkMode }: { pos: V3; darkMode: boolean }) {
  return (
    <G p={pos} r={[0, Math.PI / 2, 0]}>
      {/* Khung gỗ Teak ngoài trời & chân Matte Charcoal */}
      <RBB p={[0, 0.16, 0]} s={[2.02, 0.08, 0.78]} c="#9E6B43" rough={0.58} radius={0.025} shadow />
      {[-0.86, 0.86].map((lx) =>
        [-0.32, 0.32].map((lz) => (
          <B key={`${lx}-${lz}`} p={[lx, 0.08, lz]} s={[0.05, 0.16, 0.05]} c="#2B2D2F" metal={0.5} />
        )),
      )}
      {/* Đệm nằm kem sang trọng + Tựa lưng nâng góc thư giãn */}
      <RBB p={[0.3, 0.24, 0]} s={[1.3, 0.09, 0.72]} c={darkMode ? '#CFCAC0' : '#F4F1EA'} rough={0.86} radius={0.03} shadow />
      <RBB
        p={[-0.58, 0.42, 0]}
        r={[0, 0, -0.45]}
        s={[0.68, 0.09, 0.72]}
        c={darkMode ? '#CFCAC0' : '#F4F1EA'}
        rough={0.86}
        radius={0.03}
        shadow
      />
      {/* Gối tựa đầu cam đất #C4834E */}
      <Cyl p={[-0.72, 0.54, 0]} r={[Math.PI / 2, 0, 0]} rt={0.075} rb={0.075} h={0.44} c="#C4834E" rough={0.88} />
    </G>
  )
}

function SlattedPerimeterFence({
  pos,
  length,
  orientation,
  darkMode,
}: {
  pos: V3
  length: number
  orientation: 'x' | 'z'
  darkMode: boolean
}) {
  const isX = orientation === 'x'
  const wallC = darkMode ? '#2B303A' : '#353B47'
  const postC = '#1C1E22'
  const slatC = darkMode ? '#7D5130' : '#9E6338'
  const numPosts = Math.max(3, Math.round(length / 3.2) + 1)

  return (
    <group position={pos}>
      {/* Bệ tường xây thấp hiện đại */}
      <B
        p={[0, 0.26, 0]}
        s={isX ? [length, 0.52, 0.22] : [0.22, 0.52, length]}
        c={wallC}
        rough={0.82}
        shadow
      />
      <B
        p={[0, 0.535, 0]}
        s={isX ? [length + 0.04, 0.035, 0.26] : [0.26, 0.035, length + 0.04]}
        c={postC}
        rough={0.42}
        metal={0.45}
      />

      {/* Hệ thanh lam gỗ ngang Teak (4 hàng thanh mảnh) */}
      {[0.68, 0.85, 1.02, 1.19].map((sy, idx) => (
        <B
          key={idx}
          p={[0, sy, 0]}
          s={isX ? [length - 0.1, 0.075, 0.055] : [0.055, 0.075, length - 0.1]}
          c={slatC}
          rough={0.58}
          shadow
        />
      ))}

      {/* Thanh nẹp đỉnh hàng rào Matte Black */}
      <B
        p={[0, 1.32, 0]}
        s={isX ? [length + 0.04, 0.045, 0.11] : [0.11, 0.045, length + 0.04]}
        c={postC}
        rough={0.35}
        metal={0.55}
        shadow
      />

      {/* Trụ sắt hộp dọc */}
      {Array.from({ length: numPosts }, (_, i) => {
        const offset = -length / 2 + (i / (numPosts - 1)) * length
        return (
          <B
            key={i}
            p={isX ? [offset, 0.67, 0] : [0, 0.67, offset]}
            s={[0.1, 1.34, 0.1]}
            c={postC}
            rough={0.35}
            metal={0.55}
            shadow
          />
        )
      })}
    </group>
  )
}

function BollardLight({ pos, darkMode }: { pos: V3; darkMode: boolean }) {
  return (
    <group position={pos}>
      <B p={[0, 0.025, 0]} s={[0.16, 0.05, 0.16]} c="#1E2024" metal={0.5} rough={0.38} />
      <B p={[0, 0.34, 0]} s={[0.11, 0.62, 0.11]} c="#1E2024" metal={0.55} rough={0.35} shadow />
      <B
        p={[0, 0.58, 0]}
        s={[0.102, 0.11, 0.102]}
        c={darkMode ? '#FFD7A3' : '#EFECE6'}
        emissive="#FFD7A3"
        ei={darkMode ? 2.4 : 0.12}
      />
      <B p={[0, 0.66, 0]} s={[0.12, 0.04, 0.12]} c="#1E2024" metal={0.55} rough={0.35} />
    </group>
  )
}
