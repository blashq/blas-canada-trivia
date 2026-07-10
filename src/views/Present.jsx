import React, { useEffect, useState } from 'react'
import { useGame } from '../lib/useGame.js'
import { ROUNDS, FINALE } from '../lib/gameData.js'
import { loadLatestGame, roundAt, FINALE_ROUND_INDEX } from '../lib/room.js'
import { useCountdown, Timer, Brand, MapleLeaf, LeafFall, AvatarChip } from '../components/ui.jsx'
import { shuffledOptions } from '../lib/shuffle.js'

const emoji = { moose: '🫎', beaver: '🦫', bear: '🐻', loon: '🦆', mountie: '👮', cntower: '🗼' }

export default function Present() {
  const [gameId, setGameId] = useState(null)
  useEffect(() => {
    let stop = false
    async function tick() { const g = await loadLatestGame(); if (!stop && g) setGameId(g.id) }
    tick(); const t = setInterval(tick, 4000); return () => { stop = true; clearInterval(t) }
  }, [])
  const { game, teams, answers } = useGame(gameId)
  if (!game) return <Shell><div className="center stack"><MapleLeaf size={80} /><h1 className="huge">BLAS Canada Day Trivia</h1><p className="sub">Waiting for the host…</p></div></Shell>
  return <Shell><Stage game={game} teams={teams} answers={answers} /></Shell>
}

function Shell({ children }) {
  return (
    <div className="screen" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="flag-bar" />
      <div className="row spread pad"><Brand /><span className="pill leaf" style={{ fontSize: 20, fontWeight: 800, padding: '10px 18px', background: '#fff0f1', color: 'var(--flag-red-dark)' }}>🍁 Happy Belated Canada Day</span></div>
      <div className="grow center pad" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '3vh' }}>{children}</div>
    </div>
  )
}

function Stage({ game, teams, answers }) {
  const finale = game.current_round >= ROUNDS.length
  const round = roundAt(game.current_round)
  const phase = game.phase

  if (phase === 'lobby') return <Lobby game={game} teams={teams} />
  if (phase === 'intro') return <Intro round={round} idx={game.current_round} />
  if (phase === 'final_bet') return <FinalBet game={game} teams={teams} answers={answers} />
  if (phase === 'final_q') return <FinaleQ game={game} />
  if (phase === 'final_reveal' || phase === 'done') return <FinalReveal game={game} teams={teams} answers={answers} />
  if (phase === 'round_recap') return <Recap game={game} round={round} answers={answers} teams={teams} />

  // standard question / reveal
  return <QuestionStage game={game} round={round} teams={teams} answers={answers} />
}

