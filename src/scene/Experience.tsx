import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Room, Lights } from './Room'
import { Furniture } from './Furniture'
import { Avatar, CORGI, Dog, PUG } from './Characters'
import { FLOOR1_VIEW, FLOOR2_VIEW, HOME_VIEW, LIVE_ACTORS, STATIONS } from '../data/config'
import { useStore, type Activity } from '../store'

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
    scene.environmentIntensity = darkMode ? 0.04 : 0.28
    gl.toneMappingExposure = darkMode ? 0.92 : 1.08
  }, [gl, scene, darkMode])

  return null
}

export function Experience() {
  const mode = useStore((s) => s.mode)
  const graphicMode = useStore((s) => s.graphicMode)
  const isInteracting = useStore((s) => s.isInteracting)
  const setIsInteracting = useStore((s) => s.setIsInteracting)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const interactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Xử lý tối ưu phản hồi tương tác (thu phóng bánh xe, pinch cảm ứng, xoay, lia):
  const onInteract = () => {
    if (!useStore.getState().isInteracting) {
      setIsInteracting(true)
    }
    if (interactTimerRef.current) clearTimeout(interactTimerRef.current)
    interactTimerRef.current = setTimeout(() => {
      setIsInteracting(false)
    }, 180)
  }

  // Bắt sự kiện wheel toàn cục từ frame đầu tiên ngay khi người dùng lăn chuột / vuốt trackpad
  useEffect(() => {
    const onWheel = () => {
      onInteract()
      if (useStore.getState().focus) {
        useStore.getState().setFocus(null)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      if (interactTimerRef.current) clearTimeout(interactTimerRef.current)
    }
  }, [])

  // Adaptive DPR: Khi kéo xoay chuột hoặc thu phóng (zoom bánh xe / pinch), tạm hạ DPR xuống để duy trì 60fps mượt mà; dừng di chuyển đưa lên Retina siêu nét
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 2
  const currentDpr =
    graphicMode === 'hd'
      ? isInteracting
        ? 1.15
        : Math.min(deviceDpr, 2)
      : isInteracting
        ? 0.85
        : 1.15

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      performance={{ min: 0.6 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={currentDpr}
      camera={{ position: [-1.5, 17.5, 34.0], fov: 34, near: 0.2, far: 150 }}
    >
      <SetupEnvironment />
      <Lights />
      <Room />
      <Furniture />
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
            dampingFactor={0.095}
            minDistance={2.6}
            maxDistance={42}
            zoomSpeed={0.88}
            maxPolarAngle={Math.PI / 2.02}
            onStart={() => onInteract()}
            onEnd={() => onInteract()}
            onChange={() => onInteract()}
          />
          <CameraPerformanceManager />
          <CameraRig controlsRef={controlsRef} />
        </>
      ) : (
        <FirstPerson />
      )}
    </Canvas>
  )
}

/**
 * Quản lý tối ưu GPU bên trong Canvas:
 * - Tạm dừng tính toán lại Shadow Map depth pass khi đang thu phóng / di chuyển để giải phóng 113+ draw calls
 * - Tạm ngắt tính toán Raycasting pointer events trong lúc camera chuyển động nhanh
 */
function CameraPerformanceManager() {
  const gl = useThree((s) => s.gl)
  const setEvents = useThree((s) => s.setEvents)
  const isInteracting = useStore((s) => s.isInteracting)

  useEffect(() => {
    if (isInteracting) {
      gl.shadowMap.autoUpdate = false
      setEvents({ enabled: false })
    } else {
      gl.shadowMap.autoUpdate = true
      gl.shadowMap.needsUpdate = true
      setEvents({ enabled: true })
    }
  }, [isInteracting, gl, setEvents])

  return null
}

