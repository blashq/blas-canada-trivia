import React, { useEffect, useState } from 'react'

export function MapleLeaf({ size = 28, color = 'var(--flag-red)', style }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={style} aria-hidden>
      <path fill={color} d="M256 12l-30 118-92-64 30 118-118-30 88 82-40 40 118 22-10 82 66-52 66 52-10-82 118-22-40-40 88-82-118 30 30-118-92 64z" transform="scale(1,1)"/>
      <path fill={color} d="M246 300h20v200h-20z"/>
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
