// src/components/dashboard/BotStats.jsx
import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" color={color}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const BotStats = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    successRate: 0,
    failedPosts: 0,
    averageProcessingTime: 0
  });

  const [processingData, setProcessingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Implement Firebase fetching here
        setStats({
          totalPosts: 1234,
          successRate: 98.5,
          failedPosts: 15,
          averageProcessingTime: 2.3
        });
        
        setProcessingData([
          { date: '2024-01', posts: 65 },
          { date: '2024-02', posts: 78 },
          { date: '2024-03', posts: 90 },
          // Add more data points
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Posts"
            value={stats.totalPosts.toLocaleString()}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed Posts"
            value={stats.failedPosts}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Processing Time"
            value={`${stats.averageProcessingTime}s`}
          />
        </Grid>

        {/* Processing Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Processing History
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="#1976d2"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Errors */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Errors
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Alert severity="error" sx={{ mb: 1 }}>
                Failed to process post ID: 123456 - OpenAI API rate limit exceeded
              </Alert>
              <Alert severity="warning" sx={{ mb: 1 }}>
                Slow processing detected for post ID: 123457
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotStats;