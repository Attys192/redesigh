const axios = require('axios');

async function check() {
  try {
    const response = await axios.get('http://localhost:3005/api/specialties');
    console.log('Specialties count:', response.data.length);
    if (response.data.length > 0) {
      console.log('First specialty:', JSON.stringify(response.data[0], null, 2));
    }
  } catch (err) {
    console.error('Error fetching specialties:', err.message);
  }
}

check();
