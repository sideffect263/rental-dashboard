// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore service functions
export const getRentalPosts = async () => {
  try {
    const postsRef = collection(db, 'rental_posts');
    const q = query(postsRef, orderBy('processed_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching rental posts:', error);
    throw error;
  }
};

export const getBotStats = async () => {
  try {
    const postsRef = collection(db, 'rental_posts');
    
    // Get all posts
    const allPostsQuery = query(postsRef);
    const allPostsSnapshot = await getDocs(allPostsQuery);
    
    // Get failed posts
    const failedPostsQuery = query(postsRef, where('processing_failed', '==', true));
    const failedPostsSnapshot = await getDocs(failedPostsQuery);

    // Calculate success rate
    const totalPosts = allPostsSnapshot.size;
    const failedPosts = failedPostsSnapshot.size;
    const successRate = totalPosts ? ((totalPosts - failedPosts) / totalPosts) * 100 : 0;

    // Calculate average processing time
    let totalProcessingTime = 0;
    allPostsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.processing_time) {
        totalProcessingTime += data.processing_time;
      }
    });
    const avgProcessingTime = totalPosts ? totalProcessingTime / totalPosts : 0;

    return {
      totalPosts,
      failedPosts,
      successRate: Math.round(successRate * 10) / 10,
      averageProcessingTime: Math.round(avgProcessingTime * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    throw error;
  }
};

export const getProcessingHistory = async () => {
  try {
    const postsRef = collection(db, 'rental_posts');
    const q = query(postsRef, orderBy('processed_at', 'desc'));
    const snapshot = await getDocs(q);
    
    // Group by date and count posts
    const history = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.processed_at) {
        const date = new Date(data.processed_at.toDate()).toISOString().split('T')[0];
        history[date] = (history[date] || 0) + 1;
      }
    });

    // Convert to array format for chart
    return Object.entries(history).map(([date, posts]) => ({
      date,
      posts
    }));
  } catch (error) {
    console.error('Error fetching processing history:', error);
    throw error;
  }
};

export { db };