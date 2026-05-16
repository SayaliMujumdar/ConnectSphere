import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiEdit3, FiMapPin, FiLink, FiCalendar, FiGrid, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Post from '../components/Post'
import LoadingSpinner from '../components/LoadingSpinner'
import EditProfileModal from '../components/EditProfileModal'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'

export default function Profile() {
  const { username } = useParams()
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/users/${username}`)
        setProfile(data.user)
        setIsFollowing(data.user.followers.some((f) => f._id === currentUser?._id))
      } catch {
        toast.error('User not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username, currentUser?._id])

  useEffect(() => {
    if (!profile) return
    const fetchPosts = async () => {
      setPostsLoading(true)
      try {
        const { data } = await api.get(`/posts/user/${profile._id}`)
        setPosts(data.posts)
      } catch {
        toast.error('Failed to load posts')
      } finally {
        setPostsLoading(false)
      }
    }
    fetchPosts()
  }, [profile])

  const handleFollow = async () => {
    if (!profile) return
    setFollowLoading(true)
    try {
      const { data } = await api.put(`/users/${profile._id}/follow`)
      setIsFollowing(data.following)
      setProfile((prev) => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { _id: currentUser._id }]
          : prev.followers.filter((f) => f._id !== currentUser._id),
      }))
    } catch {
      toast.error('Action failed')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleProfileUpdated = (updatedUser) => {
    setProfile((prev) => ({ ...prev, ...updatedUser }))
    updateUser(updatedUser)
    setShowEditModal(false)
    toast.success('Profile updated!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-200">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-200">
        <Navbar />
        <div className="text-center pt-20 text-gray-400">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <div className="max-w-3xl mx-auto pt-16">
        {/* Cover Photo */}
        <div
          className="h-48 bg-gradient-to-r from-primary-900 via-primary-700 to-primary-500 relative"
          style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />

        {/* Profile Info */}
        <div className="card mx-4 -mt-12 p-6 relative">
          <div className="flex items-end justify-between mb-4">
            <div className="relative -mt-16">
              <img
                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.username}&background=7e22ce&color=fff&size=128`}
                alt={profile.username}
                className="w-24 h-24 rounded-full border-4 border-dark-100 avatar"
              />
              {profile.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-100" />
              )}
            </div>
            <div>
              {isOwnProfile ? (
                <button onClick={() => setShowEditModal(true)} className="btn-outline flex items-center gap-2">
                  <FiEdit3 size={16} /> Edit Profile
                </button>
              ) : (
                <button onClick={handleFollow} disabled={followLoading} className={isFollowing ? 'btn-outline' : 'btn-primary'}>
                  {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{profile.username}</h1>
              {profile.isVerified && (
                <span className="text-primary-400 text-sm">✓ Verified</span>
              )}
            </div>
            {profile.bio && <p className="text-gray-300 mt-2">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
              {profile.location && (
                <span className="flex items-center gap-1"><FiMapPin size={14} />{profile.location}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-400 hover:underline">
                  <FiLink size={14} />{profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <FiCalendar size={14} />Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
              </span>
            </div>

            <div className="flex gap-6 mt-4 text-sm">
              <Link to={`/profile/${username}`} className="hover:text-white">
                <span className="font-bold text-white">{profile.following?.length || 0}</span>
                <span className="text-gray-400 ml-1">Following</span>
              </Link>
              <Link to={`/profile/${username}`} className="hover:text-white">
                <span className="font-bold text-white">{profile.followers?.length || 0}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </Link>
              <span>
                <span className="font-bold text-white">{posts.length}</span>
                <span className="text-gray-400 ml-1">Posts</span>
              </span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="mx-4 mt-4 space-y-4 pb-8">
          {postsLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center">
              <FiGrid className="mx-auto text-4xl text-gray-600 mb-3" />
              <p className="text-gray-400">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <Post
                key={post._id}
                post={post}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
                onUpdated={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
              />
            ))
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </div>
  )
}
