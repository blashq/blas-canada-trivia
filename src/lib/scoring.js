// ============================================================================
// Scoring — pure functions. Given a question, its round, and a team's answer,
// return the points. `answer` is the row from the `answers` table (or null).
// ============================================================================

// Multiple choice / true-false style: correct vs wrong (no answer = wrong).
function scoreSingle(correctValue, given, correctPts, wrongPts) {
  if (given === undefined || given === null) return wrongPts // no answer = wrong
  return given === correctValue ? correctPts : wrongPts
}

// Select-all (Spot the Canadian): +perCorrect for each right pick, +perWrong for each wrong pick.
function scoreSelectAll(question, selectedIds, cfg) {
  const picks = Array.isArray(selectedIds) ? selectedIds : []
  let pts = 0
  for (const opt of question.options) {
    const picked = picks.includes(opt.id)
    if (picked && opt.isCanadian) pts += cfg.perCorrect
    if (picked && !opt.isCanadian) pts += cfg.perWrong
  }
  return pts
}

// Clue drip: tier by clue_index at lock-in; wrong or no answer = wrong flat.
function scoreDrip(correctValue, answer, tiers, wrongPts) {
  if (!answer || answer.value === undefined || answer.value === null) return wrongPts
  const given = answer.value
  if (given !== correctValue) return wrongPts
  const tierIdx = Math.min(answer.clue_index ?? 0, tiers.length - 1)
  return tiers[tierIdx]
}

// Main entry — returns points (number) for one team's answer to one question.
export function scoreAnswer(round, question, answer) {
  const val = answer ? answer.value : null

  if (round.type === 'mc') {
    return scoreSingle(question.correct, val, round.scoring.correct, round.scoring.wrong)
  }
  if (round.type === 'tf-rapid') {
    return scoreSingle(question.correct, val, round.scoring.correct, round.scoring.wrong)
  }
  if (round.type === 'select-all') {
    return scoreSelectAll(question, val, round.scoring)
  }
  if (round.type === 'clue-drip') {
    return scoreDrip(question.correct, answer, round.scoring.tiers, round.scoring.wrong)
  }
  if (round.type === 'mixed') {
    const m = round.multiplier || 1
    const wrong = round.scoring.wrongFlat // flat, not multiplied
    if (question.subtype === 'select-all') {
      return scoreSelectAll(question, val, { perCorrect: round.scoring.correctBase * m, perWrong: wrong })
    }
    if (question.subtype === 'bank-drip') {
      const tiers = round.scoring.drip.tiers.map((t) => t * m) // [2,1] -> [8,4]
      return scoreDrip(question.correct, answer, tiers, wrong)
    }
    // mc or tf subtype
    return scoreSingle(question.correct, val, round.scoring.correctBase * m, wrong)
  }
  if (round.type === 'wager') {
    // value = { fraction: 0..1, choice: optionId }. Points computed against the
    // team's CURRENT score at wager time (passed in answer.value.stake).
    if (!answer || !answer.value) return 0
    const stake = answer.value.stake ?? 0
    return answer.value.choice === question.correct ? stake : -stake
  }
  return 0
}

// Anonymous tally for the big screen: "N of M teams got it right."
export function tally(round, question, answers) {
  let right = 0
  const total = answers.length
  for (const a of answers) {
    const pts = scoreAnswer(round, question, a)
    if (round.type === 'select-all') { if (pts > 0) right++ }
    else if (pts > 0) right++
  }
  return { right, total }
}
