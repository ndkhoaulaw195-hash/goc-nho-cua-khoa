import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  FLOOR2_Y,
  getBrightTravertineTexture,
  getTeakPlankTexture,
  TEAK_DEEP,
  TRIM_BLACK,
  WARM_LED,
} from './ArchitectureShell'
import { HedgeRow, PottedVillaTree } from './Botanicals'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { B, BB, Cyl, G, RBB } from './prims'
import { getHousePalette } from '../data/config'

/** Hệ mái Pergola Sân thượng trên khu Lounge (x: -15.65..-10.35, z: -0.25..+5.95) đổ bóng sọc nắng sắc nét */
function TerracePergola({ darkMode, deckTop }: { darkMode: boolean; deckTop: number }) {
  const teakTex = useMemo(() => {
    const t = getTeakPlankTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.0, 0.25)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(() => () => teakTex.dispose(), [teakTex])

  const topY = deckTop + 2.85
  const beamY = topY - 0.07
  const slatY = topY - 0.045
  const louverCount = 22
  const startZ = -0.05
  const endZ = 5.75
  const slatTint = darkMode ? '#DFCBB2' : '#FFFFFF'

  return (
    <group>
      {/* 4 trụ thép đen mờ mảnh #1E2229 cao tới DECK_TOP + 2.85 */}
      {[
        [-15.65, -0.25],
        [-10.35, -0.25],
        [-15.65, 5.95],
        [-10.35, 5.95],
      ].map(([px, pz], idx) => (
        <group key={`tpergola-post-${idx}`}>
          <BB p={[px, deckTop, pz]} s={[0.16, 0.028, 0.16]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
          <BB p={[px, deckTop, pz]} s={[0.095, 2.82, 0.095]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
        </group>
      ))}

      {/* Khung xà thép #1E2229 & thanh purlin giữa */}
      <B p={[-15.65, beamY, 2.85]} s={[0.1, 0.14, 6.3]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      <B p={[-10.35, beamY, 2.85]} s={[0.1, 0.14, 6.3]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      <B p={[-13.0, beamY, 5.95]} s={[5.4, 0.14, 0.1]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      <B p={[-13.0, beamY, -0.25]} s={[5.4, 0.14, 0.1]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      <B p={[-13.0, beamY - 0.025, 2.85]} s={[0.06, 0.09, 6.1]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      {/* Tay ngàm neo sạch vào mảng tường Tầng 2 (x = -10.28) */}
      {[-0.25, 5.95].map((tz, idx) => (
        <B key={`tpergola-tie-${idx}`} p={[-10.22, beamY, tz]} s={[0.24, 0.11, 0.1]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow />
      ))}

      {/* 22 thanh lam gỗ Teak #C68642 nằm ngang đều nhau có castShadow = true */}
      {Array.from({ length: louverCount }, (_, i) => {
        const lz = startZ + (i / (louverCount - 1)) * (endZ - startZ)
        return (
          <B
            key={`tpergola-slat-${i}`}
            p={[-13.0, slatY, lz]}
            s={[5.18, 0.085, 0.055]}
            map={teakTex}
            c={slatTint}
            rough={0.48}
            shadow
          />
        )
      })}
    </group>
  )
}

/**
 * Sân thượng sang trọng trên nóc khối Phòng tắm Tầng 1 (bên trái: x: -16.08..-10.14, z: -6.48..+6.48)
 * Nối liền trực tiếp với không gian Tầng 2; đồng bộ ẩn/hiện khi bấm Mái nhà hoặc Tường lửng.
 */
export function RooftopTerrace({ darkMode }: { darkMode: boolean }) {
  const Y = FLOOR2_Y // 4.35
  const DECK_TOP = Y + 0.31 // 4.66
  const palette = useMemo(() => getHousePalette(darkMode), [darkMode])
  const trimColor = TRIM_BLACK
  const slabColor = palette.extWall
  const frameWhite = palette.extWall
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])

  const travTex = useMemo(() => {
    const t = getBrightTravertineTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.0, 2.2)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(() => () => travTex.dispose(), [travTex])

  const deckTex = useMemo(() => {
    const t = getTeakPlankTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.2, 4.4)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(() => () => deckTex.dispose(), [deckTex])

  const frontDeckTex = useMemo(() => {
    const t = getTeakPlankTexture().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.2, 2.8)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(() => () => frontDeckTex.dispose(), [frontDeckTex])

  return (
    <group>
      {/* 1. Kết cấu sàn đá Travertine #F5F2EB khối đặc bao quanh ô Giếng trời (x: -13.8..-11.8, z: -2.7..-0.5) */}
      <B p={[-13.18, Y + 0.15, -4.59]} s={[5.8, 0.3, 3.78]} c={slabColor} map={travTex} rough={0.4} shadow />
      <B p={[-13.18, Y + 0.15, 2.99]} s={[5.8, 0.3, 6.98]} c={slabColor} map={travTex} rough={0.4} shadow />
      <B p={[-14.94, Y + 0.15, -1.6]} s={[2.28, 0.3, 2.2]} c={slabColor} map={travTex} rough={0.4} shadow />
      <B p={[-11.04, Y + 0.15, -1.6]} s={[1.52, 0.3, 2.2]} c={slabColor} map={travTex} rough={0.4} shadow />

      {/* Đường nẹp viền đá Travertine #F5F2EB & gờ chống tràn quanh mép Sân thượng */}
      <B p={[-13.205, Y + 0.28, 6.45]} s={[5.85, 0.08, 0.12]} c={frameWhite} map={travTex} rough={0.4} shadow />
      <B p={[-16.02, Y + 0.28, 0]} s={[0.12, 0.08, 12.96]} c={frameWhite} map={travTex} rough={0.4} shadow />
      <B p={[-13.18, Y + 0.28, -6.45]} s={[5.9, 0.08, 0.12]} c={frameWhite} map={travTex} rough={0.4} shadow />

      {/* Đèn LED #FFAE52 hắt dưới diềm mặt tiền Sân thượng sáng CẢ BAN NGÀY LẪN ĐÊM */}
      <B
        p={[-13.18, Y - 0.015, 6.36]}
        s={[5.4, 0.03, 0.04]}
        c={WARM_LED}
        emissive={WARM_LED}
        ei={darkMode ? 2.6 : 1.9}
        shadow={false}
      />

      {/* 2. Mặt sàn gỗ Teak ngoài trời (chừa gọn ô giếng trời phòng tắm) */}
      {/* Khoang sau giếng trời (z: -6.1..-2.75) */}
      <B p={[-13.08, DECK_TOP - 0.01, -4.42]} s={[5.35, 0.04, 3.35]} map={frontDeckTex} c={darkMode ? '#DFCBB2' : '#FFFFFF'} rough={0.5} />
      {/* Khoang trước rộng rãi đặt khu Lounge (z: -0.45..+6.1) */}
      <B p={[-13.08, DECK_TOP - 0.01, 2.82]} s={[5.35, 0.04, 6.55]} map={deckTex} c={darkMode ? '#DFCBB2' : '#FFFFFF'} rough={0.5} />
      {/* Hai dải bo trái & phải cạnh giếng trời */}
      <B p={[-14.8, DECK_TOP - 0.01, -1.6]} s={[1.92, 0.04, 2.3]} map={frontDeckTex} c={darkMode ? '#DFCBB2' : '#FFFFFF'} rough={0.5} />
      <B p={[-10.98, DECK_TOP - 0.01, -1.6]} s={[1.55, 0.04, 2.3]} map={frontDeckTex} c={darkMode ? '#DFCBB2' : '#FFFFFF'} rough={0.5} />

      {/* 3. Giếng trời kính cường lực phòng tắm khung nhôm đen mờ phẳng gọn (x: -13.8..-11.8, z: -2.7..-0.5) */}
      <group position={[-12.8, DECK_TOP + 0.05, -1.6]}>
        <B p={[0, 0, -1.12]} s={[2.12, 0.14, 0.07]} c={trimColor} rough={0.35} metal={0.55} shadow />
        <B p={[0, 0, 1.12]} s={[2.12, 0.14, 0.07]} c={trimColor} rough={0.35} metal={0.55} shadow />
        <B p={[-1.02, 0, 0]} s={[0.07, 0.14, 2.18]} c={trimColor} rough={0.35} metal={0.55} shadow />
        <B p={[1.02, 0, 0]} s={[0.07, 0.14, 2.18]} c={trimColor} rough={0.35} metal={0.55} shadow />
        <B p={[0, 0.04, 0]} s={[0.04, 0.05, 2.14]} c={trimColor} rough={0.35} metal={0.55} />
        <mesh position={[0, 0.05, 0]} material={glassMat}>
          <boxGeometry args={[2.0, 0.03, 2.16]} />
        </mesh>
      </group>

      {/* 4. Hệ lan can kính cường lực không khung bao quanh 3 mặt Sân thượng (h = 1.02m) */}
      {/* Gờ chân đế kính Matte Charcoal */}
      <B p={[-13.14, DECK_TOP + 0.04, 6.22]} s={[5.76, 0.08, 0.09]} c={trimColor} rough={0.45} metal={0.45} />
      <B p={[-13.14, DECK_TOP + 0.04, -6.22]} s={[5.76, 0.08, 0.09]} c={trimColor} rough={0.45} metal={0.45} />
      <B p={[-15.96, DECK_TOP + 0.04, 0]} s={[0.09, 0.08, 12.52]} c={trimColor} rough={0.45} metal={0.45} />

      {/* Tấm kính lan can trước, sau & bên trái */}
      <mesh position={[-13.14, DECK_TOP + 0.56, 6.22]} material={glassMat}>
        <boxGeometry args={[5.72, 0.96, 0.025]} />
      </mesh>
      <mesh position={[-13.14, DECK_TOP + 0.56, -6.22]} material={glassMat}>
        <boxGeometry args={[5.72, 0.96, 0.025]} />
      </mesh>
      <mesh position={[-15.96, DECK_TOP + 0.56, 0]} material={glassMat}>
        <boxGeometry args={[0.025, 0.96, 12.44]} />
      </mesh>

      {/* Tay vịn mảnh kim loại đen & gỗ Teak phía trên kính */}
      <B p={[-13.14, DECK_TOP + 1.05, 6.22]} s={[5.8, 0.045, 0.07]} c={trimColor} metal={0.6} rough={0.32} shadow />
      <B p={[-13.14, DECK_TOP + 1.05, -6.22]} s={[5.8, 0.045, 0.07]} c={trimColor} metal={0.6} rough={0.32} shadow />
      <B p={[-15.96, DECK_TOP + 1.05, 0]} s={[0.07, 0.045, 12.52]} c={trimColor} metal={0.6} rough={0.32} shadow />

      {/* Trụ kẹp kính tối giản */}
      {[-15.96, -13.9, -11.9, -10.28].map((px, i) => (
        <group key={`tp-posts-${i}`}>
          <B p={[px, DECK_TOP + 0.52, 6.22]} s={[0.045, 1.04, 0.05]} c={trimColor} metal={0.6} rough={0.32} />
          <B p={[px, DECK_TOP + 0.52, -6.22]} s={[0.045, 1.04, 0.05]} c={trimColor} metal={0.6} rough={0.32} />
        </group>
      ))}
      {[-4.2, -2.0, 0.2, 2.4, 4.5].map((pz, i) => (
        <B key={`tp-left-${i}`} p={[-15.96, DECK_TOP + 0.52, pz]} s={[0.05, 1.04, 0.045]} c={trimColor} metal={0.6} rough={0.32} />
      ))}

      {/* 5. Bộ bàn ghế Lounge thư giãn ngoài trời (vùng phía trước sân thượng) */}
      <G p={[-13.0, DECK_TOP + 0.01, 2.7]}>
        {/* Thảm cói/sợi dệt ngoài trời trung tính */}
        <BB p={[0, 0, 0]} s={[3.2, 0.025, 3.6]} c={darkMode ? '#6B6D6E' : '#B6B7B5'} rough={0.92} />

        {/* 2 Ghế Lounge Thư Giãn góc nghiêng hướng ra mặt tiền */}
        {[
          { x: -1.05, z: -0.75, ry: 0.42 },
          { x: 0.95, z: -0.82, ry: -0.38 },
        ].map((ch, idx) => (
          <G key={idx} p={[ch.x, 0.02, ch.z]} r={[0, ch.ry, 0]}>
            {/* Khung ghế gỗ Teak & kim loại Matte Charcoal */}
            <BB p={[0, 0.22, 0]} s={[0.96, 0.08, 0.92]} c={TEAK_DEEP} rough={0.55} shadow />
            {[-0.42, 0.42].map((lx) =>
              [-0.4, 0.4].map((lz) => (
                <Cyl key={`${lx}-${lz}`} p={[lx, 0.11, lz]} rt={0.025} h={0.22} c={TRIM_BLACK} metal={0.5} />
              )),
            )}
            {/* Đệm ngồi kem sáng & tựa lưng êm ái */}
            <RBB p={[0, 0.3, 0.02]} s={[0.88, 0.14, 0.84]} c="#EFECE6" rough={0.85} radius={0.04} shadow />
            <RBB p={[0, 0.44, -0.36]} r={[-0.2, 0, 0]} s={[0.86, 0.52, 0.14]} c="#EFECE6" rough={0.85} radius={0.04} shadow />
            {/* Gối tựa điểm nhấn ấm Camel (#C4834E) */}
            <RBB p={[0, 0.48, -0.22]} r={[-0.25, 0.12, 0]} s={[0.42, 0.34, 0.12]} c="#C4834E" rough={0.88} radius={0.04} />
            {/* Tay vịn gỗ hai bên */}
            <B p={[-0.46, 0.42, 0]} s={[0.06, 0.28, 0.86]} c={TEAK_DEEP} rough={0.55} shadow />
            <B p={[0.46, 0.42, 0]} s={[0.06, 0.28, 0.86]} c={TEAK_DEEP} rough={0.55} shadow />
          </G>
        ))}

        {/* Bàn trà tròn đá Travertine ở giữa + Khay trà & Đèn lồng sân thượng */}
        <G p={[-0.05, 0.02, 0.35]}>
          <Cyl p={[0, 0.18, 0]} rt={0.14} rb={0.22} h={0.36} c={TRIM_BLACK} rough={0.45} metal={0.35} shadow />
          <Cyl p={[0, 0.38, 0]} rt={0.56} rb={0.54} h={0.055} c="#F5F2EB" rough={0.38} shadow />
          {/* Đèn lồng năng lượng mặt trời phát sáng ấm 3000K cả ban ngày & đêm */}
          <B p={[0.16, 0.52, 0.08]} s={[0.15, 0.24, 0.15]} c={TRIM_BLACK} metal={0.55} rough={0.35} shadow />
          <B
            p={[0.16, 0.52, 0.08]}
            s={[0.1, 0.16, 0.1]}
            c={WARM_LED}
            emissive={WARM_LED}
            ei={darkMode ? 2.4 : 1.85}
            shadow={false}
          />
          {/* Bộ tách trà thư giãn */}
          <Cyl p={[-0.14, 0.44, -0.06]} rt={0.045} rb={0.04} h={0.075} c="#EFECE6" rough={0.3} />
          <Cyl p={[-0.02, 0.44, -0.14]} rt={0.045} rb={0.04} h={0.075} c="#EFECE6" rough={0.3} />
        </G>
      </G>

      {/* 6. Hệ mái Pergola Sân thượng với thanh lam Teak tạo bóng đổ sọc nắng trên khu Lounge */}
      <TerracePergola darkMode={darkMode} deckTop={DECK_TOP} />

      {/* 7. Bồn cây dọc lan can & Chậu cây Ô-liu cảnh quan trên Sân thượng */}
      <G p={[-15.48, DECK_TOP + 0.01, -4.2]}>
        <BB p={[0, 0, 0]} s={[0.62, 0.46, 3.6]} c={TRIM_BLACK} rough={0.48} shadow />
        <HedgeRow pos={[0, 0.44, 0]} length={3.3} orientation="z" height={0.55} darkMode={darkMode} />
      </G>
      <G p={[-13.1, DECK_TOP + 0.01, -5.65]}>
        <BB p={[0, 0, 0]} s={[4.2, 0.46, 0.62]} c={TRIM_BLACK} rough={0.48} shadow />
        <HedgeRow pos={[0, 0.44, 0]} length={3.9} orientation="x" height={0.52} darkMode={darkMode} />
      </G>

      {/* Hai chậu cây kiến trúc đối xứng hai góc trước Sân thượng */}
      <PottedVillaTree pos={[-15.32, DECK_TOP + 0.01, 5.45]} scale={0.95} darkMode={darkMode} />
      <PottedVillaTree pos={[-10.85, DECK_TOP + 0.01, 5.45]} scale={0.82} darkMode={darkMode} />

      {/* Đèn âm viền sàn hắt sáng ấm Sân thượng cả Ban ngày & Ban đêm */}
      {[-5.6, -2.5, 1.5, 5.5].map((lz, idx) => (
        <B
          key={`terrace-led-${idx}`}
          p={[-15.86, DECK_TOP + 0.05, lz]}
          s={[0.04, 0.04, 1.1]}
          c={WARM_LED}
          emissive={WARM_LED}
          ei={darkMode ? 2.4 : 1.85}
          shadow={false}
        />
      ))}
      <pointLight
        position={[-13.0, DECK_TOP + 1.6, 2.8]}
        intensity={darkMode ? 1.85 : 1.0}
        distance={8.5}
        decay={2}
        color={WARM_LED}
        castShadow={false}
      />
    </group>
  )
}
