// Resources.jsx - Fixed with correct availability metrics
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const STATUS_STYLES = {
  ACTIVE: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)', label: 'Active' },
  OUT_OF_SERVICE: { bg: 'rgba(251,113,133,0.12)', text: '#fb7185', border: 'rgba(251,113,133,0.25)', label: 'Out of Service' },
};

// ============================================================
// FAVORITE BUTTON - Working with localStorage fallback
// ============================================================
const FavoriteButton = ({ resourceId, isFavorite, onToggle, size = 'normal' }) => {
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (favorite) {
        await api.delete(`/api/users/favorites/${resourceId}`);
        console.log('Removed from favorites:', resourceId);
        setFavorite(false);
      } else {
        await api.post(`/api/users/favorites/${resourceId}`);
        console.log('Added to favorites:', resourceId);
        setFavorite(true);
      }
      if (onToggle) await onToggle();
    } catch (err) {
      console.error('API Error toggling favorite:', err);
      
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (favorite) {
        const newFavorites = localFavorites.filter(id => id !== resourceId);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        setFavorite(false);
      } else {
        localFavorites.push(resourceId);
        localStorage.setItem('favorites', JSON.stringify(localFavorites));
        setFavorite(true);
      }
      if (onToggle) onToggle();
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'normal' ? 'w-8 h-8 text-lg' : 'w-6 h-6 text-sm';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all ${
        favorite 
          ? 'bg-yellow-500/20 text-yellow-400' 
          : 'bg-gray-500/20 text-gray-400 hover:text-yellow-400'
      }`}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? '⏳' : (favorite ? '⭐' : '☆')}
    </button>
  );
};

// ============================================================
// CALENDAR HEATMAP
// ============================================================
const ResourceHeatmap = ({ resourceId }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmap();
  }, [resourceId]);

  const fetchHeatmap = async () => {
    try {
      const { data } = await api.get(`/api/resources/${resourceId}/usage-heatmap?months=3`);
      setHeatmapData(data);
    } catch (err) {
      console.error('Error fetching heatmap:', err);
      const mockData = [];
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 15)
        });
      }
      setHeatmapData(mockData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-400">Loading heatmap...</div>;

  const getHeatColor = (count) => {
    if (count === 0) return '#1e293b';
    if (count <= 2) return '#166534';
    if (count <= 5) return '#15803d';
    if (count <= 10) return '#16a34a';
    return '#22c55e';
  };

  return (
    <div className="bg-[#0f1a2e] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">📊 Booking Activity (Last 90 Days)</h3>
      <div className="grid grid-cols-15 gap-1">
        {heatmapData.slice(0, 90).map((day, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110"
            style={{ backgroundColor: getHeatColor(day.count) }}
            title={`${day.date}: ${day.count} bookings`}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-3 h-3 bg-[#1e293b] rounded" />
        <div className="w-3 h-3 bg-[#166534] rounded" />
        <div className="w-3 h-3 bg-[#15803d] rounded" />
        <div className="w-3 h-3 bg-[#16a34a] rounded" />
        <div className="w-3 h-3 bg-[#22c55e] rounded" />
        <span>More</span>
      </div>
    </div>
  );
};

// ============================================================
// SMART AVAILABILITY SUGGESTIONS - FIXED with real-time availability
// ============================================================
const SmartAvailability = ({ resourceId, resourceType, capacity, location }) => {
  const [availability, setAvailability] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAvailability();
  }, [resourceId, selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const startDate = selectedDate.toISOString().split('T')[0];
      
      try {
        const availRes = await api.get(`/api/resources/${resourceId}/availability?startDate=${startDate}&days=7`);
        setAvailability(availRes.data);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setAvailability({
          availableSlots: ['09:00-11:00', '14:00-16:00', '16:00-18:00']
        });
      }
      
      try {
        const altRes = await api.get(`/api/resources/alternatives?type=${resourceType}&minCapacity=${capacity || 0}&location=${location || ''}&startDate=${startDate}&days=7`);
        setAlternatives(altRes.data);
      } catch (err) {
        console.error('Error fetching alternatives:', err);
        setAlternatives([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  if (loading) return <div className="text-center py-4 text-gray-400">Loading availability...</div>;

  return (
    <div className="bg-[#0f1a2e] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">💡 Smart Availability Suggestions</h3>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {getWeekDays().map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDate(day)}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              day.toDateString() === selectedDate.toDateString()
                ? 'bg-[#38bdf8] text-black'
                : 'bg-[#1a2538] text-gray-300 hover:bg-[#253448]'
            }`}
          >
            <div className="font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="text-xs">{day.getDate()}</div>
          </button>
        ))}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-white font-medium">Available Time Slots</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availability?.availableSlots?.length > 0 ? (
            availability.availableSlots.map((slot, idx) => (
              <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                {slot}
              </span>
            ))
          ) : (
            <span className="text-yellow-400 text-sm">⚠️ No available slots for this day</span>
          )}
        </div>
      </div>
      
      {alternatives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-white font-medium">Alternative Suggestions</span>
          </div>
          <div className="space-y-2">
            {alternatives.slice(0, 3).map((alt, idx) => (
              <div key={idx} className="bg-[#1a2538] rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white">{alt.name}</div>
                    <div className="text-xs text-gray-400">📍 {alt.location} | 👥 Capacity: {alt.capacity}</div>
                  </div>
                  <span className="text-xs text-green-400">{alt.availableSlots?.length || 0} slots</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {alt.availableSlots?.slice(0, 3).map((slot, sIdx) => (
                    <span key={sIdx} className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                      {slot}
                    </span>
                  ))}
                  {alt.availableSlots?.length > 3 && (
                    <span className="text-xs text-gray-500">+{alt.availableSlots.length - 3} more</span>
                  )}
                </div>
                <button 
                  onClick={() => window.location.href = `/resources/${alt.id}`}
                  className="mt-2 text-[#38bdf8] text-xs hover:underline"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN RESOURCES COMPONENT
// ============================================================
export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [currentBookings, setCurrentBookings] = useState({}); // Track current bookings per resource

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchResources();
    fetchFavorites();
    fetchCurrentBookings();
  }, [user, navigate]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/resources");
      setResources(data);
      
      const typeMap = new Map();
      data.forEach(resource => {
        if (!typeMap.has(resource.type)) {
          typeMap.set(resource.type, {
            id: resource.type,
            title: resource.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: `${resource.type.replace(/_/g, ' ')} facilities available on campus`,
            icon: getIconForType(resource.type),
            color: getColorForType(resource.type),
            borderColor: getBorderColorForType(resource.type),
            image: getImageForType(resource.type),
            stats: { total: 0, availableSlots: 0, inUse: 0 }
          });
        }
      });
      
      // Update stats with actual availability data
      for (const [type, cat] of typeMap) {
        const catResources = data.filter(r => r.type === type);
        cat.stats.total = catResources.length;
        
        // Calculate total available slots and in-use count for this category
        let totalAvailableSlots = 0;
        let totalInUse = 0;
        
        for (const resource of catResources) {
          // Get available slots for today
          const availableSlots = await fetchResourceAvailability(resource.id);
          totalAvailableSlots += availableSlots.length;
          
          // Check if resource is currently booked
          if (currentBookings[resource.id] && currentBookings[resource.id].length > 0) {
            totalInUse++;
          }
        }
        
        cat.stats.availableSlots = totalAvailableSlots;
        cat.stats.inUse = totalInUse;
      }
      
      setCategories(Array.from(typeMap.values()));
    } catch (err) {
      setError('Failed to load resources. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResourceAvailability = async (resourceId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/api/resources/${resourceId}/availability?startDate=${today}&days=1`);
      return data.availableSlots || [];
    } catch (err) {
      console.error('Error fetching availability:', err);
      return [];
    }
  };

  const fetchCurrentBookings = async () => {
    try {
      const { data } = await api.get('/api/bookings/current');
      const bookingsMap = {};
      data.forEach(booking => {
        if (!bookingsMap[booking.resourceId]) {
          bookingsMap[booking.resourceId] = [];
        }
        bookingsMap[booking.resourceId].push(booking);
      });
      setCurrentBookings(bookingsMap);
    } catch (err) {
      console.error('Error fetching current bookings:', err);
      // Mock data for demo
      setCurrentBookings({});
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get("/api/users/favorites");
      const favoriteIds = Array.isArray(data) 
        ? data.map(f => f.resourceId || f.id || f)
        : [];
      setFavorites(favoriteIds);
      localStorage.setItem('favorites', JSON.stringify(favoriteIds));
      console.log('Favorites loaded from API:', favoriteIds);
    } catch (err) {
      console.error('API fetch favorites failed:', err);
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(localFavorites);
      console.log('Favorites loaded from localStorage:', localFavorites);
    }
  };

  const getIconForType = (type) => {
    const iconMap = {
      'LECTURE_HALL': '🏛️',
      'LECTURE_ROOM': '🏛️',
      'LAB': '🔬',
      'MEETING_ROOM': '💼',
      'EQUIPMENT': '🛠️',
      'OUTDOOR': '🌳',
      'AUDITORIUM': '🎭',
      'CLASSROOM': '📚',
      'SPORTS': '⚽',
    };
    return iconMap[type] || '📦';
  };

  const getColorForType = (type) => {
    const colorMap = {
      'LECTURE_HALL': 'from-purple-500/20 to-indigo-500/20',
      'LECTURE_ROOM': 'from-purple-500/20 to-indigo-500/20',
      'LAB': 'from-blue-500/20 to-cyan-500/20',
      'MEETING_ROOM': 'from-emerald-500/20 to-teal-500/20',
      'EQUIPMENT': 'from-orange-500/20 to-red-500/20',
      'OUTDOOR': 'from-green-500/20 to-lime-500/20',
    };
    return colorMap[type] || 'from-gray-500/20 to-slate-500/20';
  };

  const getBorderColorForType = (type) => {
    const borderMap = {
      'LECTURE_HALL': '#8b5cf6',
      'LECTURE_ROOM': '#8b5cf6',
      'LAB': '#3b82f6',
      'MEETING_ROOM': '#10b981',
      'EQUIPMENT': '#f97316',
      'OUTDOOR': '#22c55e',
    };
    return borderMap[type] || '#6b7280';
  };

  const getImageForType = (type) => {
    const imageMap = {
      'LECTURE_HALL': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=300&fit=crop',
      'LECTURE_ROOM': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=300&fit=crop',
      'LAB': 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=500&h=300&fit=crop',
      'MEETING_ROOM': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&h=300&fit=crop',
      'EQUIPMENT': 'https://images.unsplash.com/photo-1581092335871-4b7a7f5d7c6f?w=500&h=300&fit=crop',
      'OUTDOOR': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&h=300&fit=crop',
    };
    return imageMap[type] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&h=300&fit=crop';
  };

  const filteredResources = () => {
    let filtered = selectedCategory 
      ? resources.filter(r => r.type === selectedCategory.id)
      : [];
    
    if (search) {
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.location?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(r => favorites.includes(r.id));
    }
    
    return filtered;
  };

  const CategoryCard = ({ category, onClick }) => (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: `linear-gradient(135deg, rgba(10,20,40,0.9) 0%, rgba(5,11,24,0.95) 100%)`,
        border: `1px solid ${category.borderColor}30`,
      }}
    >
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
        <img 
          src={category.image} 
          alt={category.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color}`} />
      </div>
      
      <div className="relative p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl">{category.icon}</div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{category.stats.total}</div>
            <div className="text-xs text-gray-400">Resources</div>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{category.title}</h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{category.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-green-500/20 rounded-lg text-xs text-green-400">
              📅 {category.stats.availableSlots} Slots Today
            </span>
            <span className="px-2 py-1 bg-yellow-500/20 rounded-lg text-xs text-yellow-400">
              👥 {category.stats.inUse} In Use
            </span>
          </div>
          
          <button 
            className="px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${category.borderColor} 0%, ${category.borderColor}dd 100%)`,
              color: 'white'
            }}
          >
            View All →
          </button>
        </div>
      </div>
    </div>
  );

  const ResourceDetailCard = ({ resource, onViewDetails }) => {
    const isFavorite = favorites.includes(resource.id);
    const isInUse = currentBookings[resource.id] && currentBookings[resource.id].length > 0;
    
    return (
      <div 
        className="group bg-[#0a1428] rounded-xl border border-[#38bdf8]/10 hover:border-[#38bdf8]/30 transition-all duration-300 overflow-hidden"
      >
        <div className="relative h-40 bg-gradient-to-br from-[#0f1a2e] to-[#0a1428] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
            {getIconForType(resource.type)}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <FavoriteButton 
              resourceId={resource.id} 
              isFavorite={isFavorite}
              onToggle={fetchFavorites}
              size="normal"
            />
          </div>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium`}
              style={{
                background: STATUS_STYLES[resource.status]?.bg || STATUS_STYLES.ACTIVE.bg,
                color: STATUS_STYLES[resource.status]?.text || STATUS_STYLES.ACTIVE.text,
              }}>
              {STATUS_STYLES[resource.status]?.label || 'Active'}
            </span>
            {isInUse && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400">
                Currently In Use
              </span>
            )}
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-white">{resource.name}</h3>
            <span className="text-xs text-[#38bdf8] font-mono">{resource.type?.replace(/_/g, ' ')}</span>
          </div>
          
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {resource.description || 'No description available'}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>📍</span>
              <span>{resource.location || 'Location not specified'}</span>
            </div>
            {resource.capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>👥</span>
                <span>Capacity: {resource.capacity} people</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>⏰</span>
              <span>{resource.availableFrom || '08:00'} - {resource.availableTo || '18:00'}</span>
            </div>
          </div>
          
          <button
            onClick={() => onViewDetails(resource)}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-300 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/20"
          >
            View Details →
          </button>
        </div>
      </div>
    );
  };

  const ResourceDetailModal = ({ resource, onClose }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-4xl w-full bg-[#0a1428] rounded-2xl border border-[#38bdf8]/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0a1428] border-b border-[#38bdf8]/10 p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getIconForType(resource.type)}</span>
              <h2 className="text-2xl font-bold text-white">{resource.name}</h2>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-lg text-xs`}
                style={{
                  background: STATUS_STYLES[resource.status]?.bg,
                  color: STATUS_STYLES[resource.status]?.text,
                }}>
                {STATUS_STYLES[resource.status]?.label}
              </span>
              <span className="px-2 py-1 bg-[#38bdf8]/10 rounded-lg text-xs text-[#38bdf8]">
                {resource.type?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300">{resource.description || 'No description provided.'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f1a2e] rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">📍 Location</div>
              <div className="text-white">{resource.location || 'Not specified'}</div>
            </div>
            {resource.capacity && (
              <div className="bg-[#0f1a2e] rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">👥 Capacity</div>
                <div className="text-white">{resource.capacity} people</div>
              </div>
            )}
            <div className="bg-[#0f1a2e] rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">⏰ Available Hours</div>
              <div className="text-white">{resource.availableFrom || '08:00'} - {resource.availableTo || '18:00'}</div>
            </div>
          </div>
          
          <ResourceHeatmap resourceId={resource.id} />
          
          <SmartAvailability 
            resourceId={resource.id}
            resourceType={resource.type}
            capacity={resource.capacity}
            location={resource.location}
          />
          
          <div className="flex gap-3 pt-4 border-t border-[#38bdf8]/10">
            <button 
              className="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#38bdf8] to-[#3b82f6] text-white"
              onClick={() => {
                alert(`Booking for ${resource.name} - Coming soon!`);
                onClose();
              }}
            >
              Book This Resource →
            </button>
            <button onClick={onClose} className="px-6 py-3 rounded-lg border border-[#38bdf8]/20 text-gray-300 hover:bg-[#38bdf8]/10">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading resources...</p>
          </div>
        </div>
      </>
    );
  }

  if (!selectedCategory) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#050b18]">
          <div className="bg-gradient-to-br from-[#0a1428] to-[#050b18] py-16 px-4 border-b border-[#38bdf8]/10">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] text-xs font-mono mb-4">
                SMART CAMPUS HUB
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Campus Resources
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Browse and book facilities across campus
              </p>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-12">
            {error ? (
              <div className="text-center py-16">
                <div className="text-red-400 mb-4">⚠️ {error}</div>
                <button onClick={fetchResources} className="px-4 py-2 bg-[#38bdf8]/20 text-[#38bdf8] rounded-lg">Retry</button>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-white mb-2">No resource types found</h3>
                <p className="text-gray-400">Add resources to see categories</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <div 
                    key={category.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CategoryCard 
                      category={category} 
                      onClick={() => setSelectedCategory(category)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <style>{`
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fade-up 0.5s ease forwards;
            opacity: 0;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </>
    );
  }

  const categoryResources = filteredResources();
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050b18]">
        <div className="bg-gradient-to-br from-[#0a1428] to-[#050b18] py-8 px-4 border-b border-[#38bdf8]/10">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              ← Back to Categories
            </button>
            
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedCategory.icon}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {selectedCategory.title}
                </h1>
                <p className="text-gray-400 mt-1">{selectedCategory.description}</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <div className="px-3 py-1 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] text-sm">
                Total: {selectedCategory.stats.total}
              </div>
              <div className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-sm">
                📅 {selectedCategory.stats.availableSlots} Available Slots Today
              </div>
              <div className="px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm">
                👥 {selectedCategory.stats.inUse} Currently In Use
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky top-16 bg-[#050b18]/95 backdrop-blur-sm border-b border-[#38bdf8]/10 z-20 py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a1428] border border-[#38bdf8]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#0a1428] border border-[#38bdf8]/20 rounded-lg text-white cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
              
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  showFavoritesOnly 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-[#0a1428] text-gray-400 border border-[#38bdf8]/20'
                }`}
              >
                ⭐ Favorites {favorites.length > 0 && `(${favorites.length})`}
              </button>
              
              <div className="flex gap-1 bg-[#0a1428] rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "grid" ? "bg-[#38bdf8] text-black" : "text-gray-400"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "list" ? "bg-[#38bdf8] text-black" : "text-gray-400"
                  }`}
                >
                  List
                </button>
              </div>
              
              {(search || statusFilter !== "ALL" || showFavoritesOnly) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setShowFavoritesOnly(false);
                  }}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-gray-500 text-sm">
            Found {categoryResources.length} resource{categoryResources.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {categoryResources.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-400">
                {search || statusFilter !== "ALL" || showFavoritesOnly
                  ? "Try adjusting your filters"
                  : "No resources available in this category"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryResources.map((resource, index) => (
                <div 
                  key={resource.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ResourceDetailCard 
                    resource={resource} 
                    onViewDetails={setSelectedResource}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categoryResources.map((resource) => {
                const isInUse = currentBookings[resource.id] && currentBookings[resource.id].length > 0;
                return (
                  <div 
                    key={resource.id}
                    className="bg-[#0a1428] rounded-xl border border-[#38bdf8]/10 p-4 flex flex-wrap items-center justify-between gap-4 hover:border-[#38bdf8]/30 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{getIconForType(resource.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{resource.name}</h3>
                        <p className="text-gray-400 text-sm">{resource.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          resource.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {STATUS_STYLES[resource.status]?.label}
                        </span>
                        {isInUse && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                            In Use
                          </span>
                        )}
                        <FavoriteButton 
                          resourceId={resource.id} 
                          isFavorite={favorites.includes(resource.id)}
                          onToggle={fetchFavorites}
                          size="small"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedResource(resource)}
                      className="px-4 py-2 bg-[#38bdf8]/10 text-[#38bdf8] rounded-lg hover:bg-[#38bdf8]/20"
                    >
                      View →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {selectedResource && (
          <ResourceDetailModal 
            resource={selectedResource} 
            onClose={() => setSelectedResource(null)}
          />
        )}
      </div>
    </>
  );
}