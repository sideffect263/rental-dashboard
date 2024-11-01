import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as PriceIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { getRentalPosts } from '../../services/firebase';

const RentalList = () => {
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const posts = await getRentalPosts();
        const formattedPosts = posts.map(post => ({
          id: post.id,
          location: post.processed_data?.location || 'Unknown',
          price: post.processed_data?.price || 0,
          rooms: post.processed_data?.number_of_rooms || 0,
          type: post.processed_data?.room_or_apartment || 'Unknown',
          status: post.processing_failed ? 'Failed' : 'Available'
        }));
        setRows(formattedPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load rental posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const columns = [
    {
      field: 'location',
      headerName: 'Location',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationIcon color="action" sx={{ mr: 1 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PriceIcon color="action" sx={{ mr: 1 }} />
          {`₪${params.value.toLocaleString()}`}
        </Box>
      ),
    },
    {
      field: 'rooms',
      headerName: 'Rooms',
      width: 100,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'דירה' ? 'primary' : 'secondary'}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Available' ? 'success' : 'error'}
          size="small"
        />
      ),
    }
  ];

  // Filter rows based on search term
  const filteredRows = rows.filter(row => 
    row.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ height: 700, width: '100%' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search rentals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowsPerPageOptions={[5, 10, 20]}
        checkboxSelection
        disableSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none'
          }
        }}
      />
    </Paper>
  );
};

export default RentalList;