import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  Canvas,
  events as createR3FPointerEvents,
  useFrame,
  useThree,
  type DomEvent,
  type EventManager,
  type Events,
  type RootState,
  type RootStore,
} from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Room, Lights } from './Room'
import { Furniture } from './Furniture'
import { Avatar, CORGI, Dog, PUG, getGroundY } from './Characters'
import { FLOOR1_VIEW, FLOOR2_VIEW, HOME_VIEW, LIVE_ACTORS, STATIONS } from '../data/config'
import { useStore, type Activity } from '../store'
import {
  MAX_FP_INTERACT_DIST,
  findInteractZoneOfObject,
  getActiveInteractableMeshes,
  getSpringArmOccluders,
  getVisibleOccluderMeshes,
  isHouseClosedOverview,
  isOccluderHit,
  isOrbitDragging,
  isValidClick,
  isZoneInteractive,
  recordPointerDown,
  setOrbitDragging,
} from './raycastRegistry'

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

const POINTER_MOVE_THROTTLE_MS = 65
const _occluderRaycaster = new THREE.Raycaster()
const _closedShellRaycaster = new THREE.Raycaster()
let lastInteractClickAt = 0

function clearHoverState() {
  if (typeof document !== 'undefined' && document.body.style.cursor !== 'auto') {
    document.body.style.cursor = 'auto'
  }
  const st = useStore.getState()
  if (st.hoverHint !== null) {
    st.setHoverHint(null)
  }
}

function maybeNotifyClosedOverviewClick(e: MouseEvent, rootState: RootState) {
  if (!isHouseClosedOverview()) return
  rootState.events.compute?.(e as unknown as DomEvent, rootState)
  const occluders = getVisibleOccluderMeshes()
  if (occluders.length === 0) return

  const activeInteractables = getActiveInteractableMeshes()
  _closedShellRaycaster.ray.copy(rootState.raycaster.ray)
  _closedShellRaycaster.near = rootState.raycaster.near
  _closedShellRaycaster.far = 150

  const occHits = _closedShellRaycaster.intersectObjects(occluders, false)
  const firstOcc = occHits.find((h) => isOccluderHit(h.object))
  if (!firstOcc) return

  const actHits =
    activeInteractables.length > 0
      ? _closedShellRaycaster.intersectObjects(activeInteractables, false)
      : []
  const firstAct = actHits[0]
  if (firstAct && firstAct.distance <= firstOcc.distance + 0.02) {
    return
  }

  const p = firstOcc.point
  const occKind = firstOcc.object.userData?.occluderKind as string | undefined
  const isShellKind = !occKind || occKind === 'wall' || occKind === 'glass' || occKind === 'roof' || p.y >= 2.8
  const onClosedHouseShell =
    isShellKind &&
    p.x >= -16.35 &&
    p.x <= 11.15 &&
    p.z >= -6.65 &&
    p.z <= 8.0 &&
    p.y >= 0.02 &&
    p.y <= 10.2
  if (onClosedHouseShell) {
    useStore
      .getState()
      .notify('💡 Bấm "Tầm mắt" hoặc "Tầng 1 / Tầng 2" để khám phá bên trong')
  }
}

