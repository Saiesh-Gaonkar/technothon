# Goa Tourism Assistant

A smart travel companion application for tourists visiting Goa, providing route planning, festival information, and attraction discovery.

## Features

- **Natural Language Route Planning**: Simply type where you want to go, and the AI will understand your request
- **Interactive Map Interface**: View your route, attractions, and festivals on an interactive Google Map
- **Festival Discovery**: Find upcoming festivals and events based on your travel timeframe
- **Points of Interest**: Discover tourist attractions along your route
- **Route Calculation**: Get accurate distance and duration estimates for your journey
- **Current Location Detection**: Automatically detects your current location as starting point
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Technologies Used

- **Frontend**: React, JavaScript, CSS
- **Maps**: Google Maps JavaScript API & React Google Maps
- **AI Language Processing**: Google Gemini AI for natural language understanding
- **Database**: Firebase Firestore for festival and event data
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Maps API key
- Firebase account
- Gemini API key

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd goa-tourism-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Guide

### Finding a Route

1. In the main input field, type your destination (or your starting point and destination)
   - Example: "I want to go to Palolem Beach"
   - Example: "How do I get from Panjim to Dudhsagar Falls?"

2. Click the "Find Route" button

3. The app will:
   - Extract your starting point and destination
   - Display them in the info panel
   - Show the route on the map
   - Calculate the distance and duration

4. You can also manually trigger route calculation by clicking "Show Route" after your locations are set

### Discovering Festivals and Events

1. Use the month filter buttons to select your travel timeframe (1, 2, 5, 10 months or All Events)

2. Festivals and events will appear as yellow markers on the map

3. Hover over a marker to see details about the festival:
   - Name
   - Description
   - Rating
   - Date

### Discovering Attractions Along Your Route

1. After planning a route, tourist attractions along the way will automatically appear as markers

2. Hover over these markers to see:
   - Name
   - Rating
   - Photos (if available)

### Dark Mode

- Click the sun/moon icon in the top-right to toggle between light and dark mode

## Firebase Configuration

The application uses Firebase for data storage. The database structure is as follows:

### Firestore Collections

- **events**: Contains festival and event information
  - Fields: name, description, date, lat, lng, imageUrl, rating

## Project Structure
