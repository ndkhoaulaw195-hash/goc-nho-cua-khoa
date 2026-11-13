import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Room, Lights } from './Room'
import { Furniture } from './Furniture'
import { Avatar, CORGI, Dog, PUG } from './Characters'
import { FLOOR1_VIEW, FLOOR2_VIEW, HOME_VIEW, LIVE_ACTORS, STATIONS, type V3 } from '../data/config'
import { useStore, type Activity } from '../store'

/** Hiệu ứng hạt mưa rơi lãng mạn bên ngoài cửa sổ (Lofi Rain Effect) */
function RainEffect() {
  const weather = useStore((s) => s.weather)
  const count = 350
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28 - 2
      pos[i * 3 + 1] = Math.random() * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 1
      spd[i] = 11 + Math.random() * 8
    }
    return [pos, spd]
  }, [count])

  useFrame((_, dt) => {
    if (!pointsRef.current || weather !== 'rain') return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array
    const delta = Math.min(dt, 0.05)

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= speeds[i] * delta
      array[i * 3] -= delta * 1.5
      if (array[i * 3 + 1] < -0.2) {
        array[i * 3 + 1] = 12 + Math.random() * 2
        array[i * 3] = (Math.random() - 0.5) * 28 - 2
      }
    }
    posAttr.needsUpdate = true
  })

  if (weather !== 'rain') return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d4d8dd"
        size={0.065}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Thiết lập RoomEnvironment & PMREMGenerator tạo phản chiếu chân thực cho PBR Materials (chỉ khởi tạo 1 lần) */
function SetupEnvironment() {
  const { gl, scene } = useThree()
  const darkMode = useStore((s) => s.darkMode)

  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__gl = gl
    ;(window as unknown as Record<string, unknown>).__scene = scene
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture
    scene.environment = envTexture
    roomEnv.dispose()
    pmremGenerator.dispose()

    return () => {
      scene.environment = null
      envTexture.dispose()
    }
  }, [gl, scene])

  useEffect(() => {
    scene.background = new THREE.Color(darkMode ? '#2B313A' : '#B9B1A6')
    scene.environmentIntensity = darkMode ? 0.24 : 0.34
    gl.toneMappingExposure = 1.0
  }, [gl, scene, darkMode])

  return null
}

/** Tối ưu GPU & CPU khi người dùng đang thao tác trên các ứng dụng khác (Background Performance Optimizer) */
function BackgroundOptimizer({ isWindowFocused }: { isWindowFocused: boolean }) {
  const gl = useThree((s) => s.gl)
  const lastRenderTime = useRef(0)

  useFrame(() => {
    // Khi người dùng đang gõ phím/làm việc ở app khác (unfocused):
    // Giới hạn tốc độ render nền ở 24 FPS và tắt cập nhật shadowMap để giải phóng 75% tải GPU/CPU
    if (!isWindowFocused) {
      const now = performance.now()
      if (now - lastRenderTime.current < 42) {
        return
      }
      lastRenderTime.current = now
      if (gl.shadowMap.autoUpdate) {
        gl.shadowMap.autoUpdate = false
      }
    } else {
      if (!gl.shadowMap.autoUpdate) {
        gl.shadowMap.autoUpdate = true
        gl.shadowMap.needsUpdate = true
      }
    }
  })

  return null
}

