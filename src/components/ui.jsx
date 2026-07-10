import React, { useEffect, useState } from 'react'

export function MapleLeaf({ size = 28, color = 'var(--flag-red)', style }) {
  return (
    <svg viewBox="0 0 500 500" width={size} height={size} style={style} aria-hidden>
      <path fill={color} d="M250 460 C 240 380, 190 350, 150 360 C 125 367, 100 345, 110 320 C 130 270, 90 250, 60 270 C 40 283, 20 260, 40 230 C 70 190, 75 145, 120 130 C 150 120, 165 90, 190 100 C 210 107, 220 80, 250 100 C 280 80, 290 107, 310 100 C 335 90, 350 120, 380 130 C 425 145, 430 190, 460 230 C 480 260, 460 283, 440 270 C 410 250, 370 270, 390 320 C 400 345, 375 367, 350 360 C 310 350, 260 380, 250 460 Z"/>
    </svg>
  )
}

// tick-based countdown anchored to a server timestamp
export function useCountdown(startedAtISO, timerSec, active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [active])
  if (!startedAtISO) return { remaining: timerSec, frac: 1, elapsed: 0 }
  const elapsed = Math.max(0, (now - new Date(startedAtISO).getTime()) / 1000)
  const remaining = Math.max(0, Math.ceil(timerSec - elapsed))
  const frac = Math.max(0, Math.min(1, (timerSec - elapsed) / timerSec))
  return { remaining, frac, elapsed }
}

export function Timer({ remaining, frac }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className={'timer mono' + (remaining <= 5 ? ' low' : '')}>{remaining}</div>
      <div className="timerbar"><div style={{ width: (frac * 100) + '%' }} /></div>
    </div>
  )
}

export function LeafFall({ n = 14 }) {
  const leaves = Array.from({ length: n })
  return (
    <>
      {leaves.map((_, i) => (
        <div key={i} className="leaffall" style={{
          left: `${(i / n) * 100}%`,
          animationDuration: `${6 + (i % 5)}s`,
          animationDelay: `${(i % 7) * 0.6}s`,
        }}>🍁</div>
      ))}
    </>
  )
}

export function Brand() {
  return (
    <div className="brandbar">
      <MapleLeaf size={22} />
      <span className="blas">BLAS</span>
      <span className="sub" style={{ fontSize: 14 }}>Canada Day Trivia</span>
    </div>
  )
}

export function AvatarChip({ avatar, color, name, size = 20 }) {
  const emoji = { leaf: '🍁', moose: '🫎', beaver: '🦫', bear: '🐻', goose: '🪿', loon: '🦆' }[avatar] || '🍁'
  return (
    <span className="pill">
      <span className="dot" style={{ background: color }} />
      <span style={{ fontSize: size }}>{emoji}</span>
      {name && <span>{name}</span>}
    </span>
  )
}
