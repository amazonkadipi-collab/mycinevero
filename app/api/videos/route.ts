import { NextRequest, NextResponse } from 'next/server';

export interface VideoItem {
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

const VIDEO_DATABASE: VideoItem[] = [
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
  },
  {
    id: 'vid-13',
    title: 'Aurora Borealis in Arctic Tromsø - Real Time 4K',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop&q=80',
    duration: '11:30',
    rating: '99%',
    views: '4.3M',
    category: 'Nature',
    embedUrl: 'https://www.youtube-nocookie.com/embed/c04u4iQyQvQ?autoplay=1',
    author: 'Polar Lights',
    uploaded: '5 days ago',
  },
  {
    id: 'vid-14',
    title: 'Cosmic Microwave Background and Origins of Space',
    thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=80',
    duration: '19:40',
    rating: '95%',
    views: '1.8M',
    category: 'Science',
    embedUrl: 'https://www.youtube-nocookie.com/embed/41W3tI34-m0?autoplay=1',
    author: 'Quantum Horizon',
    uploaded: '1 week ago',
  },
  {
    id: 'vid-15',
    title: 'Speedrun Champion: Record-Setting Platformer Run',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    duration: '16:04',
    rating: '92%',
    views: '730K',
    category: 'Gaming',
    embedUrl: 'https://www.youtube-nocookie.com/embed/xN1rn86s8vQ?autoplay=1',
    author: 'GamerGuild',
    uploaded: '3 days ago',
  },
  {
    id: 'vid-16',
    title: 'Cosmic Engine: Procedural Universe Simulation Demo',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    duration: '13:50',
    rating: '96%',
    views: '1.1M',
    category: 'Tech',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Wimkqo8gDZ0?autoplay=1',
    author: 'Graphics Matrix',
    uploaded: '4 days ago',
  },
  {
    id: 'vid-17',
    title: 'Kyoto Bamboo Forest Morning Mist Relaxation Walk',
    thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    duration: '28:15',
    rating: '98%',
    views: '2.9M',
    category: 'Nature',
    embedUrl: 'https://www.youtube-nocookie.com/embed/gCOkZvd_0Y4?autoplay=1',
    author: 'Zen Traveler',
    uploaded: '2 weeks ago',
  },
  {
    id: 'vid-18',
    title: 'Electric Supercar Track Test & Aerodynamics Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    duration: '17:42',
    rating: '94%',
    views: '1.4M',
    category: 'Sports',
    embedUrl: 'https://www.youtube-nocookie.com/embed/0S43IwBF0uM?autoplay=1',
    author: 'EV Dynamics',
    uploaded: '6 days ago',
  },
  {
    id: 'vid-19',
    title: 'Synthwave Neon Drive - Retro 80s Cyber Soundtrack',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    duration: '35:20',
    rating: '97%',
    views: '3.1M',
    category: 'Music',
    embedUrl: 'https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1',
    author: 'Outrun Radio',
    uploaded: '1 week ago',
  },
  {
    id: 'vid-20',
    title: 'The Secret Life of Rainforest Canopy Hummingbirds',
    thumbnail: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&auto=format&fit=crop&q=80',
    duration: '07:55',
    rating: '99%',
    views: '5.1M',
    category: 'Nature',
    embedUrl: 'https://www.youtube-nocookie.com/embed/MhX5Q_45L6M?autoplay=1',
    author: 'Wild Biosphere',
    uploaded: '3 days ago',
  },
  {
    id: 'vid-21',
    title: 'Quantum Computing Fundamentals Explained with Visual Models',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    duration: '21:10',
    rating: '98%',
    views: '2.4M',
    category: 'Science',
    embedUrl: 'https://www.youtube-nocookie.com/embed/JhHMJCUmq28?autoplay=1',
    author: 'Veritas Frontiers',
    uploaded: '1 month ago',
  },
  {
    id: 'vid-22',
    title: 'Stylized 3D Character Rigging & Animation Pipeline',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    duration: '27:40',
    rating: '95%',
    views: '820K',
    category: 'Animation',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Xp0hP0a2Z9I?autoplay=1',
    author: 'PolyCraft 3D',
    uploaded: '2 weeks ago',
  },
  {
    id: 'vid-23',
    title: 'Competitive Esports Championship Highlights & Finals',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    duration: '18:50',
    rating: '93%',
    views: '1.9M',
    category: 'Gaming',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7wtfhZwyrcc?autoplay=1',
    author: 'Major Circuit',
    uploaded: '4 days ago',
  },
  {
    id: 'vid-24',
    title: 'Cinematography Masterclass: High Contrast Lighting Rigs',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    duration: '19:15',
    rating: '96%',
    views: '990K',
    category: 'Cinema',
    embedUrl: 'https://www.youtube-nocookie.com/embed/J73kn3i8uWw?autoplay=1',
    author: 'CineLens Lab',
    uploaded: '5 days ago',
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const category = searchParams.get('category')?.trim().toLowerCase() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));

  let filtered = VIDEO_DATABASE;

  if (category && category !== 'all' && category !== 'trending') {
    filtered = filtered.filter(v => v.category.toLowerCase() === category);
  }

  if (q) {
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.author.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedVideos = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    status: 'success',
    total,
    page,
    limit,
    totalPages,
    videos: paginatedVideos,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    }
  });
}