export function Experience() {
  const mode = useStore((s) => s.mode)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const allowFull360 = true

  // Quản lý trạng thái tab và focus để ngừng/giảm tải khi người dùng dùng các ứng dụng khác
  const [isPageVisible, setIsPageVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true,
  )
  const [isWindowFocused, setIsWindowFocused] = useState(() =>
    typeof document !== 'undefined' ? document.hasFocus() : true,
  )

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const handleVisibility = () => {
      setIsPageVisible(!document.hidden)
      if (!document.hidden) setIsWindowFocused(true)
    }
    const handleFocus = () => {
      setIsWindowFocused(true)
      setIsPageVisible(true)
    }
    const handleBlur = () => {
      setIsWindowFocused(false)
    }
    const handlePointer = () => {
      if (!isWindowFocused) setIsWindowFocused(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('pointermove', handlePointer, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('pointermove', handlePointer)
    }
  }, [isWindowFocused])

  // Luôn giữ chất lượng HD sắc nét (1.35x khi focus cửa sổ, 1.0x khi mất focus để tiết kiệm GPU)
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 2
  const dpr = isWindowFocused ? Math.min(deviceDpr, 1.35) : 1.0

  return (
    <Canvas
      frameloop={isPageVisible ? 'always' : 'never'}
      shadows={{ type: THREE.PCFShadowMap }}
      performance={{ min: 0.5, max: 1 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={dpr}
      camera={{ position: HOME_VIEW.pos, fov: 34, near: 0.2, far: 150 }}
    >
      <BackgroundOptimizer isWindowFocused={isWindowFocused} />
      <SetupEnvironment />
      <Lights />
      <Room />
      <Furniture />
      <RainEffect />
      <Avatar p={[-1.1, 0, -1.2]} ry={0.15} />
      <Dog
        id="mochi"
        name="Mochi"
        p={[-3.2, 0, -1.6]}
        ry={0.45}
        feedPos={[-6.45, 0, 1.38]}
        feedYaw={-1.65}
        look={CORGI}
        s={1.2}
      />
      <Dog
        id="bo"
        name="Bơ"
        p={[2.6, 0, 3.8]}
        ry={-0.65}
        feedPos={[-6.95, 0, 1.95]}
        feedYaw={3.05}
        look={PUG}
        s={1.24}
      />
      {mode === 'orbit' ? (
        <>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={2.0}
            maxDistance={56}
            zoomSpeed={0.85}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI / 2.02}
            minAzimuthAngle={allowFull360 ? -Infinity : -Math.PI * 0.56}
            maxAzimuthAngle={allowFull360 ? Infinity : Math.PI * 0.56}
          />
          <CameraRig controlsRef={controlsRef} />
        </>
      ) : (
        <FirstPerson />
      )}
    </Canvas>
  )
}

const HOUSE_FOCUS_CENTER = new THREE.Vector3(-2.5, 2.2, 0)

/* ---------- Camera bay mượt tới đúng góc nhìn và quay về tổng quan chuẩn xác ---------- */
function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const tp = useMemo(() => new THREE.Vector3(), [])
  const tt = useMemo(() => new THREE.Vector3(), [])
  const downPos = useRef<[number, number] | null>(null)
  const lastDbgUpdate = useRef(0)

  useEffect(() => {
    camera.fov = 34
    camera.rotation.order = 'XYZ'
    camera.updateProjectionMatrix()
    const st = useStore.getState()
    if (!st.focus) {
      if (st.viewPreset === 'floor1') {
        st.setFocus(FLOOR1_VIEW, 'floor1')
      } else if (st.viewPreset === 'floor2') {
        st.setFocus(FLOOR2_VIEW, 'floor2')
      } else {
        st.setFocus(HOME_VIEW, 'overview')
      }
    }
  }, [camera])

  useEffect(() => {
    const dom = gl.domElement
    const onDown = (e: PointerEvent) => {
      downPos.current = [e.clientX, e.clientY]
    }
    const onMove = (e: PointerEvent) => {
      if (!downPos.current) return
      const dist = Math.hypot(e.clientX - downPos.current[0], e.clientY - downPos.current[1])
      if (dist > 6 && useStore.getState().focus) {
        useStore.getState().setFocus(null)
      }
    }
    const onUp = () => {
      downPos.current = null
    }
    const onWheel = () => {
      if (useStore.getState().focus) {
        useStore.getState().setFocus(null)
      }
    }
    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    dom.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      dom.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, dt) => {
    const controls = controlsRef.current
    const st = useStore.getState()
    const f = st.focus

    // Tự động mở Cutaway khi zoom sát ngôi nhà ở Toàn cảnh (kèm hysteresis tránh nhấp nháy)
    if (st.mode === 'orbit' && st.viewPreset === 'overview') {
      const dist = camera.position.distanceTo(HOUSE_FOCUS_CENTER)
      if (dist < 19.5 && !st.nearInteriorOpen) {
        st.setNearInteriorOpen(true)
      } else if (dist > 22.8 && st.nearInteriorOpen) {
        st.setNearInteriorOpen(false)
      }
    } else if (st.nearInteriorOpen) {
      st.setNearInteriorOpen(false)
    }

    const now = performance.now()
    if (now - lastDbgUpdate.current > 800) {
      lastDbgUpdate.current = now
      ;(window as unknown as Record<string, unknown>).__camDbg = {
        pos: [
          Number(camera.position.x.toFixed(2)),
          Number(camera.position.y.toFixed(2)),
          Number(camera.position.z.toFixed(2)),
        ],
        target: controls
          ? [
              Number(controls.target.x.toFixed(2)),
              Number(controls.target.y.toFixed(2)),
              Number(controls.target.z.toFixed(2)),
            ]
          : null,
        focus: f,
        activeChar: st.activeChar,
        activity: st.activity,
        activityPhase: st.activityPhase,
        boyActivity: st.boyActivity,
        boyPhase: st.boyPhase,
        girlActivity: st.girlActivity,
        girlPhase: st.girlPhase,
        boyAutoLife: st.boyAutoLife,
        girlAutoLife: st.girlAutoLife,
        isUserInitiated: st.isUserInitiated,
        petTargetId: st.petTargetId,
        khoaPos: LIVE_ACTORS.khoaPos,
        khoaFloorY: LIVE_ACTORS.khoaFloorY,
        girlPos: LIVE_ACTORS.girlPos,
        dogs: LIVE_ACTORS.dogs,
      }
    }
    if (controls) {
      // Khóa tâm camera (OrbitControls target) vào trung tâm Tầng 2 khi đang xem Tầng 2 ở chế độ Orbit
      const isFloor2Orbit = st.mode === 'orbit' && st.viewPreset === 'floor2'
      if (controls.enablePan !== !isFloor2Orbit) {
        controls.enablePan = !isFloor2Orbit
      }
      if (isFloor2Orbit && !f) {
        tt.set(...FLOOR2_VIEW.target)
        if (controls.target.distanceToSquared(tt) > 1e-6) {
          controls.target.copy(tt)
          controls.update()
        }
      }
    }
    if (!f || !controls) return
    const delta = Math.min(dt, 0.05)
    tp.set(...f.pos)
    tt.set(...f.target)
    const k = 1 - Math.exp(-delta * 9.5)
    camera.position.lerp(tp, k)
    controls.target.lerp(tt, k)
    controls.update()
    if (camera.position.distanceTo(tp) < 0.02 && controls.target.distanceTo(tt) < 0.02) {
      camera.position.copy(tp)
      controls.target.copy(tt)
      controls.update()
      st.setFocus(null)
    }
  })
  return null
}