function Lobby({ game, teams }) {
  const url = window.location.origin + window.location.pathname
  return (
    <div className="stack center">
      <img src="/art/beaver.png" alt="" style={{ position: 'fixed', left: '2vw', bottom: '2vh', height: '32vh', pointerEvents: 'none', zIndex: 0, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.15))' }} />
      <img src="/art/celebrate.png" alt="" style={{ position: 'fixed', right: '2vw', bottom: '2vh', height: '32vh', pointerEvents: 'none', zIndex: 0, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.15))' }} />
      <p className="sub">Join on your laptop at</p>
      <h2 className="big" style={{ color: 'var(--brand-teal-dark)' }}>{url}</h2>
      <p className="sub" style={{ marginTop: 20 }}>Room code</p>
      <div className="codebox">{game.room_code}</div>
      <div className="row wrap center" style={{ marginTop: 24, justifyContent: 'center' }}>
        {teams.length === 0 && <p className="sub">No teams yet…</p>}
        {teams.filter(t => !t.is_bot).map(t => (
          <span key={t.id} className="pill" style={{ fontSize: 20, padding: '10px 16px' }}>
            <span className="dot" style={{ background: t.color }} /> {emoji[t.avatar]} {t.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function Intro({ round, idx }) {
  return (
    <div className="stack center" style={{ maxWidth: 1000 }}>
      <img src="/art/mountie.png" alt="" style={{ position: 'fixed', left: '3vw', bottom: '2vh', height: '34vh', pointerEvents: 'none', zIndex: 0, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.15))' }} />
      <img src="/art/friends.png" alt="" style={{ position: 'fixed', right: '3vw', bottom: '2vh', height: '30vh', pointerEvents: 'none', zIndex: 0, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.15))' }} />
      <MapleLeaf size={60} />
      <p className="sub">Round {idx + 1}</p>
      <h1 className="huge">{round.title}</h1>
      <div className="card" style={{ maxWidth: 760 }}>
        <p style={{ fontSize: 24, margin: 0 }}>{round.rules}</p>
      </div>
      <div className="pill" style={{ fontSize: 22, padding: '12px 20px', background: '#fff0f1', color: 'var(--flag-red-dark)' }}>{round.pointsLabel}</div>
    </div>
  )
}

function QuestionStage({ game, round, teams, answers }) {
  const q = game.current_question
  const question = round.questions[q]
  const subtype = round.type === 'mixed' ? question.subtype : round.type
  const seed = `${game.id}:${game.current_round}:${q}:${question.id}`
  const { remaining, frac, elapsed } = useCountdown(game.question_started_at, round.timerSec, game.accepting)
  const revealed = game.revealed
  const tally = game.data?.tally

  return (
    <div className="stack center present-compact" style={{ maxWidth: 1100, width: '100%', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span className="pill" style={{ fontSize: 18 }}>{round.title}{round.type !== 'wager' ? ` · Q${q + 1}` : ''}</span>
        {!revealed && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 200 }}><Timer remaining={remaining} frac={frac} /></div>}
      </div>

      {subtype === 'mc' && <MCStage question={question} revealed={revealed} seed={seed} />}
      {subtype === 'tf' && <TFStage question={question} revealed={revealed} />}
      {subtype === 'select-all' && <SpotStage question={question} revealed={revealed} />}
      {(subtype === 'clue-drip' || subtype === 'bank-drip') &&
        <DripStage question={question} revealed={revealed} seed={seed}
          intervalSec={subtype === 'clue-drip' ? round.clueIntervalSec : round.scoring.drip.intervalSec}
          elapsed={elapsed} />}

      {revealed && <RevealFooter blurb={question.reveal?.blurb} tally={tally} />}
    </div>
  )
}

function MCStage({ question, revealed, seed }) {
  const opts = React.useMemo(() => shuffledOptions(question.options, seed), [seed])
  const showFlagMap = revealed && question.image && question.reveal?.flag
  return (
    <>
      {question.image && <img src={showFlagMap ? question.reveal.flag : question.image} alt="" style={{ maxHeight: '32vh', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.20))', margin: '2px 0' }} />}
      <h1 className="big" style={{ margin: '4px 0', fontSize: 'clamp(24px, 4.6vh, 52px)' }}>{question.prompt}</h1>
      <div className="options" style={{ maxWidth: 900, width: '100%' }}>
        {opts.map(o => (
          <div key={o.id} className={'opt' + (revealed && o.id === question.correct ? ' correct' : '')}>
            {o.label}{revealed && o.id === question.correct ? ' ✓' : ''}
          </div>
        ))}
      </div>
      {revealed && question.reveal?.answerName && (
        <div className="pill" style={{ fontSize: 20, padding: '8px 16px' }}>
          {(!question.image && question.reveal.flag) ? <img src={question.reveal.flag} alt="" style={{ height: 22 }} /> : <MapleLeaf size={20} />} {question.reveal.answerName}
        </div>
      )}
    </>
  )
}

function TFStage({ question, revealed }) {
  return (
    <>
      <h1 className="big" style={{ margin: '10px 0' }}>{question.statement}</h1>
      <div className="options" style={{ maxWidth: 700 }}>
        <div className={'opt' + (revealed && question.correct === true ? ' correct' : '')}>✅ TRUE</div>
        <div className={'opt' + (revealed && question.correct === false ? ' correct' : '')}>❌ FALSE</div>
      </div>
    </>
  )
}

function SpotStage({ question, revealed }) {
  return (
    <>
      <h1 className="big" style={{ margin: '6px 0' }}>{revealed ? 'The Canadians are…' : 'Who here is Canadian?'}</h1>
      <div className="photos" style={{ maxWidth: 720, width: '100%' }}>
        {question.options.map(o => (
          <div key={o.id} className={'photo' + (revealed ? (o.isCanadian ? ' rev-yes' : ' rev-no') : '')}>
            {o.img ? <img src={o.img} alt="" /> : <div className="center grow" style={{ fontSize: 60 }}>👤</div>}
            {revealed && o.label && o.label !== 'TBD' && <div className="name">{o.label}{o.isCanadian ? ' 🍁' : ''}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

function DripStage({ question, revealed, intervalSec, elapsed, seed }) {
  const opts = React.useMemo(() => shuffledOptions(question.options, seed), [seed])
  const shown = revealed ? question.clues.length : Math.min(Math.floor(elapsed / intervalSec) + 1, question.clues.length)
  return (
    <>
      <div className="stack" style={{ maxWidth: 900, width: '100%' }}>
        {question.clues.slice(0, shown).map((c, i) => (
          <div key={i} className="card" style={{ borderLeft: '6px solid var(--flag-red)', fontSize: 22, textAlign: 'left' }}>
            <span className="pill" style={{ marginRight: 10 }}>Clue {i + 1}{!revealed ? ` · +${[3, 2, 1][i] ?? 1}` : ''}</span>{c}
          </div>
        ))}
      </div>
      <div className="options" style={{ maxWidth: 900, marginTop: 10, gridTemplateColumns: question.options.length > 4 ? '1fr 1fr 1fr' : '1fr 1fr' }}>
        {opts.map(o => (
          <div key={o.id} className={'opt' + (revealed && o.id === question.correct ? ' correct' : '')}>{o.label}{revealed && o.id === question.correct ? ' ✓' : ''}</div>
        ))}
      </div>
    </>
  )
}

function RevealFooter({ blurb, tally }) {
  return (
    <div className="stack center" style={{ marginTop: 4, gap: 6 }}>
      {tally && (
        <div style={{ color: 'var(--brand-teal-dark)', fontWeight: 800, fontSize: 'clamp(18px, 3.2vh, 34px)' }}>
          {tally.right === 0 ? 'Nobody got it! 😳' : `${tally.right} of ${tally.total} teams got it right`}
        </div>
      )}
      {blurb && <p style={{ fontSize: 'clamp(18px, 2.7vh, 26px)', lineHeight: 1.3, color: 'var(--ink)', fontWeight: 500, maxWidth: 980, margin: 0 }}>{blurb}</p>}
    </div>
  )
}

function Recap({ game, round, answers, teams }) {
  const q = game.current_question
  const question = round.questions[q]
  const total = teams.length
  // recompute tally for this rapid question from answers
  let right = 0
  for (const a of answers.filter(a => a.round_index === game.current_round && a.question_index === q)) {
    if (a.value === question.correct) right++
  }
  return (
    <div className="stack center" style={{ maxWidth: 1000 }}>
      <span className="pill">Recap · {q + 1} / {round.questions.length}</span>
      <h1 className="big">{question.statement}</h1>
      <div className="huge" style={{ fontSize: 60, color: question.correct ? 'var(--good)' : 'var(--bad)' }}>
        {question.correct ? '✅ TRUE' : '❌ FALSE'}
      </div>
      <div className="big" style={{ color: 'var(--brand-teal-dark)' }}>
        {right === 0 ? 'Nobody got it!' : `${right} of ${total} got it right`}
      </div>
      {question.blurb && <p className="sub" style={{ fontSize: 20 }}>{question.blurb}</p>}
    </div>
  )
}

function FinalBet({ game, teams, answers }) {
  const locked = answers.filter(a => a.round_index === FINALE_ROUND_INDEX).length
  const total = teams.length
  return (
    <div className="stack center">
      <div style={{ fontSize: 70 }}>🎲</div>
      <p className="sub">Final Wager</p>
      <h1 className="huge">{FINALE.category}</h1>
      <p style={{ fontSize: 26, maxWidth: 700 }}>Teams are placing their secret bets…</p>
      <div className="big" style={{ color: 'var(--brand-teal-dark)' }}>{locked} of {total} wagers locked</div>
    </div>
  )
}

function FinaleQ({ game }) {
  const { remaining, frac } = useCountdown(game.question_started_at, FINALE.timerSec, game.accepting)
  const opts = React.useMemo(() => shuffledOptions(FINALE.options, `${game.id}:finale`), [game.id])
  return (
    <div className="stack center" style={{ maxWidth: 1000 }}>
      <div className="row spread" style={{ width: '100%' }}>
        <span className="pill">🍁 Final Wager</span>
        <div style={{ width: 220 }}><Timer remaining={remaining} frac={frac} /></div>
      </div>
      <h1 className="big">{FINALE.prompt}</h1>
      <div className="options" style={{ maxWidth: 900 }}>
        {opts.map(o => <div key={o.id} className="opt">{o.label}</div>)}
      </div>
    </div>
  )
}

function FinalReveal({ game, teams, answers }) {
  // per-team section breakdown from answers.points
  const rows = teams.map(t => {
    const sections = {}
    for (const a of answers.filter(a => a.team_id === t.id)) {
      sections[a.round_index] = (sections[a.round_index] || 0) + Number(a.points || 0)
    }
    return { team: t, total: Number(t.score), sections }
  }).sort((a, b) => b.total - a.total)
  const winner = rows[0]
  return (
    <div className="stack center" style={{ maxWidth: 1100, width: '100%', position: 'relative' }}>
      <LeafFall n={18} />
      <div style={{ fontSize: 60 }}>🏆🍁</div>
      <h1 className="huge">Champions: {winner?.team.name}</h1>
      <div className="card" style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 18 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Team</th>
              {ROUNDS.map((r, i) => <th key={i} style={{ padding: 8 }}>{i + 1}</th>)}
              <th style={{ padding: 8 }}>🍁</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.team.id} style={{ background: ri === 0 ? '#fff0f1' : 'transparent' }}>
                <td style={{ padding: 8, fontWeight: 800 }}><span className="dot" style={{ background: row.team.color, marginRight: 6 }} />{emoji[row.team.avatar]} {row.team.name}</td>
                {ROUNDS.map((r, i) => <td key={i} style={{ padding: 8, textAlign: 'center' }}>{row.sections[i] ?? 0}</td>)}
                <td style={{ padding: 8, textAlign: 'center' }}>{row.sections[FINALE_ROUND_INDEX] ?? 0}</td>
                <td style={{ padding: 8, textAlign: 'right', fontWeight: 900, fontSize: 22 }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