/** Custom R3F EventManager: throttle pointermove ~65ms, pause khi drag, kiểm tra occlusion tường/kính & drag threshold */
function createVillaPointerEvents(store: RootStore): EventManager<HTMLElement> {
  const base = createR3FPointerEvents(store)
  let lastPointerMoveRaycastAt = 0

  const filter = (items: THREE.Intersection[], state: RootState): THREE.Intersection[] => {
    const st = useStore.getState()
    const dom = state.gl?.domElement
    if (
      st.mode === 'fp' &&
      typeof document !== 'undefined' &&
      dom &&
      document.pointerLockElement === dom
    ) {
      return []
    }
    if (!items.length) return items

    const occluders = getVisibleOccluderMeshes()
    let firstOccDist = Infinity
    let firstOccObj: THREE.Object3D | null = null
    if (occluders.length > 0) {
      _occluderRaycaster.ray.copy(state.raycaster.ray)
      _occluderRaycaster.near = state.raycaster.near
      _occluderRaycaster.far = items[items.length - 1].distance + 0.05
      const occHits = _occluderRaycaster.intersectObjects(occluders, false)
      for (const oh of occHits) {
        if (isOccluderHit(oh.object)) {
          firstOccDist = oh.distance
          firstOccObj = oh.object
          break
        }
      }
    }

    if (
      firstOccObj !== null &&
      items[0].object !== firstOccObj &&
      items[0].distance > firstOccDist + 0.015
    ) {
      clearHoverState()
      return []
    }

    const filtered: THREE.Intersection[] = []
    for (const item of items) {
      if (
        firstOccObj !== null &&
        item.object !== firstOccObj &&
        item.distance > firstOccDist + 0.015
      ) {
        continue
      }

      const zone = findInteractZoneOfObject(item.object)
      if (zone && !isZoneInteractive(zone, st)) {
        continue
      }

      if (isHouseClosedOverview(st) && !zone) {
        const p = item.point
        const insideClosedHouse =
          p.x >= -16.1 && p.x <= 10.6 && p.z >= -6.3 && p.z <= 6.3 && p.y > -0.25
        if (insideClosedHouse || isOccluderHit(item.object)) {
          continue
        }
      }

      if (zone !== null && !isWithinFpInteractRange(st, item.point, item.distance)) {
        continue
      }

      filtered.push(item)
    }

    if (filtered.length === 0) {
      clearHoverState()
    }
    return filtered
  }

  const baseHandlers = base.handlers!
  const wrappedHandlers: Events = {
    ...baseHandlers,
    onPointerDown: (e) => {
      if (e instanceof PointerEvent || e instanceof MouseEvent) {
        recordPointerDown(e.clientX, e.clientY)
      }
      baseHandlers.onPointerDown(e)
    },
    onPointerMove: (e) => {
      const rootState = store.getState()
      const dom = rootState.gl?.domElement
      if (typeof document !== 'undefined' && dom && document.pointerLockElement === dom) {
        return
      }
      if (isOrbitDragging()) {
        if (rootState.internal.hovered.size > 0) {
          baseHandlers.onPointerCancel(e)
        }
        clearHoverState()
        return
      }
      const now = performance.now()
      if (now - lastPointerMoveRaycastAt < POINTER_MOVE_THROTTLE_MS) return
      lastPointerMoveRaycastAt = now
      baseHandlers.onPointerMove(e)
    },
    onClick: (e) => {
      const rootState = store.getState()
      const dom = rootState.gl?.domElement
      if (typeof document !== 'undefined' && dom && document.pointerLockElement === dom) {
        return
      }
      if (e instanceof MouseEvent && !isValidClick(e.clientX, e.clientY, 5, 250)) {
        return
      }
      if (e instanceof MouseEvent) {
        rootState.events.compute?.(e as unknown as DomEvent, rootState)
        const actMeshes = getActiveInteractableMeshes()
        if (actMeshes.length > 0) {
          _occluderRaycaster.ray.copy(rootState.raycaster.ray)
          _occluderRaycaster.near = rootState.raycaster.near
          _occluderRaycaster.far = 150
          const actHits = _occluderRaycaster.intersectObjects(actMeshes, false)
          if (actHits.length > 0 && isWithinFpInteractRange(useStore.getState(), actHits[0].point, actHits[0].distance)) {
            const occluders = getVisibleOccluderMeshes()
            const occHits =
              occluders.length > 0 ? _occluderRaycaster.intersectObjects(occluders, false) : []
            const firstOcc = occHits.find((h) => isOccluderHit(h.object))
            if (!firstOcc || actHits[0].distance <= firstOcc.distance + 0.015) {
              lastInteractClickAt = performance.now()
            }
          }
        }
      }
      const wasClosedOverview = isHouseClosedOverview()
      baseHandlers.onClick(e)
      if (wasClosedOverview && isHouseClosedOverview() && e instanceof MouseEvent) {
        maybeNotifyClosedOverviewClick(e, rootState)
      }
    },
    onDoubleClick: (e) => {
      if (e instanceof MouseEvent && !isValidClick(e.clientX, e.clientY, 5, 250)) {
        return
      }
      baseHandlers.onDoubleClick(e)
    },
  }

  return {
    ...base,
    filter,
    handlers: wrappedHandlers,
  }
}

/** Gắn pointerdown/pointerup/pointercancel toàn cục lên canvas để đồng bộ drag threshold và isOrbitDragging */
function PointerInteractionBridge() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const dom = gl.domElement
    const onPointerDown = (e: PointerEvent) => {
      recordPointerDown(e.clientX, e.clientY)
    }
    const onPointerEnd = () => {
      setOrbitDragging(false)
    }
    dom.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
    window.addEventListener('blur', onPointerEnd)
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('blur', onPointerEnd)
      setOrbitDragging(false)
    }
  }, [gl])
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

  // Giới hạn pixelRatio không bao giờ vượt quá 1.5 (giảm về 1.0 khi mất focus để tiết kiệm GPU)
  const maxDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5)
  const dpr: [number, number] = [1, isWindowFocused ? maxDpr : 1.0]

  return (
    <Canvas
      frameloop={isPageVisible ? 'always' : 'never'}
      shadows={{ type: THREE.PCFShadowMap }}
      performance={{ min: 0.5, max: 1 }}
      events={createVillaPointerEvents}
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
      <PointerInteractionBridge />
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
            onStart={() => {
              setOrbitDragging(true)
              clearHoverState()
            }}
            onEnd={() => setOrbitDragging(false)}
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

/* ---------- Chế độ Vào nhà (GTA Third-Person Free-Orbit & Eye-Level): Hỗ trợ Spring Arm + Auto-Recenter + Zoom ---------- */
const CENTER_NDC = new THREE.Vector2(0, 0)
const PITCH_MIN = -Math.PI / 3 // -60°
const PITCH_MAX = (75 * Math.PI) / 180 // +75°
const DEFAULT_THIRD_PITCH = 0.22
const DEFAULT_EYE_PITCH = 0.04
const AUTO_RECENTER_DELAY_MS = 2000

function getCameraFloorY(camX: number, camZ: number, charFloorY: number): number {
  if (charFloorY >= 3.5) {
    const onMainSlab = camX >= -10.0 && camX <= 10.0 && camZ >= -6.0 && camZ <= 0.18
    const onBedroomBalcony = camX >= -7.7 && camX <= -1.2 && camZ > 0.18 && camZ <= 5.98
    const onTerrace = camX >= -15.6 && camX < -10.0 && camZ >= -6.0 && camZ <= 6.0
    if (onMainSlab || onBedroomBalcony || onTerrace) {
      return 4.35
    }
  }
  return getGroundY(camX, camZ)
}

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

function isWithinFpInteractRange(
  st: ReturnType<typeof useStore.getState>,
  hitPoint: THREE.Vector3,
  rayDistance: number,
): boolean {
  if (st.mode !== 'fp') return true
  if (st.fpPerspective === 'eye') {
    return rayDistance <= MAX_FP_INTERACT_DIST
  }
  const char = st.userRole || st.activeChar || 'boy'
  const charPos = char === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
  const charDist = Math.hypot(
    hitPoint.x - charPos[0],
    hitPoint.y - (charPos[1] + 1.0),
    hitPoint.z - charPos[2],
  )
  return charDist <= MAX_FP_INTERACT_DIST
}

function raycastInteractFromRay(
  raycaster: THREE.Raycaster,
  maxFar: number,
): { interactHint?: string; onInteractClick?: () => void } | null {
  const st = useStore.getState()
  if (st.pianoModalOpen || st.wardrobeOpen || st.girlWardrobeOpen || st.activePhoto !== null) return null

  const char = st.userRole || st.activeChar || 'boy'
  const isGirl = char === 'girl'
  const charPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
  const isThird = st.fpPerspective === 'third'

  const interactMeshes = getActiveInteractableMeshes()
  if (interactMeshes.length === 0) return null
  const occluderMeshes = getVisibleOccluderMeshes()

  const targetSet = new Set<THREE.Object3D>(interactMeshes)
  for (const m of occluderMeshes) targetSet.add(m)
  const targets = Array.from(targetSet)

  raycaster.near = 0.05
  raycaster.far = maxFar
  const hits = raycaster.intersectObjects(targets, false)

  for (const hit of hits) {
    const obj = hit.object
    if (obj instanceof THREE.Points || obj instanceof THREE.Line || obj instanceof THREE.LineSegments) {
      continue
    }
    if (!isEffectivelyVisible(obj)) continue

    // Bỏ qua chính cơ thể nhân vật đang điều khiển ở góc nhìn thứ 3
    if (
      isThird &&
      Math.hypot(hit.point.x - charPos[0], hit.point.z - charPos[2]) < 0.55 &&
      hit.point.y >= charPos[1] - 0.1 &&
      hit.point.y <= charPos[1] + 1.9
    ) {
      continue
    }

    const interactData = findInteractUserData(obj)
    const zone = findInteractZoneOfObject(obj)

    // Chặn xuyên tường/sàn/mái/kính: nếu giao cắt gần nhất là vật cản kiến trúc -> dừng ngay
    if (isOccluderHit(obj) && !interactData) {
      return null
    }

    if (zone && !isZoneInteractive(zone, st)) {
      return null
    }

    if (interactData && (typeof interactData.onInteractClick === 'function' || typeof interactData.interactHint === 'string')) {
      if (!isWithinFpInteractRange(st, hit.point, hit.distance)) {
        return null
      }
      return interactData
    }
  }
  return null
}

function raycastCenterInteract(
  raycaster: THREE.Raycaster,
  camera: THREE.PerspectiveCamera,
): { interactHint?: string; onInteractClick?: () => void } | null {
  const st = useStore.getState()
  const isThird = st.fpPerspective === 'third'
  raycaster.setFromCamera(CENTER_NDC, camera)
  const maxFar = isThird ? st.fpDistance + MAX_FP_INTERACT_DIST + 1.5 : MAX_FP_INTERACT_DIST
  return raycastInteractFromRay(raycaster, maxFar)
}

function FirstPerson() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(LIVE_ACTORS.fpYaw || 0.15)
  const pitch = useRef(DEFAULT_THIRD_PITCH)
  const smoothPivot = useRef(new THREE.Vector3())
  const pivotInitialized = useRef(false)
  const desiredDistRef = useRef(useStore.getState().fpDistance)
  const actualArmDistRef = useRef(useStore.getState().fpDistance)
  const lastMouseOrbitAt = useRef(performance.now())
  const dragging = useRef(false)
  const hasLastMouse = useRef(false)
  const lastMouse = useRef<[number, number]>([0, 0])
  const dragMovedDist = useRef(0)
  const lastSpawnTick = useRef(0)
  const isLockedRef = useRef(false)
  const lastUnlockAtRef = useRef(0)
  const raycasterRef = useRef(new THREE.Raycaster())
  const clickNdcRef = useRef(new THREE.Vector2())
  const springRaycasterRef = useRef(new THREE.Raycaster())
  const springDirRef = useRef(new THREE.Vector3())
  const targetPivotVec = useRef(new THREE.Vector3())
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
      initYaw = st.walkthroughSpawn.yaw + Math.PI
    }

    yaw.current = initYaw
    pitch.current = isThird ? DEFAULT_THIRD_PITCH : DEFAULT_EYE_PITCH
    LIVE_ACTORS.fpYaw = yaw.current
    desiredDistRef.current = st.fpDistance
    actualArmDistRef.current = st.fpDistance
    smoothPivot.current.set(spawnPos[0], spawnPos[1] + 1.42, spawnPos[2])
    pivotInitialized.current = true
    lastMouseOrbitAt.current = performance.now()

    if (isThird) {
      const cosP = Math.cos(pitch.current)
      const dirX = Math.sin(yaw.current) * cosP
      const dirY = Math.sin(pitch.current)
      const dirZ = Math.cos(yaw.current) * cosP
      springDirRef.current.set(dirX, dirY, dirZ)
      const armOccluders = getSpringArmOccluders()
      let initArmDist = st.fpDistance
      if (armOccluders.length > 0) {
        springRaycasterRef.current.set(smoothPivot.current, springDirRef.current)
        springRaycasterRef.current.near = 0.15
        springRaycasterRef.current.far = st.fpDistance + 0.3
        const hits = springRaycasterRef.current.intersectObjects(armOccluders, true)
        if (hits.length > 0 && hits[0].distance < st.fpDistance) {
          initArmDist = Math.max(0.55, hits[0].distance - 0.28)
        }
      }
      actualArmDistRef.current = initArmDist
      const cx = smoothPivot.current.x + dirX * initArmDist
      const rawY = smoothPivot.current.y + dirY * initArmDist
      const cz = smoothPivot.current.z + dirZ * initArmDist
      const floorY = getCameraFloorY(cx, cz, spawnPos[1])
      camera.position.set(cx, Math.max(rawY, floorY + 0.18), cz)
      camera.lookAt(smoothPivot.current)
    } else {
      camera.position.set(
        spawnPos[0] - Math.sin(yaw.current) * 0.08,
        spawnPos[1] + 1.48,
        spawnPos[2] - Math.cos(yaw.current) * 0.08,
      )
      camera.rotation.set(-pitch.current, yaw.current, 0, 'YXZ')
    }

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
      setOrbitDragging(false)
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
        if (e.repeat) return
        useStore.getState().cycleFpDistPreset()
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
          const hit = raycastCenterInteract(raycasterRef.current, camera)
          if (hit?.onInteractClick) {
            hit.onInteractClick()
            return
          }
        }

        const curPos = curChar === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
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
      setOrbitDragging(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return
      dragging.current = true
      hasLastMouse.current = true
      lastMouse.current = [e.clientX, e.clientY]
      dragMovedDist.current = 0
    }

    const onContextMenu = (e: MouseEvent) => {
      if (useStore.getState().mode === 'fp') {
        e.preventDefault()
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom || e.button !== 0) return
      const hit = raycastCenterInteract(raycasterRef.current, camera)
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
        pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.0022, PITCH_MIN, PITCH_MAX)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          lastMouseOrbitAt.current = performance.now()
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
        if (dragMovedDist.current > 3) {
          setOrbitDragging(true)
        }
        yaw.current -= dx * 0.0042
        pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.0042, PITCH_MIN, PITCH_MAX)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          lastMouseOrbitAt.current = performance.now()
          orientCancelledRef.current = true
          orientTimerRef.current = 0
        }
      }
    }

    const onMouseUp = () => {
      dragging.current = false
      hasLastMouse.current = false
      setOrbitDragging(false)
    }

    const onWheel = (e: WheelEvent) => {
      const cur = useStore.getState()
      if (cur.mode !== 'fp' || cur.fpPerspective !== 'third') return
      if (cur.pianoModalOpen || cur.wardrobeOpen || cur.girlWardrobeOpen || cur.activePhoto !== null) return
      e.preventDefault()
      const deltaNorm = THREE.MathUtils.clamp(e.deltaY, -160, 160) * 0.0045
      cur.setFpDistance(cur.fpDistance + deltaNorm)
    }

    const onCanvasClick = (e: MouseEvent) => {
      if (document.pointerLockElement === dom) return
      const cur = useStore.getState()
      if (cur.pianoModalOpen || cur.wardrobeOpen || cur.girlWardrobeOpen || cur.activePhoto !== null) return
      if (!isValidClick(e.clientX, e.clientY, 5, 250)) return
      if (performance.now() - lastInteractClickAt < 100) return

      const rect = dom.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        clickNdcRef.current.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        )
        raycasterRef.current.setFromCamera(clickNdcRef.current, camera)
        const hit = raycastInteractFromRay(raycasterRef.current, 150)
        if (hit && (typeof hit.onInteractClick === 'function' || typeof hit.interactHint === 'string')) {
          lastInteractClickAt = performance.now()
          return
        }
      }

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
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('pointerup', onMouseUp)
    window.addEventListener('pointercancel', onMouseUp)
    window.addEventListener('blur', onMouseUp)
    dom.addEventListener('pointerenter', onPointerEnter)
    dom.addEventListener('pointerleave', onPointerLeave)
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('contextmenu', onContextMenu)
    dom.addEventListener('wheel', onWheel, { passive: false })
    dom.addEventListener('click', onCanvasClick)
    dom.addEventListener('pointermove', suppressLockedPointerMove, true)
    dom.addEventListener('click', suppressLockedClick, true)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('pointerup', onMouseUp)
      window.removeEventListener('pointercancel', onMouseUp)
      window.removeEventListener('blur', onMouseUp)
      dom.removeEventListener('pointerenter', onPointerEnter)
      dom.removeEventListener('pointerleave', onPointerLeave)
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('contextmenu', onContextMenu)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('click', onCanvasClick)
      dom.removeEventListener('pointermove', suppressLockedPointerMove, true)
      dom.removeEventListener('click', suppressLockedClick, true)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      syncLockState(false)
      if (document.pointerLockElement === dom) {
        try {
          document.exitPointerLock?.()
        } catch {
          // Bỏ qua lỗi khi unmount
        }
      }
    }
  }, [camera, gl])

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

    if (k.KeyQ) {
      yaw.current += 1.8 * delta
      lastMouseOrbitAt.current = performance.now()
    }

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
      yaw.current = st.walkthroughSpawn.yaw + Math.PI
      pitch.current = isThird ? DEFAULT_THIRD_PITCH : DEFAULT_EYE_PITCH
      charPos = st.walkthroughSpawn.pos
      snapped = true
      lastMouseOrbitAt.current = performance.now()
    }

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

    const isManualKeyMove = Boolean(
      k.KeyW || k.KeyA || k.KeyS || k.KeyD || k.ArrowUp || k.ArrowDown || k.ArrowLeft || k.ArrowRight,
    )
    const isForwardOnlyKey =
      Boolean(k.KeyW || k.ArrowUp) &&
      !k.KeyS &&
      !k.ArrowDown &&
      !k.KeyA &&
      !k.KeyD &&
      !k.ArrowLeft &&
      !k.ArrowRight
    const isTapWalking = !isManualKeyMove && (isWalking || Boolean(st.avatarTarget))

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

      // Auto-Recenter sau 2 giây không di chuyển chuột khi đang tiến tới hoặc đi tới điểm click
      const idleMouseMs = performance.now() - lastMouseOrbitAt.current
      if (
        idleMouseMs >= AUTO_RECENTER_DELAY_MS &&
        !dragging.current &&
        !snapped &&
        (isForwardOnlyKey || isTapWalking)
      ) {
        const desiredCamYaw = charYaw + Math.PI
        const diff = Math.atan2(
          Math.sin(desiredCamYaw - yaw.current),
          Math.cos(desiredCamYaw - yaw.current),
        )
        yaw.current += diff * Math.min(1, delta * 2.8)
      }
    }

    LIVE_ACTORS.fpYaw = yaw.current

    if (isThird) {
      // 1. Pivot mục tiêu ở lưng/vai nhân vật với Smooth Damping / Camera Lag
      targetPivotVec.current.set(charPos[0], charPos[1] + 1.42, charPos[2])
      if (snapped || !pivotInitialized.current) {
        smoothPivot.current.copy(targetPivotVec.current)
        pivotInitialized.current = true
      } else {
        const kHoriz = 1 - Math.exp(-delta * 10.5)
        const kVert = 1 - Math.exp(-delta * 15.0)
        smoothPivot.current.x = THREE.MathUtils.lerp(smoothPivot.current.x, targetPivotVec.current.x, kHoriz)
        smoothPivot.current.y = THREE.MathUtils.lerp(smoothPivot.current.y, targetPivotVec.current.y, kVert)
        smoothPivot.current.z = THREE.MathUtils.lerp(smoothPivot.current.z, targetPivotVec.current.z, kHoriz)
      }

      // 2. Smooth Zoom Distance
      if (snapped) {
        desiredDistRef.current = st.fpDistance
      } else {
        desiredDistRef.current = THREE.MathUtils.lerp(
          desiredDistRef.current,
          st.fpDistance,
          1 - Math.exp(-delta * 10.0),
        )
      }

      // 3. Spring Arm Collision với tường/sàn/mái visible (KHÔNG lấy scene.children)
      const cosP = Math.cos(pitch.current)
      const dirX = Math.sin(yaw.current) * cosP
      const dirY = Math.sin(pitch.current)
      const dirZ = Math.cos(yaw.current) * cosP
      springDirRef.current.set(dirX, dirY, dirZ)

      const armOccluders = getSpringArmOccluders()
      let targetArmDist = desiredDistRef.current
      let hardMaxDist = desiredDistRef.current
      if (armOccluders.length > 0) {
        springRaycasterRef.current.set(smoothPivot.current, springDirRef.current)
        springRaycasterRef.current.near = 0.15
        springRaycasterRef.current.far = desiredDistRef.current + 0.3
        const hits = springRaycasterRef.current.intersectObjects(armOccluders, false)
        const firstHit = hits.find((h) => isEffectivelyVisible(h.object))
        if (firstHit && firstHit.distance < desiredDistRef.current) {
          targetArmDist = Math.max(0.55, firstHit.distance - 0.28)
          hardMaxDist = Math.max(0.55, firstHit.distance - 0.16)
        }
      }

      if (snapped) {
        actualArmDistRef.current = targetArmDist
      } else {
        const pullRate = targetArmDist < actualArmDistRef.current ? 26.0 : 6.5
        actualArmDistRef.current = THREE.MathUtils.lerp(
          actualArmDistRef.current,
          targetArmDist,
          1 - Math.exp(-delta * pullRate),
        )
        if (actualArmDistRef.current > hardMaxDist) {
          actualArmDistRef.current = hardMaxDist
        }
      }

      const camX = smoothPivot.current.x + dirX * actualArmDistRef.current
      const rawCamY = smoothPivot.current.y + dirY * actualArmDistRef.current
      const camZ = smoothPivot.current.z + dirZ * actualArmDistRef.current
      const floorY = getCameraFloorY(camX, camZ, charPos[1])
      const camY = Math.max(rawCamY, floorY + 0.18)

      camera.position.set(camX, camY, camZ)
      camera.lookAt(smoothPivot.current)
    } else {
      const targetCamX = charPos[0] - Math.sin(yaw.current) * eyeForward
      const targetCamY = charPos[1] + eyeH + bob
      const targetCamZ = charPos[2] - Math.cos(yaw.current) * eyeForward
      if (snapped) {
        camera.position.set(targetCamX, targetCamY, targetCamZ)
      } else {
        const lerpK = 1 - Math.exp(-delta * 22)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, lerpK)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, lerpK)
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, lerpK)
      }
      camera.rotation.set(-pitch.current, yaw.current, 0, 'YXZ')
    }

    // Raycast từ tâm màn hình (0, 0) mỗi ~70ms khi khóa chuột GTA để hiển thị gợi ý tương tác
    if (document.pointerLockElement === dom) {
      const now = performance.now()
      if (now - lastRaycastAtRef.current >= 70) {
        lastRaycastAtRef.current = now
        const hit = raycastCenterInteract(raycasterRef.current, camera)
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
