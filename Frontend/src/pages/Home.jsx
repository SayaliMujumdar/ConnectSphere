import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import LeftSidebar from '../components/LeftSidebar'
import RightSidebar from '../components/RightSidebar'
import CreatePost from '../components/CreatePost'
import Post from '../components/Post'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      const { data } = await api.get(`/posts/feed?page=${pageNum}&limit=10`)
      if (pageNum === 1) {
        setPosts(data.posts)
      } else {
        setPosts((prev) => [...prev, ...data.posts])
      }
      setHasMore(pageNum < data.totalPages)
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)))
  }

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <div className="flex max-w-6xl mx-auto pt-16 px-4 gap-6">
        <LeftSidebar />
        <main className="flex-1 max-w-2xl py-6 space-y-4">
          <CreatePost onPostCreated={handlePostCreated} />
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
              <p className="text-gray-400">Follow some people to see their posts here!</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  onDeleted={handlePostDeleted}
                  onUpdated={handlePostUpdated}
                />
              ))}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-outline flex items-center gap-2"
                  >
                    {loadingMore ? <LoadingSpinner size="sm" /> : null}
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        <RightSidebar />
      </div>
    </div>
  )
}
