import React, { useEffect, useState } from 'react'
import Search from './Components/Search.jsx'
import MovieCard from './Components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState(null); 
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1100, [searchTerm])

  const fetchMovies = async (query = '', page = 1, sortBy = 'popularity.desc') => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`
        : `${API_BASE_URL}/discover/movie?sort_by=${sortBy}&page=${page}`

      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) throw new Error('Failed to fetch movies')

      const data = await response.json()

      if (data.Response === 'false') {
        setErrorMessage(data.Error || 'Failed to fetch movies')
        if (page === 1) setMovieList([])
        return
      }

      setMovieList(prev =>
        page === 1 ? data.results || [] : [...prev, ...(data.results || [])]
      )

      if (query && data.results.length > 0 && page === 1) {
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.error(`Error fetching Movies: ${error}`)
      setErrorMessage('Error fetching Movies. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies()
      setTrendingMovies(movies || [])
    } catch (error) {
      console.log("Error fetching movies:", error)
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies()
  }, [])
  
  useEffect(() => {
  const handler = (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };
}, []);


  return (
    <main>
      <div className="pattern">
        <div className="glow-effect"></div>
        <div className="glow-effect"></div>

        <div className="wrapper">
          <header>
            <img src="hero.png" alt="Hero Banner" />
            <h1>
              Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>

          {trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending movies 🔥</h2>
              <ul className="hide-scrollbar">
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id} onClick={() => setSelectedMovie(movie)}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="all-movies">
            <h2>All Movies</h2>

            <div className="flex gap-4 mt-6">
              <select
                className="bg-gray-800 text-white p-2 rounded-lg"
                onChange={(e) =>
                  fetchMovies(debouncedSearchTerm, 1, e.target.value)
                }
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Top Rated</option>
                <option value="release_date.desc">Newest</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              </div>
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <>
                <ul>
                  {movieList.map((movie) => (
                    <div
                      onClick={() => setSelectedMovie(movie)}
                      key={movie.id}
                    >
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </ul>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      const nextPage = page + 1
                      setPage(nextPage)
                      fetchMovies(debouncedSearchTerm, nextPage)
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    See More
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {selectedMovie && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-gray-900 text-white rounded-lg p-6 max-w-lg w-full relative">
      {/* Close button */}
      <button
        onClick={() => setSelectedMovie(null)}
        className="absolute top-3 right-3 text-gray-400 hover:text-white"
      >
        ✕
      </button>

      {/* Poster */}
      <img
        src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
        alt={selectedMovie.title}
        className="w-full h-[400px] object-cover rounded-md mb-4"
      />

      {/* Movie Info */}
      <h2 className="text-2xl font-bold mb-2">{selectedMovie.title}</h2>
      <p className="text-gray-300 text-sm mb-4">
        {selectedMovie.overview || "No description available."}
      </p>

      <div className="flex justify-between text-sm text-gray-400">
        <span>⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"}</span>
        <span>📅 {selectedMovie.release_date || "Unknown"}</span>
      </div>
    </div>
  </div>
)}

 {deferredPrompt && (
        <div className="fixed bottom-5 right-5 bg-purple-600 text-white p-4 rounded-lg shadow-lg">
          <p>📲 Install MovieFinder?</p>
          <button
            className="bg-white text-purple-600 px-4 py-2 rounded mt-2"
            onClick={() => {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((choice) => {
                if (choice.outcome === "accepted") {
                  console.log("✅ User installed the app");
                } else {
                  console.log("❌ User dismissed the install");
                }
                setDeferredPrompt(null);
              });
            }}
          >
            Install
          </button>
        </div>
      )}
      
    </main>
  )
}

export default App
