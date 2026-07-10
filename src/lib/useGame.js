import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

// Subscribes to one game + its teams + answers, refetching on any change.
export function useGame(gameId) {
  const [game, setGame] = useState(null)
  const [teams, setTeams] = useState([])
  const [answers, setAnswers] = useState([])

  const refetchGame = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase.from('games').select('*').eq('id', gameId).maybeSingle()
    setGame(data)
  }, [gameId])

  const refetchTeams = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase.from('teams').select('*').eq('game_id', gameId).order('created_at')
    setTeams(data || [])
  }, [gameId])

  const refetchAnswers = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase.from('answers').select('*').eq('game_id', gameId)
    setAnswers(data || [])
  }, [gameId])

  useEffect(() => {
    if (!gameId) return
    refetchGame(); refetchTeams(); refetchAnswers()
    const ch = supabase.channel('game-' + gameId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, refetchGame)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `game_id=eq.${gameId}` }, refetchTeams)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `game_id=eq.${gameId}` }, refetchAnswers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [gameId, refetchGame, refetchTeams, refetchAnswers])

  return { game, teams, answers, refetchGame, refetchTeams, refetchAnswers }
}
