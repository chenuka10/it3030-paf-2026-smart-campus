// Resources.jsx - Fixed with correct available slots calculation
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const STATUS_STYLES = {
  ACTIVE: { bg: 'bg-ui-green/20', text: 'text-ui-green', border: 'border-ui-green/30', label: 'Active' },
  OUT_OF_SERVICE: { bg: 'bg-ui-danger/20', text: 'text-ui-danger', border: 'border-ui-danger/30', label: 'Out of Service' },
};

// ============================================================
// HELPER FUNCTION: Calculate available slots for a resource TODAY
// ============================================================
const calculateAvailableSlots = (resource, bookings = [], now = new Date()) => {
  if (resource.status !== 'ACTIVE') return 0;
  
  // Get resource operating hours
  const openHour = parseInt(resource.availableFrom?.split(':')[0] || 8);
  const openMinute = parseInt(resource.availableFrom?.split(':')[1] || 0);
  const closeHour = parseInt(resource.availableTo?.split(':')[0] || 18);
  const closeMinute = parseInt(resource.availableTo?.split(':')[1] || 0);
  const maxHours = resource.maxBookingHours || 2;
  
  // Convert to minutes for easier calculation
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  const slotDurationMinutes = maxHours * 60;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Generate all possible remaining time slots for today
  const possibleSlots = [];
  let currentStart = openMinutes;
  
  while (currentStart + slotDurationMinutes <= closeMinutes) {
    const startHour = Math.floor(currentStart / 60);
    const startMinute = currentStart % 60;
    const endTime = currentStart + slotDurationMinutes;
    const endHour = Math.floor(endTime / 60);
    const endMinute = endTime % 60;
    
    if (currentStart >= currentMinutes) {
      possibleSlots.push({
        start: currentStart,
        end: currentStart + slotDurationMinutes,
        startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        isAvailable: true
      });
    }
    
    currentStart += slotDurationMinutes;
  }
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Get all bookings for this resource today
  const todayBookings = bookings.filter(booking => {
    if (booking.resourceId !== resource.id) return false;
    const bookingDate = booking.startTime?.split('T')[0];
    return bookingDate === today;
  });
  
  // Convert bookings to minutes
  const bookedSlots = todayBookings.map(booking => {
    const startTimeStr = booking.startTime?.split('T')[1]?.slice(0, 5);
    const endTimeStr = booking.endTime?.split('T')[1]?.slice(0, 5);
    
    if (!startTimeStr || !endTimeStr) return null;
    
    const startHour = parseInt(startTimeStr.split(':')[0]);
    const startMinute = parseInt(startTimeStr.split(':')[1]);
    const endHour = parseInt(endTimeStr.split(':')[0]);
    const endMinute = parseInt(endTimeStr.split(':')[1]);
    
    return {
      start: startHour * 60 + startMinute,
      end: endHour * 60 + endMinute
    };
  }).filter(slot => slot !== null);
  
  // Mark slots as unavailable if they overlap with any booking
  possibleSlots.forEach(slot => {
    for (const bookedSlot of bookedSlots) {
      // Check if slot overlaps with booking
      const overlaps = (slot.start < bookedSlot.end && slot.end > bookedSlot.start);
      if (overlaps) {
        slot.isAvailable = false;
        break;
      }
    }
  });
  
  // Count available slots
  const availableSlots = possibleSlots.filter(slot => slot.isAvailable).length;
  
  return availableSlots;
};

