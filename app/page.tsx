'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Play, Film, Flame, Sparkles, Monitor, Music, Compass, ChevronLeft, ChevronRight, Star, Eye, Clock, RefreshCw, ExternalLink } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  rating: string;
  views: string;
  category: string;
  embedUrl: string;
  author: string;
  uploaded: string;
}

const CATEGORIES = [
  'All',
  'Trending',
  'Animation',
  'Cinema',
  'Nature',
  'Tech',
  'Music',
  'Science',
  'Gaming',
];

// Configurable API endpoint constant as specified
const BASE_API_URL = "API_ENDPOINT_PLACEHOLDER";

// Built-in fallback database for instant offline reliability or standalone use
const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: 'vid-01',
    title: 'Big Buck Bunny 4K - Open Source Animation Classic',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    duration: '09:56',
    rating: '98%',
    views: '14.2M',
    category: 'Animation',
    embedUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1',
    author: 'Blender Foundation',
    uploaded: '3 days ago',
  },
  {
    id: 'vid-02',
    title: 'Cyberpunk Tokyo Rain & Ambient Street Sounds 4K',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    duration: '18:24',
    rating: '96%',
    views: '2.1M',
    category: 'Cinema',
    embedUrl: 'https://www.youtube-nocookie.com/embed/9No-FiEInLA?autoplay=1',
    author: 'Neon Voyager',
    uploaded: '1 week ago',
  },
  {
    id: 'vid-03',
    title: 'Deep Space Hubble & James Webb Ultra Deep Field Tour',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    duration: '14:10',
    rating: '99%',
    views: '5.8M',
    category: 'Science',
    embedUrl: 'https://www.youtube-nocookie.com/embed/udAL48P5NJU?autoplay=1',
    author: 'Astro Odyssey',
    uploaded: '2 weeks ago',
  },
  {
    id: 'vid-04',
    title: 'Alpine Peak Wilderness Expedition - 4K Drone Footage',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    duration: '12:05',
    rating: '95%',
    views: '890K',
    category: 'Nature',
    embedUrl: 'https://www.youtube-nocookie.com/embed/EngW7tLk6R8?autoplay=1',
    author: 'Summit Films',
    uploaded: '4 days ago',
  },
  {
    id: 'vid-05',
    title: 'Synthesizer Live Performance: Modular Ambient Drift',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    duration: '22:40',
    rating: '94%',
    views: '410K',
    category: 'Music',
    embedUrl: 'https://www.youtube-nocookie.com/embed/5qap5aO4i9A?autoplay=1',
    author: 'Analog Dreamer',
    uploaded: '5 days ago',
  },
  {
    id: 'vid-06',
    title: 'Tears of Steel - Sci-Fi VFX Short Film',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    duration: '12:14',
    rating: '93%',
    views: '8.4M',
    category: 'Cinema',
    embedUrl: 'https://www.youtube-nocookie.com/embed/R6MlUcmOul8?autoplay=1',
    author: 'Blender Studio',
    uploaded: '1 month ago',
  },
  {
    id: 'vid-07',
    title: 'Modern Web Architecture with Vanilla JavaScript & Performance',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    duration: '31:50',
    rating: '97%',
    views: '1.5M',
    category: 'Tech',
    embedUrl: 'https://www.youtube-nocookie.com/embed/hdI2bqOjy3c?autoplay=1',
    author: 'Dev Masterclass',
    uploaded: '2 weeks ago',
  },
  {
    id: 'vid-08',
    title: 'Ocean Bioluminescence in Deep Waters: Night Dive',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    duration: '08:45',
    rating: '98%',
    views: '3.7M',
    category: 'Nature',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7hP2jV19XUo?autoplay=1',
    author: 'Abyss Chronicles',
    uploaded: '6 days ago',
  },
  {
    id: 'vid-09',
    title: 'Sintel - The Dragon Flight Open Animation Project',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    duration: '15:22',
    rating: '97%',
    views: '11.8M',
    category: 'Animation',
    embedUrl: 'https://www.youtube-nocookie.com/embed/eRsGyueVLvQ?autoplay=1',
    author: 'Durian Open Film',
    uploaded: '3 weeks ago',
  },
  {
    id: 'vid-10',
    title: 'Formula Racing High Speed On-Board Telemetry Lap',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    duration: '06:12',
    rating: '91%',
    views: '950K',
    category: 'Sports',
    embedUrl: 'https://www.youtube-nocookie.com/embed/wb49-oV0F78?autoplay=1',
    author: 'Apex Velocity',
    uploaded: '1 day ago',
  },
  {
    id: 'vid-11',
    title: 'Lo-Fi Sunset Hip Hop Beats for Coding and Relaxation',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    duration: '45:00',
    rating: '99%',
    views: '6.2M',
    category: 'Music',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1',
    author: 'ChillHop Station',
    uploaded: '2 days ago',
  },
  {
    id: 'vid-12',
    title: 'Building High-Performance Computing Clusters in 2026',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    duration: '24:18',
    rating: '96%',
    views: '670K',
    category: 'Tech',
    embedUrl: 'https://www.youtube-nocookie.com/embed/sB2iQI_98aY?autoplay=1',
    author: 'Compute Engine Lab',
    uploaded: '1 week ago',
  }
];

