import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Room, Lights } from './Room'
import { Furniture, isBlocked, isBlockedTier2 } from './Furniture'
import { Avatar, CORGI, Dog, PUG } from './Characters'
import { HOME_VIEW, LIVE_ACTORS, STATIONS } from '../data/config'
import { useStore, type Activity } from '../store'

export function Experience() {
  const mode = useStore((s) => s.mode)
  const darkMode = useStore((s) => s.darkMode)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <Canvas
      shadows
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.25]}
      camera={{ position: [-1.5, 17.5, 34.0], fov: 34, near: 0.2, far: 150 }}
    >
      <color attach="background" args={[darkMode ? '#111520' : '#ece6dd']} />
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
            dampingFactor={0.08}
            minDistance={1.0}
            maxDistance={46}
            maxPolarAngle={Math.PI / 2.02}
          />
          <CameraRig controlsRef={controlsRef} />
        </>
      ) : (
        <FirstPerson />
      )}
    </Canvas>
  )
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
      if (st.isUserInitiated && st.activity !== 'idle') {
        st.setFocus(STATIONS[st.activity].camera)
      } else {
        st.setFocus(HOME_VIEW)
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
      if (useStore.getState().focus) useStore.getState().setFocus(null)
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
    const cutBack = camera.position.z < 0.5
    const cutLeft = camera.position.x < -8.0
    const cutRight = camera.position.x > 7.0
    if (
      st.cutWalls.back !== cutBack ||
      st.cutWalls.left !== cutLeft ||
      st.cutWalls.right !== cutRight
    ) {
      st.setCutWalls({ back: cutBack, left: cutLeft, right: cutRight })
    }
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

/* ---------- Góc nhìn thứ nhất (Giữ nguyên hoạt động hiện tại khi chuyển sang & hỗ trợ đi bộ tới tương tác POV) ---------- */
const EYE = 1.62

function FirstPerson() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(0.15)
  const pitch = useRef(-0.06)
  const dragging = useRef(false)
  const lastMouse = useRef<[number, number]>([0, 0])
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const phaseTimer = useRef(0)
  const prevActivity = useRef<Activity>('idle')

  useEffect(() => {
    camera.fov = 68
    camera.rotation.order = 'YXZ'
    camera.updateProjectionMatrix()

    const st = useStore.getState()
    // Nếu người dùng đang thực hiện một hoạt động do chính mình bấm chọn trước khi bật góc nhìn thứ nhất -> giữ nguyên POV tại hoạt động đó!
    if (st.isUserInitiated && st.activity !== 'idle') {
      const station = STATIONS[st.activity]
      prevActivity.current = st.activity
      if (st.activityPhase === 'walking') {
        if (st.activeChar === 'girl') {
          camera.position.set(LIVE_ACTORS.girlPos[0], LIVE_ACTORS.girlPos[1] + EYE, LIVE_ACTORS.girlPos[2])
        } else {
          camera.position.set(LIVE_ACTORS.khoaPos[0], LIVE_ACTORS.khoaFloorY + EYE, LIVE_ACTORS.khoaPos[1])
        }
      } else {
        camera.position.set(...station.fpPos)
      }
      const ldx = station.fpTarget[0] - station.fpPos[0]
      const ldy = station.fpTarget[1] - station.fpPos[1]
      const ldz = station.fpTarget[2] - station.fpPos[2]
      yaw.current = Math.atan2(-ldx, -ldz)
      pitch.current = Math.atan2(ldy, Math.hypot(ldx, ldz))
    } else {
      prevActivity.current = 'idle'
      if (st.activeChar === 'girl') {
        camera.position.set(LIVE_ACTORS.girlPos[0], LIVE_ACTORS.girlPos[1] + EYE, LIVE_ACTORS.girlPos[2])
        yaw.current = LIVE_ACTORS.girlYaw
      } else {
        camera.position.set(LIVE_ACTORS.khoaPos[0], LIVE_ACTORS.khoaFloorY + EYE, LIVE_ACTORS.khoaPos[1])
        yaw.current = LIVE_ACTORS.khoaYaw
      }
      pitch.current = -0.05
    }
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true
      if (e.code === 'Escape') {
        useStore.getState().setMode('orbit')
      } else if (e.code === 'KeyE') {
        const cur = useStore.getState()
        if (cur.isUserInitiated && cur.activity !== 'idle') {
          cur.startActivity('idle', true)
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
          cur.petDog(dMochi <= dBo ? 'mochi' : 'bo', true)
          return
        }

        let nearest: Exclude<Activity, 'idle' | 'pet'> | null = null
        let bestDist = 4.2
        ;(Object.keys(STATIONS) as Exclude<Activity, 'idle'>[]).forEach((act) => {
          if (act === 'pet') return
          if (act === 'wardrobe' && cur.activeChar !== 'boy') return
          if (act === 'girl_wardrobe' && cur.activeChar !== 'girl') return
          if (Math.abs(STATIONS[act].floorY - (camera.position.y - EYE)) > 2.2) return
          const ep = STATIONS[act].entryPos
          const d = Math.hypot(ep[0] - camera.position.x, ep[1] - camera.position.z)
          if (d < bestDist) {
            bestDist = d
            nearest = act
          }
        })
        if (nearest) {
          cur.startActivity(nearest, true)
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
      yaw.current -= dx * 0.0045
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0045, -1.2, 1.2)
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

    const userActiveInFp = st.isUserInitiated && st.activity !== 'idle'
    const currentEffectiveAct: Activity = userActiveInFp ? st.activity : 'idle'

    if (prevActivity.current !== currentEffectiveAct) {
      if (prevActivity.current !== 'idle') {
        const ep = STATIONS[prevActivity.current].entryPos
        camera.position.x = ep[0]
        camera.position.z = ep[1]
      }
      prevActivity.current = currentEffectiveAct
      phaseTimer.current = 0
    }

    if (k.KeyQ) yaw.current += 1.8 * delta

    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
    const r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)

    if ((f !== 0 || r !== 0 || k.Space) && userActiveInFp && st.activityPhase === 'active') {
      st.startActivity('idle', true)
      return
    }

    if (st.isUserInitiated && st.activity !== 'idle') {
      const station = STATIONS[st.activity]
      if (st.activityPhase === 'walking') {
        const [tx, tz] = station.entryPos
        const dx = tx - camera.position.x
        const dz = tz - camera.position.z
        const dist = Math.hypot(dx, dz)
        if (dist > 0.22) {
          const speed = 3.6 * delta
          camera.position.x += (dx / dist) * speed
          camera.position.z += (dz / dist) * speed
          camera.position.y = EYE + Math.abs(Math.sin(t * 11)) * 0.045

          const targetYaw = Math.atan2(-dx, -dz)
          const diff = Math.atan2(Math.sin(targetYaw - yaw.current), Math.cos(targetYaw - yaw.current))
          yaw.current += diff * Math.min(1, delta * 8)
          pitch.current = THREE.MathUtils.lerp(pitch.current, -0.08, delta * 6)
        } else {
          phaseTimer.current = 0
          st.setActivityPhase('entering')
        }
      } else if (st.activityPhase === 'entering') {
        phaseTimer.current += delta
        const lerpK = 1 - Math.exp(-delta * 7)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, station.fpPos[0], lerpK)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, station.fpPos[1], lerpK)
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, station.fpPos[2], lerpK)

        const ldx = station.fpTarget[0] - station.fpPos[0]
        const ldy = station.fpTarget[1] - station.fpPos[1]
        const ldz = station.fpTarget[2] - station.fpPos[2]
        const targetYaw = Math.atan2(-ldx, -ldz)
        const targetPitch = Math.atan2(ldy, Math.hypot(ldx, ldz))
        const diff = Math.atan2(Math.sin(targetYaw - yaw.current), Math.cos(targetYaw - yaw.current))
        yaw.current += diff * lerpK
        pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch, lerpK)

        const enteringDur = 0.65
        if (phaseTimer.current >= enteringDur) {
          phaseTimer.current = 0
          st.setActivityPhase('active')
        }
      } else {
        phaseTimer.current += delta
        const lerpK = 1 - Math.exp(-delta * 6)
        const breathY =
          st.activity === 'sleep'
            ? Math.sin(t * 2.0) * 0.015
            : st.activity === 'pc'
              ? Math.sin(t * 12) * 0.005
              : st.activity === 'pet'
                ? Math.sin(t * 7.2) * 0.018
                : Math.sin(t * 2.5) * 0.008
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, station.fpPos[0], lerpK)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, station.fpPos[1] + breathY, lerpK)
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, station.fpPos[2], lerpK)

        if (
          (st.activity === 'drink' ||
            st.activity === 'darts' ||
            st.activity === 'feed') &&
          phaseTimer.current > 4.2
        ) {
          st.startActivity('idle', true)
        }
      }
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
      return
    }

    // Chế độ đi bộ tự do bằng WASD ở Góc nhìn thứ nhất (hỗ trợ cả Tầng 1, Tầng 2 & bước lên cầu thang)
    const speed = (k.ShiftLeft || k.ShiftRight ? 5.6 : 3.6) * delta
    let moving = false

    // Kiểm tra xem vị trí hiện tại có đang ở khu vực cầu thang không
    const inStairs =
      camera.position.x >= -9.5 &&
      camera.position.x <= -8.2 &&
      camera.position.z >= 0.45 &&
      camera.position.z <= 4.75
    const isTier2 = camera.position.y > 3.0 || (camera.position.z < 0.55 && inStairs)

    if (f !== 0 || r !== 0) {
      fwd.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
      right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
      const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r)
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed)
        const nx = camera.position.x + move.x
        const nz = camera.position.z + move.z

        const nextInStairs = nx >= -9.5 && nx <= -8.2 && nz >= 0.45 && nz <= 4.75
        if (nextInStairs) {
          camera.position.x = nx
          camera.position.z = nz
          moving = true
        } else if (isTier2) {
          if (!isBlockedTier2(nx, camera.position.z)) camera.position.x = nx
          if (!isBlockedTier2(camera.position.x, nz)) camera.position.z = nz
          moving = true
        } else {
          if (!isBlocked(nx, camera.position.z)) camera.position.x = nx
          if (!isBlocked(camera.position.x, nz)) camera.position.z = nz
          moving = true
        }
      }
    }

    // Tính toán độ cao sàn (Floor height) mượt mà khi leo cầu thang
    let currentFloorY = 0
    if (inStairs) {
      const stairProgress = THREE.MathUtils.clamp((4.7 - camera.position.z) / (4.7 - 0.45), 0, 1)
      currentFloorY = stairProgress * 4.35
    } else if (camera.position.y > 2.5) {
      currentFloorY = 4.35
    }

    const targetEye = currentFloorY + EYE + (moving ? Math.abs(Math.sin(t * 10)) * 0.035 : 0)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetEye, 1 - Math.exp(-delta * 12))
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })

  return null
}