// ============================================================
// FAVORITE BUTTON
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
        setFavorite(false);
      } else {
        await api.post(`/api/users/favorites/${resourceId}`);
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
          ? 'bg-ui-warn/20 text-ui-warn' 
          : 'bg-ui-sky/10 text-ui-dim hover:text-ui-warn'
      }`}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? '⏳' : (favorite ? '⭐' : '☆')}
    </button>
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
  const [allBookings, setAllBookings] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAllData();
    fetchFavorites();
  }, [user, navigate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const getCurrentBookingsByResource = (bookings, now = new Date()) => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toISOString().split('T')[0];

    return bookings.reduce((acc, booking) => {
      const bookingDate = booking.startTime?.split('T')[0];
      const startTimeStr = booking.startTime?.split('T')[1]?.slice(0, 5);
      const endTimeStr = booking.endTime?.split('T')[1]?.slice(0, 5);

      if (!startTimeStr || !endTimeStr || bookingDate !== today) {
        return acc;
      }

      const startHour = parseInt(startTimeStr.split(':')[0]);
      const startMinute = parseInt(startTimeStr.split(':')[1]);
      const endHour = parseInt(endTimeStr.split(':')[0]);
      const endMinute = parseInt(endTimeStr.split(':')[1]);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      if (currentTime >= start && currentTime < end) {
        if (!acc[booking.resourceId]) {
          acc[booking.resourceId] = [];
        }
        acc[booking.resourceId].push(booking);
      }

      return acc;
    }, {});
  };

  const buildCategories = (resourcesData, bookingsData, now = new Date()) => {
    const typeMap = new Map();

    resourcesData.forEach(resource => {
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

    for (const [type, cat] of typeMap) {
      const catResources = resourcesData.filter(r => r.type === type);
      cat.stats.total = catResources.length;

      let totalAvailableSlots = 0;
      let totalInUse = 0;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const resource of catResources) {
        totalAvailableSlots += calculateAvailableSlots(resource, bookingsData, now);

        const isCurrentlyBooked = bookingsData.some(booking => {
          if (booking.resourceId !== resource.id) return false;
          const startTimeStr = booking.startTime?.split('T')[1]?.slice(0, 5);
          const endTimeStr = booking.endTime?.split('T')[1]?.slice(0, 5);

          if (!startTimeStr || !endTimeStr) return false;

          const startHour = parseInt(startTimeStr.split(':')[0]);
          const startMinute = parseInt(startTimeStr.split(':')[1]);
          const endHour = parseInt(endTimeStr.split(':')[0]);
          const endMinute = parseInt(endTimeStr.split(':')[1]);

          const start = startHour * 60 + startMinute;
          const end = endHour * 60 + endMinute;

          return currentMinutes >= start && currentMinutes < end;
        });

        if (isCurrentlyBooked) {
          totalInUse++;
        }
      }

      cat.stats.availableSlots = totalAvailableSlots;
      cat.stats.inUse = totalInUse;
    }

    return Array.from(typeMap.values());
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch resources
      const resourcesRes = await api.get("/api/resources");
      const resourcesData = resourcesRes.data;
      setResources(resourcesData);
      
      // Fetch all bookings for today
      const today = new Date().toISOString().split('T')[0];
      let bookingsData = [];
      try {
        const bookingsRes = await api.get("/api/bookings", {
          params: { startDate: today, endDate: today }
        });
        bookingsData = bookingsRes.data || [];
        setAllBookings(bookingsData);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setAllBookings([]);
      }
      
      setCategories(buildCategories(resourcesData, bookingsData, currentTime));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load resources. Please try again later.');
    } finally {
      setLoading(false);
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
    } catch (err) {
      console.error('API fetch favorites failed:', err);
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(localFavorites);
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
      'LECTURE_HALL': 'from-ui-sky/20 to-ui-sky/10',
      'LECTURE_ROOM': 'from-ui-sky/20 to-ui-sky/10',
      'LAB': 'from-ui-sky/20 to-ui-sky/10',
      'MEETING_ROOM': 'from-ui-green/20 to-ui-green/10',
      'EQUIPMENT': 'from-ui-warn/20 to-ui-warn/10',
      'OUTDOOR': 'from-ui-green/20 to-ui-green/10',
    };
    return colorMap[type] || 'from-ui-sky/10 to-ui-sky/5';
  };

  const getBorderColorForType = (type) => {
    const borderMap = {
      'LECTURE_HALL': '#6F8F72',
      'LECTURE_ROOM': '#6F8F72',
      'LAB': '#6F8F72',
      'MEETING_ROOM': '#6F8F72',
      'EQUIPMENT': '#F2A65A',
      'OUTDOOR': '#6F8F72',
    };
    return borderMap[type] || '#6F8F72';
  };

  const getImageForType = (type) => {
    const imageMap = {
      'LECTURE_HALL': '/images/lecture-hall.jpg',
      'LECTURE_ROOM': '/images/lecture-hall.jpg',
      'LAB': '/images/lab.jpg',
      'MEETING_ROOM': '/images/meeting-room.jpg',
      'EQUIPMENT': '/images/lab.jpg',
      'OUTDOOR': '/images/outdoor.jpg',
    };
    return imageMap[type] || '/images/default.jpg';
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

  useEffect(() => {
    if (resources.length === 0) {
      setCategories([]);
      return;
    }

    setCategories(buildCategories(resources, allBookings, currentTime));
  }, [resources, allBookings, currentTime]);

  useEffect(() => {
    if (!selectedCategory) return;

    const updatedCategory = categories.find(category => category.id === selectedCategory.id);
    if (updatedCategory) {
      setSelectedCategory(updatedCategory);
    }
  }, [categories, selectedCategory]);

  const currentBookings = getCurrentBookingsByResource(allBookings, currentTime);

  const CategoryCard = ({ category, onClick }) => (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-medium border"
      style={{
        background: `linear-gradient(135deg, rgba(232,226,216,0.9) 0%, rgba(245,242,236,0.95) 100%)`,
        borderColor: category.borderColor + '30'
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
            <div className="text-2xl font-bold text-ui-surface">{category.stats.total}</div>
            <div className="text-xs text-ui-dim">Resources</div>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-ui-surface mb-2">{category.title}</h3>
        <p className="text-ui-bright text-sm mb-4 line-clamp-2">{category.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-ui-green/20 rounded-lg text-xs text-ui-green">
              📅 {category.stats.availableSlots} Remaining Today
            </span>
            <span className="px-2 py-1 bg-ui-warn/20 rounded-lg text-xs text-ui-warn">
              👥 {category.stats.inUse} In Use
            </span>
          </div>
          
          <button 
            className="px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-medium text-ui-base"
            style={{
              background: `linear-gradient(135deg, ${category.borderColor} 0%, ${category.borderColor}dd 100%)`
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
    const isInUse = Boolean(currentBookings[resource.id]?.length);
    const availableSlots = calculateAvailableSlots(resource, allBookings, currentTime);
    const statusStyle = STATUS_STYLES[resource.status] || STATUS_STYLES.ACTIVE;
    
    return (
      <div 
        className="group bg-ui-base rounded-xl border border-ui-sky/20 hover:border-ui-sky/40 transition-all duration-300 overflow-hidden shadow-soft"
      >
        <div className="relative h-40 bg-gradient-to-br from-ui-sky/10 to-ui-base overflow-hidden">
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
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            {isInUse && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-ui-warn/20 text-ui-warn">
                Currently In Use
              </span>
            )}
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-ui-surface">{resource.name}</h3>
            <span className="text-xs text-ui-sky font-mono">{resource.type?.replace(/_/g, ' ')}</span>
          </div>
          
          <p className="text-ui-dim text-sm mb-4 line-clamp-2">
            {resource.description || 'No description available'}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-ui-dim">
              <span>📍</span>
              <span>{resource.location || 'Location not specified'}</span>
            </div>
            {resource.capacity && (
              <div className="flex items-center gap-2 text-sm text-ui-dim">
                <span>👥</span>
                <span>Capacity: {resource.capacity} people</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-ui-dim">
              <span>⏰</span>
              <span>{resource.availableFrom || '08:00'} - {resource.availableTo || '18:00'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <span>📅</span>
              <span>{availableSlots} slots remaining today</span>
            </div>
          </div>
          
          <button
            onClick={() => onViewDetails(resource)}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-300 bg-ui-sky/10 hover:bg-ui-sky/20 text-ui-sky border border-ui-sky/20"
          >
            View Details →
          </button>
        </div>
      </div>
    );
  };

  const ResourceDetailModal = ({ resource, onClose }) => {
    const statusStyle = STATUS_STYLES[resource.status] || STATUS_STYLES.ACTIVE;
    return (
      <div className="fixed inset-0 bg-ui-surface/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="relative max-w-4xl w-full bg-ui-base rounded-2xl border border-ui-sky/20 max-h-[90vh] overflow-y-auto shadow-medium" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-ui-base border-b border-ui-sky/20 p-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getIconForType(resource.type)}</span>
                <h2 className="text-2xl font-bold text-ui-surface">{resource.name}</h2>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
                <span className="px-2 py-1 bg-ui-sky/10 rounded-lg text-xs text-ui-sky">
                  {resource.type?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-ui-dim hover:text-ui-surface text-2xl">✕</button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ui-surface mb-2">Description</h3>
              <p className="text-ui-bright">{resource.description || 'No description provided.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-ui-sky/10 rounded-lg p-4 border border-ui-sky/20">
                <div className="text-ui-dim text-sm mb-1">📍 Location</div>
                <div className="text-ui-surface">{resource.location || 'Not specified'}</div>
              </div>
              {resource.capacity && (
                <div className="bg-ui-sky/10 rounded-lg p-4 border border-ui-sky/20">
                  <div className="text-ui-dim text-sm mb-1">👥 Capacity</div>
                  <div className="text-ui-surface">{resource.capacity} people</div>
                </div>
              )}
              <div className="bg-ui-sky/10 rounded-lg p-4 border border-ui-sky/20">
                <div className="text-ui-dim text-sm mb-1">⏰ Available Hours</div>
                <div className="text-ui-surface">{resource.availableFrom || '08:00'} - {resource.availableTo || '18:00'}</div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-ui-sky/20">
              <button 
                className="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-ui-sky to-ui-green text-ui-base shadow-soft hover:shadow-medium transition-all"
                onClick={() => {
                  alert(`Booking for ${resource.name} - Coming soon!`);
                  onClose();
                }}
              >
                Book This Resource →
              </button>
              <button onClick={onClose} className="px-6 py-3 rounded-lg border border-ui-sky/20 text-ui-bright hover:bg-ui-sky/10">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-ui-base flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-ui-sky/20 border-t-ui-sky rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-ui-dim">Loading resources...</p>
          </div>
        </div>
      </>
    );
  }

  if (!selectedCategory) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-ui-base">
          <div className="bg-gradient-to-br from-ui-sky/10 to-ui-base py-16 px-4 border-b border-ui-sky/20">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-ui-warn/10 text-ui-warn text-xs font-mono mb-4">
                SMART CAMPUS HUB
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-ui-surface mb-4">
                Campus Resources
              </h1>
              <p className="text-ui-dim text-lg max-w-2xl mx-auto">
                Browse and book facilities across campus
              </p>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-12">
            {error ? (
              <div className="text-center py-16">
                <div className="text-ui-danger mb-4">⚠️ {error}</div>
                <button onClick={fetchAllData} className="px-4 py-2 bg-ui-sky/10 text-ui-sky rounded-lg hover:bg-ui-sky/20">Retry</button>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-ui-surface mb-2">No resource types found</h3>
                <p className="text-ui-dim">Add resources to see categories</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <div 
                    key={category.id}
                    className="animate-fade-in-up"
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
      </>
    );
  }

  const categoryResources = filteredResources();
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-ui-base">
        <div className="bg-gradient-to-br from-ui-sky/10 to-ui-base py-8 px-4 border-b border-ui-sky/20">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-ui-dim hover:text-ui-surface mb-4 transition-colors"
            >
              ← Back to Categories
            </button>
            
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedCategory.icon}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-ui-surface">
                  {selectedCategory.title}
                </h1>
                <p className="text-ui-dim mt-1">{selectedCategory.description}</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <div className="px-3 py-1 rounded-lg bg-ui-sky/10 text-ui-sky text-sm">
                Total: {selectedCategory.stats.total}
              </div>
              <div className="px-3 py-1 rounded-lg bg-ui-green/10 text-ui-green text-sm">
                📅 {selectedCategory.stats.availableSlots} Remaining Slots Today
              </div>
              <div className="px-3 py-1 rounded-lg bg-ui-warn/10 text-ui-warn text-sm">
                👥 {selectedCategory.stats.inUse} Currently In Use
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky top-16 bg-ui-base/95 backdrop-blur-sm border-b border-ui-sky/20 z-20 py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-ui-base border border-ui-sky/20 rounded-lg text-ui-bright placeholder-ui-dim focus:outline-none focus:border-ui-sky"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-ui-base border border-ui-sky/20 rounded-lg text-ui-bright cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
              
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  showFavoritesOnly 
                    ? 'bg-ui-warn/20 text-ui-warn border border-ui-warn/30' 
                    : 'bg-ui-base text-ui-dim border border-ui-sky/20'
                }`}
              >
                ⭐ Favorites {favorites.length > 0 && `(${favorites.length})`}
              </button>
              
              <div className="flex gap-1 bg-ui-base rounded-lg p-1 border border-ui-sky/20">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "grid" ? "bg-ui-sky text-ui-base" : "text-ui-dim"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "list" ? "bg-ui-sky text-ui-base" : "text-ui-dim"
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
                  className="px-4 py-2 bg-ui-danger/10 text-ui-danger rounded-lg hover:bg-ui-danger/20"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-ui-dim text-sm">
            Found {categoryResources.length} resource{categoryResources.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {categoryResources.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <h3 className="text-xl font-semibold text-ui-surface mb-2">No resources found</h3>
              <p className="text-ui-dim">
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
                  className="animate-fade-in-up"
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
                const isInUse = Boolean(currentBookings[resource.id]?.length);
                const statusStyle = STATUS_STYLES[resource.status] || STATUS_STYLES.ACTIVE;
                return (
                  <div 
                    key={resource.id}
                    className="bg-ui-base rounded-xl border border-ui-sky/20 p-4 flex flex-wrap items-center justify-between gap-4 hover:border-ui-sky/40 transition-all shadow-soft"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{getIconForType(resource.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-ui-surface">{resource.name}</h3>
                        <p className="text-ui-dim text-sm">{resource.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                        {isInUse && (
                          <span className="px-2 py-1 rounded text-xs bg-ui-warn/20 text-ui-warn">
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
                      className="px-4 py-2 bg-ui-sky/10 text-ui-sky rounded-lg hover:bg-ui-sky/20"
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