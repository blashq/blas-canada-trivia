import { supabase } from './supabase'
import { ROUNDS, FINALE, TEAM_COLORS, AVATARS } from './gameData'
import { scoreAnswer } from './scoring'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O
export function genCode(n = 4) {
  let s = ''
  for (let i = 0; i < n; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return s
}

export const FINALE_ROUND_INDEX = ROUNDS.length
export const WAGER_CAP = 50
export function roundAt(i) { return i >= ROUNDS.length ? FINALE : ROUNDS[i] }
export function isFinale(i) { return i >= ROUNDS.length }
export function totalRounds() { return ROUNDS.length + 1 }

// ---------- game lifecycle ----------
export async function loadLatestGame() {
  const { data } = await supabase.from('games').select('*').order('created_at', { ascending: false }).limit(1)
  return data && data[0] ? data[0] : null
}
export async function createGame() {
  const { data } = await supabase.from('games').insert({ room_code: genCode() }).select().single()
  return data
}
export async function hostGetOrCreateGame() {
  return (await loadLatestGame()) || (await createGame())
}
export async function patchGame(id, fields) {
  await supabase.from('games').update(fields).eq('id', id)
}
export async function resetGame(id) {
  await supabase.from('answers').delete().eq('game_id', id)
  await supabase.from('teams').delete().eq('game_id', id)
  await patchGame(id, {
    phase: 'lobby', current_round: 0, current_question: 0, clue_index: 0,
    revealed: false, accepting: false, question_started_at: null, data: {},
  })
}

// ---------- teams ----------
export async function joinGameByCode(code, { name, color, avatar, isBot = false }) {
  const { data: games } = await supabase.from('games').select('*').eq('room_code', code.toUpperCase().trim()).limit(1)
  if (!games || !games.length) throw new Error('No game found for that code.')
  const game = games[0]
  // Auto-allocate a DISTINCT colour + avatar so every team looks different.
  if (!color || !avatar) {
    const { data: existing } = await supabase.from('teams').select('color, avatar').eq('game_id', game.id)
    const used = existing || []
    const usedColors = new Set(used.map(t => t.color))
    const usedAvatars = new Set(used.map(t => t.avatar))
    const freeColors = TEAM_COLORS.filter(c => !usedColors.has(c))
    const freeAvatars = AVATARS.filter(a => !usedAvatars.has(a))
    const rand = arr => arr[Math.floor(Math.random() * arr.length)]
    color = color || (freeColors.length ? freeColors[0] : rand(TEAM_COLORS))
    avatar = avatar || (freeAvatars.length ? rand(freeAvatars) : rand(AVATARS))
  }
  const { data: team, error } = await supabase.from('teams')
    .insert({ game_id: game.id, name, color, avatar, is_bot: isBot }).select().single()
  if (error) throw error
  return { game, team }
}
export async function removeTeam(teamId) {
  await supabase.from('teams').delete().eq('id', teamId)
}
export async function addBots(gameId, n = 2) {
  const names = ['Test Bot A', 'Test Bot B', 'Test Bot C', 'Test Bot D']
  const rows = Array.from({ length: n }, (_, i) => ({
    game_id: gameId, name: names[i] || 'Bot ' + i, color: TEAM_COLORS[i % TEAM_COLORS.length], avatar: AVATARS[i % AVATARS.length], is_bot: true,
  }))
  await supabase.from('teams').insert(rows)
}

// ---------- answers ----------
export async function submitAnswer(gameId, teamId, roundIndex, questionIndex, value, clueIndex = 0) {
  await supabase.from('answers').upsert(
    { game_id: gameId, team_id: teamId, round_index: roundIndex, question_index: questionIndex, value, clue_index: clueIndex },
    { onConflict: 'team_id,round_index,question_index' }
  )
}
export function findAnswer(answers, teamId, r, q) {
  return answers.find(a => a.team_id === teamId && a.round_index === r && a.question_index === q) || null
}

// ---------- host flow ----------
export async function startGame(id) {
  await patchGame(id, { phase: 'intro', current_round: 0, current_question: 0, clue_index: 0, revealed: false, accepting: false })
}
export async function beginRound(game) {
  // from intro card -> first question of the round
  await startQuestion(game.id, 0)
}
export async function startQuestion(id, questionIndex) {
  await patchGame(id, {
    phase: 'question', current_question: questionIndex, clue_index: 0,
    revealed: false, accepting: true, question_started_at: new Date().toISOString(),
    data: {},
  })
}
export async function endTimer(id) {
  await patchGame(id, { accepting: false })
}

export async function showStandings(game) {
  await patchGame(game.id, { phase: 'standings', data: { ...(game.data || {}), prev_phase: game.phase } })
}
export async function showBreakdown(game) {
  await patchGame(game.id, { phase: 'breakdown', data: { ...(game.data || {}), prev_phase: game.phase } })
}
export async function hideBreakdown(game) {
  const prev = (game.data && game.data.prev_phase) || 'final_reveal'
  await patchGame(game.id, { phase: prev })
}
export async function hideStandings(game) {
  const prev = (game.data && game.data.prev_phase) || 'intro'
  await patchGame(game.id, { phase: prev })
}

// Apply scoring for a single (round,question) across all teams. Idempotent-ish:
// caller should only invoke once (on reveal).
async function applyScoringForQuestion(game, roundIndex, questionIndex) {
  const round = roundAt(roundIndex)
  const q = round.type === 'wager' ? round : round.questions[questionIndex]
  const { data: answers } = await supabase.from('answers').select('*')
    .eq('game_id', game.id).eq('round_index', roundIndex).eq('question_index', questionIndex)
  const { data: teams } = await supabase.from('teams').select('*').eq('game_id', game.id)
  let right = 0
  for (const team of teams || []) {
    const ans = (answers || []).find(a => a.team_id === team.id) || null
    let pts
    if (round.type === 'wager') {
      const stake = ans && ans.value ? Math.round(WAGER_CAP * (ans.value.fraction ?? 0)) : 0
      pts = ans && ans.value && ans.value.choice === round.correct ? stake : -stake
    } else {
      pts = scoreAnswer(round, q, ans)
    }
    if (pts > 0) right++
    if (ans) await supabase.from('answers').update({ points: pts }).eq('id', ans.id)
    await supabase.from('teams').update({ score: Number(team.score) + pts }).eq('id', team.id)
  }
  return { right, total: (teams || []).length }
}

export async function revealQuestion(game) {
  if (game.revealed) return
  const tally = await applyScoringForQuestion(game, game.current_round, game.current_question)
  await patchGame(game.id, { revealed: true, accepting: false, data: { ...(game.data || {}), tally } })
}

// advance to next question, or next round intro, or finale
export async function nextQuestion(game) {
  const round = roundAt(game.current_round)
  const qCount = round.type === 'wager' ? 1 : round.questions.length
  if (game.current_question + 1 < qCount) {
    await startQuestion(game.id, game.current_question + 1)
  } else {
    await goToNextRound(game)
  }
}
export async function goToNextRound(game) {
  const next = game.current_round + 1
  if (next < ROUNDS.length) {
    await patchGame(game.id, { phase: 'intro', current_round: next, current_question: 0, clue_index: 0, revealed: false, accepting: false })
  } else {
    // finale
    await patchGame(game.id, { phase: 'final_bet', current_round: FINALE_ROUND_INDEX, current_question: 0, revealed: false, accepting: false, data: {} })
  }
}
export async function jumpToRound(game, roundIndex) {
  if (isFinale(roundIndex)) {
    await patchGame(game.id, { phase: 'final_bet', current_round: FINALE_ROUND_INDEX, current_question: 0, revealed: false, accepting: false, data: {} })
  } else {
    await patchGame(game.id, { phase: 'intro', current_round: roundIndex, current_question: 0, clue_index: 0, revealed: false, accepting: false })
  }
}

// ---------- rapid-fire ----------
export async function startRapidRound(game) { await startQuestion(game.id, 0) }
export async function advanceRapid(game) {
  // Guard: re-read live state so multiple drivers (big screen + host) can never double-advance.
  const { data: g } = await supabase.from('games').select('phase, current_round, current_question').eq('id', game.id).single()
  if (!g || g.phase !== 'question' || g.current_round !== game.current_round || g.current_question !== game.current_question) return
  const round = roundAt(game.current_round)
  if (game.current_question + 1 < round.questions.length) {
    await startQuestion(game.id, game.current_question + 1)
  } else {
    // score all rapid questions at once, then go to recap
    for (let qi = 0; qi < round.questions.length; qi++) {
      await applyScoringForQuestion(game, game.current_round, qi)
    }
    await patchGame(game.id, { phase: 'round_recap', current_question: 0, accepting: false, revealed: true })
  }
}
export async function recapNext(game) {
  const round = roundAt(game.current_round)
  if (game.current_question + 1 < round.questions.length) {
    await patchGame(game.id, { current_question: game.current_question + 1 })
  } else {
    await goToNextRound(game)
  }
}

// ---------- finale ----------
export async function finaleShowQuestion(game) {
  await patchGame(game.id, { phase: 'final_q', accepting: true, revealed: false, question_started_at: new Date().toISOString() })
}
export async function finaleReveal(game) {
  if (game.revealed) return
  const tally = await applyScoringForQuestion(game, FINALE_ROUND_INDEX, 0)
  await patchGame(game.id, { phase: 'final_reveal', revealed: true, accepting: false, data: { ...(game.data || {}), tally } })
}

// ---------- tally helper for present (from live answers already in memory) ----------
export function liveTally(round, question, answers, teamsCount) {
  let right = 0
  for (const a of answers) {
    const pts = scoreAnswer(round, question, a)
    if (pts > 0) right++
  }
  return { right, total: teamsCount }
}
