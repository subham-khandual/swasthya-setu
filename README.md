# Swasthya Setu

**Swasthya Setu** is a comprehensive healthcare application designed to bridge the gap between medical services and people, ensuring everyone has access to reliable health information and services at their fingertips.

## Features

- **Blood Donation**: Find nearby blood donation centers, track donations, and receive blood on time.
- **Consultation with Experts**: Connect with doctors and healthcare providers online for consultations.
- **Sayraa Healthcare Chatbot**: An advanced AI-powered assistant providing rapid first aid guidance and instant medical consultations.
- **AI Doctor Assistance**: Use AI-powered tools to get medical advice based on symptoms or conditions.
- **Medicine Shop**: Browse a range of medicines and order them conveniently from online pharmacies.

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB / Firebase 
- AI Features: Integration with AI-based Gemini APIs 

## Installation

Follow the steps below to get your local copy of this project up and running. The application consists of two main parts: the frontend and the backend server.

### 1. Clone the Repository

Clone the repository to your local machine:
```bash
git clone https://github.com/your-username/swasthya-setu.git
cd swasthya-setu
```

You will see two directories:
- `frontend/`: Contains the React app (UI and client-side logic).
- `server/`: Contains the backend server (API and database handling).

### 2. Setting Up the Frontend

Change to the `frontend/` directory and install the required dependencies:

```bash
cd frontend
npm install
```

Or if you’re using yarn:

```bash
yarn install
```

### 3. Setting Up the Server (Backend)

Change to the `server/` directory and install the required dependencies:

```bash
cd ../server
npm install
```

Or if you’re using yarn:

```bash
yarn install
```

### 4. Set Up Environment Variables

You’ll need to set up your environment variables in both frontend and server directories.

#### Frontend (.env)

In the `frontend/` directory, create a `.env` file if it doesn't exist already. Add any frontend-specific configuration, like API endpoints.

Example:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Server (.env)

In the `server/` directory, create a `.env` file with your backend configuration, such as the MongoDB URI and other API keys.

Example:

```env
MONGO_URI=your-mongo-db-uri
PORT=5000
```

### 5. Running the Application

First, you need to start the backend server, and then you can run the frontend.

#### Start the Server (Backend)

In the `server/` directory:

```bash
npm start
```

Or using yarn:

```bash
yarn start
```

This will start the backend server on `http://localhost:5000`.

#### Start the Frontend (React)

In the `frontend/` directory:

```bash
npm start
```

Or using yarn:

```bash
yarn start
```

This will start the frontend React application on `http://localhost:3000`.


## Contributing

If you'd like to contribute to this project, feel free to open an issue or submit a pull request. Your contributions are highly appreciated!

## License

This project is licensed under the MIT License - see the [sayraa-health-care-ai-assistant.vercel.app
](SAYRAA) file for details.

### Key Sections Breakdown:
1. **Frontend Setup**: Install dependencies for the React app inside the `frontend/` folder.
2. **Server Setup**: Install dependencies for the backend server inside the `server/` folder.
3. **Environment Variables**: Ensure environment variables are set both for frontend and backend in `.env` files.
4. **Running the Project**: Instructions to run the frontend and backend servers.
