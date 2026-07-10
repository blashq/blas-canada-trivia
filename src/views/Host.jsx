import React, { useEffect, useState, useRef } from 'react'
import { useGame } from '../lib/useGame.js'
import { ROUNDS, FINALE } from '../lib/gameData.js'
import {
  hostGetOrCreateGame, patchGame, resetGame, removeTeam, addBots,
  startGame, beginRound, endTimer, revealQuestion, nextQuestion, goToNextRound,
  jumpToRound, advanceRapid, recapNext, finaleShowQuestion, finaleReveal,
  roundAt, FINALE_ROUND_INDEX, isFinale, submitAnswer, findAnswer,
} from '../lib/room.js'
import { useCountdown, Brand, MapleLeaf } from '../components/ui.jsx'

const emoji = { moose: '🫎', beaver: '🦫', bear: '🐻', loon: '🦆', mountie: '👮', cntower: '🗼' }

export default function Host() {
  const [gameId, setGameId] = useState(null)
  useEffect(() => { hostGetOrCreateGame().then(g => setGameId(g.id)) }, [])
  const { game, teams, answers } = useGame(gameId)
  if (!game) return <div className="screen center"><MapleLeaf size={60} /><p className="sub">Loading host panel…</p></div>
  return <Panel game={game} teams={teams} answers={answers} />
}

