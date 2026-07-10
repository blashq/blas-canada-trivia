import React, { useEffect, useState } from 'react'
import { useGame } from '../lib/useGame.js'
import { ROUNDS, FINALE, TEAM_COLORS, AVATARS } from '../lib/gameData.js'
import { joinGameByCode, submitAnswer, findAnswer, roundAt, FINALE_ROUND_INDEX } from '../lib/room.js'
import { useCountdown, Timer, Brand, AvatarChip, MapleLeaf } from '../components/ui.jsx'
import { shuffledOptions } from '../lib/shuffle.js'

const LS = 'blas_team_v1'
const emoji = { moose: '🫎', beaver: '🦫', bear: '🐻', loon: '🦆', mountie: '👮', cntower: '🗼' }

export default function Join() {
  const [team, setTeam] = useState(() => { try { return JSON.parse(localStorage.getItem(LS)) } catch { return null } })
  const { game, answers } = useGame(team?.gameId)

  function leave() { localStorage.removeItem(LS); setTeam(null) }

  if (!team) return <JoinForm onJoined={(t) => { localStorage.setItem(LS, JSON.stringify(t)); setTeam(t) }} />
  if (!game) return <Splash><p className="sub">Connecting…</p></Splash>

  return <Play game={game} team={team} answers={answers} onLeave={leave} />
}

function Splash({ children }) {
  return (
    <div className="screen center pad">
      <div className="flag-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }} />
      <img src="/art/beaver.png" alt="" className="join-art" style={{ left: '2vw' }} />
      <img src="/art/celebrate.png" alt="" className="join-art" style={{ right: '2vw' }} />
      <MapleLeaf size={54} />
      <h1 className="big" style={{ margin: '12px 0' }}>BLAS Canada Day Trivia</h1>
      {children}
    </div>
  )
}

function JoinForm({ onJoined }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function go() {
    if (!code.trim() || !name.trim()) { setErr('Enter a room code and team name.'); return }
    setBusy(true); setErr('')
    try {
      const { team } = await joinGameByCode(code, { name: name.trim() })
      onJoined({ id: team.id, name: team.name, color: team.color, avatar: team.avatar, gameId: team.game_id, roomCode: code.toUpperCase().trim() })
    } catch (e) { setErr(e.message || 'Could not join.'); setBusy(false) }
  }

  return (
    <Splash>
      <div className="card stack" style={{ maxWidth: 460, width: '100%', textAlign: 'left' }}>
        <label className="sub">Room code</label>
        <input className="field" style={{ textTransform: 'uppercase', letterSpacing: '.15em', fontWeight: 800 }}
          value={code} onChange={e => setCode(e.target.value)} placeholder="ABCD" maxLength={5} />
        <label className="sub">Team name</label>
        <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="The Maple Mavericks" maxLength={24} />
        <p className="sub" style={{ margin: '2px 0 0', fontSize: 15 }}>We'll assign your team a colour &amp; a Canadian mascot so everyone stands out. 🍁</p>
        {err && <div style={{ color: 'var(--bad)', fontWeight: 700 }}>{err}</div>}
        <button className="btn big" disabled={busy} onClick={go}>{busy ? 'Joining…' : "Join the game 🍁"}</button>
      </div>
    </Splash>
  )
}

function Play({ game, team, answers, onLeave }) {
  const finale = game.current_round >= ROUNDS.length
  const round = roundAt(game.current_round)
  const r = game.current_round
  const q = game.current_question
  const rIndex = finale ? FINALE_ROUND_INDEX : r

  return (
    <div className="screen">
      <div className="flag-bar" />
      <div className="row spread pad" style={{ paddingBottom: 0 }}>
        <AvatarChip avatar={team.avatar} color={team.color} name={team.name} />
        <button className="btn ghost sm" onClick={onLeave}>Leave</button>
      </div>
      <div className="grow pad center stack" style={{ justifyContent: 'flex-start' }}>
        <PlayBody game={game} team={team} answers={answers} round={round} rIndex={rIndex} q={q} finale={finale} />
      </div>
    </div>
  )
}

function PlayBody({ game, team, answers, round, rIndex, q, finale }) {
  const phase = game.phase
  if (phase === 'lobby') return <Msg emoji="⏳" title="You're in!" sub="Waiting for the host to start the game…" />
  if (phase === 'intro') return <Msg emoji="📣" title={round.title} sub="Get ready — round starting shortly." />
  if (phase === 'round_recap') return <Msg emoji="📺" title="Eyes on the big screen!" sub="Going through the answers…" />
  if (phase === 'final_reveal' || phase === 'done') return <Msg emoji="🍁" title="Watch the big screen!" sub="Final results are in." />

  if (phase === 'final_bet') return <WagerBet game={game} team={team} answers={answers} />
  if (phase === 'final_q') return <FinaleQuestion game={game} team={team} answers={answers} />

  // standard question phase
  if (phase === 'question') return <QuestionInput game={game} team={team} answers={answers} round={round} rIndex={rIndex} q={q} />
  return <Msg emoji="🍁" title="Stand by…" />
}