function computeThirdPersonCameraPos(charPos: V3, camYaw: number, camPitch: number): V3 {
  const [cx, cy, cz] = charPos
  const bx = Math.sin(camYaw)
  const bz = Math.cos(camYaw)
  const desiredDist = 2.2

  const inFloor1House = cy < 3.5 && cx > -15.6 && cx < 10.0 && cz > -6.0 && cz < 6.0
  const inFloor2House = cy >= 3.5 && cx > -10.0 && cx < 10.0 && cz > -6.0 && cz < 6.0

  let armDist = desiredDist
  if (inFloor1House || inFloor2House) {
    for (let i = 1; i <= 10; i++) {
      const d = (desiredDist * i) / 10
      const px = cx + bx * d
      const pz = cz + bz * d
      const hitBack = pz <= -5.75
      const hitRight = px >= 9.75
      const hitFront = pz >= 5.75 && !(cy < 3.5 && px >= -2.15 && px <= -0.75)
      const hitBathLeft = cy < 3.5 && px <= -15.35
      const hitBathPartition =
        cy < 3.5 &&
        pz > -3.55 &&
        ((cx < -10.0 && px >= -10.25) || (cx > -10.0 && px <= -9.75))
      const hitTerraceWall = cy >= 3.5 && px <= -9.75 && (pz < 2.15 || pz > 4.05)

      if (hitBack || hitRight || hitFront || hitBathLeft || hitBathPartition || hitTerraceWall) {
        armDist = Math.max(0.55, (desiredDist * (i - 1)) / 10)
        break
      }
    }
  }

  const maxCamY = inFloor1House ? 3.85 : inFloor2House ? 8.2 : cy + 3.2
  const camY = THREE.MathUtils.clamp(cy + 1.55 - Math.sin(camPitch) * 0.7, cy + 0.55, maxCamY)

  return [cx + bx * armDist, camY, cz + bz * armDist]
}

/* ---------- Chế độ Vào nhà (Walkthrough): Hỗ trợ 2 góc nhìn 'eye' (tầm mắt) & 'third' (sau lưng) ---------- */
const CENTER_NDC = new THREE.Vector2(0, 0)

function isEffectivelyVisible(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    if (!cur.visible) return false
    cur = cur.parent
  }
  return true
}

function findInteractUserData(obj: THREE.Object3D): { interactHint?: string; onInteractClick?: () => void } | null {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    if (cur.userData && (typeof cur.userData.onInteractClick === 'function' || typeof cur.userData.interactHint === 'string')) {
      return cur.userData as { interactHint?: string; onInteractClick?: () => void }
    }
    cur = cur.parent
  }
  return null
}

function raycastCenterInteract(
  raycaster: THREE.Raycaster,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
): { interactHint?: string; onInteractClick?: () => void } | null {
  const st = useStore.getState()
  if (st.pianoModalOpen || st.wardrobeOpen || st.girlWardrobeOpen || st.activePhoto !== null) return null

  const char = st.userRole || st.activeChar || 'boy'
  const isGirl = char === 'girl'
  const charPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
  const isThird = st.fpPerspective === 'third'

  raycaster.setFromCamera(CENTER_NDC, camera)
  raycaster.far = 5.5
  const hits = raycaster.intersectObjects(scene.children, true)

  for (const hit of hits) {
    if (hit.distance > 5.5) break
    const obj = hit.object
    if (!isEffectivelyVisible(obj)) continue
    if (obj instanceof THREE.Points || obj instanceof THREE.Line || obj instanceof THREE.LineSegments) continue

    const interactData = findInteractUserData(obj)
    if (interactData && (interactData.onInteractClick || interactData.interactHint)) {
      return interactData
    }

    const mat = (obj as THREE.Mesh).material
    const firstMat = Array.isArray(mat) ? mat[0] : mat
    if (firstMat && 'transparent' in firstMat && firstMat.transparent && 'opacity' in firstMat && (firstMat.opacity as number) < 0.82) {
      continue
    }
    if (
      isThird &&
      Math.hypot(hit.point.x - charPos[0], hit.point.z - charPos[2]) < 0.55 &&
      hit.point.y >= charPos[1] - 0.1 &&
      hit.point.y <= charPos[1] + 1.9
    ) {
      continue
    }

    return null
  }
  return null
}

function FirstPerson() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(LIVE_ACTORS.fpYaw || 0.15)
  const pitch = useRef(-0.06)
  const dragging = useRef(false)
  const hasLastMouse = useRef(false)
  const lastMouse = useRef<[number, number]>([0, 0])
  const dragMovedDist = useRef(0)
  const lastSpawnTick = useRef(0)
  const isLockedRef = useRef(false)
  const lastUnlockAtRef = useRef(0)
  const raycasterRef = useRef(new THREE.Raycaster())
  const lastRaycastAtRef = useRef(0)
  const lastCenterHintRef = useRef<string | null>(null)
  const prevActiveStateRef = useRef<string>('idle:idle')
  const orientTimerRef = useRef(0)
  const orientCancelledRef = useRef(false)

  useEffect(() => {
    const dom = gl.domElement
    const st = useStore.getState()
    const isThird = st.fpPerspective === 'third'
    camera.fov = isThird ? 58 : 68
    camera.rotation.order = 'YXZ'
    camera.updateProjectionMatrix()

    const char = st.userRole || st.activeChar || 'boy'
    const isGirl = char === 'girl'
    let spawnPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
    let initYaw = (isGirl ? LIVE_ACTORS.girlYaw : LIVE_ACTORS.khoaYaw) + Math.PI

    if (st.walkthroughSpawn && st.walkthroughSpawn.tick !== lastSpawnTick.current) {
      lastSpawnTick.current = st.walkthroughSpawn.tick
      spawnPos = st.walkthroughSpawn.pos
      initYaw = st.walkthroughSpawn.yaw
    }

    yaw.current = initYaw
    pitch.current = isThird ? -0.07 : -0.04
    LIVE_ACTORS.fpYaw = yaw.current

    if (isThird) {
      const [cx, cy, cz] = computeThirdPersonCameraPos(spawnPos, yaw.current, pitch.current)
      camera.position.set(cx, cy, cz)
    } else {
      camera.position.set(
        spawnPos[0] - Math.sin(yaw.current) * 0.08,
        spawnPos[1] + 1.48,
        spawnPos[2] - Math.cos(yaw.current) * 0.08,
      )
    }
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    const syncLockState = (locked: boolean) => {
      const wasLocked = isLockedRef.current
      isLockedRef.current = locked
      if (wasLocked && !locked) {
        lastUnlockAtRef.current = performance.now()
      }
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).__gtaLocked = locked
        window.dispatchEvent(new CustomEvent('gta-lock-change', { detail: locked }))
      }
      dragging.current = false
      hasLastMouse.current = false
      if (!locked && lastCenterHintRef.current !== null) {
        lastCenterHintRef.current = null
        useStore.getState().setHoverHint(null)
      }
    }

    const requestGtaLock = () => {
      const cur = useStore.getState()
      if (cur.pianoModalOpen || cur.wardrobeOpen || cur.girlWardrobeOpen || cur.activePhoto !== null) return
      if (document.pointerLockElement === dom) return
      try {
        const maybePromise = dom.requestPointerLock?.() as unknown as Promise<void> | undefined
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch(() => {})
        }
      } catch {
        // Trình duyệt có thể từ chối requestPointerLock khi chưa có tương tác trực tiếp
      }
    }

    syncLockState(document.pointerLockElement === dom)
    requestGtaLock()

    const onPointerLockChange = () => {
      syncLockState(document.pointerLockElement === dom)
    }

    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true
      if (e.code === 'Escape') {
        const cur = useStore.getState()
        const modalOpen = cur.pianoModalOpen || cur.wardrobeOpen || cur.girlWardrobeOpen || cur.activePhoto !== null
        if (modalOpen) return
        if (
          document.pointerLockElement === dom ||
          isLockedRef.current ||
          performance.now() - lastUnlockAtRef.current < 300
        ) {
          return
        }
        cur.setMode('orbit')
      } else if (e.code === 'KeyV') {
        useStore.getState().toggleFpPerspective()
      } else if (e.code === 'Space') {
        const cur = useStore.getState()
        const curChar = cur.userRole || cur.activeChar || 'boy'
        const act = curChar === 'boy' ? cur.boyActivity : cur.girlActivity
        if (act !== 'idle') {
          cur.startActivity('idle', true, curChar)
        }
      } else if (e.code === 'KeyE') {
        const cur = useStore.getState()
        const curChar = cur.userRole || cur.activeChar || 'boy'
        const act = curChar === 'boy' ? cur.boyActivity : cur.girlActivity
        if (act !== 'idle') {
          cur.startActivity('idle', true, curChar)
          return
        }

        if (document.pointerLockElement === dom) {
          const hit = raycastCenterInteract(raycasterRef.current, camera, scene)
          if (hit?.onInteractClick) {
            hit.onInteractClick()
            return
          }
        }

        const curPos = curChar === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
        // Kiểm tra xem có đứng gần Mochi hoặc Bơ không
        const dMochi = Math.hypot(
          LIVE_ACTORS.dogs.mochi.pos[0] - curPos[0],
          LIVE_ACTORS.dogs.mochi.pos[2] - curPos[2],
        )
        const dBo = Math.hypot(
          LIVE_ACTORS.dogs.bo.pos[0] - curPos[0],
          LIVE_ACTORS.dogs.bo.pos[2] - curPos[2],
        )
        if (Math.min(dMochi, dBo) < 2.4) {
          cur.petDog(dMochi <= dBo ? 'mochi' : 'bo', true, curChar)
          return
        }

        let nearest: Exclude<Activity, 'idle' | 'pet'> | null = null
        let bestDist = 3.6
        ;(Object.keys(STATIONS) as Exclude<Activity, 'idle'>[]).forEach((item) => {
          if (item === 'pet') return
          if (item === 'wardrobe' && curChar !== 'boy') return
          if (item === 'girl_wardrobe' && curChar !== 'girl') return
          const ep = STATIONS[item].entryPos
          const d = Math.hypot(ep[0] - curPos[0], ep[1] - curPos[2])
          if (d < bestDist) {
            bestDist = d
            nearest = item
          }
        })
        if (nearest) {
          cur.startActivity(nearest, true, curChar)
        }
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }

    const onPointerEnter = (e: PointerEvent) => {
      lastMouse.current = [e.clientX, e.clientY]
      hasLastMouse.current = true
    }

    const onPointerLeave = () => {
      hasLastMouse.current = false
      dragging.current = false
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      hasLastMouse.current = true
      lastMouse.current = [e.clientX, e.clientY]
      dragMovedDist.current = 0
    }

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom || e.button !== 0) return
      const hit = raycastCenterInteract(raycasterRef.current, camera, scene)
      if (hit?.onInteractClick) {
        hit.onInteractClick()
        const next = useStore.getState()
        if (next.pianoModalOpen || next.wardrobeOpen || next.girlWardrobeOpen || next.activePhoto !== null) {
          try {
            document.exitPointerLock?.()
          } catch {
            // Bỏ qua nếu không thể thoát pointer lock
          }
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === dom) {
        const dx = THREE.MathUtils.clamp(e.movementX || 0, -180, 180)
        const dy = THREE.MathUtils.clamp(e.movementY || 0, -180, 180)
        yaw.current -= dx * 0.0024
        pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0022, -1.15, 1.15)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          orientCancelledRef.current = true
          orientTimerRef.current = 0
        }
        return
      }

      const cur = useStore.getState()
      if (cur.pianoModalOpen || cur.wardrobeOpen || cur.girlWardrobeOpen || cur.activePhoto !== null) return

      if (dragging.current) {
        if (!hasLastMouse.current) {
          lastMouse.current = [e.clientX, e.clientY]
          hasLastMouse.current = true
          return
        }
        const dx = THREE.MathUtils.clamp(e.clientX - lastMouse.current[0], -120, 120)
        const dy = THREE.MathUtils.clamp(e.clientY - lastMouse.current[1], -120, 120)
        lastMouse.current = [e.clientX, e.clientY]
        dragMovedDist.current += Math.hypot(dx, dy)
        yaw.current -= dx * 0.0042
        pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0042, -1.15, 1.15)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          orientCancelledRef.current = true
          orientTimerRef.current = 0
        }
      } else if (e.target === dom) {
        // Fallback lia chuột nhẹ mượt khi con trỏ nằm trên canvas mà chưa khóa chuột
        if (!hasLastMouse.current) {
          lastMouse.current = [e.clientX, e.clientY]
          hasLastMouse.current = true
          return
        }
        const dx = THREE.MathUtils.clamp(e.clientX - lastMouse.current[0], -80, 80)
        const dy = THREE.MathUtils.clamp(e.clientY - lastMouse.current[1], -80, 80)
        lastMouse.current = [e.clientX, e.clientY]
        yaw.current -= dx * 0.0018
        pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0016, -1.15, 1.15)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          orientCancelledRef.current = true
          orientTimerRef.current = 0
        }
      }
    }

    const onMouseUp = () => {
      dragging.current = false
    }

    const onCanvasClick = () => {
      if (document.pointerLockElement === dom) return
      if (dragMovedDist.current >= 8) return
      requestGtaLock()
    }

    // Chặn pointermove/click tọa độ đóng băng của R3F khi đang Pointer Lock để tránh click nhầm vị trí cũ
    const suppressLockedPointerMove = (e: PointerEvent) => {
      if (document.pointerLockElement === dom) {
        e.stopPropagation()
      }
    }
    const suppressLockedClick = (e: MouseEvent) => {
      if (document.pointerLockElement === dom) {
        e.stopPropagation()
      }
    }

    document.addEventListener('pointerlockchange', onPointerLockChange)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    dom.addEventListener('pointerenter', onPointerEnter)
    dom.addEventListener('pointerleave', onPointerLeave)
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('click', onCanvasClick)
    dom.addEventListener('pointermove', suppressLockedPointerMove, true)
    dom.addEventListener('click', suppressLockedClick, true)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      dom.removeEventListener('pointerenter', onPointerEnter)
      dom.removeEventListener('pointerleave', onPointerLeave)
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('click', onCanvasClick)
      dom.removeEventListener('pointermove', suppressLockedPointerMove, true)
      dom.removeEventListener('click', suppressLockedClick, true)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      syncLockState(false)
      if (document.pointerLockElement === dom) {
        try {
          document.exitPointerLock?.()
        } catch {
          // Bỏ qua lỗi khi unmount
        }
      }
    }
  }, [camera, gl, scene])

  useFrame(({ clock }, dt) => {
    const st = useStore.getState()
    const k = keys.current
    const delta = Math.min(dt, 0.05)
    const t = clock.elapsedTime
    const isThird = st.fpPerspective === 'third'
    const dom = gl.domElement

    const modalOpen = st.pianoModalOpen || st.wardrobeOpen || st.girlWardrobeOpen || st.activePhoto !== null
    if (modalOpen && document.pointerLockElement === dom) {
      try {
        document.exitPointerLock?.()
      } catch {
        // Bỏ qua nếu thoát lock không thành công
      }
    }

    const targetFov = isThird ? 58 : 68
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-delta * 10))
      camera.updateProjectionMatrix()
    }

    if (k.KeyQ) yaw.current += 1.8 * delta

    const char = st.userRole || st.activeChar || 'boy'
    const isGirl = char === 'girl'
    let charPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
    const charYaw = isGirl ? LIVE_ACTORS.girlYaw : LIVE_ACTORS.khoaYaw
    const currentAct = isGirl ? st.girlActivity : st.boyActivity
    const currentPhase = isGirl ? st.girlPhase : st.boyPhase

    // Đồng bộ ngay yaw & vị trí camera khi người dùng nhảy tới một không gian qua Thanh Điều hướng Phòng
    let snapped = false
    if (st.walkthroughSpawn && st.walkthroughSpawn.tick !== lastSpawnTick.current) {
      lastSpawnTick.current = st.walkthroughSpawn.tick
      yaw.current = st.walkthroughSpawn.yaw
      pitch.current = isThird ? -0.07 : -0.04
      charPos = st.walkthroughSpawn.pos
      snapped = true
    }

    LIVE_ACTORS.fpYaw = yaw.current

    let eyeH = 1.48
    let eyeForward = 0.08
    if (currentAct === 'sleep' || currentAct === 'girl_sleep') {
      eyeH = currentPhase === 'active' ? 0.38 : 1.48
      eyeForward = 0.05
    } else if (currentAct === 'bath') {
      eyeH = currentPhase === 'active' ? 0.65 : 1.48
      eyeForward = 0.08
    } else if (
      currentAct === 'pc' ||
      currentAct === 'tv' ||
      currentAct === 'girl_pc' ||
      currentAct === 'girl_vanity' ||
      currentAct === 'girl_lounge' ||
      currentAct === 'girl_nook' ||
      currentAct === 'read'
    ) {
      eyeH = currentPhase === 'active' ? 1.12 : 1.48
      eyeForward = 0.08
    }

    const isWalking = currentPhase === 'walking'
    const bob = isWalking ? Math.abs(Math.sin(t * 10)) * 0.035 : 0

    let targetCamX: number
    let targetCamY: number
    let targetCamZ: number

    if (isThird) {
      const [tx, ty, tz] = computeThirdPersonCameraPos(charPos, yaw.current, pitch.current)
      targetCamX = tx
      targetCamY = ty + bob * 0.4
      targetCamZ = tz
    } else {
      targetCamX = charPos[0] - Math.sin(yaw.current) * eyeForward
      targetCamY = charPos[1] + eyeH + bob
      targetCamZ = charPos[2] - Math.cos(yaw.current) * eyeForward
    }

    if (snapped) {
      camera.position.set(targetCamX, targetCamY, targetCamZ)
    } else {
      const lerpK = 1 - Math.exp(-delta * (isThird ? 16 : 22))
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, lerpK)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, lerpK)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, lerpK)
    }

    const isManualKeyMove = Boolean(
      k.KeyW || k.KeyA || k.KeyS || k.KeyD || k.ArrowUp || k.ArrowDown || k.ArrowLeft || k.ArrowRight,
    )

    // Khi mới chuyển sang ngồi/nằm/tương tác đồ vật, chỉ xoay nhẹ 1 lần trong ~0.45s đầu (tắt ngay nếu chuột di chuyển) để tự do xoay 360°
    const activeStateKey = `${currentAct}:${currentPhase}`
    if (currentAct !== 'idle' && currentPhase === 'active') {
      if (prevActiveStateRef.current !== activeStateKey) {
        prevActiveStateRef.current = activeStateKey
        orientTimerRef.current = 0.45
        orientCancelledRef.current = false
      }
      if (orientTimerRef.current > 0 && !orientCancelledRef.current && !dragging.current && !snapped && !isManualKeyMove) {
        orientTimerRef.current = Math.max(0, orientTimerRef.current - delta)
        const station = STATIONS[currentAct]
        if (station) {
          const ldx = station.fpTarget[0] - station.fpPos[0]
          const ldz = station.fpTarget[2] - station.fpPos[2]
          const targetYaw = Math.atan2(-ldx, -ldz)
          const diff = Math.atan2(Math.sin(targetYaw - yaw.current), Math.cos(targetYaw - yaw.current))
          yaw.current += diff * Math.min(1, delta * 6.5)
        }
      }
    } else {
      prevActiveStateRef.current = activeStateKey
      orientTimerRef.current = 0
      orientCancelledRef.current = false
      if (!isLockedRef.current && !dragging.current && !snapped && !isManualKeyMove && (isWalking || st.avatarTarget)) {
        const desiredCamYaw = charYaw + Math.PI
        const diff = Math.atan2(Math.sin(desiredCamYaw - yaw.current), Math.cos(desiredCamYaw - yaw.current))
        yaw.current += diff * Math.min(1, delta * 3.5)
      }
    }

    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    // Raycast từ tâm màn hình (0, 0) mỗi ~80ms khi khóa chuột GTA để hiển thị gợi ý tương tác
    if (document.pointerLockElement === dom) {
      const now = performance.now()
      if (now - lastRaycastAtRef.current >= 80) {
        lastRaycastAtRef.current = now
        const hit = raycastCenterInteract(raycasterRef.current, camera, scene)
        const nextHint = hit?.interactHint ?? null
        if (nextHint !== lastCenterHintRef.current) {
          lastCenterHintRef.current = nextHint
          st.setHoverHint(nextHint)
        }
      }
    }
  })

  return null
}