function Panel({ game, teams, answers }) {
  const round = roundAt(game.current_round)
  const finale = isFinale(game.current_round)
  const origin = window.location.origin + window.location.pathname

  // ---- auto: rapid-fire advance ----
  const timeoutRef = useRef(null)
  useEffect(() => {
    clearTimeout(timeoutRef.current)
    if (game.phase === 'question' && round.type === 'tf-rapid' && game.accepting && game.question_started_at) {
      const elapsed = (Date.now() - new Date(game.question_started_at).getTime()) / 1000
      const delay = Math.max(0, round.timerSec - elapsed) * 1000
      timeoutRef.current = setTimeout(() => advanceRapid(game), delay + 150)
    }
    return () => clearTimeout(timeoutRef.current)
  }, [game.phase, game.current_round, game.current_question, game.question_started_at, game.accepting, round.type])

  // ---- auto: bots answer (test mode) ----
  useEffect(() => {
    if (!game.test_mode) return
    const bots = teams.filter(t => t.is_bot)
    if (!bots.length) return
    if (game.phase === 'question' && game.accepting) {
      const rIdx = game.current_round, qIdx = game.current_question
      const question = round.questions[qIdx]
      const subtype = round.type === 'mixed' ? question.subtype : round.type
      bots.forEach(b => {
        if (findAnswer(answers, b.id, rIdx, qIdx)) return
        submitAnswer(game.id, b.id, rIdx, qIdx, botValue(subtype, question), botClue(subtype, question))
      })
    } else if (game.phase === 'final_bet') {
      bots.forEach(b => { if (!findAnswer(answers, b.id, FINALE_ROUND_INDEX, 0)) submitAnswer(game.id, b.id, FINALE_ROUND_INDEX, 0, { fraction: Math.random() }) })
    } else if (game.phase === 'final_q' && game.accepting) {
      bots.forEach(b => {
        const ex = findAnswer(answers, b.id, FINALE_ROUND_INDEX, 0)
        const fraction = ex?.value?.fraction ?? 0.5
        if (!ex?.value?.choice) submitAnswer(game.id, b.id, FINALE_ROUND_INDEX, 0, { fraction, choice: rand(FINALE.options).id })
      })
    }
  }, [game.phase, game.current_round, game.current_question, game.accepting, game.test_mode, teams, answers])

  const sorted = [...teams].sort((a, b) => Number(b.score) - Number(a.score))
  const q = game.current_question
  const answeredCount = answers.filter(a => a.round_index === game.current_round && a.question_index === q).length

  return (
    <div className="screen">
      <div className="flag-bar" />
      <div className="pad stack">
        <div className="row spread">
          <Brand />
          <label className="pill" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={game.test_mode} onChange={e => patchGame(game.id, { test_mode: e.target.checked })} /> Test Mode
          </label>
        </div>

        <div className="card row spread wrap" style={{ gap: 10 }}>
          <div><div className="sub">Room code</div><div className="codebox" style={{ fontSize: 44 }}>{game.room_code}</div></div>
          <div className="stack" style={{ gap: 4, fontSize: 14 }}>
            <div>Big screen: <a href={origin + '#present'} target="_blank" rel="noreferrer">{origin}#present</a></div>
            <div>Players: <a href={origin} target="_blank" rel="noreferrer">{origin}</a></div>
            <div className="sub">Phase: <b>{game.phase}</b>{!finale ? ` · Round ${game.current_round + 1}/${ROUNDS.length}` : ' · Finale'}</div>
          </div>
        </div>

        {/* ---- controls ---- */}
        <div className="card stack">
          <Controls game={game} teams={teams} round={round} finale={finale} answeredCount={answeredCount} />
        </div>

        {/* ---- test tools ---- */}
        {game.test_mode && (
          <div className="card stack">
            <b>🔧 Test tools</b>
            <div className="row wrap">
              <button className="btn ghost sm" onClick={() => endTimer(game.id)}>End timer now</button>
              <button className="btn ghost sm" onClick={() => addBots(game.id, 2)}>Add 2 bots</button>
              <button className="btn ghost sm" onClick={() => { if (confirm('Wipe teams, answers & scores?')) resetGame(game.id) }}>Reset / New game</button>
            </div>
            <div className="row wrap" style={{ alignItems: 'center' }}>
              <span className="sub">Jump to round:</span>
              {ROUNDS.map((r, i) => <button key={i} className="btn ghost sm" onClick={() => jumpToRound(game, i)}>{i + 1}</button>)}
              <button className="btn ghost sm" onClick={() => jumpToRound(game, FINALE_ROUND_INDEX)}>🍁 Finale</button>
            </div>
          </div>
        )}

        {/* ---- live scoreboard (host only) ---- */}
        <div className="stack">
          <b>Live standings (private)</b>
          {sorted.length === 0 && <p className="sub">No teams yet.</p>}
          {sorted.map((t, i) => (
            <div key={t.id} className="sb-row">
              <span className="sb-rank">{i + 1}</span>
              <span className="dot" style={{ background: t.color }} />
              <span>{emoji[t.avatar]} {t.name}{t.is_bot ? ' 🤖' : ''}</span>
              {game.phase === 'lobby' && <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => removeTeam(t.id)}>✕</button>}
              {game.phase !== 'lobby' && <span className="sb-score">{Number(t.score)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Controls({ game, teams, round, finale, answeredCount }) {
  const total = teams.length
  if (game.phase === 'lobby') {
    return (
      <>
        <b>Lobby · {teams.filter(t => !t.is_bot).length} team(s) joined</b>
        <p className="sub">Start when everyone's in (2–4 teams).</p>
        <button className="btn big" disabled={total < 1} onClick={() => startGame(game.id)}>Start game →</button>
      </>
    )
  }
  if (game.phase === 'intro') {
    return (
      <>
        <b>{round.title}</b><p className="sub">{round.pointsLabel}</p>
        <button className="btn big" onClick={() => beginRound(game)}>Start this round →</button>
      </>
    )
  }
  if (game.phase === 'round_recap') {
    return (
      <>
        <b>Rapid recap · item {game.current_question + 1}/{round.questions.length}</b>
        <button className="btn big" onClick={() => recapNext(game)}>Next answer →</button>
      </>
    )
  }
  if (game.phase === 'final_bet') {
    return (
      <>
        <b>Final Wager · teams betting</b>
        <p className="sub">{answeredCountFinale(game, teams)} / {total} wagers locked</p>
        <button className="btn big" onClick={() => finaleShowQuestion(game)}>Reveal the question →</button>
      </>
    )
  }
  if (game.phase === 'final_q') {
    return (
      <>
        <b>Final question live</b>
        <div className="row"><button className="btn ghost" onClick={() => endTimer(game.id)}>End timer</button>
          <button className="btn big" onClick={() => finaleReveal(game)}>Reveal result →</button></div>
      </>
    )
  }
  if (game.phase === 'final_reveal' || game.phase === 'done') {
    return <><b>🏆 Game over · results on the big screen.</b>
      <button className="btn ghost" onClick={() => { if (confirm('Reset for a new game?')) resetGame(game.id) }}>Reset / New game</button></>
  }

  // standard question phase
  if (round.type === 'tf-rapid') {
    return (
      <>
        <b>Rapid fire · Q{game.current_question + 1}/{round.questions.length} (auto-advancing)</b>
        <p className="sub">{answeredCount}/{total} answered</p>
        {game.test_mode && <button className="btn ghost sm" onClick={() => advanceRapid(game)}>Skip to next →</button>}
      </>
    )
  }
  return (
    <>
      <b>{round.title} · Q{game.current_question + 1}/{round.questions.length}</b>
      <p className="sub">{answeredCount}/{total} answered</p>
      <div className="row wrap">
        {!game.revealed && <button className="btn ghost" onClick={() => endTimer(game.id)}>End timer</button>}
        {!game.revealed && <button className="btn" onClick={() => revealQuestion(game)}>Reveal answer</button>}
        {game.revealed && <button className="btn big" onClick={() => nextQuestion(game)}>Next →</button>}
        {game.test_mode && <button className="btn ghost sm" onClick={() => nextQuestion(game)}>Skip →</button>}
      </div>
    </>
  )
}

function answeredCountFinale(game, teams) {
  return 0 // placeholder; present shows the live count from answers
}

// ---- bot helpers ----
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function botValue(subtype, question) {
  if (subtype === 'tf') return Math.random() > 0.5
  if (subtype === 'select-all') {
    const picks = question.options.filter(() => Math.random() > 0.5).map(o => o.id)
    return picks.length ? picks : [rand(question.options).id]
  }
  return rand(question.options).id // mc, clue-drip, bank-drip
}
function botClue(subtype, question) {
  if (subtype === 'clue-drip') return Math.floor(Math.random() * (question.clues?.length || 1))
  if (subtype === 'bank-drip') return Math.floor(Math.random() * (question.clues?.length || 1))
  return 0
}
