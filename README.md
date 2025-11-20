# Comment Chaos

Comment Chaos is a web app that challenges you to rank YouTube Short comments by their like count. Each day features a unique theme, and you must drag-and-drop 5 comments into the correct order from most to least likes. The backend fetches real YouTube comment threads while the React frontend presents the daily challenge, a video player, and a results screen showing your accuracy.

## How It Works

1. **Daily Briefing**: The app displays today's theme (e.g., "Minecraft", "Pranks", "Fail Compilation"). The theme is consistent throughout the day for all players.

2. **The Challenge**: After accepting the mission, you'll see:
   - A YouTube Short video playing on the left side
   - 5 comments that appear one-by-one on the right side
   - A ranking board with slots for 1st through 5th place

3. **Ranking**: Drag each comment card into the rank slot you think it deserves based on its like count. Comments are presented sequentially, so you must make decisions without seeing all comments at once.

4. **Results**: After ranking all 5 comments, you'll receive:
   - A score (0-100) based on how accurately you ranked each comment
   - The correct ranking with actual like counts
   - Deviation indicators showing how far off each of your guesses was

## Prerequisites

- **Python 3.11+** (for the FastAPI service)
- **Node.js 20+** (for the Vite dev server)
- A YouTube Data API v3 key stored in `YOUTUBE_API_KEY`

## Backend Setup

1. Navigate to the backend directory and create a virtual environment:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install the dependencies:

   ```bash
   pip install fastapi uvicorn python-dotenv requests pydantic
   ```

3. Export your API key so the service can talk to YouTube:

   ```bash
   export YOUTUBE_API_KEY="your-key"
   ```

   Or create a `.env` file in the `backend/` directory:

   ```
   YOUTUBE_API_KEY=your-key
   ```

4. Run the API locally:

   ```bash
   uvicorn app:app --reload --port 8000
   ```

   The API exposes:

   - `GET /api/daily-challenge` – fetch today's themed challenge with a video and 5 comments to rank.
   - `POST /api/submit-rank` – submit your ranking and receive your score with the correct order.
   - `GET /api/get-game-round` – (legacy endpoint) fetch a random video with candidate comments for the old guessing game mode.
   - `POST /api/submit-guess` – (legacy endpoint) score a guess for the old game mode.

## Frontend Setup

1. Navigate to the frontend directory and install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite dev server:

   ```bash
   npm run dev
   ```

3. The frontend will typically run on `http://localhost:5173` and automatically connect to the backend on `http://localhost:8000`.

   To override the backend URL, create a `.env` file in `frontend/`:

   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

## Tech Stack

- **Backend**: FastAPI (Python) with YouTube Data API v3
- **Frontend**: React + TypeScript + Vite, with Tailwind CSS for styling
- **UI Libraries**: Framer Motion for animations, @dnd-kit for drag-and-drop functionality
- **Design Theme**: Soviet-inspired aesthetic with scanlines and noise overlays
