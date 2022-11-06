// Getting Address and converting to coordinates
const axios = require('axios');

const HttpError = require('../models/http_error');

const API_KEY = process.env.GOOGLE_API_KEY;

//Dummy Coordinates as we don't have Credit card to get Google Geocoding API, IF we have we use the commented code
async function getCoordsForAddress(address) {
  return {
    lat: 40.7484474,
    lng: -73.9871516
  };
  // const response = await axios.get(
  //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(   //encodeURIComponent - global javascript function
  //     address
  //   )}&key=${API_KEY}`
  // );

  // const data = response.data;

  // if (!data || data.status === 'ZERO_RESULTS') {
  //   const error = new HttpError(
  //     'Could not find location for the specified address.',
  //     422
  //   );
  //   throw error;
  // }

  // const coordinates = data.results[0].geometry.location;

  // return coordinates;
}

module.exports = getCoordsForAddress;
