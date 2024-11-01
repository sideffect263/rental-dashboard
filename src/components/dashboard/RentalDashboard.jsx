import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Grid, 
  Box, 
  Skeleton, 
  Alert,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Camera,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  Phone,
  MapPin,
  Home,
  Calendar
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;
const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₪2,000', value: '0-2000' },
  { label: '₪2,000 - ₪4,000', value: '2000-4000' },
  { label: '₪4,000 - ₪6,000', value: '4000-6000' },
  { label: 'Over ₪6,000', value: '6000+' }
];

const RentalDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const fetchPosts = async () => {
    try {
      setRefreshing(true);
      const postsRef = collection(db, 'rental_posts');
      let q = query(postsRef, orderBy('processed_at', 'desc'), limit(50));
      
      const snapshot = await getDocs(q);
      
      const fetchedPosts = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(post => {
          if (!post.processed_data) return false;
          
          // Filter by price range
          if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-');
            const price = post.processed_data.price;
            if (max === '+') {
              if (price < parseInt(min)) return false;
            } else {
              if (price < parseInt(min) || price > parseInt(max)) return false;
            }
          }

          // Filter by property type
          if (propertyType !== 'all' && post.processed_data.room_or_apartment !== propertyType) {
            return false;
          }

          // Filter by search term
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              post.processed_data.location?.toLowerCase().includes(searchLower) ||
              post.content?.toLowerCase().includes(searchLower)
            );
          }

          return true;
        });
          
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load rental posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [priceRange, propertyType, searchTerm]);

  const handleRefresh = () => {
    fetchPosts();
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const pageCount = Math.ceil(posts.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton height={32} width="60%" />
                  <Skeleton height={24} width="40%" />
                  <Skeleton height={24} width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Recent Rentals</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Price Range</InputLabel>
            <Select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              label="Price Range"
            >
              {PRICE_RANGES.map(range => (
                <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="דירה">Apartment</MenuItem>
              <MenuItem value="חדר">Room</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh listings">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={refreshing ? "animate-spin" : ""} size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {paginatedPosts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setSelectedPost(post)}
            >
              {post.images_links?.[0] ? (
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={post.images_links[0]} 
                    alt="Property"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/400/300";
                    }}
                  />
                  {post.images_links.length > 1 && (
                    <Chip
                      label={`+${post.images_links.length - 1} photos`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white'
                      }}
                    />
                  )}
                </CardMedia>
              ) : (
                <Box sx={{ height: 200, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={48} color="grey" />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography variant="h6" gutterBottom>
                    {post.processed_data?.location || 'Unknown Location'}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ₪{post.processed_data?.price?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<Home size={14} />}
                    label={`${post.processed_data?.number_of_rooms || 'N/A'} Rooms`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Calendar size={14} />}
                    label={new Date(post.processed_at?.toDate()).toLocaleDateString()}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {post.content}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {posts.length > ITEMS_PER_PAGE && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={pageCount} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog 
        open={!!selectedPost} 
        onClose={() => {
          setSelectedPost(null);
          setImageIndex(0);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedPost && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedPost.processed_data?.location}</Typography>
              <IconButton onClick={() => setSelectedPost(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {selectedPost.images_links?.length > 0 && (
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <img
                    src={selectedPost.images_links[imageIndex]}
                    alt={`Property ${imageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '400px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  {selectedPost.images_links.length > 1 && (
                    <>
                      <IconButton
                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)' }}
                        onClick={() => setImageIndex((prev) => (prev > 0 ? prev - 1 : selectedPost.images_links.length - 1))}
                      >
                        <ChevronLeft />
                      </IconButton>
                      <IconButton
                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.8)' }}
                        onClick={() => setImageIndex((prev) => (prev < selectedPost.images_links.length - 1 ? prev + 1 : 0))}
                      >
                        <ChevronRight />
                      </IconButton>
                      <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1, borderRadius: 1 }}>
                        {imageIndex + 1} / {selectedPost.images_links.length}
                      </Box>
                    </>
                  )}
                </Box>
              )}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h5" gutterBottom color="primary">
                    ₪{selectedPost.processed_data?.price?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {selectedPost.processed_data?.number_of_rooms && (
                    <Chip icon={<Home />} label={`${selectedPost.processed_data.number_of_rooms} Rooms`} />
                  )}
                  {selectedPost.processed_data?.room_or_apartment && (
                    <Chip label={selectedPost.processed_data.room_or_apartment} color="primary" />
                  )}
                </Grid>
              </Grid>
              <Typography variant="body1" paragraph>{selectedPost.content}</Typography>
              {selectedPost.processed_data?.phone && (
                <Button
                  variant="contained"
                  startIcon={<Phone />}
                  href={`tel:${selectedPost.processed_data.phone}`}
                  sx={{ mr: 1 }}
                >
                  Call
                </Button>
              )}
              {selectedPost.link && (
                <Button
                  variant="outlined"
                  startIcon={<MapPin />}
                  href={selectedPost.link}
                  target="_blank"
                >
                  View on Facebook
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog >

    </Box>

    );

}

export default RentalDashboard;

