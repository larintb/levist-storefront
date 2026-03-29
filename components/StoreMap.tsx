'use client'

import { useEffect, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'

const STORE_LNG = -97.52131975816589
const STORE_LAT = 25.860658261552587
const COORDS: [number, number] = [STORE_LNG, STORE_LAT]

export default function StoreMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    let cancelled  = false
    let droneFrame: number | null = null

    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default

      // ← CLAVE: si el cleanup corrió mientras esperábamos el import, no crear el mapa
      if (cancelled || !containerRef.current || mapRef.current) return

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const isMobile = 'ontouchstart' in window

      const map = new mapboxgl.Map({
        container:   containerRef.current,
        style:       'mapbox://styles/mapbox/standard',
        center:      [0, 20],
        zoom:        1.5,
        pitch:       0,
        bearing:     0,
        antialias:   !isMobile,
        interactive: false,
      })

      mapRef.current = map

      map.on('load', () => {
        if (cancelled) return

        // Estilo standard: luz dusk para ver edificios 3D con profundidad
        map.setConfigProperty('basemap', 'lightPreset', 'dusk')

        // ─── Marcador ──────────────────────────────────────────────────────────
        const markerEl = document.createElement('div')
        markerEl.style.cssText = 'width:22px;height:22px;'

        const dotEl = document.createElement('div')
        dotEl.style.cssText = [
          'width:22px',
          'height:22px',
          'background:#364458',
          'border:3px solid #fff',
          'border-radius:50%',
          'box-shadow:0 2px 14px rgba(54,68,88,0.6)',
          'cursor:pointer',
          'opacity:0',
          'transform:scale(0)',
        ].join(';')
        markerEl.appendChild(dotEl)

        new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat(COORDS)
          .addTo(map)

        // ─── Fase 1: vuelo desde vista mundial hasta la tienda en 3D ──────────
        map.flyTo({
          center:   COORDS,
          zoom:     19,
          pitch:    70,
          bearing:  180,
          duration: 4000,
          curve:    1.4,
          easing:   (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        })

        // ─── Fases 2 + 3: bounce del marcador + órbita de dron ────────────────
        const onFlyEnd = () => {
          if (cancelled) return
          if (map.getZoom() < 10) {       // garantía: esperar zoom real
            map.once('moveend', onFlyEnd)
            return
          }

          // Habilitar interacción al terminar la animación
          map.dragPan.enable()
          map.scrollZoom.enable()
          map.touchZoomRotate.enable()

          // Bounce del marcador (Web Animations API)
          dotEl.animate(
            [
              { transform: 'scale(0) translateY(-14px)', opacity: '0' },
              { transform: 'scale(1.45) translateY(0)',  opacity: '1', offset: 0.52 },
              { transform: 'scale(0.80) translateY(0)',               offset: 0.70 },
              { transform: 'scale(1.18) translateY(0)',               offset: 0.85 },
              { transform: 'scale(0.95) translateY(0)',               offset: 0.93 },
              { transform: 'scale(1) translateY(0)',     opacity: '1' },
            ],
            { duration: 680, easing: 'ease-out', fill: 'forwards' }
          )

          // Órbita 15°/s · se detiene tras 1 vuelta completa (360°)
          const THROTTLE_MS = isMobile ? 33 : 16
          let lastTime:    number | null = null
          let lastSetTime: number | null = null
          let bearing      = map.getBearing()
          let totalRotated = 0

          const orbit = (time: number) => {
            if (cancelled) return
            if (lastTime !== null) {
              const delta = time - lastTime
              const step  = (15 * delta) / 1000
              bearing      += step
              totalRotated += step
              if (totalRotated >= 360) return
              if (lastSetTime === null || time - lastSetTime >= THROTTLE_MS) {
                map.setBearing(bearing)
                lastSetTime = time
              }
            }
            lastTime   = time
            droneFrame = requestAnimationFrame(orbit)
          }

          droneFrame = requestAnimationFrame(orbit)
        }

        map.once('moveend', onFlyEnd)
      })
    }

    init()

    return () => {
      cancelled = true
      if (droneFrame !== null) cancelAnimationFrame(droneFrame)
      if (mapRef.current) {
        mapRef.current.stop()
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full border border-gray-200"
      style={{ height: 220 }}
    />
  )
}
