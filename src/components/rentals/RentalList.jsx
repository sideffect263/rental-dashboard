// src/components/rentals/RentalList.jsx
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

// Rest of the component code remains the same...
const RentalList = () => {
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

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
          color={params.value === 'Apartment' ? 'primary' : 'secondary'}
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

  const rows = [
    { 
      id: 1, 
      location: 'Tel Aviv - Florentin',
      price: 4500,
      rooms: 3,
      type: 'Apartment',
      status: 'Available'
    },
    // Add more sample data
  ];

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
        rows={rows}
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