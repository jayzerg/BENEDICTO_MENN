# Benedicto Exam Portal

A comprehensive exam management system built with Next.js, MongoDB, and Tailwind CSS.

## Features

- Role-based authentication (Student, Teacher, Administrator)
- Exam creation and management
- Student exam taking interface with timer
- Result tracking and management
- Responsive design with Tailwind CSS
- MongoDB database integration

## Technologies Used

- [Next.js 14](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://reactjs.org/)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB database (local or cloud instance)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd benedicto-exam-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm run start` - Runs the built app in production mode
- `npm run lint` - Runs the linter

## Project Structure

```
├── components/          # Reusable UI components
├── lib/                 # Utility functions and database connections
├── models/              # Mongoose models
├── pages/               # Next.js pages
├── public/              # Static assets
├── scripts/             # Utility scripts
├── styles/              # CSS files
└── ...
```

## Roles

1. **Student**: Can take exams and view results
2. **Teacher**: Can create exams and manage subjects
3. **Administrator**: Full access to manage users, exams, and system settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.