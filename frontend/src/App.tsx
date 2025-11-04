import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type CommentOption = {
  commentId: string
  text: string
}

type GameRound = {
  roundId: string
  videoLink: string
  options: CommentOption[]
}

type RevealedOption = CommentOption & {
  likes: number
  isCorrect: boolean
}

type GuessResult = {
  isCorrect: boolean
  selectedOptionId: string
  options: RevealedOption[]
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const GET_ROUND_ENDPOINT = `${API_BASE_URL}/api/get-game-round`
const SUBMIT_GUESS_ENDPOINT = `${API_BASE_URL}/api/submit-guess`

const formatLikes = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const getEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const videoId =
      parsed.searchParams.get('v') ??
      parsed.pathname.split('/').filter(Boolean).pop()

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`
    }
  } catch (err) {
    console.error('Failed to build embed url', err)
  }

  return url
}

function App() {
  const [gameRound, setGameRound] = useState<GameRound | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null)
  const [isLoadingRound, setIsLoadingRound] = useState(true)
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)

  const fetchRound = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingRound(true)
    if (!signal?.aborted) {
      setError(null)
    }

    try {
      const response = await fetch(GET_ROUND_ENDPOINT, { signal })
      const payload = await response.json()

      if (!response.ok) {
        const message =
          typeof payload?.detail === 'string'
            ? payload.detail
            : 'Unable to fetch a new video right now. Please try again soon.'
        throw new Error(message)
      }

      const data = payload as GameRound

      if (signal?.aborted) {
        return
      }

      setGameRound(data)
      setSelectedOptionId(null)
      setGuessResult(null)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return
      }

      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      setError(message)
      setGameRound(null)
      setGuessResult(null)
      setSelectedOptionId(null)
    } finally {
      if (!signal?.aborted) {
        setIsLoadingRound(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchRound(controller.signal)

    return () => controller.abort()
  }, [fetchRound])

  const embedUrl = useMemo(
    () => (gameRound ? getEmbedUrl(gameRound.videoLink) : ''),
    [gameRound],
  )

  const isInitialLoading = isLoadingRound && !gameRound && !error

  const handleOptionSelect = (commentId: string) => {
    if (isLoadingRound || isSubmittingGuess || guessResult) {
      return
    }

    setSelectedOptionId(commentId)
  }

  const handleSubmitGuess = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!gameRound || !selectedOptionId || guessResult) {
      return
    }

    setIsSubmittingGuess(true)

    try {
      const response = await fetch(SUBMIT_GUESS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundId: gameRound.roundId,
          commentId: selectedOptionId,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        const message =
          typeof payload?.detail === 'string'
            ? payload.detail
            : 'We could not score that guess. Please try a new round.'
        throw new Error(message)
      }

      const data = payload as GuessResult
      setStreak((prev) => (data.isCorrect ? prev + 1 : 0))
      setGuessResult(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setGameRound(null)
      setGuessResult(null)
      setSelectedOptionId(null)
    } finally {
      setIsSubmittingGuess(false)
    }
  }

  const handleNextRound = () => {
    fetchRound()
  }

  const handleRetry = () => {
    fetchRound()
  }

  const isSubmitDisabled =
    isLoadingRound || isSubmittingGuess || !selectedOptionId || Boolean(guessResult)

  const isNextDisabled = isLoadingRound || !guessResult

  return (
    <div className="page-shell">
      <div className="page-shell__glow page-shell__glow--one" />
      <div className="page-shell__glow page-shell__glow--two" />
      <main className="layout">
        <header className="masthead">
          <span className="masthead__eyebrow">Comment Guesser</span>
          <h1 className="masthead__title">Guess the comment fans loved most</h1>
          <p className="masthead__body">
            Watch a trending short, study the contenders, and lock in the reply you think pulled in
            the most likes.
          </p>
          <div
            className={`streak-card ${streak > 0 ? 'streak-card--active' : ''}`}
            role="status"
            aria-live="polite"
          >
            <span className="streak-card__label">Current streak</span>
            <span className="streak-card__value">{streak}</span>
          </div>
        </header>

        {error && (
          <section className="state-card state-card--error">
            <h2>We hit a snag</h2>
            <p>{error}</p>
            <button className="button button--primary" onClick={handleRetry}>
              Try again
            </button>
          </section>
        )}

        {isInitialLoading && (
          <section className="state-card state-card--loading">
            <div className="loading-spinner" />
            <p>Fetching a new short and its comment section...</p>
          </section>
        )}

        {!error && gameRound && (
          <section className="game-board">
            <article className="surface surface--video">
              <div className="surface__header">
                <h2>Featured short</h2>
                <p>Soak in the context before you make your pick.</p>
              </div>
              <div className="video-frame">
                {embedUrl ? (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="video-frame__fallback">
                    <p>Video unavailable</p>
                  </div>
                )}
                {isLoadingRound && (
                  <div className="surface__overlay">
                    <div className="loading-spinner" />
                  </div>
                )}
              </div>
            </article>

            <article className="surface surface--choices">
              <form className="choices-form" onSubmit={handleSubmitGuess}>
                <div className="surface__header">
                  <h2>The contenders</h2>
                  <p>Only one of these comments claimed the crown.</p>
                </div>

                <div className="choices-grid">
                  {gameRound.options.map((option, index) => {
                    const revealedOption = guessResult?.options.find(
                      (revealed) => revealed.commentId === option.commentId,
                    )
                    const isCorrect = Boolean(revealedOption?.isCorrect)
                    const isUserChoice = guessResult
                      ? guessResult.selectedOptionId === option.commentId
                      : selectedOptionId === option.commentId
                    const isDisabled =
                      isLoadingRound || isSubmittingGuess || Boolean(guessResult)

                    const classNames = ['choice']

                    if (isCorrect && guessResult) {
                      classNames.push('choice--correct')
                    } else if (guessResult && isUserChoice && !isCorrect) {
                      classNames.push('choice--incorrect')
                    } else if (!guessResult && isUserChoice) {
                      classNames.push('choice--selected')
                    }

                    if (isDisabled) {
                      classNames.push('choice--disabled')
                    }

                    return (
                      <button
                        type="button"
                        key={option.commentId}
                        className={classNames.join(' ')}
                        onClick={() => handleOptionSelect(option.commentId)}
                        disabled={isDisabled}
                        aria-pressed={isUserChoice}
                      >
                        <span className="choice__index">{String.fromCharCode(65 + index)}.</span>
                        <p className="choice__text">{option.text}</p>

                        {guessResult && revealedOption && (
                          <div className="choice__meta">
                            <div className="choice__badges">
                              {isCorrect && <span className="choice__badge choice__badge--win">Top comment</span>}
                              {guessResult.selectedOptionId === option.commentId && !isCorrect && (
                                <span className="choice__badge choice__badge--warn">Your pick</span>
                              )}
                            </div>
                            <span className="choice__likes">
                              {formatLikes(revealedOption.likes)} likes
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="form-actions">
                  <button type="submit" className="button button--primary" disabled={isSubmitDisabled}>
                    Lock in guess
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={handleNextRound}
                    disabled={isNextDisabled}
                  >
                    Next video
                  </button>
                </div>
              </form>

              {(isLoadingRound || isSubmittingGuess) && gameRound && (
                <div className="surface__overlay surface__overlay--subtle">
                  <div className="loading-spinner" />
                </div>
              )}
            </article>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
