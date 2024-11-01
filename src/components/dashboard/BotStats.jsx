import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Tooltip as MuiTooltip,
  IconButton,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { RefreshCcw, Clock, Activity, AlertTriangle, CheckCircle, Database } from 'lucide-react';

const StatCard = ({ title, value, color, icon: Icon, subtitle }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon size={24} className="mr-2" style={{ color: color }} />
        <Typography color="textSecondary" variant="subtitle1">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" color={color} sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const BotStats = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    successRate: 0,
    failedPosts: 0,
    averageProcessingTime: 0,
    lastScrapeTime: null,
    postsLastDay: 0,
    scrapeSuccess: false
  });
  const [processingData, setProcessingData] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const postsRef = collection(db, 'rental_posts');
      
      // Get all posts
      const allPostsQuery = query(postsRef);
      const allPostsSnapshot = await getDocs(allPostsQuery);
      const totalPosts = allPostsSnapshot.size;

      // Get failed posts
      const failedPostsQuery = query(
        postsRef, 
        where('processing_failed', '==', true)
      );
      const failedPostsSnapshot = await getDocs(failedPostsQuery);
      const failedPosts = failedPostsSnapshot.size;

      // Calculate success rate
      const successRate = ((totalPosts - failedPosts) / totalPosts * 100).toFixed(1);

      // Get last 24 hours posts
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentPostsQuery = query(
        postsRef,
        where('processed_at', '>=', oneDayAgo),
        orderBy('processed_at', 'desc')
      );
      const recentPostsSnapshot = await getDocs(recentPostsQuery);
      const postsLastDay = recentPostsSnapshot.size;

      // Find last scrape time
      let lastScrapeTime = null;
      let scrapeSuccess = false;
      recentPostsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!lastScrapeTime || data.processed_at?.toDate() > lastScrapeTime) {
          lastScrapeTime = data.processed_at?.toDate();
          scrapeSuccess = !data.processing_failed;
        }
      });

      // Calculate average processing time
      let totalProcessingTime = 0;
      let postsWithTime = 0;
      
      allPostsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.processing_time) {
          totalProcessingTime += data.processing_time;
          postsWithTime++;
        }
      });

      const avgProcessingTime = (postsWithTime > 0 
        ? (totalProcessingTime / postsWithTime).toFixed(1) 
        : 0);

      setStats({
        totalPosts,
        successRate,
        failedPosts,
        averageProcessingTime: avgProcessingTime,
        lastScrapeTime,
        postsLastDay,
        scrapeSuccess
      });

      // Get processing history with hourly breakdown
      const historyQuery = query(
        postsRef,
        orderBy('processed_at', 'desc'),
        limit(100)
      );
      const historySnapshot = await getDocs(historyQuery);
      
      const processedHours = {};
      historySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.processed_at) {
          const date = new Date(data.processed_at.toDate());
          const hourKey = date.toISOString().split(':')[0] + ':00';
          processedHours[hourKey] = (processedHours[hourKey] || 0) + 1;
        }
      });

      const historyData = Object.entries(processedHours)
        .map(([hour, posts]) => ({ 
          hour,
          posts,
          success: posts - (posts * (100 - stats.successRate) / 100)
        }))
        .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime());

      setProcessingData(historyData);

      // Get recent errors
      const recentErrorsQuery = query(
        postsRef,
        where('processing_failed', '==', true),
        orderBy('processed_at', 'desc'),
        limit(5)
      );
      const recentErrorsSnapshot = await getDocs(recentErrorsQuery);
      
      const errors = recentErrorsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          error: data.error_message || 'Unknown error',
          timestamp: data.processed_at?.toDate(),
          severity: data.error_type || 'error'
        };
      });

      setRecentErrors(errors);

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'Just now';
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Bot Statistics</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {stats.lastScrapeTime && (
            <Chip
              icon={<Clock size={16} />}
              label={`Last Scrape: ${getTimeSince(stats.lastScrapeTime)}`}
              color={stats.scrapeSuccess ? "success" : "error"}
              variant="outlined"
            />
          )}
          <MuiTooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={refreshing ? "animate-spin" : ""} />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={stats.totalPosts.toLocaleString()}
            color="primary.main"
            icon={Database}
            subtitle={`${stats.postsLastDay} new in last 24h`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            color="success.main"
            icon={CheckCircle}
            subtitle="Of total processed posts"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed Posts"
            value={stats.failedPosts}
            color="error.main"
            icon={AlertTriangle}
            subtitle="Requires attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Processing Time"
            value={`${stats.averageProcessingTime}s`}
            color="info.main"
            icon={Activity}
            subtitle="Per post"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Processing History
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processingData}>
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value, name) => [value, name === 'posts' ? 'Total Posts' : 'Successful Posts']}
                />
                <Area
                  type="monotone"
                  dataKey="posts"
                  stroke="#1976d2"
                  fillOpacity={1}
                  fill="url(#colorPosts)"
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#4caf50"
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Errors
            </Typography>
            <Box sx={{ mt: 2 }}>
              {recentErrors.length > 0 ? (
                recentErrors.map((error) => (
                  <Alert 
                    key={error.id}
                    severity={error.severity}
                    sx={{ mb: 1 }}
                  >
                    {`Post ID: ${error.id} - ${error.error}`}
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {error.timestamp?.toLocaleString()}
                    </Typography>
                  </Alert>
                ))
              ) : (
                <Typography color="textSecondary">
                  No recent errors
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotStats;