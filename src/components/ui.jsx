import React, { useEffect, useState } from 'react'

export function MapleLeaf({ size = 28, style }) {
  return (
    <img src="/leaf.png" alt="" aria-hidden
      style={{ height: size, width: 'auto', display: 'inline-block', verticalAlign: 'middle', ...style }} />
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
    <div className="brandbar" style={{ gap: 12 }}>
      <MapleLeaf size={42} />
      <span className="blas" style={{ fontSize: 26 }}>BLAS</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--flag-red)' }}>Canada Day Trivia</span>
    </div>
  )
}

export function AvatarChip({ avatar, color, name, size = 20 }) {
  const emoji = { moose: '🫎', beaver: '🦫', bear: '🐻', loon: '🦆', mountie: '👮', cntower: '🗼' }[avatar] || '🍁'
  return (
    <span className="pill">
      <span className="dot" style={{ background: color }} />
      <span style={{ fontSize: size }}>{emoji}</span>
      {name && <span>{name}</span>}
    </span>
  )
}
