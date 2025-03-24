// src/services/openaiService.js
import axios from 'axios';

const API_URL = '/api/coach'; // Our serverless function endpoint

export const getCoachingAdvice = async (trainingData) => {
  try {
    const response = await axios.post(API_URL, {
      trainingData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting coaching advice:', error);
    throw error;
  }
};