/* ---------- Camera bay mượt tới đúng góc nhìn và quay về tổng quan chuẩn xác ---------- */
function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const tp = useMemo(() => new THREE.Vector3(), [])
  const tt = useMemo(() => new THREE.Vector3(), [])
  const downPos = useRef<[number, number] | null>(null)

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
    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl])

  useFrame((_, dt) => {
    const controls = controlsRef.current
    const st = useStore.getState()
    const f = st.focus
    ;(window as unknown as Record<string, unknown>).__store = useStore
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

/* ---------- Góc nhìn thứ nhất: Luôn đi theo nhân vật thời gian thực (cả tự hoạt động và điều khiển) ---------- */
function FirstPerson() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(LIVE_ACTORS.fpYaw || 0.15)
  const pitch = useRef(-0.05)
  const dragging = useRef(false)
  const lastMouse = useRef<[number, number]>([0, 0])

  useEffect(() => {
    camera.fov = 68
    camera.rotation.order = 'YXZ'
    camera.updateProjectionMatrix()

    const st = useStore.getState()
    const char = st.userRole || st.activeChar || 'boy'
    const isGirl = char === 'girl'
    const charPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
    const charYaw = isGirl ? LIVE_ACTORS.girlYaw : LIVE_ACTORS.khoaYaw
    yaw.current = charYaw
    pitch.current = -0.05
    camera.position.set(charPos[0] - Math.sin(charYaw) * 0.12, charPos[1] + 1.48, charPos[2] - Math.cos(charYaw) * 0.12)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true
      if (e.code === 'Escape') {
        useStore.getState().setMode('orbit')
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
        // Kiểm tra xem có đứng gần Mochi hoặc Bơ không
        const dMochi = Math.hypot(
          LIVE_ACTORS.dogs.mochi.pos[0] - camera.position.x,
          LIVE_ACTORS.dogs.mochi.pos[2] - camera.position.z,
        )
        const dBo = Math.hypot(
          LIVE_ACTORS.dogs.bo.pos[0] - camera.position.x,
          LIVE_ACTORS.dogs.bo.pos[2] - camera.position.z,
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
          const d = Math.hypot(ep[0] - camera.position.x, ep[1] - camera.position.z)
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

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true
      lastMouse.current = [e.clientX, e.clientY]
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastMouse.current[0]
      const dy = e.clientY - lastMouse.current[1]
      lastMouse.current = [e.clientX, e.clientY]
      yaw.current -= dx * 0.0042
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0042, -1.2, 1.2)
    }
    const onPointerUp = () => {
      dragging.current = false
    }

    const dom = gl.domElement
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [camera, gl])

  useFrame(({ clock }, dt) => {
    const st = useStore.getState()
    const k = keys.current
    const delta = Math.min(dt, 0.05)
    const t = clock.elapsedTime

    if (k.KeyQ) yaw.current += 1.8 * delta
    LIVE_ACTORS.fpYaw = yaw.current

    const char = st.userRole || st.activeChar || 'boy'
    const isGirl = char === 'girl'
    const charPos = isGirl ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
    const charYaw = isGirl ? LIVE_ACTORS.girlYaw : LIVE_ACTORS.khoaYaw
    const currentAct = isGirl ? st.girlActivity : st.boyActivity
    const currentPhase = isGirl ? st.girlPhase : st.boyPhase

    let eyeH = 1.48
    let eyeForward = 0.12
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
      eyeForward = 0.12
    }

    const isWalking = currentPhase === 'walking'
    const bob = isWalking ? Math.abs(Math.sin(t * 10)) * 0.035 : 0

    const targetEyeX = charPos[0] - Math.sin(charYaw) * eyeForward
    const targetEyeY = charPos[1] + eyeH + bob
    const targetEyeZ = charPos[2] - Math.cos(charYaw) * eyeForward

    const lerpK = 1 - Math.exp(-delta * 22)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetEyeX, lerpK)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetEyeY, lerpK)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetEyeZ, lerpK)

    // Khi người chơi không rê chuột xoay hướng, camera tự động hướng theo nhân vật khi đi bộ hoặc hướng vào đồ vật khi tương tác
    if (!dragging.current) {
      if (currentAct !== 'idle' && currentPhase === 'active') {
        const station = STATIONS[currentAct]
        if (station) {
          const ldx = station.fpTarget[0] - station.fpPos[0]
          const ldz = station.fpTarget[2] - station.fpPos[2]
          const targetYaw = Math.atan2(-ldx, -ldz)
          const diff = Math.atan2(Math.sin(targetYaw - yaw.current), Math.cos(targetYaw - yaw.current))
          yaw.current += diff * Math.min(1, delta * 3.5)
        }
      } else if (isWalking) {
        const diff = Math.atan2(Math.sin(charYaw - yaw.current), Math.cos(charYaw - yaw.current))
        yaw.current += diff * Math.min(1, delta * 4.0)
      }
    }

    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })

  return null
}