export default function VideoPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [apiSourceInfo, setApiSourceInfo] = useState('/api/videos');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    // Determine effective API URL
    const targetBase = customApiUrl.trim() || (BASE_API_URL !== 'API_ENDPOINT_PLACEHOLDER' ? BASE_API_URL : '/api/videos');
    const queryParams = new URLSearchParams();
    if (activeSearch.trim()) queryParams.set('q', activeSearch.trim());
    if (selectedCategory && selectedCategory !== 'All') queryParams.set('category', selectedCategory);
    queryParams.set('page', currentPage.toString());
    queryParams.set('limit', pageSize.toString());

    const url = `${targetBase}${targetBase.includes('?') ? '&' : '?'}${queryParams.toString()}`;

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (ignore) return;
        const videoList: VideoItem[] = Array.isArray(data) ? data : (data.videos || data.data || data.results || []);
        const totalCount = data.total ?? data.count ?? videoList.length;
        const pagesCount = data.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

        setVideos(videoList);
        setTotalVideos(totalCount);
        setTotalPages(pagesCount);
        setApiSourceInfo(targetBase);
        setIsLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        console.warn('API fetch fell back to internal catalog:', err);
        // Fallback filtering
        let filtered = [...FALLBACK_VIDEOS];
        if (selectedCategory !== 'All') {
          filtered = filtered.filter(v => v.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (activeSearch.trim()) {
          const q = activeSearch.trim().toLowerCase();
          filtered = filtered.filter(v => 
            v.title.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.author.toLowerCase().includes(q)
          );
        }
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        const start = (currentPage - 1) * pageSize;
        setVideos(filtered.slice(start, start + pageSize));
        setTotalVideos(total);
        setTotalPages(pages);
        setApiSourceInfo('Internal Video Catalog (Fallback)');
        setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeSearch, selectedCategory, currentPage, pageSize, customApiUrl, refreshTrigger]);

  const triggerRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeVideo) {
        setActiveVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-200 flex flex-col font-sans selection:bg-red-700 selection:text-white">
      {/* Top Header Bar: Dark Crimson Red */}
      <header id="app-header" className="bg-red-800 text-white shadow-md border-b border-red-900/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <button 
              onClick={() => { clearSearch(); setSelectedCategory('All'); }}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center border border-red-500/40 shadow-inner group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 text-red-500 fill-red-500 ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1 leading-none">
                  VIDEO<span className="bg-zinc-950 text-red-500 px-1.5 py-0.5 rounded text-xs font-black tracking-wider uppercase ml-0.5 border border-red-900/80">PORTAL</span>
                </span>
                <span className="text-[10px] text-red-200/80 tracking-wider uppercase font-medium">Ultra High Definition Stream</span>
              </div>
            </button>

            {/* Mobile Category Quick Toggle */}
            <div className="sm:hidden flex items-center gap-1.5 text-xs">
              <span className="bg-black/30 px-2 py-1 rounded text-red-100 font-mono text-[11px]">
                {totalVideos} vids
              </span>
            </div>
          </div>

          {/* Centered Search Input Bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="w-full sm:max-w-md lg:max-w-lg flex items-center shadow-inner rounded-sm overflow-hidden border border-red-900/80 bg-zinc-950"
            id="video-search-form"
          >
            <div className="relative flex-1 flex items-center">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, tags, creators..."
                className="w-full bg-zinc-950 text-white placeholder-zinc-500 px-3.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              id="search-submit-btn"
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-l border-red-800 focus:outline-none"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Endpoint Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-red-200/90 font-mono bg-red-950/50 px-2.5 py-1 rounded border border-red-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate max-w-[140px]" title={apiSourceInfo}>
              API: {apiSourceInfo === '/api/videos' ? 'Local JSON' : apiSourceInfo}
            </span>
          </div>
        </div>

        {/* Quick Category Navigation Bar */}
        <nav className="bg-red-900/90 border-t border-red-950/70 px-3 sm:px-4 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-1.5">
            <span className="text-red-300 font-semibold text-[11px] uppercase tracking-wider mr-1 hidden sm:inline">
              Channels:
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  id={`cat-btn-${cat.toLowerCase()}`}
                  className={`px-3 py-1 rounded-sm font-medium whitespace-nowrap transition-all cursor-pointer text-xs ${
                    isActive
                      ? 'bg-zinc-950 text-white border border-red-500 shadow-sm font-bold'
                      : 'text-red-100 hover:bg-red-800/80 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-4 flex-1 flex flex-col">
        {/* Results Info & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-zinc-800/80 px-3 py-2 rounded-sm border border-zinc-700/60 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="font-semibold text-white">
              {activeSearch ? (
                <>Search results for <span className="text-red-400 font-bold">&quot;{activeSearch}&quot;</span></>
              ) : (
                <span className="capitalize">{selectedCategory} Videos</span>
              )}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400 font-mono">
              {totalVideos} total item{totalVideos === 1 ? '' : 's'} (Page {currentPage} of {totalPages})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSearch && (
              <button
                onClick={clearSearch}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 underline cursor-pointer text-xs"
              >
                Reset Search
              </button>
            )}
            <button
              onClick={triggerRefresh}
              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs cursor-pointer"
              title="Refresh video list"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Video Grid or Fallback State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-zinc-800 rounded-sm overflow-hidden animate-pulse border border-zinc-800">
                <div className="aspect-video bg-zinc-700/60 w-full"></div>
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-zinc-700 rounded w-5/6"></div>
                  <div className="h-3 bg-zinc-700/80 rounded w-3/4"></div>
                  <div className="h-2 bg-zinc-700/50 rounded w-1/2 pt-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* Fallback No Videos Found */
          <div id="no-videos-fallback" className="my-12 flex flex-col items-center justify-center p-8 bg-zinc-800/50 rounded-sm border border-zinc-700/80 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-red-600/40 flex items-center justify-center mb-3 text-red-500">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No videos found</h3>
            <p className="text-xs text-zinc-400 mb-4">
              We couldn&apos;t find any video matching your search term <span className="text-red-400">&quot;{activeSearch}&quot;</span> in category &quot;{selectedCategory}&quot;.
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearSearch}
                className="bg-red-700 hover:bg-red-600 text-white text-xs px-4 py-2 rounded font-semibold transition-colors cursor-pointer"
              >
                Clear Search &amp; View All
              </button>
            </div>
          </div>
        ) : (
          /* Dense Responsive Video Grid */
          <div id="video-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {videos.map((video) => (
              <div
                key={video.id}
                id={`video-card-${video.id}`}
                onClick={() => setActiveVideo(video)}
                className="group bg-zinc-800 rounded-sm overflow-hidden border border-transparent hover:border-red-600 transition-all duration-150 cursor-pointer flex flex-col shadow-sm hover:shadow-md"
              >
                {/* 16:9 Thumbnail Container */}
                <div className="aspect-video relative overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Subtle Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration label badge on bottom right */}
                  <span className="absolute bottom-1 right-1 bg-black/80 text-amber-300 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-sm tracking-tight border border-black/40">
                    {video.duration}
                  </span>

                  {/* Category Pill on top left */}
                  <span className="absolute top-1 left-1 bg-zinc-900/80 text-zinc-300 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm backdrop-blur-xs font-semibold">
                    {video.category}
                  </span>
                </div>

                {/* Card Meta Content */}
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Compact Title */}
                    <h4 
                      className="text-xs font-semibold text-gray-200 line-clamp-2 hover:text-red-400 transition-colors leading-snug" 
                      title={video.title}
                    >
                      {video.title}
                    </h4>
                  </div>

                  {/* Secondary Meta Text: Rating, Length, Author */}
                  <div className="mt-2 pt-1 border-t border-zinc-750 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold" title="Viewer Rating">
                      <Star className="w-2.5 h-2.5 fill-emerald-400" />
                      <span>{video.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-zinc-400" title="Views">
                      <Eye className="w-2.5 h-2.5" />
                      <span>{video.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800 text-xs">
            <span className="text-zinc-400 font-mono">
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalVideos)} of {totalVideos} videos
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                id="pagination-prev-btn"
                className="px-3 py-1.5 rounded-sm bg-zinc-800 text-zinc-300 hover:bg-red-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-1 border border-zinc-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-7 rounded-sm text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-red-700 text-white border border-red-500'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                id="pagination-next-btn"
                className="px-3 py-1.5 rounded-sm bg-zinc-800 text-zinc-300 hover:bg-red-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-1 border border-zinc-700"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Embedded Video Player Modal */}
      {activeVideo && (
        <div 
          id="video-player-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 transition-opacity duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-750 w-full max-w-4xl rounded shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-zinc-950 px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <span className="bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  {activeVideo.category}
                </span>
                <h3 className="text-sm font-semibold text-white truncate" title={activeVideo.title}>
                  {activeVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setActiveVideo(null)}
                id="modal-close-btn"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 16:9 Responsive Embedded Video Container */}
            <div className="aspect-video w-full bg-black relative">
              <iframe
                id="video-embed-iframe"
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Footer / Video Info */}
            <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                  {activeVideo.title}
                </h4>
                <div className="flex items-center gap-3 text-zinc-400 mt-1">
                  <span>Channel: <strong className="text-zinc-200">{activeVideo.author}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-amber-300 font-mono">{activeVideo.duration}</strong></span>
                  <span>•</span>
                  <span>Rating: <strong className="text-emerald-400">{activeVideo.rating}</strong></span>
                  <span>•</span>
                  <span>Views: <strong className="text-zinc-200">{activeVideo.views}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={activeVideo.embedUrl.replace('?autoplay=1', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 text-xs font-semibold transition-colors border border-zinc-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Direct Link</span>
                </a>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="px-3.5 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-4 px-3 sm:px-4 text-center text-zinc-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            <span className="font-bold text-red-500">VIDEO PORTAL</span> — Classic Red/Dark Theme Video Engine
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>Vanilla JS / HTML5 / Tailwind CSS</span>
            <span>•</span>
            <span className="text-red-400 font-medium">16:9 Modal Player</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