function Msg({ emoji, title, sub }) {
  return (
    <div className="card center stack" style={{ maxWidth: 460, marginTop: 40 }}>
      <div style={{ fontSize: 60 }}>{emoji}</div>
      <h2 className="big">{title}</h2>
      {sub && <p className="sub">{sub}</p>}
    </div>
  )
}

function QuestionInput({ game, team, answers, round, rIndex, q }) {
  const question = round.questions[q]
  const subtype = round.type === 'mixed' ? question.subtype : round.type
  const { remaining } = useCountdown(game.question_started_at, round.timerSec, game.accepting)
  const myAns = findAnswer(answers, team.id, rIndex, q)
  const timedOut = remaining <= 0 || !game.accepting

  // reveal state (host revealed): show a light "your result"
  if (game.revealed) {
    const correct = isMyAnswerCorrect(round, question, myAns)
    return (
      <div className="card center stack" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: 54 }}>{correct ? '✅' : '❌'}</div>
        <h2 className="big">{correct ? 'Nice!' : 'Not this time'}</h2>
        <p className="sub">Answer's on the big screen.</p>
      </div>
    )
  }

  const common = { game, team, question, rIndex, q, timedOut, myAns, round }
  return (
    <div className="stack" style={{ maxWidth: 520, width: '100%' }}>
      <div className="row spread"><span className="pill">{round.title}</span><span className={'pill mono'}>⏱ {remaining}s</span></div>
      {subtype === 'mc' && <MCInput {...common} />}
      {subtype === 'tf' && <TFInput {...common} />}
      {subtype === 'select-all' && <SelectAllInput {...common} />}
      {subtype === 'clue-drip' && <DripInput {...common} clueCount={question.clues.length} intervalSec={round.clueIntervalSec} />}
      {subtype === 'bank-drip' && <DripInput {...common} clueCount={question.clues.length} intervalSec={round.scoring.drip.intervalSec} />}
      {timedOut && <p className="sub center">Time's up — locked.</p>}
    </div>
  )
}

function isMyAnswerCorrect(round, question, myAns) {
  if (!myAns) return false
  if (round.type === 'select-all' || question.subtype === 'select-all') {
    const picks = Array.isArray(myAns.value) ? myAns.value : []
    const correctIds = question.options.filter(o => o.isCanadian).map(o => o.id)
    const wrongPicked = picks.some(p => !correctIds.includes(p))
    return picks.length > 0 && !wrongPicked && correctIds.every(id => picks.includes(id))
  }
  return myAns.value === question.correct
}

function MCInput({ game, team, question, rIndex, q, timedOut, myAns }) {
  const sel = myAns?.value
  const opts = React.useMemo(() => shuffledOptions(question.options, `${game.id}:${rIndex}:${q}:${question.id}`), [game.id, rIndex, q, question.id])
  function pick(id) { if (!timedOut) submitAnswer(game.id, team.id, rIndex, q, id) }
  return (
    <>
      <h2 className="big">{question.prompt}</h2>
      <div className="options">
        {opts.map(o => (
          <button key={o.id} className={'opt' + (sel === o.id ? ' sel' : '') + (timedOut ? ' locked' : '')} onClick={() => pick(o.id)}>{o.label}</button>
        ))}
      </div>
    </>
  )
}

function TFInput({ game, team, question, rIndex, q, timedOut, myAns }) {
  const sel = myAns?.value
  function pick(v) { if (!timedOut) submitAnswer(game.id, team.id, rIndex, q, v) }
  return (
    <>
      <h2 className="big">{question.statement || question.prompt}</h2>
      <div className="options">
        <button className={'opt' + (sel === true ? ' sel' : '') + (timedOut ? ' locked' : '')} onClick={() => pick(true)}>✅ TRUE</button>
        <button className={'opt' + (sel === false ? ' sel' : '') + (timedOut ? ' locked' : '')} onClick={() => pick(false)}>❌ FALSE</button>
      </div>
    </>
  )
}

function SelectAllInput({ game, team, question, rIndex, q, timedOut, myAns }) {
  const [sel, setSel] = useState([])
  const locked = !!myAns || timedOut
  useEffect(() => { setSel([]) }, [rIndex, q])
  function toggle(id) { if (locked) return; setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]) }
  function lockIn() { if (locked || sel.length === 0) return; submitAnswer(game.id, team.id, rIndex, q, sel) }
  const shown = myAns ? (Array.isArray(myAns.value) ? myAns.value : []) : sel
  return (
    <>
      <h2 className="big">{question.prompt || 'Who here is Canadian?'}</h2>
      <p className="sub">Select everyone Canadian — at least one.</p>
      <div className="photos">
        {question.options.map(o => (
          <div key={o.id} className={'photo' + (shown.includes(o.id) ? ' sel' : '')} onClick={() => toggle(o.id)}>
            {o.img ? <img src={o.img} alt="" /> : <div className="center grow" style={{ fontSize: 40 }}>👤</div>}
          </div>
        ))}
      </div>
      {!myAns && !timedOut && <button className="btn big" disabled={sel.length === 0} onClick={lockIn}>Lock in {sel.length ? `(${sel.length})` : ''}</button>}
      {myAns && <p className="sub center">Locked in ✓</p>}
    </>
  )
}

function DripInput({ game, team, question, rIndex, q, timedOut, myAns, intervalSec, clueCount }) {
  const { elapsed } = useCountdown(game.question_started_at, 999, game.accepting)
  const opts = React.useMemo(() => shuffledOptions(question.options, `${game.id}:${rIndex}:${q}:${question.id}`), [game.id, rIndex, q, question.id])
  const clueIdx = Math.min(Math.floor(elapsed / intervalSec), clueCount - 1)
  const locked = !!myAns || timedOut
  function pick(id) {
    if (locked) return
    submitAnswer(game.id, team.id, rIndex, q, id, clueIdx)
  }
  const tierPts = [3, 2, 1]
  return (
    <>
      <div className="stack">
        {question.clues.slice(0, clueIdx + 1).map((c, i) => (
          <div key={i} className="card" style={{ borderLeft: '5px solid var(--flag-red)', padding: '12px 16px' }}>
            <span className="pill" style={{ marginRight: 8 }}>Clue {i + 1}</span>{c}
          </div>
        ))}
      </div>
      <div className="options" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {opts.map(o => (
          <button key={o.id} className={'opt' + (myAns?.value === o.id ? ' sel' : '') + (locked ? ' locked' : '')} onClick={() => pick(o.id)}>{o.label}</button>
        ))}
      </div>
      {myAns ? <p className="sub center">Locked in ✓ — no changing now!</p>
        : !timedOut && <p className="sub center">Lock in now for more points. This is final!</p>}
    </>
  )
}

function WagerBet({ game, team, answers }) {
  const myAns = findAnswer(answers, team.id, FINALE_ROUND_INDEX, 0)
  const [frac, setFrac] = useState(0.5)
  const locked = !!myAns
  function lockIn() { submitAnswer(game.id, team.id, FINALE_ROUND_INDEX, 0, { fraction: frac }) }
  return (
    <div className="card stack center" style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 48 }}>🎲</div>
      <h2 className="big">{FINALE.category}</h2>
      <p className="sub">Bet a portion of your points — before you see the question.</p>
      {locked ? <p className="big" style={{ color: 'var(--flag-red)' }}>Wager locked ✓</p> : (
        <>
          <div className="huge" style={{ fontSize: 56 }}>{Math.round(frac * 100)}%</div>
          <input type="range" min="0" max="100" value={Math.round(frac * 100)} onChange={e => setFrac(e.target.value / 100)} style={{ width: '100%' }} />
          <button className="btn big" onClick={lockIn}>Lock in my wager</button>
        </>
      )}
    </div>
  )
}

function FinaleQuestion({ game, team, answers }) {
  const myAns = findAnswer(answers, team.id, FINALE_ROUND_INDEX, 0)
  const opts = React.useMemo(() => shuffledOptions(FINALE.options, `${game.id}:finale`), [game.id])
  const { remaining } = useCountdown(game.question_started_at, FINALE.timerSec, game.accepting)
  const timedOut = remaining <= 0 || !game.accepting
  function pick(id) {
    if (timedOut) return
    const fraction = myAns?.value?.fraction ?? 0
    submitAnswer(game.id, team.id, FINALE_ROUND_INDEX, 0, { fraction, choice: id })
  }
  const choice = myAns?.value?.choice
  return (
    <div className="stack" style={{ maxWidth: 520, width: '100%' }}>
      <div className="row spread"><span className="pill">Final Wager</span><span className="pill mono">⏱ {remaining}s</span></div>
      <h2 className="big">{FINALE.prompt}</h2>
      <div className="options">
        {opts.map(o => (
          <button key={o.id} className={'opt' + (choice === o.id ? ' sel' : '') + (timedOut ? ' locked' : '')} onClick={() => pick(o.id)}>{o.label}</button>
        ))}
      </div>
      {timedOut && <p className="sub center">Locked.</p>}
    </div>
  )
}
